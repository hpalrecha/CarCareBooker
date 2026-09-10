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
 *   0. inside the free-booking window -> 0 (no payment taken, for every service)
 *   1. Annual Maintenance Package     -> services.price (the full package price)
 *   2. any other service              -> site_settings.booking_amount
 *   3. neither usable                 -> DEFAULT_BOOKING_FEE
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

/**
 * IST end-of-day for the free-booking window.
 *
 * The offer is expressed as a DATE ("free until the 16th"), and a customer booking at
 * 11pm on the 16th in Bangalore must still get it. Parsing the bare date would give
 * midnight UTC — 05:30 IST — ending the offer eighteen and a half hours early for the
 * only timezone this business operates in.
 */
const IST_END_OF_DAY = "T23:59:59.999+05:30";

/**
 * True while free booking is active.
 *
 * FAILS CLOSED. A missing, blank, malformed or unparseable value means "not free", so a
 * typo in the admin panel cannot silently switch the whole catalogue to zero. The only
 * way to give work away is a value that genuinely parses to a future IST date.
 */
export function isFreeBookingWindow(
  freeBookingUntil: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!freeBookingUntil) return false;
  const raw = String(freeBookingUntil).trim();
  // Exactly YYYY-MM-DD. Anything else — a timestamp, "true", "yes", a stray quote — is
  // rejected rather than guessed at, because guessing wrong here costs real money.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const endsAt = Date.parse(raw + IST_END_OF_DAY);
  if (!Number.isFinite(endsAt)) return false;
  return now.getTime() <= endsAt;
}

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
  /**
   * Raw `value` of the site_settings row keyed "free_booking_until" — a YYYY-MM-DD date,
   * or null when the row is absent or the read threw. While that date has not passed in
   * IST, NOTHING is charged online: no booking fee, and no full-price package either.
   */
  freeBookingUntil?: string | null;
  /**
   * True when a RUNNING campaign waives the booking fee for THIS service.
   *
   * Passed in as a plain boolean, already resolved by the caller (see
   * server/lib/campaign.ts campaignFreeBookingForService). This module deliberately has
   * no imports: it is the most security-sensitive calculation in the application, it is
   * loaded by its unit test as bare source with the types stripped, and adding a
   * dependency would both break that test and make the amount harder to reason about.
   *
   * Defaults to false, so every existing caller keeps its exact behaviour.
   */
  campaignFreeBooking?: boolean;
  /** Injected so the window is testable without waiting for a calendar. */
  now?: Date;
}

export interface ResolvedBookingAmount {
  /** Rupees. This is what is charged and what is stored on the booking. Zero means no
   *  payment is taken and Razorpay is not involved at all. */
  amount: number;
  /** Which rule produced it — surfaced for logging and asserted in tests. */
  source: "service-price" | "settings" | "default" | "free-offer" | "campaign-free-offer";
}

/** Accepts a value only if it parses to a finite, strictly positive number. */
function usableAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function resolveBookingAmount(input: ResolveBookingAmountInput): ResolvedBookingAmount {
  // 0a. A RUNNING campaign waives the fee for this specific service.
  //
  //     Ahead of the legacy window only so the reported `source` names the campaign; both
  //     produce the same zero, so the order cannot change what anyone is charged. Scoped
  //     to one service by the caller, unlike rule 0b — a ceramic-coating campaign must
  //     not make the ₹8,999 Annual Maintenance Package free just because both are
  //     bookable the same week.
  if (input.campaignFreeBooking === true) {
    return { amount: 0, source: "campaign-free-offer" };
  }

  // 0b. Legacy free-booking offer, applying to EVERY service. Unchanged.
  //
  //     Deliberately ahead of the full-price package: the offer is "book free", and a
  //     customer told the booking is free must not be charged ₹8999 because of which
  //     service they picked. The window fails closed (see above), and zero is returned as
  //     a first-class result rather than by setting booking_amount to "0" —
  //     usableAmount() rejects 0, so that route would silently charge ₹299 instead.
  if (isFreeBookingWindow(input.freeBookingUntil, input.now ?? new Date())) {
    return { amount: 0, source: "free-offer" };
  }

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
