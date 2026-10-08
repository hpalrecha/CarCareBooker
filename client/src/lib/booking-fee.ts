/**
 * Slot-booking fee shown for a service. DISPLAY ONLY: the amount that is charged is decided on the
 * server (server/lib/booking-amount.ts resolveBookingAmount), which holds the same two numbers. If one
 * changes there, change it here, or the label and the Razorpay amount will disagree.
 *
 * A service priced MORE than ₹10,000 (all six PPF services) takes a ₹499 slot deposit; everything else
 * keeps the configured booking fee (₹299 by default).
 */
export const HIGH_VALUE_PRICE_THRESHOLD = 10000;
export const HIGH_VALUE_BOOKING_FEE = 499;

/** True when the catalogue price is more than the threshold. An unreadable price is not high-value. */
export function isHighValueService(price: string | number | null | undefined): boolean {
  if (price === null || price === undefined || price === "") return false;
  const n = typeof price === "number" ? price : parseFloat(String(price));
  return Number.isFinite(n) && n > HIGH_VALUE_PRICE_THRESHOLD;
}

/** The booking fee to show for a service, or `fallback` (the configured fee) for an ordinary one. */
export function slotFeeFor(price: string | number | null | undefined, fallback = 299): number {
  return isHighValueService(price) ? HIGH_VALUE_BOOKING_FEE : fallback;
}
