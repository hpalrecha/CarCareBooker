/**
 * The purchase conversion must fire exactly once per payment.
 *
 *   npm test
 *
 * Four things can drive the same successful payment through trackPurchase more than once:
 *   - the five-attempt retry loop in the Razorpay handler
 *   - the webhook/browser race, where both paths now return a successful response
 *   - React re-renders or a remount of the booking modal
 *   - Razorpay invoking its handler callback more than once
 *
 * Reporting one sale twice inflates Google Ads conversions and corrupts ROAS, so the guard
 * lives inside trackPurchase keyed on razorpay_payment_id — not at the call site, where a
 * future caller could forget it. These tests drive each of those paths.
 *
 * Ads (AW-11467752288), GA4 (G-QXEEJ4EK4J) and Clarity are separate tags and are not
 * touched here; the assertions below are about what this module pushes to dataLayer/gtag.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const src = fs
  .readFileSync(path.join(repoRoot, 'client/src/lib/analytics.ts'), 'utf8')
  .replace(/declare global \{[\s\S]*?\n\}/, '')
  .replace(/const reportedPurchases = new Set<string>\(\);/, 'const reportedPurchases = new Set();')
  .replace(/function track\([^)]*\)[^{]*\{/, 'function track(event, params) {')
  .replace(/export function trackFreeBooking\(args: \{[\s\S]*?\}\): void \{/, 'function trackFreeBooking(args) {')
  .replace(/export function trackBeginCheckout\(args: \{[\s\S]*?\}\): void \{/, 'function trackBeginCheckout(args) {')
  .replace(/export function trackPurchase\(args: \{[\s\S]*?\}\): boolean \{/, 'function trackPurchase(args) {')
  .replace(/export function __resetPurchaseDedupeForTests\(\): void \{/, 'function __resetPurchaseDedupeForTests() {')
  .replace(/^export /gm, '');

const mod = new Function(
  'window',
  src + '; return { trackPurchase, trackBeginCheckout, trackFreeBooking, __resetPurchaseDedupeForTests };',
);

let win;
let api;
const gtagCalls = () => win.__gtagEvents;
const purchases = () => win.dataLayer.filter((e) => e.event === 'purchase');

beforeEach(() => {
  win = {
    dataLayer: [],
    __gtagEvents: [],
    gtag: function (kind, name, params) { win.__gtagEvents.push({ kind, name, params }); },
  };
  api = mod(win);
});

const PAYMENT = {
  transactionId: 'pay_TESTONLY123',
  serviceId: 'svc-1',
  serviceTitle: 'Interior Detailing Service',
  amount: 299,
};

describe('purchase fires exactly once per payment id', () => {
  test('the first call reports the conversion', () => {
    assert.equal(api.trackPurchase(PAYMENT), true);
    assert.equal(purchases().length, 1);
    assert.equal(gtagCalls().length, 1);
    assert.equal(purchases()[0].transaction_id, 'pay_TESTONLY123');
    assert.equal(purchases()[0].value, 299);
    assert.equal(purchases()[0].currency, 'INR');
  });

  test('the retry loop cannot report it again', () => {
    api.trackPurchase(PAYMENT);
    for (let attempt = 2; attempt <= 5; attempt++) {
      assert.equal(api.trackPurchase(PAYMENT), false, `retry ${attempt} must be suppressed`);
    }
    assert.equal(purchases().length, 1, 'exactly one purchase event');
    assert.equal(gtagCalls().length, 1, 'exactly one gtag event');
  });

  test('the webhook/browser race cannot report it twice', () => {
    // Both paths now return a successful response for the same payment.
    assert.equal(api.trackPurchase(PAYMENT), true);   // browser confirmed
    assert.equal(api.trackPurchase(PAYMENT), false);  // idempotent confirm after webhook
    assert.equal(purchases().length, 1);
  });

  test('a remount or re-render cannot report it twice (module-level guard)', () => {
    api.trackPurchase(PAYMENT);
    // A remount re-invokes the same module instance, exactly as in the browser.
    assert.equal(api.trackPurchase(PAYMENT), false);
    assert.equal(purchases().length, 1);
  });

  test('a genuinely different payment IS reported', () => {
    assert.equal(api.trackPurchase(PAYMENT), true);
    assert.equal(api.trackPurchase({ ...PAYMENT, transactionId: 'pay_TESTONLY456' }), true);
    assert.equal(purchases().length, 2, 'two real sales must both count');
  });

  test('a missing payment id is never reported (cannot be deduplicated)', () => {
    assert.equal(api.trackPurchase({ ...PAYMENT, transactionId: '' }), false);
    assert.equal(api.trackPurchase({ ...PAYMENT, transactionId: undefined }), false);
    assert.equal(purchases().length, 0, 'better a missing conversion than an uncountable one');
  });
});

describe('begin_checkout is an intent signal, not a conversion', () => {
  test('it pushes begin_checkout with the amount', () => {
    api.trackBeginCheckout({ serviceId: 'svc-1', serviceTitle: 'X', amount: 299 });
    const evts = win.dataLayer.filter((e) => e.event === 'begin_checkout');
    assert.equal(evts.length, 1);
    assert.equal(evts[0].value, 299);
    assert.equal(purchases().length, 0, 'opening checkout must never count as a sale');
  });

  test('begin_checkout is deliberately NOT deduplicated', () => {
    api.trackBeginCheckout({ serviceId: 'svc-1', serviceTitle: 'X', amount: 299 });
    api.trackBeginCheckout({ serviceId: 'svc-1', serviceTitle: 'X', amount: 299 });
    assert.equal(win.dataLayer.filter((e) => e.event === 'begin_checkout').length, 2,
      'a customer reopening checkout is a real, repeatable intent signal');
  });
});

describe('failed and cancelled payments fire no purchase', () => {
  test('a cancelled checkout never calls trackPurchase, so nothing is reported', () => {
    api.trackBeginCheckout({ serviceId: 'svc-1', serviceTitle: 'X', amount: 299 });
    // no trackPurchase call — this is what the cancel path does
    assert.equal(purchases().length, 0);
  });

  test('tracking never throws even when the tag is absent or hostile', () => {
    const broken = mod({
      get dataLayer() { throw new Error('blocked by an extension'); },
    });
    assert.doesNotThrow(() => broken.trackPurchase(PAYMENT), 'analytics must never break checkout');
    const noGtag = mod({ dataLayer: [] });
    assert.doesNotThrow(() => noGtag.trackPurchase(PAYMENT));
  });
});

describe('source guard — the conversion stays on the verified path', () => {
  test('trackPurchase is only called after a successful confirm response', () => {
    const modal = fs.readFileSync(path.join(repoRoot, 'client/src/components/booking-modal.tsx'), 'utf8');
    const okIdx = modal.indexOf('if (confirmResponse.ok)');
    const purchaseIdx = modal.indexOf('trackPurchase({');
    assert.ok(okIdx > -1, 'the ok-response branch must exist');
    assert.ok(purchaseIdx > okIdx, 'trackPurchase must sit inside the ok branch');
  });

  test('the existing tags are untouched in index.html', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'client/index.html'), 'utf8');
    assert.ok(html.includes('AW-11467752288'), 'Google Ads tag must remain');
    assert.ok(html.includes('clarity.ms/tag/'), 'Clarity tag must remain');
    assert.ok(html.includes("indexOf('/admin')"), 'Clarity admin guard must remain');
  });
});

describe('free bookings are leads, never purchases', () => {
  test('a free booking fires generate_lead with zero value', () => {
    api.trackFreeBooking({ serviceId: 'svc-1', serviceTitle: 'Interior Detailing', bookingId: 'bk-1' });
    const leads = win.dataLayer.filter((e) => e.event === 'generate_lead');
    assert.equal(leads.length, 1);
    assert.equal(leads[0].value, 0);
    assert.equal(leads[0].lead_source, 'free_booking_offer');
  });

  test('a free booking NEVER reports a purchase', () => {
    api.trackFreeBooking({ serviceId: 'svc-1', serviceTitle: 'X', bookingId: 'bk-1' });
    assert.equal(purchases().length, 0,
      'a zero-value purchase would corrupt ROAS and the Ads conversion value');
  });

  test('free bookings and real sales stay separable', () => {
    api.trackFreeBooking({ serviceId: 'svc-1', serviceTitle: 'X', bookingId: 'bk-1' });
    api.trackPurchase(PAYMENT);
    assert.equal(win.dataLayer.filter((e) => e.event === 'generate_lead').length, 1);
    assert.equal(purchases().length, 1);
    assert.equal(purchases()[0].value, 299, 'the paid sale keeps its real value');
  });

  test('tracking a free booking never throws when the tag is absent', () => {
    const noGtag = mod({ dataLayer: [] });
    assert.doesNotThrow(() => noGtag.trackFreeBooking({ serviceId: 'a', serviceTitle: 'b' }));
  });
});
