/**
 * Booking all six PPF packages (Basic and Premium, hatchback / sedan / SUV) through the REAL POST /api/bookings.
 *
 *   npm run test:integration
 *
 * Same method as booking-payment-integration.itest.mjs: the real routes mounted on a real Express app, with only the
 * edges faked (storage, the Razorpay wrapper, notifications). No real payment, no message, no database.
 *
 * WHAT IS PROVEN:
 *   - the booking stores the catalogue row the customer chose (serviceId), so Basic and Premium are told apart by the
 *     row itself, with no new field;
 *   - the body type is recorded as vehicleCategory (hatchback | sedan | suv); a tier name is not a valid category and
 *     is dropped, so it cannot be used to change anything;
 *   - the amount charged is decided on the server from the row (the ₹499 slot deposit for a PPF row over ₹10,000), for
 *     Premium exactly as for Basic, and a client-supplied amount is ignored;
 *   - the Meta Ads campaign snapshot is still written.
 *
 * WHICH ROW QUALIFIES FOR A CAMPAIGN'S FREE BOOKING (documented, and tested below): only the row named by the
 * campaign's `serviceSlug` (server/lib/campaign.ts campaignFreeBookingForService). Every other PPF row still takes the
 * ₹499 deposit, Premium rows included, because the campaign lookup compares `c.serviceSlug === service.slug`. The
 * legacy `free_booking_until` window is the exception: it waives the fee for every row.
 *
 * NOT PROVEN HERE: the booking modal and the page UI (checked in a browser), Razorpay's hosted checkout, a real database.
 */
import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { __resetRateLimitsForTests } from '../server/lib/rate-limit.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const six = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'fixtures', 'ppf-six-records.json'), 'utf8')).records;
const BODY = { hatchback: 'hatchback', sedan: 'sedan', suv: 'suv' };
const bodyOf = (slug) => slug.replace(/^ppf-(premium-)?/, '');
const tierOf = (slug) => (slug.startsWith('ppf-premium-') ? 'premium' : 'basic');

const db = { services: new Map(), bookings: new Map(), settings: new Map(), businessHours: new Map(), campaigns: [] };
const chargedAmounts = [];
let seq = 0;

const storage = {
  getService: async (id) => db.services.get(id),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async (dow) => db.businessHours.get(dow),
  getBookingCountForSlot: async () => 0,
  getSetting: async (key) => db.settings.get(key),
  getAllCampaigns: async () => db.campaigns,
  createBooking: async (values) => { const b = { id: 'bk_' + ++seq, ...values }; db.bookings.set(b.id, b); return b; },
  createBookingWithCapacity: async (values) => storage.createBooking(values),
  updateBooking: async (id, patch) => Object.assign(db.bookings.get(id), patch),
  getBooking: async (id) => db.bookings.get(id),
  getTimeSlot: async () => ({ id: 'ts', startTime: '10:00 AM', endTime: '11:00 AM' }),
  getPpfLeadByOrderId: async () => undefined,
};
class SlotFullError extends Error {}

mock.module('../server/storage.ts', { exports: { storage, SlotFullError } });
// Pinned closed so the ordinary booking fee is what is asserted (the Diwali slot offer is covered elsewhere).
mock.module('../server/lib/diwali-offer.ts', { exports: { ...(await import('../server/lib/diwali-offer.ts')), isDiwaliOfferOpen: () => false } });
mock.module('../server/services/payment.ts', {
  exports: {
    createPaymentOrder: async (amount, receipt) => { chargedAmounts.push(amount); return { id: 'order_' + ++seq, amount: Math.round(Number(amount) * 100), currency: 'INR', receipt }; },
    verifyPaymentSignature: async () => false,
  },
});
mock.module('../server/services/whatsapp.ts', { exports: { whatsappService: { sendBookingConfirmation: async () => ({ success: true }), sendAppointmentReminder: async () => ({ success: true }) } } });
mock.module('../server/services/scheduler.ts', { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module('../server/services/email.ts', { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module('../server/services/webhook.ts', { exports: { sendBookingWebhook: async () => ({ ok: true }) } });

let server, base;
before(async () => {
  process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/none';
  process.env.SESSION_SECRET = 'ppf-booking-test-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_fake';
  process.env.RAZORPAY_KEY_SECRET = 'fake-secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'fake-webhook';
  process.env.NODE_ENV = 'test';
  const { registerRoutes } = await import('../server/routes.ts');
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise((r) => server.close(r)); });

beforeEach(() => {
  __resetRateLimitsForTests();
  db.services.clear(); db.bookings.clear(); db.settings.clear(); db.businessHours.clear(); db.campaigns = [];
  chargedAmounts.length = 0;
  for (const r of six) db.services.set(r.id, { ...r });
  db.settings.set('booking_amount', { key: 'booking_amount', value: '299' });
  for (let d = 0; d <= 6; d++) db.businessHours.set(d, { dayOfWeek: d, dayName: 'Day' + d, isOpen: true, openTime: '00:00', cutoffTime: '23:59' });
});

const futureDate = () => {
  const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const post = async (body) => {
  const res = await fetch(base + '/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};
const payload = (over = {}) => ({
  serviceId: six[0].id, timeSlotId: '10:00', appointmentDate: futureDate(), appointmentTime: '10:00',
  customerName: 'Test Person', customerEmail: 'test.person@example.com', customerPhone: '9876500011', ...over,
});

describe('each of the six packages books correctly', () => {
  for (const row of six) {
    const tier = tierOf(row.slug), body = bodyOf(row.slug);
    test(`${tier} / ${body} (${row.slug}): the chosen row, the body type and a server-side amount`, async () => {
      const res = await post(payload({ serviceId: row.id, vehicleType: 'car', vehicleCategory: BODY[body] }));
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(db.bookings.size, 1);
      const saved = [...db.bookings.values()][0];
      assert.equal(saved.serviceId, row.id, 'the booking points at the row that was chosen');
      assert.equal(db.services.get(saved.serviceId).slug, row.slug);
      assert.equal(db.services.get(saved.serviceId).title.includes('Premium'), tier === 'premium');
      assert.equal(saved.vehicleCategory, body);
      assert.equal(saved.vehicleType, 'car');
      assert.equal(chargedAmounts[0], 499, 'a PPF row over ₹10,000 takes the ₹499 slot deposit, Basic and Premium alike');
      assert.equal(res.body.paymentOrder.amount, 49900);
    });
  }

  test('the six bookings are six different rows, three per tier', async () => {
    for (const row of six) await post(payload({ serviceId: row.id, vehicleType: 'car', vehicleCategory: bodyOf(row.slug) }));
    const ids = [...db.bookings.values()].map((b) => b.serviceId);
    assert.equal(new Set(ids).size, 6);
    assert.equal(ids.filter((id) => db.services.get(id).slug.startsWith('ppf-premium-')).length, 3);
  });
});

describe('the client cannot change what is recorded or charged', () => {
  const premiumSedan = six.find((r) => r.slug === 'ppf-premium-sedan');

  test('a tier name is not a vehicle category: it is dropped, and the row still decides the package', async () => {
    const res = await post(payload({ serviceId: premiumSedan.id, vehicleType: 'car', vehicleCategory: 'premium' }));
    assert.equal(res.status, 200);
    const saved = [...db.bookings.values()][0];
    assert.equal(saved.vehicleCategory, null);
    assert.equal(saved.serviceId, premiumSedan.id);
  });

  test('a manipulated amount is ignored for a Premium package', async () => {
    const res = await post(payload({ serviceId: premiumSedan.id, vehicleCategory: 'sedan', amount: 1 }));
    assert.equal(res.status, 200);
    assert.equal(chargedAmounts[0], 499);
  });

  test('a vehicle category that does not match the row cannot change the price (the row decides)', async () => {
    const res = await post(payload({ serviceId: premiumSedan.id, vehicleCategory: 'hatchback' }));
    assert.equal(res.status, 200);
    assert.equal(chargedAmounts[0], 499);
    assert.equal([...db.bookings.values()][0].serviceId, premiumSedan.id);
  });
});

describe('the Meta Ads campaign snapshot is still written for a /ppf booking', () => {
  test('a running campaign scoped to the booked row is recorded on the booking, Basic or Premium', async () => {
    const now = Date.now();
    for (const slug of ['ppf-hatchback', 'ppf-premium-hatchback']) {
      db.bookings.clear(); chargedAmounts.length = 0;
      db.campaigns = [{
        id: 'camp1', name: 'PPF offer', identifier: 'ppf_nov_offer', serviceSlug: slug, vehicleType: 'car', landingPage: '/ppf',
        startsAt: new Date(now - 3600e3).toISOString(), endsAt: new Date(now + 86400e3).toISOString(),
        isActive: true, offerType: 'free_booking', offerTitle: 't', offerDescription: null, ctaText: 'Book',
      }];
      const row = six.find((r) => r.slug === slug);
      const res = await post(payload({ serviceId: row.id, vehicleType: 'car', vehicleCategory: 'hatchback' }));
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const saved = [...db.bookings.values()][0];
      assert.equal(saved.campaignIdentifier, 'ppf_nov_offer', slug);
      assert.equal(saved.vehicleCategory, 'hatchback', slug);
    }
  });

  test('a campaign scoped to one row does not apply to another row (existing rule, unchanged)', async () => {
    const now = Date.now();
    db.campaigns = [{
      id: 'camp1', name: 'PPF offer', identifier: 'ppf_nov_offer', serviceSlug: 'ppf-hatchback', vehicleType: 'car', landingPage: '/ppf',
      startsAt: new Date(now - 3600e3).toISOString(), endsAt: new Date(now + 86400e3).toISOString(),
      isActive: true, offerType: 'free_booking', offerTitle: 't', offerDescription: null, ctaText: 'Book',
    }];
    const premium = six.find((r) => r.slug === 'ppf-premium-hatchback');
    const res = await post(payload({ serviceId: premium.id, vehicleType: 'car', vehicleCategory: 'hatchback' }));
    assert.equal(res.status, 200);
    assert.equal([...db.bookings.values()][0].campaignIdentifier, null);
    assert.equal(chargedAmounts[0], 499);
  });
});

// ===========================================================================
// FREE BOOKING IS PER ROW: what the page says must equal what the server charges, for all six rows
// ===========================================================================
import { bookingIsFreeForRow, freeBookingSource, showPreviousPrice } from '../client/src/lib/offer-scope.ts';

describe('free-booking scope: the page and the server agree for every row and every scenario', () => {
  const NOW = Date.now();
  const campaign = (slug, over = {}) => ({
    id: 'camp-' + slug, name: 'PPF offer', identifier: 'ppf_offer', serviceSlug: slug, vehicleType: 'car', landingPage: '/ppf',
    startsAt: new Date(NOW - 3600e3).toISOString(), endsAt: new Date(NOW + 86400e3).toISOString(),
    isActive: true, offerType: 'free_booking', offerTitle: 'Free booking', offerDescription: null, ctaText: 'Book', ...over,
  });
  const futureLegacy = () => { const d = new Date(NOW + 5 * 86400e3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const pastLegacy = () => { const d = new Date(NOW - 5 * 86400e3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  /** [label, campaigns, legacy setting value or null, slugs expected to be free] */
  const SCENARIOS = [
    ['no offer at all', [], null, []],
    ['campaign for Basic Hatchback', [campaign('ppf-hatchback')], null, ['ppf-hatchback']],
    ['campaign for Basic Sedan', [campaign('ppf-sedan')], null, ['ppf-sedan']],
    ['campaign for Basic SUV', [campaign('ppf-suv')], null, ['ppf-suv']],
    ['campaign for Premium Hatchback', [campaign('ppf-premium-hatchback')], null, ['ppf-premium-hatchback']],
    ['campaign for Premium Sedan', [campaign('ppf-premium-sedan')], null, ['ppf-premium-sedan']],
    ['campaign for Premium SUV', [campaign('ppf-premium-suv')], null, ['ppf-premium-suv']],
    ['legacy free_booking_until in the future (every row)', [], 'LEGACY_FUTURE', six.map((r) => r.slug)],
    ['legacy free_booking_until in the past', [], 'LEGACY_PAST', []],
    ['legacy window AND a campaign for one row (every row is free)', [campaign('ppf-premium-sedan')], 'LEGACY_FUTURE', six.map((r) => r.slug)],
    ['campaign that has ended', [campaign('ppf-hatchback', { startsAt: new Date(NOW - 9e6).toISOString(), endsAt: new Date(NOW - 3e6).toISOString() })], null, []],
    ['campaign not started yet', [campaign('ppf-hatchback', { startsAt: new Date(NOW + 3e6).toISOString(), endsAt: new Date(NOW + 9e6).toISOString() })], null, []],
    ['campaign paused', [campaign('ppf-hatchback', { isActive: false })], null, []],
    ['presentation-only campaign (offerType none)', [campaign('ppf-hatchback', { offerType: 'none' })], null, []],
  ];

  for (const [label, campaigns, legacy, freeSlugs] of SCENARIOS) {
    test(`${label}: free for ${freeSlugs.length === 6 ? 'all six rows' : freeSlugs.length ? freeSlugs.join(', ') : 'no row'}; the other rows take the ₹499 deposit`, async () => {
      db.campaigns = campaigns;
      db.settings.set('free_booking_until', legacy ? { key: 'free_booking_until', value: legacy === 'LEGACY_FUTURE' ? futureLegacy() : pastLegacy() } : undefined);
      if (!legacy) db.settings.delete('free_booking_until');

      // What the page learns, from the real endpoints.
      const offer = await (await fetch(base + '/api/booking-offer')).json();
      const active = await (await fetch(base + '/api/campaigns/active?landingPage=' + encodeURIComponent('/ppf'))).json();

      for (const row of six) {
        db.bookings.clear(); chargedAmounts.length = 0; __resetRateLimitsForTests();
        const pageSaysFree = bookingIsFreeForRow({ rowSlug: row.slug, campaign: active.campaign, legacyFree: offer.free });
        const res = await post(payload({ serviceId: row.id, vehicleType: 'car', vehicleCategory: bodyOf(row.slug) }));
        assert.equal(res.status, 200, `${row.slug}: ${JSON.stringify(res.body)}`);
        const serverFree = res.body.freeBooking === true && chargedAmounts.length === 0;
        assert.equal(serverFree, freeSlugs.includes(row.slug), `${row.slug}: server`);
        assert.equal(pageSaysFree, serverFree, `${row.slug}: the page promised "${pageSaysFree ? 'free' : 'not free'}" but the server charged ${serverFree ? 0 : chargedAmounts[0]}`);
        if (!serverFree) assert.equal(chargedAmounts[0], 499, `${row.slug}: ₹499 deposit`);
      }
    });
  }

  test('the mismatch the review found: a campaign for Basic Hatchback must not promise free booking on Premium Sedan', async () => {
    db.campaigns = [campaign('ppf-hatchback')];
    db.settings.delete('free_booking_until');
    const active = await (await fetch(base + '/api/campaigns/active?landingPage=' + encodeURIComponent('/ppf'))).json();
    assert.equal(active.campaign?.serviceSlug, 'ppf-hatchback', 'the endpoint answers per landing page, not per row');
    // The old page logic (campaign present and free_booking) would have said free for every row:
    const old = (c) => c !== null && c.offerType === 'free_booking';
    assert.equal(old(active.campaign), true);
    // The new rule says free only for the campaign's row:
    assert.equal(bookingIsFreeForRow({ rowSlug: 'ppf-hatchback', campaign: active.campaign, legacyFree: false }), true);
    for (const slug of ['ppf-sedan', 'ppf-suv', 'ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv']) {
      assert.equal(bookingIsFreeForRow({ rowSlug: slug, campaign: active.campaign, legacyFree: false }), false, slug);
    }
    __resetRateLimitsForTests();
    const premium = six.find((r) => r.slug === 'ppf-premium-sedan');
    chargedAmounts.length = 0;
    await post(payload({ serviceId: premium.id, vehicleCategory: 'sedan' }));
    assert.equal(chargedAmounts[0], 499, 'and the server really does charge ₹499 for it');
  });

  test('fails closed: unknown row, no campaign, wrong offer type or a different row is not free', () => {
    assert.equal(freeBookingSource({ rowSlug: undefined, campaign: { serviceSlug: 'ppf-suv', offerType: 'free_booking' }, legacyFree: false }), null);
    assert.equal(freeBookingSource({ rowSlug: 'ppf-suv', campaign: null, legacyFree: false }), null);
    assert.equal(freeBookingSource({ rowSlug: 'ppf-suv', campaign: { serviceSlug: 'ppf-suv', offerType: 'none' }, legacyFree: false }), null);
    assert.equal(freeBookingSource({ rowSlug: 'ppf-suv', campaign: { serviceSlug: 'ppf-sedan', offerType: 'free_booking' }, legacyFree: false }), null);
    assert.equal(freeBookingSource({ rowSlug: 'ppf-suv', campaign: { serviceSlug: 'ppf-suv', offerType: 'free_booking' }, legacyFree: false }), 'campaign');
    assert.equal(freeBookingSource({ rowSlug: 'ppf-suv', campaign: null, legacyFree: true }), 'legacy-window');
    assert.equal(freeBookingSource({ rowSlug: undefined, campaign: null, legacyFree: true }), 'legacy-window', 'the legacy window frees every row');
  });
});

describe('previous price in the booking modal', () => {
  test('none of the six PPF rows shows one; every other service is unchanged', () => {
    for (const r of six) assert.equal(showPreviousPrice(r), false, r.slug);
    assert.equal(showPreviousPrice({ slug: '1-year-ceramic-coating', price: '7500.00', originalPrice: '12000.00' }), true);
    assert.equal(showPreviousPrice({ slug: 'car-polishing', price: '2999', originalPrice: null }), false);
    assert.equal(showPreviousPrice({ slug: 'partial-ppf-sedan', price: '30000', originalPrice: '30000' }), false);
    assert.equal(showPreviousPrice(undefined), false);
  });
});
