/**
 * Integration tests for the paid Diwali offer (Rs 99 slot payment), against the REAL route handlers.
 *
 *   npm run test:integration
 *
 * Same approach as booking-payment-integration.itest.mjs: server/routes.ts is mounted on a real Express
 * app and only the edges are faked (storage, the Razorpay SDK wrapper, notifications). Nothing here
 * talks to Razorpay or to the production database.
 *
 * WHAT IS PROVEN:
 *   - the order endpoint charges exactly Rs 99, whatever the request or the booking settings say
 *   - the lead is stored with source, offer name, amount, pending status and the Razorpay order id
 *   - a lead becomes "paid" only after a valid signature (confirm-payment) or a signed webhook
 *   - confirm-payment and the webhook are idempotent, and "paid" is never downgraded to "failed"
 *   - NO WhatsApp and NO ERP sync for paid leads
 *   - an ordinary Rs 299 booking is untouched: same amount, same confirmation, same notifications
 *   - the offer cannot be started after its end date, nor without Razorpay configured
 *
 * NOT PROVEN (needs Razorpay test credentials): the hosted checkout itself, a real UPI/card payment,
 * and real database persistence.
 */
import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { __resetRateLimitsForTests } from '../server/lib/rate-limit.ts';

const WEBHOOK_SECRET = 'offer-test-webhook-secret';
const KEY_SECRET = 'offer-test-key-secret';

const db = { services: new Map(), bookings: new Map(), settings: new Map(), leads: [], staleReadOnce: false, barrier: null };
const charged = [];
const notes = { whatsapp: 0, erp: 0 };
let seq = 0;

const storage = {
  getService: async (id) => db.services.get(id),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async () => ({ dayOfWeek: 0, dayName: 'Day', isOpen: true, openTime: '00:00', cutoffTime: '23:59' }),
  getBookingCountForSlot: async () => 0,
  getSetting: async (key) => db.settings.get(key),
  getAllCampaigns: async () => [],
  createBooking: async (v) => {
    const b = { id: 'bk_' + ++seq, whatsappSent: false, emailSent: false, paymentVerifiedAt: null, paymentId: null, ...v };
    db.bookings.set(b.id, b);
    return b;
  },
  createBookingWithCapacity: async (v) => storage.createBooking(v),
  updateBooking: async (id, patch) => Object.assign(db.bookings.get(id), patch),
  getBooking: async (id) => db.bookings.get(id),
  getBookingByPaymentOrderId: async (o) => [...db.bookings.values()].find((b) => b.razorpayOrderId === o),
  getTimeSlot: async () => ({ id: 'ts', startTime: '10:00 AM', endTime: '11:00 AM' }),
  getBookingsByStatus: async (st) => [...db.bookings.values()].filter((b) => b.paymentStatus === st),
  // leads
  createPpfLead: async (v) => {
    // The database's unique index: one lead per (offer_name, phone) when offer_name is set.
    if (v.offerName && db.leads.some((l) => l.offerName === v.offerName && l.phone === v.phone)) {
      const err = new Error('duplicate key value violates unique constraint "ppf_leads_offer_phone_uniq"');
      err.code = '23505';
      throw err;
    }
    const lead = { id: 'lead_' + ++seq, status: 'new', createdAt: new Date(), paymentStatus: null, paymentId: null, paymentVerifiedAt: null, ...v };
    db.leads.push(lead);
    return lead;
  },
  getPpfLeadByOrderId: async (o) => {
    const row = db.leads.find((l) => l.razorpayOrderId === o);
    // Simulates a handler reading a lead just before another request pays it: the caller sees a stale "pending".
    if (row && db.staleReadOnce) { db.staleReadOnce = false; return { ...row, paymentStatus: 'pending' }; }
    return row;
  },
  findOfferLeadsByPhone: async (offerName, phone) => {
    await new Promise((r) => setImmediate(r)); // yield, so concurrent requests interleave like real I/O
    const snapshot = db.leads.filter((l) => l.offerName === offerName && l.phone === phone).sort((x, y) => y.createdAt - x.createdAt);
    // Race harness: hold every caller until `need` of them have all read the (still empty) table, so they
    // then all try to create, exactly the interleaving the unique index exists for.
    if (db.barrier) {
      const b = db.barrier;
      if (++b.seen >= b.need) b.release();
      await b.promise;
    }
    return snapshot;
  },
  // Same conditions as the real UPDATEs in server/storage.ts (asserted there by a source test too).
  markPpfLeadPaid: async (id, paymentId) => {
    const row = db.leads.find((l) => l.id === id);
    if (row && row.paymentStatus !== 'paid') { Object.assign(row, { paymentStatus: 'paid', paymentId, paymentVerifiedAt: new Date() }); return { lead: row, changed: true }; }
    return { lead: row, changed: false };
  },
  markPpfLeadFailed: async (id, paymentId) => {
    const row = db.leads.find((l) => l.id === id);
    if (row && (row.paymentStatus === 'pending' || row.paymentStatus === 'failed')) { Object.assign(row, { paymentStatus: 'failed', paymentId }); return { lead: row, changed: true }; }
    return { lead: row, changed: false };
  },
  updatePpfLeadDetails: async (id, patch) => Object.assign(db.leads.find((l) => l.id === id), patch),
  getAdmin: async (id) => (id === 'admin-1' ? { id: 'admin-1', email: 'a@p91.test', name: 'Admin' } : undefined),
  getPpfLead: async (id) => db.leads.find((l) => l.id === id),
  // Same condition as the real DELETE in server/storage.ts (asserted there by a source test too).
  deletePpfLead: async (id) => {
    const i = db.leads.findIndex((l) => l.id === id && l.paymentStatus !== 'paid');
    if (i < 0) return false;
    db.leads.splice(i, 1);
    return true;
  },
};
class SlotFullError extends Error {}

mock.module('../server/storage.ts', { exports: { storage, SlotFullError } });
mock.module('../server/services/payment.ts', {
  exports: {
    createPaymentOrder: async (amount, receipt) => {
      charged.push(amount);
      return { id: 'order_' + ++seq, amount: Math.round(Number(amount) * 100), currency: 'INR', receipt };
    },
    verifyPaymentSignature: async (orderId, paymentId, signature) =>
      signature === crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex'),
  },
});
mock.module('../server/services/whatsapp.ts', {
  exports: { whatsappService: { sendBookingConfirmation: async () => { notes.whatsapp++; return { success: true, messageId: 'wamid.T' }; }, sendAppointmentReminder: async () => ({ success: true }) } },
});
mock.module('../server/services/scheduler.ts', { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module('../server/services/email.ts', { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module('../server/services/webhook.ts', { exports: { sendBookingWebhook: async () => { notes.erp++; return { ok: true, n8nExecutionId: 'exec' }; } } });

let server;
let base;
before(async () => {
  process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/none';
  process.env.SESSION_SECRET = 'offer-test-session-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_offerfake';
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NODE_ENV = 'test';
  const { registerRoutes } = await import('../server/routes.ts');
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
  app.use(express.urlencoded({ extended: false }));
  app.use((req, _res, next) => {
    if (req.headers['x-test-admin'] === '1') {
      Object.defineProperty(req, 'session', { value: { adminId: 'admin-1', destroy: (cb) => cb?.(), save: (cb) => cb?.() }, configurable: true, writable: true });
    }
    next();
  });
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise((r) => server.close(r)); });

beforeEach(() => {
  __resetRateLimitsForTests();
  db.services.clear(); db.bookings.clear(); db.settings.clear(); db.leads.length = 0; db.staleReadOnce = false; db.barrier = null;
  charged.length = 0; notes.whatsapp = 0; notes.erp = 0;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_offerfake';
  db.services.set('svc-normal', { id: 'svc-normal', slug: 'car-polishing', title: 'Car Polishing', price: '2999.00', duration: 120, isActive: true, maxBookingsPerSlot: 3 });
  db.settings.set('booking_amount', { key: 'booking_amount', value: '299' });
});

const post = async (path, body, opts = {}) => {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.raw ?? JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

const customer = (over = {}) => ({
  name: 'Diwali Customer', email: 'diwali@example.com', phone: '9876543210', vehicleType: 'car', vehicleModel: 'Creta', ...over,
});
const sign = (orderId, paymentId) => crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
const webhook = (event, orderId, paymentId = 'pay_1', { badSig = false } = {}) => {
  const raw = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
  const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  return post('/api/razorpay-webhook', null, { raw, headers: { 'x-razorpay-signature': badSig ? 'f'.repeat(64) : sig } });
};
const startOrder = async (over = {}) => {
  const r = await post('/api/offers/diwali/order', customer(over));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body;
};
const futureDate = () => { const d = new Date(Date.now() + 30 * 864e5); return d.toISOString().slice(0, 10); };

describe('order creation', () => {
  test('charges exactly Rs 99 and stores a pending Diwali lead with its Razorpay order id', async () => {
    const out = await startOrder();
    assert.deepEqual(charged, [99]);
    assert.equal(out.paymentOrder.amount, 9900);
    assert.equal(out.paymentOrder.currency, 'INR');
    assert.ok(out.paymentOrder.key);
    assert.equal(db.leads.length, 1);
    const lead = db.leads[0];
    assert.equal(lead.source, 'diwali_offer');
    assert.equal(lead.offerName, 'de-dhana-dhan-2026');
    assert.equal(lead.amount, '99.00');
    assert.equal(lead.paymentStatus, 'pending');
    assert.equal(lead.razorpayOrderId, out.paymentOrder.id);
    assert.equal(lead.name, 'Diwali Customer');
    assert.equal(lead.phone, '9876543210');
    assert.equal(lead.email, 'diwali@example.com');
    assert.equal(lead.vehicleModel, 'Creta');
    assert.match(lead.message, /De Dhana Dhan/);
    assert.equal(out.leadId, lead.id);
  });

  test('the request cannot change the amount, the status or the source', async () => {
    await startOrder({ amount: 1, paymentStatus: 'paid', source: 'landing_page', offerName: 'other', razorpayOrderId: 'order_forged' });
    assert.deepEqual(charged, [99]);
    const lead = db.leads[0];
    assert.equal(lead.paymentStatus, 'pending');
    assert.equal(lead.source, 'diwali_offer');
    assert.equal(lead.offerName, 'de-dhana-dhan-2026');
    assert.equal(lead.amount, '99.00');
    assert.notEqual(lead.razorpayOrderId, 'order_forged');
  });

  test('is independent of the Rs 299 booking-fee setting', async () => {
    db.settings.set('booking_amount', { key: 'booking_amount', value: '5' });
    await startOrder();
    assert.deepEqual(charged, [99]);
    db.settings.delete('booking_amount');
    __resetRateLimitsForTests();
    await startOrder({ phone: '9123456789' });
    assert.deepEqual(charged, [99, 99]);
  });

  test('validation failures create nothing', async () => {
    for (const bad of [{ name: '' }, { phone: '123' }, { email: 'nope' }, { vehicleType: 'boat' }]) {
      __resetRateLimitsForTests();
      const r = await post('/api/offers/diwali/order', customer(bad));
      assert.equal(r.status, 400, JSON.stringify(bad));
    }
    assert.equal(db.leads.length, 0);
    assert.equal(charged.length, 0);
  });

  test('a filled honeypot is refused and creates nothing', async () => {
    const r = await post('/api/offers/diwali/order', customer({ website: 'http://spam.example' }));
    assert.equal(r.status, 400);
    assert.equal(db.leads.length, 0);
    assert.equal(charged.length, 0);
  });

  test('a retry by the same customer reuses the pending lead and order, updating their details', async () => {
    const first = await startOrder();
    __resetRateLimitsForTests();
    const second = await startOrder({ name: 'Diwali Customer Corrected', vehicleModel: 'Seltos' });
    assert.equal(db.leads.length, 1, 'no duplicate lead');
    assert.equal(charged.length, 1, 'no second Razorpay order');
    assert.equal(second.paymentOrder.id, first.paymentOrder.id);
    assert.equal(db.leads[0].name, 'Diwali Customer Corrected');
    assert.equal(db.leads[0].vehicleModel, 'Seltos');
  });

  test('the same customer in any phone format is ONE lead (normalised phone stored)', async () => {
    const first = await startOrder({ phone: '+91 98765 43210' });
    assert.equal(db.leads[0].phone, '9876543210', 'stored normalised');
    for (const variant of ['09876543210', '9876543210', '919876543210', '98765-43210']) {
      __resetRateLimitsForTests();
      const again = await startOrder({ phone: variant });
      assert.equal(again.paymentOrder.id, first.paymentOrder.id, variant);
    }
    assert.equal(db.leads.length, 1);
    assert.equal(charged.length, 1);
  });

  test('a number that is not an Indian mobile is refused', async () => {
    for (const phone of ['1234567890', '98765', '+1 415 555 0100']) {
      __resetRateLimitsForTests();
      const r = await post('/api/offers/diwali/order', customer({ phone }));
      assert.equal(r.status, 400, phone);
    }
    assert.equal(db.leads.length, 0);
  });

  test('after a FAILED attempt the retry reuses the same lead and order (no duplicate)', async () => {
    const first = await startOrder();
    await webhook('payment.failed', first.paymentOrder.id, 'pay_F');
    assert.equal(db.leads[0].paymentStatus, 'failed');
    __resetRateLimitsForTests();
    const retry = await startOrder({ name: 'Diwali Customer Retry' });
    assert.equal(db.leads.length, 1, 'no second lead');
    assert.equal(charged.length, 1, 'no second Razorpay order');
    assert.equal(retry.paymentOrder.id, first.paymentOrder.id);
    assert.equal(db.leads[0].name, 'Diwali Customer Retry');
    // Status reflects the last verified fact until Razorpay reports again; the retry then pays:
    assert.equal(db.leads[0].paymentStatus, 'failed');
    await webhook('payment.captured', first.paymentOrder.id, 'pay_OK');
    assert.equal(db.leads[0].paymentStatus, 'paid');
  });

  test('a customer who has already PAID cannot start a second payment (409, nothing created)', async () => {
    const first = await startOrder();
    await webhook('payment.captured', first.paymentOrder.id, 'pay_OK');
    __resetRateLimitsForTests();
    for (const phone of ['9876543210', '+91 98765 43210']) {
      const r = await post('/api/offers/diwali/order', customer({ phone }));
      assert.equal(r.status, 409, phone);
      assert.equal(r.body.alreadyPaid, true);
    }
    assert.equal(db.leads.length, 1);
    assert.equal(charged.length, 1, 'no second order to pay twice on');
    assert.equal(db.leads[0].paymentStatus, 'paid');
  });

  test('two simultaneous requests for one customer end up as ONE lead (unique index + recovery)', async () => {
    let release;
    db.barrier = { need: 2, seen: 0, release: () => release(), promise: new Promise((r) => { release = r; }) };
    const [a, b] = await Promise.all([
      post('/api/offers/diwali/order', customer()),
      post('/api/offers/diwali/order', customer({ phone: '+91 9876543210' })),
    ]);
    const sawBoth = db.barrier.seen >= 2;
    db.barrier = null;
    assert.ok(sawBoth, 'the harness must have made both requests check before either created');
    assert.equal(charged.length, 2, 'both requests really did create an order and race to insert (one order is left unused)');
    assert.equal(a.status, 200, JSON.stringify(a.body));
    assert.equal(b.status, 200, JSON.stringify(b.body));
    assert.equal(db.leads.length, 1, 'the database allows only one');
    assert.equal(a.body.paymentOrder.id, db.leads[0].razorpayOrderId);
    assert.equal(b.body.paymentOrder.id, db.leads[0].razorpayOrderId, 'both are told to pay the one real order');
  });

  test('after the end date (server clock) no payment can start', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-09T00:30:00+05:30') });
    try {
      const r = await post('/api/offers/diwali/order', customer());
      assert.equal(r.status, 410);
    } finally {
      mock.timers.reset();
    }
    assert.equal(db.leads.length, 0);
    assert.equal(charged.length, 0);
  });

  test('is still open in the last second of 8 Nov 2026 IST', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-08T23:59:58+05:30') });
    try {
      const r = await post('/api/offers/diwali/order', customer());
      assert.equal(r.status, 200);
    } finally {
      mock.timers.reset();
    }
  });

  test('without Razorpay configured it refuses (503) and creates nothing', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    const saved = process.env.RAZORPAY_TEST_KEY_ID; delete process.env.RAZORPAY_TEST_KEY_ID;
    try {
      const r = await post('/api/offers/diwali/order', customer());
      assert.equal(r.status, 503);
    } finally {
      if (saved) process.env.RAZORPAY_TEST_KEY_ID = saved;
    }
    assert.equal(db.leads.length, 0);
  });
});

describe('confirm-payment (existing endpoint) for an offer lead', () => {
  test('a valid signature marks the lead paid; no WhatsApp, no ERP; idempotent', async () => {
    const { paymentOrder } = await startOrder();
    const body = { razorpay_order_id: paymentOrder.id, razorpay_payment_id: 'pay_A', razorpay_signature: sign(paymentOrder.id, 'pay_A') };
    const r = await post('/api/confirm-payment', body);
    assert.equal(r.status, 200);
    assert.equal(r.body.kind, 'lead');
    assert.equal(r.body.paymentStatus, 'paid');
    const lead = db.leads[0];
    assert.equal(lead.paymentStatus, 'paid');
    assert.equal(lead.paymentId, 'pay_A');
    assert.ok(lead.paymentVerifiedAt instanceof Date);
    assert.equal(notes.whatsapp, 0, 'no WhatsApp for offer leads');
    assert.equal(notes.erp, 0, 'no ERP sync for offer leads');

    const again = await post('/api/confirm-payment', body);
    assert.equal(again.status, 200);
    assert.equal(again.body.alreadyConfirmed, true);
    assert.equal(db.leads.length, 1);
    assert.equal(notes.whatsapp, 0);
    assert.equal(notes.erp, 0);
  });

  test('a stale read cannot re-pay or rewrite an already-paid lead either', async () => {
    const { paymentOrder } = await startOrder();
    await webhook('payment.captured', paymentOrder.id, 'pay_FIRST');
    const verifiedAt = db.leads[0].paymentVerifiedAt;
    db.staleReadOnce = true; // the confirm handler thinks it is still pending
    const r = await post('/api/confirm-payment', { razorpay_order_id: paymentOrder.id, razorpay_payment_id: 'pay_SECOND', razorpay_signature: sign(paymentOrder.id, 'pay_SECOND') });
    assert.equal(r.status, 200);
    assert.equal(r.body.alreadyConfirmed, true);
    assert.equal(db.leads[0].paymentId, 'pay_FIRST');
    assert.equal(db.leads[0].paymentVerifiedAt, verifiedAt);
  });

  test('an invalid signature changes nothing', async () => {
    const { paymentOrder } = await startOrder();
    const r = await post('/api/confirm-payment', { razorpay_order_id: paymentOrder.id, razorpay_payment_id: 'pay_A', razorpay_signature: 'bad' });
    assert.equal(r.status, 400);
    assert.equal(db.leads[0].paymentStatus, 'pending');
    assert.equal(db.leads[0].paymentId, null);
  });

  test('an order id that belongs to nobody is still a 404', async () => {
    const r = await post('/api/confirm-payment', { razorpay_order_id: 'order_none', razorpay_payment_id: 'pay_A', razorpay_signature: sign('order_none', 'pay_A') });
    assert.equal(r.status, 404);
  });
});

describe('Razorpay webhook for an offer lead', () => {
  test('payment.captured marks it paid; a replay changes nothing; no WhatsApp/ERP', async () => {
    const { paymentOrder } = await startOrder();
    const r = await webhook('payment.captured', paymentOrder.id, 'pay_W');
    assert.equal(r.status, 200);
    assert.equal(r.body.kind, 'lead');
    assert.equal(db.leads[0].paymentStatus, 'paid');
    assert.equal(db.leads[0].paymentId, 'pay_W');
    const verifiedAt = db.leads[0].paymentVerifiedAt;
    const replay = await webhook('payment.captured', paymentOrder.id, 'pay_W');
    assert.equal(replay.status, 200);
    assert.equal(db.leads[0].paymentVerifiedAt, verifiedAt, 'replay must not rewrite the verified time');
    assert.equal(notes.whatsapp, 0);
    assert.equal(notes.erp, 0);
  });

  test('a badly signed webhook is rejected and changes nothing', async () => {
    const { paymentOrder } = await startOrder();
    const r = await webhook('payment.captured', paymentOrder.id, 'pay_X', { badSig: true });
    assert.equal(r.status, 400);
    assert.equal(db.leads[0].paymentStatus, 'pending');
  });

  test('payment.failed marks a pending lead failed, and a later capture makes it paid', async () => {
    const { paymentOrder } = await startOrder();
    const f = await webhook('payment.failed', paymentOrder.id, 'pay_F');
    assert.equal(f.status, 200);
    assert.equal(db.leads[0].paymentStatus, 'failed');
    const c = await webhook('payment.captured', paymentOrder.id, 'pay_OK');
    assert.equal(c.status, 200);
    assert.equal(db.leads[0].paymentStatus, 'paid');
    assert.equal(db.leads[0].paymentId, 'pay_OK');
  });

  test('payment.authorized alone does NOT mark a lead paid; only capture does', async () => {
    const { paymentOrder } = await startOrder();
    const auth = await webhook('payment.authorized', paymentOrder.id, 'pay_AUTH');
    assert.equal(auth.status, 200);
    assert.equal(db.leads[0].paymentStatus, 'pending', 'authorized is a hold, not a payment');
    assert.equal(db.leads[0].paymentId, null);
    assert.equal(db.leads[0].paymentVerifiedAt, null);
    await webhook('payment.captured', paymentOrder.id, 'pay_AUTH');
    assert.equal(db.leads[0].paymentStatus, 'paid');
    assert.equal(db.leads[0].paymentId, 'pay_AUTH');
  });

  test('RACE: a payment.failed that read a stale "pending" cannot overwrite a lead that just became paid', async () => {
    const { paymentOrder } = await startOrder();
    const body = { razorpay_order_id: paymentOrder.id, razorpay_payment_id: 'pay_OK', razorpay_signature: sign(paymentOrder.id, 'pay_OK') };
    await post('/api/confirm-payment', body);
    assert.equal(db.leads[0].paymentStatus, 'paid');
    // The failed-event handler's lookup returns a stale snapshot saying "pending" (as if it read before the payment landed).
    db.staleReadOnce = true;
    const f = await webhook('payment.failed', paymentOrder.id, 'pay_EARLIER_ATTEMPT');
    assert.equal(f.status, 200);
    assert.equal(db.leads[0].paymentStatus, 'paid', 'the conditional UPDATE refuses to touch a paid lead');
    assert.equal(db.leads[0].paymentId, 'pay_OK', 'and the verified payment id is kept');
  });

  test('a paid lead is never downgraded by a late payment.failed', async () => {
    const { paymentOrder } = await startOrder();
    await webhook('payment.captured', paymentOrder.id, 'pay_OK');
    await webhook('payment.failed', paymentOrder.id, 'pay_LATE');
    assert.equal(db.leads[0].paymentStatus, 'paid');
    assert.equal(db.leads[0].paymentId, 'pay_OK');
  });

  test('an event for an unknown order is acknowledged and creates nothing', async () => {
    const r = await webhook('payment.captured', 'order_unknown');
    assert.equal(r.status, 200);
    assert.equal(r.body.matched, false);
    assert.equal(db.leads.length, 0);
  });
});

describe('ordinary Rs 299 bookings are untouched', () => {
  const bookingBody = () => ({
    serviceId: 'svc-normal', timeSlotId: '10:00', appointmentDate: futureDate(), appointmentTime: '10:00',
    customerName: 'Booking Person', customerEmail: 'b@example.com', customerPhone: '9876500011',
  });

  test('a booking still charges the booking fee, confirms as a booking, and notifies once', async () => {
    const r = await post('/api/bookings', bookingBody());
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(charged, [299]);
    const orderId = r.body.paymentOrder.id;
    const booking = db.bookings.get(r.body.booking.id);
    assert.equal(booking.paymentStatus, 'pending');

    const c = await post('/api/confirm-payment', { razorpay_order_id: orderId, razorpay_payment_id: 'pay_B', razorpay_signature: sign(orderId, 'pay_B') });
    assert.equal(c.status, 200);
    assert.equal(c.body.paymentStatus, 'paid');
    assert.ok(c.body.confirmationToken, 'bookings still return a confirmation token');
    assert.equal(db.bookings.get(booking.id).paymentStatus, 'paid');
    assert.equal(notes.whatsapp, 1, 'the booking WhatsApp is still sent');
    assert.equal(notes.erp, 1, 'the booking ERP sync still runs');
    assert.equal(db.leads.length, 0, 'no lead involved');
  });

  test('a booking order is never treated as a lead by the webhook, and payment.failed leaves bookings alone', async () => {
    const r = await post('/api/bookings', bookingBody());
    const orderId = r.body.paymentOrder.id;
    const f = await webhook('payment.failed', orderId, 'pay_F');
    assert.equal(f.status, 200);
    assert.equal(db.bookings.get(r.body.booking.id).paymentStatus, 'pending', 'unchanged behaviour: bookings do not record failed attempts');
    const c = await webhook('payment.captured', orderId, 'pay_B');
    assert.equal(c.status, 200);
    assert.equal(db.bookings.get(r.body.booking.id).paymentStatus, 'paid');
    assert.equal(notes.erp, 1);
  });
});

describe('admin: a paid lead can never be deleted', () => {
  const del = async (id, admin = true) => {
    const res = await fetch(base + '/api/ppf-leads/' + id, { method: 'DELETE', headers: admin ? { 'x-test-admin': '1' } : {} });
    const text = await res.text(); let body; try { body = JSON.parse(text); } catch { body = { _raw: text }; }
    return { status: res.status, body };
  };

  test('paid lead: refused with 409, still there, payment record intact', async () => {
    const { paymentOrder, leadId } = await startOrder();
    await webhook('payment.captured', paymentOrder.id, 'pay_KEEP');
    const r = await del(leadId);
    assert.equal(r.status, 409);
    assert.equal(r.body.protected, true);
    assert.match(r.body.message, /can't be deleted/);
    assert.equal(db.leads.length, 1);
    assert.equal(db.leads[0].paymentStatus, 'paid');
    assert.equal(db.leads[0].paymentId, 'pay_KEEP');
  });

  test('RACE: paid a moment after the route read it, the DELETE itself still refuses', async () => {
    const { paymentOrder, leadId } = await startOrder();
    // The route's first read sees the lead as unpaid; the payment lands before the DELETE runs.
    const realGet = storage.getPpfLead;
    let calls = 0;
    storage.getPpfLead = async (id) => {
      const row = await realGet(id);
      if (++calls === 1) { const snapshot = { ...row }; await webhook('payment.captured', paymentOrder.id, 'pay_JUST_IN'); return snapshot; }
      return row;
    };
    try {
      const r = await del(leadId);
      assert.equal(r.status, 409, 'the conditional DELETE removed nothing, and the re-read shows paid');
    } finally { storage.getPpfLead = realGet; }
    assert.equal(db.leads.length, 1);
    assert.equal(db.leads[0].paymentStatus, 'paid');
  });

  test('pending, failed and ordinary (no payment) leads can still be deleted', async () => {
    const a = await startOrder({ phone: '9876543210' });
    const b = await startOrder({ phone: '9123456789', email: 'b@example.com' });
    await webhook('payment.failed', b.paymentOrder.id, 'pay_F');
    const plain = await storage.createPpfLead({ name: 'Plain Lead', email: 'p@example.com', phone: '9000000000', vehicleType: 'car', serviceInterest: 'ppf', source: 'landing_page' });
    for (const id of [a.leadId, b.leadId, plain.id]) assert.equal((await del(id)).status, 200, id);
    assert.equal(db.leads.length, 0);
  });

  test('a missing lead is 404, and deleting needs an admin', async () => {
    assert.equal((await del('nope')).status, 404);
    const { leadId } = await startOrder();
    assert.equal((await del(leadId, false)).status, 401);
    assert.equal(db.leads.length, 1);
  });
});

describe('rate limit keys on the real visitor, behind Cloudflare and nginx', () => {
  // The test app listens on loopback, like nginx does in production, and routes.ts sets trust proxy = 1.
  const CF_EDGE = '172.71.10.5';
  const hit = (headers) =>
    fetch(base + '/api/offers/diwali/order', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: '{}' }).then((r) => r.status);
  const burst = async (headers, n) => { const out = []; for (let i = 0; i < n; i++) out.push(await hit(headers)); return out; };

  test('nginx appends the edge to X-Forwarded-For: visitors on the SAME edge get separate quotas', async () => {
    const a = { 'X-Forwarded-For': `203.0.113.7, ${CF_EDGE}`, 'CF-Connecting-IP': '203.0.113.7' };
    const b = { 'X-Forwarded-For': `198.51.100.9, ${CF_EDGE}`, 'CF-Connecting-IP': '198.51.100.9' };
    const first = await burst(a, 9); // limit is 8 per 10 minutes; the body is invalid, but the quota is charged first
    assert.equal(first[7], 400);
    assert.equal(first[8], 429, 'visitor A is limited');
    assert.equal(await hit(b), 400, 'visitor B, same Cloudflare edge, is NOT limited by A');
  });

  test('nginx overwrites X-Forwarded-For with the edge only: still the real visitor', async () => {
    const a = { 'X-Forwarded-For': CF_EDGE, 'CF-Connecting-IP': '203.0.113.20' };
    const b = { 'X-Forwarded-For': CF_EDGE, 'CF-Connecting-IP': '203.0.113.21' };
    assert.equal((await burst(a, 9))[8], 429);
    assert.equal(await hit(b), 400);
  });

  test('a direct hit on the origin cannot dodge the limit by forging CF-Connecting-IP', async () => {
    // Last X-Forwarded-For entry is what nginx recorded: the attacker's own (non-Cloudflare) address.
    const forge = (n) => ({ 'X-Forwarded-For': `1.2.3.4, 198.18.0.99`, 'CF-Connecting-IP': `203.0.113.${n}` });
    const out = [];
    for (let i = 0; i < 9; i++) out.push(await hit(forge(i + 100)));
    assert.equal(out[8], 429, 'a different forged visitor address each time does not reset the quota');
  });

  test('a forged X-Forwarded-For cannot pose as Cloudflare unless it is the LAST entry nginx wrote', async () => {
    // Attacker puts a Cloudflare address FIRST, but nginx's own (real) address is last.
    const h = (n) => ({ 'X-Forwarded-For': `${CF_EDGE}, 198.18.0.77`, 'CF-Connecting-IP': `203.0.113.${n}` });
    const out = [];
    for (let i = 0; i < 9; i++) out.push(await hit(h(i + 150)));
    assert.equal(out[8], 429);
  });

  test('no proxy headers at all: unchanged behaviour (keyed on the connection)', async () => {
    assert.equal((await burst({}, 9))[8], 429);
  });
});

describe('Razorpay webhook: signature validation and idempotency', () => {
  const rawEvent = (event, orderId, paymentId) => JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
  const sigOf = (raw, secret = WEBHOOK_SECRET) => crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const send = (raw, headers) => post('/api/razorpay-webhook', null, { raw, headers });

  test('valid signature is accepted (payment.captured)', async () => {
    const { paymentOrder } = await startOrder();
    const raw = rawEvent('payment.captured', paymentOrder.id, 'pay_S');
    assert.equal((await send(raw, { 'x-razorpay-signature': sigOf(raw) })).status, 200);
    assert.equal(db.leads[0].paymentStatus, 'paid');
  });

  test('missing signature header: 400, nothing changes', async () => {
    const { paymentOrder } = await startOrder();
    const raw = rawEvent('payment.captured', paymentOrder.id, 'pay_S');
    assert.equal((await send(raw, {})).status, 400);
    assert.equal(db.leads[0].paymentStatus, 'pending');
  });

  test('body altered after signing: 400, nothing changes (payment.captured and payment.failed)', async () => {
    const { paymentOrder } = await startOrder();
    for (const ev of ['payment.captured', 'payment.failed']) {
      const signed = rawEvent(ev, paymentOrder.id, 'pay_S');
      const tampered = signed.replace('pay_S', 'pay_X');
      assert.equal((await send(tampered, { 'x-razorpay-signature': sigOf(signed) })).status, 400, ev);
    }
    assert.equal(db.leads[0].paymentStatus, 'pending');
    assert.equal(db.leads[0].paymentId, null);
  });

  test('signed with the wrong secret, wrong length, or upper-case: rejected', async () => {
    const { paymentOrder } = await startOrder();
    const raw = rawEvent('payment.captured', paymentOrder.id, 'pay_S');
    for (const sig of [sigOf(raw, 'some-other-secret'), sigOf(raw).slice(0, 40), sigOf(raw) + '00', sigOf(raw).toUpperCase(), '']) {
      const r = await send(raw, { 'x-razorpay-signature': sig });
      assert.ok(r.status === 400, 'signature ' + sig.slice(0, 8) + ' -> ' + r.status);
    }
    assert.equal(db.leads[0].paymentStatus, 'pending');
  });

  test('no webhook secret configured: fails CLOSED (503), never open', async () => {
    const { paymentOrder } = await startOrder();
    const raw = rawEvent('payment.captured', paymentOrder.id, 'pay_S');
    const saved = process.env.RAZORPAY_WEBHOOK_SECRET; delete process.env.RAZORPAY_WEBHOOK_SECRET;
    try {
      assert.equal((await send(raw, { 'x-razorpay-signature': sigOf(raw) })).status, 503);
      assert.equal((await send(raw, { 'x-razorpay-signature': 'anything' })).status, 503);
    } finally { process.env.RAZORPAY_WEBHOOK_SECRET = saved; }
    assert.equal(db.leads[0].paymentStatus, 'pending');
  });

  test('payment.captured is idempotent: N identical deliveries change nothing after the first', async () => {
    const { paymentOrder } = await startOrder();
    const raw = rawEvent('payment.captured', paymentOrder.id, 'pay_ONCE');
    const headers = { 'x-razorpay-signature': sigOf(raw) };
    assert.equal((await send(raw, headers)).status, 200);
    const snapshot = JSON.stringify(db.leads[0]);
    for (let i = 0; i < 4; i++) assert.equal((await send(raw, headers)).status, 200);
    assert.equal(JSON.stringify(db.leads[0]), snapshot, 'row byte-for-byte identical after replays');
    assert.equal(db.leads.length, 1);
    assert.equal(notes.whatsapp + notes.erp, 0);
  });

  test('payment.failed is idempotent, and never rewrites a paid lead', async () => {
    const { paymentOrder } = await startOrder();
    const failed = rawEvent('payment.failed', paymentOrder.id, 'pay_F1');
    const fh = { 'x-razorpay-signature': sigOf(failed) };
    await send(failed, fh);
    const afterFirst = JSON.stringify(db.leads[0]);
    for (let i = 0; i < 3; i++) assert.equal((await send(failed, fh)).status, 200);
    assert.equal(JSON.stringify(db.leads[0]), afterFirst);
    assert.equal(db.leads[0].paymentStatus, 'failed');

    const captured = rawEvent('payment.captured', paymentOrder.id, 'pay_OK');
    await send(captured, { 'x-razorpay-signature': sigOf(captured) });
    const paidSnapshot = JSON.stringify(db.leads[0]);
    assert.equal(db.leads[0].paymentStatus, 'paid');
    await send(failed, fh); // an old failure delivered late
    assert.equal(JSON.stringify(db.leads[0]), paidSnapshot, 'paid row untouched by a late failed event');
  });

  test('events for orders we do not know are acknowledged (200) without creating anything', async () => {
    for (const ev of ['payment.captured', 'payment.failed']) {
      const raw = rawEvent(ev, 'order_not_ours', 'pay_Z');
      const r = await send(raw, { 'x-razorpay-signature': sigOf(raw) });
      assert.equal(r.status, 200, ev);
    }
    assert.equal(db.leads.length, 0);
  });
});
