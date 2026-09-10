/**
 * Campaign window resolution — pure, dependency-free, and the single authority on which
 * campaign (if any) is running at a given instant.
 *
 * Lives in shared/ because the client needs the TYPES and the expiry check for the
 * countdown, while the server needs the RESOLUTION for pricing. Both must agree, and the
 * only reliable way to make two runtimes agree is to give them one implementation.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * TIME MODEL
 *
 * A campaign window is a half-open interval of ABSOLUTE INSTANTS:  [startsAt, endsAt)
 *
 *   absolute instants   `timestamptz` in Postgres, ISO-8601 with an offset on the wire.
 *                       An instant is an instant everywhere on earth, so nothing here has
 *                       to reason about timezones at all. The business timezone
 *                       (Asia/Kolkata) matters only when a HUMAN types a date — that
 *                       conversion happens once, at the admin boundary, and never again.
 *                       Storing a bare date would push that conversion into every
 *                       consumer, which is how the legacy setting acquired its bug.
 *
 *   half-open [ , )     active AT startsAt, NOT active at endsAt. This is what makes two
 *                       adjacent campaigns safe: one ending 17 Sep 00:00 IST and the next
 *                       starting 17 Sep 00:00 IST have exactly zero overlap and exactly
 *                       zero gap. An inclusive end would make that instant belong to both,
 *                       which is precisely the ambiguity this file exists to remove.
 *
 * The legacy `free_booking_until` setting is NOT modelled here. It keeps its own
 * inclusive-end-of-IST-day semantics in server/lib/booking-amount.ts, untouched — see
 * resolveOfferState() for why the two are deliberately kept apart.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * FAILS CLOSED. A campaign with an unparseable, missing or inverted window is treated as
 * not running, never as running. Giving the catalogue away by accident must stay several
 * mistakes deep, exactly as isFreeBookingWindow already guarantees for the legacy setting.
 */

/** What a campaign does to the booking flow. */
export type CampaignOfferType =
  /** Booking costs nothing online. The SERVICE is still charged at the studio. */
  | "free_booking"
  /** Presentation only: a title, a countdown, a CTA. Pricing is untouched. */
  | "none";

export type CampaignVehicleType = "car" | "bike" | "both";

/** The stored shape, narrowed to what resolution actually reads. */
export interface CampaignRecord {
  id: string;
  name: string;
  /** Stable machine key, e.g. "ceramic_car_sep". Matches utm_campaign on the ad. */
  identifier: string;
  /** Catalogue slug this campaign applies to, e.g. "1-year-ceramic-coating". */
  serviceSlug: string;
  vehicleType: CampaignVehicleType;
  /** Route this campaign is shown on, e.g. "/ceramic-coating/car". */
  landingPage: string;
  /** ISO-8601 instant, or a Date. */
  startsAt: string | Date;
  /** ISO-8601 instant, or a Date. Exclusive. */
  endsAt: string | Date;
  isActive: boolean;
  offerType: CampaignOfferType;
  offerTitle: string;
  offerDescription?: string | null;
  ctaText: string;
  /** Used only as a deterministic tiebreak. */
  createdAt?: string | Date | null;
}

/** Why a campaign is or is not running. Surfaced to admin; never guessed at. */
export type CampaignState =
  | "running"
  | "scheduled" // valid, but startsAt is in the future
  | "expired" // endsAt has passed
  | "paused" // isActive === false
  | "invalid"; // unparseable or inverted window

export interface ResolvedCampaign {
  campaign: CampaignRecord | null;
  state: CampaignState | "none";
  /**
   * Every other campaign that ALSO matched the same key and instant.
   *
   * Non-empty means the admin has created overlapping campaigns. Resolution is still
   * deterministic (see pickDeterministic), but the caller is expected to surface this
   * rather than let it pass silently — an offer nobody intended is worse than an error.
   */
  conflicts: CampaignRecord[];
}

/** Milliseconds, or null when the value is not a usable instant. */
function toMillis(value: string | Date | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const t = Date.parse(trimmed);
  return Number.isFinite(t) ? t : null;
}

/**
 * Classify one campaign at one instant, ignoring every other campaign.
 *
 * Order matters and is deliberate: an unusable WINDOW is reported as "invalid" before
 * `isActive` is consulted, so a corrupt record cannot hide behind being paused and then
 * surprise someone the moment it is switched on.
 */
export function campaignState(
  campaign: CampaignRecord,
  now: Date = new Date(),
): CampaignState {
  const start = toMillis(campaign.startsAt);
  const end = toMillis(campaign.endsAt);

  // Unparseable, missing, or an end that does not follow its start. Fails closed.
  if (start === null || end === null) return "invalid";
  if (end <= start) return "invalid";

  if (campaign.isActive !== true) return "paused";

  const t = now.getTime();
  if (t < start) return "scheduled";
  if (t >= end) return "expired"; // half-open: endsAt itself is already over
  return "running";
}

/** True only for a campaign that is running right now. */
export function isCampaignRunning(campaign: CampaignRecord, now: Date = new Date()): boolean {
  return campaignState(campaign, now) === "running";
}

/**
 * Deterministic winner when more than one campaign is running for the same key.
 *
 * THE RULE: most recently STARTED wins. If two share a start instant, the most recently
 * CREATED wins. If those also tie, the lexicographically smallest id wins.
 *
 * Why "most recently started": it matches what a person means by launching a campaign.
 * If marketing schedules an October offer over a September one that has not finished, the
 * October offer is the current intent. Choosing the earlier one would show a customer an
 * offer the business has already moved on from.
 *
 * Why a THIRD tiebreak on id: the first two can genuinely tie (two rows inserted in the
 * same transaction with identical timestamps), and "deterministic" has to mean it — a
 * comparator that returns 0 leaves the result at the mercy of the database's row order,
 * which is exactly the arbitrary choice the requirement forbids.
 */
export function pickDeterministic(candidates: CampaignRecord[]): CampaignRecord | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const startDiff = (toMillis(b.startsAt) ?? 0) - (toMillis(a.startsAt) ?? 0);
    if (startDiff !== 0) return startDiff;

    const createdDiff = (toMillis(b.createdAt) ?? 0) - (toMillis(a.createdAt) ?? 0);
    if (createdDiff !== 0) return createdDiff;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return sorted[0];
}

/**
 * Resolve the one effective campaign from a candidate set.
 *
 * `candidates` is expected to be pre-filtered to a single landing-page / service /
 * vehicle key by the caller — this function does not know what key was asked for, only
 * that everything handed to it competes for the same slot.
 *
 * Returns the winner AND the campaigns it beat, so the caller can warn. Resolution never
 * throws and never returns an arbitrary row.
 */
export function resolveActiveCampaign(
  candidates: CampaignRecord[],
  now: Date = new Date(),
): ResolvedCampaign {
  const list = Array.isArray(candidates) ? candidates : [];
  const running = list.filter((c) => isCampaignRunning(c, now));

  if (running.length === 0) {
    return { campaign: null, state: "none", conflicts: [] };
  }

  const winner = pickDeterministic(running);
  return {
    campaign: winner,
    state: "running",
    conflicts: running.filter((c) => c.id !== winner?.id),
  };
}

/**
 * Do two campaigns compete for the same slot at overlapping times?
 *
 * Used by the write path to REFUSE an overlapping campaign, which is the real fix — the
 * deterministic resolution above is a safety net for rows that already exist, not a
 * licence to create ambiguity.
 *
 * Only `isActive` campaigns can conflict: a paused campaign is a draft, and drafts must
 * be allowed to overlap or an admin could never prepare next month's offer while this
 * month's is running.
 *
 * An invalid window cannot overlap anything, because it is not a window.
 */
export function campaignsOverlap(a: CampaignRecord, b: CampaignRecord): boolean {
  if (a.id === b.id) return false;
  if (a.isActive !== true || b.isActive !== true) return false;
  if (a.landingPage !== b.landingPage) return false;

  const aStart = toMillis(a.startsAt);
  const aEnd = toMillis(a.endsAt);
  const bStart = toMillis(b.startsAt);
  const bEnd = toMillis(b.endsAt);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  if (aEnd <= aStart || bEnd <= bStart) return false;

  // Half-open intervals overlap iff each starts before the other ends.
  return aStart < bEnd && bStart < aEnd;
}

/** Milliseconds until a campaign ends; 0 once it has. Never negative. */
export function millisRemaining(campaign: CampaignRecord, now: Date = new Date()): number {
  const end = toMillis(campaign.endsAt);
  if (end === null) return 0;
  return Math.max(0, end - now.getTime());
}
