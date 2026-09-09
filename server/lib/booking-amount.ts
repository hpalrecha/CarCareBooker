/**
 * Authoritative payable amount for a booking.
 *
 * Pure and side-effect free on purpose: the amount that reaches Razorpay is the single
 * most security-sensitive number in the application, and it must be provable in a unit
 * test rather than only observable by making a real payment. The route performs the
 * database read and hands the result in; every decision lives here.
 *
 * THE RULE THIS ENFORCES: the client never contributes to the amount. There is no input
 * on this function that a request body can reach. A caller cannot accidentally pass the
 * customer's number in, because there is nowhere to put it.
 *
 * Precedence, all server-side:
 *   1. Annual Maintenance Package -> services.price (the full package price)
 *   2. any other service          -> site_settings.booking_amount
 *   3. neither usable             -> DEFAULT_BOOKING_FEE
 *
 * History: POST /api/bookings used to seed the variable with `bookingData.amount || 299`
 * and then overwrite it from the database. The overwrite was conditional, so a missing or
 * unreadable `booking_amount` row left the client's value in place — and that value became
 * the Razorpay order amount. See the tests in tests/booking-amount.test.mjs.
 */

/** Server-side floor. Used when no database source yields a usable number. */
export const DEFAULT_BOOKING_FEE = 299;

/** The one service that is charged its full price up front rather than a booking fee. */
export const FULL_PRICE_SLUG = "annual-maintenance-package";

export interface ResolveBookingAmountInput {
  /** services.slug of the service being booked (from the database, not the request). */
  serviceSlug: string;
  /** services.price of that same row, as stored (decimal column -> string). */
  servicePrice: string | number | null | undefined;
  /**
   * The raw `value` of the site_settings row keyed "booking_amount", or null when the row
   * is absent, empty, or the read threw. The caller is responsible for turning a failed
   * read into null — a failure must never look like a valid price.
   */
  bookingAmountSetting: string | number | null | undefined;
}

export interface ResolvedBookingAmount {
  /** Rupees. This is what is charged and what is stored on the booking. */
  amount: number;
  /** Which rule produced it — surfaced for logging and asserted in tests. */
  source: "service-price" | "settings" | "default";
}

/** Accepts a value only if it parses to a finite, strictly positive number. */
function usableAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function resolveBookingAmount(input: ResolveBookingAmountInput): ResolvedBookingAmount {
  // 1. The full-price package is priced from its own service row.
  if (input.serviceSlug === FULL_PRICE_SLUG) {
    const fromService = usableAmount(input.servicePrice);
    if (fromService !== null) return { amount: fromService, source: "service-price" };
    // A corrupt price on the package row must not fall through to the booking fee, which
    // would charge ₹299 for a ₹8999 package. The server default is the safe floor and the
    // mismatch is visible in the response.
    return { amount: DEFAULT_BOOKING_FEE, source: "default" };
  }

  // 2. Everything else uses the configured booking fee.
  const fromSettings = usableAmount(input.bookingAmountSetting);
  if (fromSettings !== null) return { amount: fromSettings, source: "settings" };

  // 3. Row missing, value blank, value non-numeric, or the read failed.
  return { amount: DEFAULT_BOOKING_FEE, source: "default" };
}
