/**
 * Server-side campaign validation and offer resolution.
 *
 * The pure window arithmetic lives in shared/campaign.ts so the client and server cannot
 * disagree about whether an offer is running. This module is the SERVER's half: it
 * validates what an admin submits, and it decides what the offer state means for pricing.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE PRICING RULE, stated once, precisely.
 *
 * A campaign controls the OFFER STATE. It does not, and cannot, set a price.
 *
 *   services.price                 what the SERVICE costs. Unchanged by any campaign.
 *   site_settings.booking_amount   the booking fee. Unchanged by any campaign.
 *   campaign.offerType             whether that fee is waived RIGHT NOW.
 *
 * There is no price column on campaigns and there must never be one — a second authority
 * on money is how a customer ends up charged a figure no screen showed them.
 *
 * PRECEDENCE for "is booking free", highest first:
 *
 *   1. an active free_booking campaign for THIS service   -> free, scoped to that service
 *   2. legacy site_settings.free_booking_until            -> free, for EVERY service
 *   3. otherwise                                          -> the normal fee applies
 *
 * Rule 2 is the currently-live behaviour and is preserved byte-for-byte. With zero rows
 * in `campaigns`, rule 1 can never fire, so introducing this system cannot change what
 * anybody is charged. That is the property the tests pin.
 *
 * The two rules differ in SCOPE, deliberately. The legacy setting is a blunt
 * everything-is-free switch, which is what it was built as. A campaign is scoped to the
 * service it advertises: a ceramic-coating campaign must not silently make the ₹8,999
 * Annual Maintenance Package free just because both are bookable that week.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import {
  resolveActiveCampaign,
  campaignsOverlap,
  campaignState,
  type CampaignRecord,
  type ResolvedCampaign,
} from "@shared/campaign";

/** Landing pages a campaign may target. A closed set: an unknown route renders nothing,
 *  so a campaign pointed at one would be invisible and look like a bug in the offer. */
export const CAMPAIGN_LANDING_PAGES = [
  "/ceramic-coating/car",
  "/ceramic-coating/bike",
  "/ppf",
] as const;

/**
 * Identifier format: lowercase alphanumeric with underscores, 3-60 chars.
 *
 * Matches what a `utm_campaign` value can safely be, because the two are meant to be
 * compared. Rejecting uppercase and punctuation up front avoids "Ceramic_Car_Sep" and
 * "ceramic-car-sep" both existing and neither matching the ad.
 */
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_]{1,58}[a-z0-9]$/;

/**
 * An ISO-8601 instant that Date.parse understands AND that carries an offset.
 *
 * The offset requirement is the important half. "2026-09-16T00:00:00" with no zone is
 * interpreted differently by different runtimes, and a campaign that starts at midnight
 * in an unspecified timezone is a campaign that starts at the wrong time in Bangalore.
 * The admin UI converts the business's Asia/Kolkata input into an explicit offset once,
 * at the boundary; everything downstream deals in absolute instants.
 */
const isoInstant = z
  .string()
  .trim()
  .refine((v) => Number.isFinite(Date.parse(v)), { message: "Must be a valid ISO-8601 timestamp" })
  .refine((v) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(v), {
    message: "Must carry a timezone offset, e.g. 2026-09-16T00:00:00+05:30",
  });

/**
 * Validation for POST/PATCH. Every field is checked server-side; the admin frontend is
 * not trusted for any of it.
 */
export const campaignInputSchema = z
  .object({
    name: z.string().trim().min(3, "Name is required").max(120),
    identifier: z
      .string()
      .trim()
      .regex(IDENTIFIER_PATTERN, "Use lowercase letters, digits and underscores (3-60 chars)"),
    serviceSlug: z.string().trim().min(1, "Service is required").max(120),
    vehicleType: z.enum(["car", "bike", "both"], {
      errorMap: () => ({ message: "Vehicle type must be car, bike or both" }),
    }),
    landingPage: z.enum(CAMPAIGN_LANDING_PAGES, {
      errorMap: () => ({ message: `Landing page must be one of: ${CAMPAIGN_LANDING_PAGES.join(", ")}` }),
    }),
    startsAt: isoInstant,
    endsAt: isoInstant,
    isActive: z.boolean(),
    offerType: z.enum(["free_booking", "none"], {
      errorMap: () => ({ message: "Offer type must be free_booking or none" }),
    }),
    offerTitle: z.string().trim().min(3, "Offer title is required").max(120),
    offerDescription: z.string().trim().max(500).optional().nullable(),
    // Bounded because it renders inside a button. A 200-character CTA does not wrap, it
    // breaks the layout on a 360px phone — which is most of the ad traffic.
    ctaText: z.string().trim().min(2, "CTA text is required").max(40),
  })
  .strict()
  .refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    message: "End must be after start",
    path: ["endsAt"],
  });

export type CampaignInput = z.infer<typeof campaignInputSchema>;

export interface ValidationFailure {
  ok: false;
  fieldErrors: Record<string, string>;
  message: string;
}
export interface ValidationSuccess {
  ok: true;
  value: CampaignInput;
}

/** Parse a request body into a validated campaign, with field-keyed errors. */
export function validateCampaignInput(body: unknown): ValidationSuccess | ValidationFailure {
  const parsed = campaignInputSchema.safeParse(body);
  if (parsed.success) return { ok: true, value: parsed.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    fieldErrors,
    message: "Please correct the highlighted fields.",
  };
}

/**
 * Would saving `candidate` create an ambiguous offer?
 *
 * Called on create and on edit. `existing` is every other campaign; `candidate.id` is
 * excluded automatically by campaignsOverlap so editing a campaign never conflicts with
 * itself.
 *
 * Refusing the WRITE is the real fix. The deterministic read-time resolution exists for
 * rows that predate this check or were inserted around it — a safety net, not a licence.
 */
export function findOverlaps(
  candidate: CampaignRecord,
  existing: CampaignRecord[],
): CampaignRecord[] {
  return existing.filter((other) => campaignsOverlap(candidate, other));
}

/**
 * The effective campaign for a landing page, plus any conflicts to surface.
 *
 * Filtering by landing page before resolution is what makes "at most one effective
 * campaign per landing page" meaningful — two campaigns on DIFFERENT pages are not in
 * competition and must both be allowed to run.
 */
export function effectiveCampaignForLandingPage(
  all: CampaignRecord[],
  landingPage: string,
  now: Date = new Date(),
): ResolvedCampaign {
  const candidates = all.filter((c) => c.landingPage === landingPage);
  return resolveActiveCampaign(candidates, now);
}

/**
 * Is booking free for this service because of a campaign?
 *
 * Scoped to the service, and to `free_booking` campaigns only. A campaign with
 * offerType "none" is presentation — a title and a countdown — and must not touch money.
 *
 * Returns the WINNING campaign as well as the boolean, so the caller can snapshot its
 * identifier onto the booking. Resolution here is across ALL landing pages, because the
 * question is "is any running campaign waiving the fee for this service", not "what does
 * one page show".
 */
export function campaignFreeBookingForService(
  all: CampaignRecord[],
  serviceSlug: string,
  now: Date = new Date(),
): { free: boolean; campaign: CampaignRecord | null } {
  const candidates = all.filter(
    (c) =>
      c.serviceSlug === serviceSlug &&
      c.offerType === "free_booking" &&
      campaignState(c, now) === "running",
  );

  if (candidates.length === 0) return { free: false, campaign: null };

  // Same deterministic winner as everywhere else, so the campaign whose offer the page
  // displayed is the campaign recorded against the booking.
  const resolved = resolveActiveCampaign(candidates, now);
  return { free: resolved.campaign !== null, campaign: resolved.campaign };
}
