/**
 * Conversion tracking for the existing Google Ads tag.
 *
 * index.html has loaded gtag.js for AW-11467752288 for a long time, but nothing in the
 * app ever called `gtag('event', ...)` — the only thing the tag ever recorded was the
 * pageview from its own `config` call. So booking and payment conversions have not been
 * attributable, and Ads has had no signal to optimise against.
 *
 * This is the piece the redesign prototype specified but could not implement, since it
 * had no real payment flow. Its note is worth keeping, because the placement is the
 * whole point:
 *
 *     begin_checkout  -> as the payment sheet opens
 *     purchase        -> only after a payment genuinely succeeded. Firing it on button
 *                        press instead would book abandoned and failed payments as
 *                        revenue.
 *
 * We go one step stricter than the prototype. `purchase` fires only after
 * POST /api/confirm-payment has returned ok — that is, after the SERVER verified the
 * Razorpay signature. Razorpay's client-side handler alone is not proof of a verified
 * payment, and the backend stays the authority for what was actually paid.
 *
 * Everything here is defensive: if gtag is blocked, absent, or throws, tracking must
 * never break a booking. Analytics is not allowed to cost a sale.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/** Push to dataLayer and gtag, swallowing every failure. */
function track(event: string, params: Record<string, unknown>): void {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  } catch {
    // An ad blocker, a CSP rule, or a missing tag must never interrupt checkout.
  }
}

/**
 * A booking confirmed under the free-booking offer.
 *
 * Deliberately NOT `purchase`. No money changed hands, and a stream of ₹0 purchases would
 * drag average order value down, corrupt ROAS, and make the conversion column meaningless
 * for the real ₹299 payments either side of the offer. `generate_lead` is what this
 * actually is: a qualified booking with contact details and a held slot.
 *
 * Not deduplicated, because there is no payment id to key on — the guard on trackPurchase
 * exists to protect a money figure, and there is none here. The call site fires once, on
 * the server's confirmed response.
 */
export function trackFreeBooking(args: {
  serviceId: string;
  serviceTitle: string;
  bookingId?: string;
}): void {
  track("generate_lead", {
    currency: "INR",
    value: 0,
    lead_source: "free_booking_offer",
    booking_id: args.bookingId,
    items: [{ item_id: args.serviceId, item_name: args.serviceTitle, price: 0, quantity: 1 }],
  });
}

/** The payment sheet is opening. Not a conversion — an intent signal. */
export function trackBeginCheckout(args: {
  serviceId: string;
  serviceTitle: string;
  amount: number;
}): void {
  track("begin_checkout", {
    currency: "INR",
    value: args.amount,
    items: [{ item_id: args.serviceId, item_name: args.serviceTitle, price: args.amount, quantity: 1 }],
  });
}

/**
 * Razorpay payment ids whose purchase conversion has already been reported.
 *
 * The confirmation call has a five-attempt retry loop, the modal can re-render or remount,
 * and Razorpay's handler can in principle be invoked more than once — every one of those
 * paths ends up here with the SAME razorpay_payment_id. Reporting a sale twice inflates
 * Ads conversions and corrupts ROAS, so the guard lives in this function rather than at
 * each call site: there is then no way to add a caller that forgets it.
 *
 * Module-level, so it survives component remounts for the life of the page — which is the
 * full lifetime of a payment. A reload starts a new page and a new Razorpay payment id, so
 * nothing is lost by not persisting it.
 */
const reportedPurchases = new Set<string>();

/**
 * A payment that the SERVER has verified. `transactionId` is Razorpay's payment id, which
 * is what makes the conversion deduplicable — the webhook path and the browser path both
 * describe the same payment.
 *
 * Fires at most ONCE per payment id. Returns true if this call actually reported the
 * conversion, false if it was a duplicate that was suppressed.
 */
export function trackPurchase(args: {
  transactionId: string;
  serviceId: string;
  serviceTitle: string;
  amount: number;
}): boolean {
  // A missing payment id cannot be deduplicated, so it is not reported at all — better a
  // missing conversion than an uncountable duplicate.
  if (!args.transactionId) return false;

  if (reportedPurchases.has(args.transactionId)) return false;
  reportedPurchases.add(args.transactionId);

  track("purchase", {
    transaction_id: args.transactionId,
    currency: "INR",
    value: args.amount,
    items: [{ item_id: args.serviceId, item_name: args.serviceTitle, price: args.amount, quantity: 1 }],
  });
  return true;
}

/** Test-only reset so the dedupe guard does not leak between cases. */
export function __resetPurchaseDedupeForTests(): void {
  reportedPurchases.clear();
}
