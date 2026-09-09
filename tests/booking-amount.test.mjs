/**
 * Payment amount authority — the six cases requested for the DEFECT 1 fix.
 *
 *   npm test
 *
 * WHAT THIS PROVES: the amount charged to a customer is decided entirely by server-side
 * inputs. `resolveBookingAmount` has no parameter a request body can reach, so a crafted
 * client cannot influence the Razorpay order amount even in the degraded states (missing
 * settings row, unreadable settings, corrupt value) where the old code silently kept the
 * client's number.
 *
 * The old code was:
 *     let bookingFeeAmount = bookingData.amount || 299;   // client-seeded
 *     ... conditionally overwritten from the database ...
 * and `bookingFeeAmount` is what createPaymentOrder() charges and what is stored on the
 * booking row. If site_settings.booking_amount was missing, blank or the read threw, the
 * client's value survived to Razorpay.
 *
 * Cases 1, 2 and 6 are enforced structurally rather than by a value assertion: there is no
 * client input to pass, so they are asserted against the route source instead — the amount
 * variable must not be seeded from the request body, and createPaymentOrder must be called
 * with the resolved server value.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load the pure module by stripping its type annotations — it has no runtime dependencies.
const src = fs
  .readFileSync(path.join(repoRoot, 'server/lib/booking-amount.ts'), 'utf8')
  .replace(/export interface \w+ \{[\s\S]*?\n\}/g, '')
  .replace(/function usableAmount\([^)]*\)[^{]*\{/, 'function usableAmount(value) {')
  // Multi-line signature with a default parameter, so it needs its own rule.
  .replace(
    /export function isFreeBookingWindow\([\s\S]*?\): boolean \{/,
    'function isFreeBookingWindow(freeBookingUntil, now) { if (now === undefined) now = new Date();',
  )
  .replace(/export function resolveBookingAmount\([^)]*\)[^{]*\{/, 'function resolveBookingAmount(input) {')
  .replace(/^export /gm, '');

const { resolveBookingAmount, isFreeBookingWindow, DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG } =
  new Function(
    src +
      '; return { resolveBookingAmount, isFreeBookingWindow, DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG };',
  )();

/** Route source with comments removed, so assertions match code and not the explanations. */
const routeCode = fs
  .readFileSync(path.join(repoRoot, 'server/routes.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('DEFECT 1 — client input can never become the amount', () => {
  test('case 1+2: resolveBookingAmount exposes no client-controlled input at all', () => {
    // The strongest possible statement of the rule: the function signature has three
    // fields, all sourced from the database. There is nowhere to put a request value.
    const result = resolveBookingAmount({
      serviceSlug: 'car-polishing',
      servicePrice: '2999.00',
      bookingAmountSetting: '299',
    });
    assert.equal(result.amount, 299);
    assert.equal(result.source, 'settings');

    // Passing extra keys (as a malicious caller might) changes nothing.
    const withJunk = resolveBookingAmount({
      serviceSlug: 'car-polishing',
      servicePrice: '2999.00',
      bookingAmountSetting: '299',
      amount: 1,
      bookingFeeAmount: 1,
      clientAmount: 1,
    });
    assert.equal(withJunk.amount, 299, 'an injected amount-like key must be ignored');
  });

  test('case 2: the route no longer seeds the amount from the request body', () => {
    assert.ok(
      !/bookingFeeAmount\s*=\s*bookingData\.amount/.test(routeCode),
      'the amount must not be seeded from bookingData.amount',
    );
    assert.ok(
      !/=\s*bookingData\.amount\s*\|\|/.test(routeCode),
      'the "bookingData.amount || 299" pattern must not reappear',
    );
  });

  test('case 3: a valid settings value is used', () => {
    const r = resolveBookingAmount({
      serviceSlug: 'interior-detailing-service',
      servicePrice: '2499.00',
      bookingAmountSetting: '499',
    });
    assert.equal(r.amount, 499);
    assert.equal(r.source, 'settings');
  });

  test('case 3b: the Annual Maintenance Package is charged its full service price', () => {
    const r = resolveBookingAmount({
      serviceSlug: FULL_PRICE_SLUG,
      servicePrice: '8999.00',
      bookingAmountSetting: '299',
    });
    assert.equal(r.amount, 8999, 'the package must not be charged the ₹299 booking fee');
    assert.equal(r.source, 'service-price');
  });

  test('case 4: a missing settings row falls back to the server default', () => {
    for (const missing of [null, undefined, '']) {
      const r = resolveBookingAmount({
        serviceSlug: 'car-polishing',
        servicePrice: '2999.00',
        bookingAmountSetting: missing,
      });
      assert.equal(r.amount, DEFAULT_BOOKING_FEE);
      assert.equal(r.source, 'default');
    }
  });

  test('case 5: a failed settings read (passed as null) falls back to the server default', () => {
    // The route turns a thrown read into null before calling in, so this is that path.
    const r = resolveBookingAmount({
      serviceSlug: 'car-polishing',
      servicePrice: '2999.00',
      bookingAmountSetting: null,
    });
    assert.equal(r.amount, DEFAULT_BOOKING_FEE);
    assert.equal(r.source, 'default');
  });

  test('case 5b: a corrupt or hostile settings value falls back, never charges it', () => {
    for (const bad of ['abc', '0', '-500', 'NaN', '  ', '1e-9999']) {
      const r = resolveBookingAmount({
        serviceSlug: 'car-polishing',
        servicePrice: '2999.00',
        bookingAmountSetting: bad,
      });
      assert.equal(r.amount, DEFAULT_BOOKING_FEE, `"${bad}" must not become the charge`);
      assert.equal(r.source, 'default');
    }
  });

  test('case 6: the Razorpay order is created from the resolved server amount', () => {
    assert.ok(
      /createPaymentOrder\(\s*bookingFeeAmount/.test(routeCode),
      'createPaymentOrder must be called with the resolved server amount',
    );
    assert.ok(
      !/createPaymentOrder\(\s*(req\.body|bookingData)/.test(routeCode),
      'createPaymentOrder must never be called with a request value',
    );
    assert.ok(
      /const bookingFeeAmount = resolvedAmount\.amount/.test(routeCode),
      'bookingFeeAmount must come from resolveBookingAmount',
    );
  });

  test('case 6b: the amount stored on the booking is the same resolved value', () => {
    assert.ok(
      /amount:\s*bookingFeeAmount\.toString\(\)/.test(routeCode),
      'the persisted booking amount must be the resolved server amount',
    );
  });

  test('the resolved amount is immutable once computed (const, not let)', () => {
    assert.ok(
      /const bookingFeeAmount =/.test(routeCode),
      'bookingFeeAmount should be const so nothing downstream can reassign it',
    );
    assert.ok(
      !/let bookingFeeAmount =/.test(routeCode),
      'a reassignable amount invites exactly the bug this fixes',
    );
  });
});

describe('DEFECT 1 — the full-price package cannot be downgraded', () => {
  test('a corrupt package price falls back to the default rather than charging nothing', () => {
    const r = resolveBookingAmount({
      serviceSlug: FULL_PRICE_SLUG,
      servicePrice: 'not-a-number',
      bookingAmountSetting: '299',
    });
    assert.equal(r.amount, DEFAULT_BOOKING_FEE);
    assert.equal(r.source, 'default');
  });

  test('the package ignores the booking-fee setting entirely', () => {
    const r = resolveBookingAmount({
      serviceSlug: FULL_PRICE_SLUG,
      servicePrice: '8999.00',
      bookingAmountSetting: '1',
    });
    assert.equal(r.amount, 8999);
  });
});

describe('FREE BOOKING OFFER — nothing is charged while the window is open', () => {
  const IN_WINDOW = new Date('2026-09-12T10:00:00+05:30');

  test('every service resolves to zero during the offer', () => {
    for (const slug of ['car-polishing', 'interior-detailing-service', 'ppf-suv']) {
      const r = resolveBookingAmount({
        serviceSlug: slug,
        servicePrice: '2999.00',
        bookingAmountSetting: '299',
        freeBookingUntil: '2026-09-16',
        now: IN_WINDOW,
      });
      assert.equal(r.amount, 0, `${slug} must be free`);
      assert.equal(r.source, 'free-offer');
    }
  });

  test('the full-price package is free too, not charged its 8999', () => {
    const r = resolveBookingAmount({
      serviceSlug: FULL_PRICE_SLUG,
      servicePrice: '8999.00',
      bookingAmountSetting: '299',
      freeBookingUntil: '2026-09-16',
      now: IN_WINDOW,
    });
    assert.equal(r.amount, 0, 'a customer told booking is free must not be charged 8999');
    assert.equal(r.source, 'free-offer');
  });

  test('the fee returns the moment the window closes', () => {
    const after = new Date('2026-09-17T00:00:01+05:30');
    const r = resolveBookingAmount({
      serviceSlug: 'car-polishing',
      servicePrice: '2999.00',
      bookingAmountSetting: '299',
      freeBookingUntil: '2026-09-16',
      now: after,
    });
    assert.equal(r.amount, 299);
    assert.equal(r.source, 'settings');
  });

  test('the last IST minute of the final day is still free', () => {
    // A booking at 23:50 in Bangalore on the 16th is inside the offer. Parsing the bare
    // date as UTC would have ended it at 05:30 IST that morning.
    assert.equal(isFreeBookingWindow('2026-09-16', new Date('2026-09-16T23:50:00+05:30')), true);
    assert.equal(isFreeBookingWindow('2026-09-16', new Date('2026-09-17T00:10:00+05:30')), false);
  });

  test('FAILS CLOSED: a malformed or hostile value never makes anything free', () => {
    for (const bad of [null, undefined, '', '   ', 'true', 'yes', 'forever', '2026-13-45x',
                       '16-09-2026', '2026/09/16', '"2026-09-16"', '2026-09-16T00:00:00Z']) {
      assert.equal(isFreeBookingWindow(bad, IN_WINDOW), false, `"${bad}" must not open the offer`);
      const r = resolveBookingAmount({
        serviceSlug: 'car-polishing',
        servicePrice: '2999.00',
        bookingAmountSetting: '299',
        freeBookingUntil: bad,
        now: IN_WINDOW,
      });
      assert.equal(r.amount, 299, `"${bad}" must leave the fee in place`);
    }
  });

  test('a past date does not reopen the offer', () => {
    assert.equal(isFreeBookingWindow('2026-09-01', IN_WINDOW), false);
  });

  test('absent setting behaves exactly as before the offer existed', () => {
    const r = resolveBookingAmount({
      serviceSlug: FULL_PRICE_SLUG,
      servicePrice: '8999.00',
      bookingAmountSetting: '299',
    });
    assert.equal(r.amount, 8999);
    assert.equal(r.source, 'service-price');
  });
});

describe('FREE BOOKING OFFER — the route takes no payment', () => {
  test('a zero amount short-circuits before Razorpay is consulted', () => {
    const freeIdx = routeCode.indexOf('resolvedAmount.amount === 0');
    const rzpIdx = routeCode.indexOf('const razorpayConfigured');
    assert.ok(freeIdx > -1, 'the free-booking branch must exist');
    assert.ok(freeIdx < rzpIdx, 'free booking must not be blocked by a missing Razorpay key');
  });

  test('free bookings are recorded as free, never as paid', () => {
    const block = routeCode.slice(routeCode.indexOf('resolvedAmount.amount === 0'));
    assert.match(block.slice(0, 1200), /paymentStatus: "free"/);
    assert.ok(!/paymentStatus: "paid"/.test(block.slice(0, 1200)),
      'recording 0 as paid would inflate admin revenue');
    assert.match(block.slice(0, 1200), /amount: "0\.00"/);
  });

  test('the free path still guards slot capacity', () => {
    const block = routeCode.slice(routeCode.indexOf('resolvedAmount.amount === 0'), routeCode.indexOf('const razorpayConfigured'));
    assert.match(block, /createBookingWithCapacity/, 'a free slot is still a real slot');
    assert.match(block, /SlotFullError/);
  });

  test('the offer state is decided server-side, not in the browser', () => {
    assert.match(routeCode, /app\.get\("\/api\/booking-offer"/);
    assert.match(routeCode, /isFreeBookingWindow\(until\)/);
  });
});
