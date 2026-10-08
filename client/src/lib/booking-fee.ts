/**
 * Slot-booking fee shown for a service. DISPLAY ONLY: the amount that is charged is decided on the
 * server (server/lib/booking-amount.ts resolveBookingAmount), which holds the same numbers and the same
 * PPF test. If one changes there, change it here, or the label and the Razorpay amount will disagree.
 *
 * A PPF service priced MORE than ₹10,000 (all six today) takes a ₹499 slot deposit. Both conditions are
 * required; everything else keeps the configured booking fee (₹299 by default).
 */
export const HIGH_VALUE_PRICE_THRESHOLD = 10000;
export const HIGH_VALUE_BOOKING_FEE = 499;

/** PPF by slug (ppf-sedan, partial-ppf-suv, ...). Same test as the server. */
export function isPpfService(slug: string | null | undefined): boolean {
  return /(^|-)(ppf|paint-protection)(-|$)/i.test(String(slug ?? ""));
}

/** True for a PPF service whose catalogue price is more than the threshold. An unreadable price never is. */
export function isHighValueService(
  slug: string | null | undefined,
  price: string | number | null | undefined,
): boolean {
  if (!isPpfService(slug)) return false;
  if (price === null || price === undefined || price === "") return false;
  const n = typeof price === "number" ? price : parseFloat(String(price));
  return Number.isFinite(n) && n > HIGH_VALUE_PRICE_THRESHOLD;
}

/** The booking fee to show for a service, or `fallback` (the configured fee) for an ordinary one. */
export function slotFeeFor(
  slug: string | null | undefined,
  price: string | number | null | undefined,
  fallback = 299,
): number {
  return isHighValueService(slug, price) ? HIGH_VALUE_BOOKING_FEE : fallback;
}
