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
  .replace(/export function resolveBookingAmount\([^)]*\)[^{]*\{/, 'function resolveBookingAmount(input) {')
  .replace(/^export /gm, '');

const { resolveBookingAmount, DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG } = new Function(
  src + '; return { resolveBookingAmount, DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG };',
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
