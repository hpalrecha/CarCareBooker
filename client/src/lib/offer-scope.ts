import { isPpfService } from "./booking-fee";

/**
 * Which catalogue ROW a free-booking offer applies to, decided the way the server decides it, and which rows may show a
 * previous price. Pure functions so the page, the offer blocks and the booking modal read one rule.
 *
 * ─────────────────────────────────────────────────
 * FREE BOOKING IS PER ROW, NOT PER PAGE.
 *
 * The server (server/lib/booking-amount.ts resolveBookingAmount, server/lib/campaign.ts campaignFreeBookingForService)
 * waives the booking fee in exactly two cases:
 *
 *   1. the LEGACY `free_booking_until` window, which applies to EVERY row; or
 *   2. a RUNNING `free_booking` campaign, which applies to ONE row: the campaign's `serviceSlug`.
 *
 * Every other row is charged as usual (for the six PPF rows, the ₹499 slot deposit). /api/campaigns/active answers per
 * LANDING PAGE, so a page that shows several packages (/ppf) must compare the campaign's `serviceSlug` with the package
 * on screen before it says "free". Until this module the offer strip, the offer block and the step list said "free"
 * whichever package was selected, and the booking modal ignored campaigns altogether.
 *
 * Fails closed: no row, no campaign, a presentation-only campaign (offerType "none") or a different row means NOT free.
 * The client only decides what to SAY; the amount is always the server's.
 * ─────────────────────────────────────────────────
 */
export interface RunningCampaignLike {
  serviceSlug?: string | null;
  offerType?: string | null;
}

export type FreeBookingSource = "legacy-window" | "campaign" | null;

export function freeBookingSource(input: {
  /** The catalogue row being shown or booked. */
  rowSlug: string | null | undefined;
  /** The campaign /api/campaigns/active returned for the landing page (it only returns a running one), or null. */
  campaign: RunningCampaignLike | null | undefined;
  /** True while /api/booking-offer says the legacy window is open. */
  legacyFree: boolean;
}): FreeBookingSource {
  if (input.legacyFree === true) return "legacy-window";
  const c = input.campaign;
  if (!input.rowSlug || !c) return null;
  if (c.offerType === "free_booking" && c.serviceSlug === input.rowSlug) return "campaign";
  return null;
}

export function bookingIsFreeForRow(input: Parameters<typeof freeBookingSource>[0]): boolean {
  return freeBookingSource(input) !== null;
}

/**
 * Whether a previous (struck-through) price may be shown for a row in the booking modal.
 *
 * The previous price is business-entered data (`originalPrice`) with no approved source. For the six PPF rows it is also
 * contradicted by the catalogue's own labels (the Basic rows say "50% OFF" where the stored prices give 41%, 29% and
 * 26%; the Premium rows have none). Until the studio supplies an approved source it is not shown for PPF rows. Every
 * other service keeps its previous price exactly as before; those are listed for the studio in the review report.
 */
export function showPreviousPrice(service: { slug?: string | null; price?: unknown; originalPrice?: unknown } | null | undefined): boolean {
  if (!service) return false;
  if (isPpfService(service.slug)) return false;
  // Every other service: unchanged (the modal showed whatever previous price the row carries).
  return Boolean(service.originalPrice);
}
