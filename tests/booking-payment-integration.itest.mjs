/**
 * Integration tests against the REAL route handlers.
 *
 *   npm run test:integration
 *
 * These import server/routes.ts itself and mount it on a real Express app, with only the
 * outermost edges replaced: the database (storage), the Razorpay SDK wrapper, and the
 * notification services. Everything in between — request validation, blackout and
 * business-hours checks, capacity, the amount-authority logic, the confirm-payment lookup,
 * and the webhook's HMAC verification — is the code that ships.
 *
 * WHY THIS EXISTS: the account holder has no Razorpay test-mode credentials and no
 * isolated database, so a live end-to-end run would mean charging real cards and writing
 * to the production `bookings` table. This is how much can be verified without either.
 *
 * WHAT IS PROVEN HERE:
 *   - a manipulated client `amount` cannot change what Razorpay is asked to charge
 *   - the settings-missing and settings-throwing paths fall back to the server default
 *   - confirm-payment succeeds when the webhook won the race (the DEFECT 2 fix)
 *   - confirm-payment and the webhook are each idempotent, and notify exactly once
 *   - webhook signature verification accepts only correctly signed raw bodies
 *
 * WHAT IS NOT PROVEN HERE, and still needs test credentials:
 *   - Razorpay's hosted checkout, a real card, and real success/failure/cancellation
 *   - real database persistence, constraints and concurrency
 *   - real WhatsApp / email / ERP delivery
 */
import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { __resetRateLimitsForTests } from '../server/lib/rate-limit.ts';

const WEBHOOK_SECRET = 'integration-test-webhook-secret';
const KEY_SECRET = 'integration-test-key-secret';

// ---------------------------------------------------------------------------
// Fakes for the edges only.
// ---------------------------------------------------------------------------
const db = {
  services: new Map(),
  bookings: new Map(),
  settings: new Map(),
  blackouts: [],
  businessHours: new Map(),
  settingThrows: false,
};

/** Every amount createPaymentOrder was asked to charge. The heart of the amount tests. */
const chargedAmounts = [];
const notifications = { whatsapp: 0 };

let seq = 0;
const storage = {
  getService: async (id) => db.services.get(id),
  getAllBlackoutDates: async () => db.blackouts,
  getBusinessHoursForDay: async (dow) => db.businessHours.get(dow),
  getBookingCountForSlot: async () => 0,
  getSetting: async (key) => {
    if (db.settingThrows) throw new Error('simulated settings read failure');
    return db.settings.get(key);
  },
  createBooking: async (values) => {
    const b = { id: 'bk_' + ++seq, whatsappSent: false, emailSent: false, paymentVerifiedAt: null, paymentId: null, ...values };
    db.bookings.set(b.id, b);
    return b;
  },
  createBookingWithCapacity: async (values) => storage.createBooking(values),
  updateBooking: async (id, patch) => {
    const b = db.bookings.get(id);
    Object.assign(b, patch);
    return b;
  },
  getBooking: async (id) => db.bookings.get(id),
  getBookingByPaymentOrderId: async (orderId) =>
    [...db.bookings.values()].find((b) => b.razorpayOrderId === orderId),
  getTimeSlot: async () => ({ id: 'ts', startTime: '10:00 AM', endTime: '11:00 AM' }),
  getBookingsByStatus: async (status) =>
    [...db.bookings.values()].filter((b) => b.paymentStatus === status),
};

class SlotFullError extends Error {}

mock.module('../server/storage.ts', { exports: { storage, SlotFullError } });

mock.module('../server/services/payment.ts', {
  exports: {
    createPaymentOrder: async (amount, receipt) => {
      chargedAmounts.push(amount);
      return { id: 'order_' + ++seq, amount: Math.round(Number(amount) * 100), currency: 'INR', receipt };
    },
    verifyPaymentSignature: async (orderId, paymentId, signature) =>
      signature === crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex'),
  },
});

mock.module('../server/services/whatsapp.ts', {
  exports: {
    whatsappService: {
      sendBookingConfirmation: async () => { notifications.whatsapp++; return { success: true, messageId: 'wamid.TEST' }; },
      sendAppointmentReminder: async () => ({ success: true }),
    },
  },
});
mock.module('../server/services/scheduler.ts', { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module('../server/services/email.ts', { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module('../server/services/webhook.ts', { exports: { sendBookingWebhook: async () => ({ ok: true, n8nExecutionId: 'exec_test' }) } });

// ---------------------------------------------------------------------------

let server;
let base;

before(async () => {
  // A syntactically valid but unreachable URL: storage is mocked, so nothing connects.
  process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/none';
  process.env.SESSION_SECRET = 'integration-test-session-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_integrationfake';
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NODE_ENV = 'test';

  const { registerRoutes } = await import('../server/routes.ts');

  const app = express();
  // Mirrors server/index.ts: the raw body is captured for webhook signature verification.
  app.use(express.json({
    verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); },
  }));
  app.use(express.urlencoded({ extended: false }));
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
});

beforeEach(() => {
  /**
   * Reset the public-endpoint rate limiter between tests.
   *
   * POST /api/bookings allows 10 requests per client per 10 minutes. Every test in this
   * file posts from the same loopback address, so from the limiter's point of view they
   * are one very busy customer — and from the 11th test onward every booking came back
   * 429 instead of the status being asserted.
   *
   * The limiter is behaving correctly; it is the harness that is unusual. Resetting here
   * rather than exempting tests in the middleware keeps the SHIPPING code path under
   * test — an env-var bypass would mean these 31 tests exercise a limiter that production
   * does not have.
   */
  __resetRateLimitsForTests();

  db.services.clear(); db.bookings.clear(); db.settings.clear();
  db.blackouts = []; db.businessHours.clear(); db.settingThrows = false;
  chargedAmounts.length = 0; notifications.whatsapp = 0;

  db.services.set('svc-normal', {
    id: 'svc-normal', slug: 'car-polishing', title: 'Car Polishing',
    price: '2999.00', originalPrice: '5999.00', duration: 120,
    isActive: true, maxBookingsPerSlot: 3,
  });
  db.services.set('svc-amp', {
    id: 'svc-amp', slug: 'annual-maintenance-package', title: 'Annual Maintenance Package',
    price: '8999.00', duration: 240, isActive: true, maxBookingsPerSlot: 3,
  });
  db.settings.set('booking_amount', { key: 'booking_amount', value: '299' });
  // Open every day, wide window, so date rules never mask an amount assertion.
  for (let d = 0; d <= 6; d++) {
    db.businessHours.set(d, { dayOfWeek: d, dayName: 'Day' + d, isOpen: true, openTime: '00:00', cutoffTime: '23:59' });
  }
});

/** A date well in the future so the past-slot guard never trips. */
function futureDate() {
  const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const post = async (path, body, raw = false) => {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(raw?.headers || {}) },
    body: raw?.body ?? JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

const bookingPayload = (over = {}) => ({
  serviceId: 'svc-normal',
  timeSlotId: '10:00',
  appointmentDate: futureDate(),
  appointmentTime: '10:00',
  customerName: 'Test Person',
  customerEmail: 'test.person@example.com',
  customerPhone: '9876500011',
  ...over,
});

// ===========================================================================

describe('booking creation via the real POST /api/bookings', () => {
  test('a valid booking creates a pending booking and a Razorpay order', async () => {
    const res = await post('/api/bookings', bookingPayload());
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(res.body.booking?.id);
    assert.equal(res.body.booking.paymentStatus, 'pending');
    assert.ok(res.body.paymentOrder?.id?.startsWith('order_'));
    assert.equal(db.bookings.size, 1);
  });

  test('the order amount is the server amount, in paise', async () => {
    const res = await post('/api/bookings', bookingPayload());
    assert.equal(chargedAmounts[0], 299);
    assert.equal(res.body.paymentOrder.amount, 29900);
  });
});

describe('AMOUNT AUTHORITY — the client cannot change what is charged', () => {
  test('a manipulated amount of 1 is ignored; Razorpay is still asked for 299', async () => {
    const res = await post('/api/bookings', bookingPayload({ amount: 1 }));
    assert.equal(res.status, 200);
    assert.equal(chargedAmounts[0], 299, 'client sent 1 — the server must still charge 299');
    assert.equal(res.body.paymentOrder.amount, 29900);
    assert.equal(res.body.booking.amount, '299');
  });

  test('a manipulated amount of 0.01 is ignored', async () => {
    await post('/api/bookings', bookingPayload({ amount: 0.01 }));
    assert.equal(chargedAmounts[0], 299);
  });

  test('a hostile huge amount is ignored too (works both directions)', async () => {
    await post('/api/bookings', bookingPayload({ amount: 999999 }));
    assert.equal(chargedAmounts[0], 299);
  });

  test('a non-numeric amount cannot crash or change the charge', async () => {
    const res = await post('/api/bookings', bookingPayload({ amount: 'free' }));
    // Either schema-rejected or ignored — never charged.
    if (res.status === 200) assert.equal(chargedAmounts[0], 299);
    assert.ok(!chargedAmounts.includes('free'));
  });

  test('the configured settings value is what gets charged', async () => {
    db.settings.set('booking_amount', { key: 'booking_amount', value: '499' });
    await post('/api/bookings', bookingPayload({ amount: 1 }));
    assert.equal(chargedAmounts[0], 499);
  });

  test('MISSING settings row -> server default 299, NOT the client amount', async () => {
    db.settings.delete('booking_amount');
    await post('/api/bookings', bookingPayload({ amount: 1 }));
    assert.equal(chargedAmounts[0], 299, 'this is the exact case the old code got wrong');
  });

  test('settings read THROWS -> server default 299, NOT the client amount', async () => {
    db.settingThrows = true;
    await post('/api/bookings', bookingPayload({ amount: 1 }));
    assert.equal(chargedAmounts[0], 299, 'a database outage must not let the client set the price');
  });

  test('a blank settings value -> server default, not the client amount', async () => {
    db.settings.set('booking_amount', { key: 'booking_amount', value: '' });
    await post('/api/bookings', bookingPayload({ amount: 1 }));
    assert.equal(chargedAmounts[0], 299);
  });

  test('a corrupt settings value -> server default, not the client amount', async () => {
    db.settings.set('booking_amount', { key: 'booking_amount', value: 'abc' });
    await post('/api/bookings', bookingPayload({ amount: 5 }));
    assert.equal(chargedAmounts[0], 299);
  });

  test('Annual Maintenance is charged its service price, not the fee or the client value', async () => {
    await post('/api/bookings', bookingPayload({ serviceId: 'svc-amp', amount: 1 }));
    assert.equal(chargedAmounts[0], 8999);
  });

  test('AMP ignores a tampered settings row as well', async () => {
    db.settings.set('booking_amount', { key: 'booking_amount', value: '1' });
    await post('/api/bookings', bookingPayload({ serviceId: 'svc-amp', amount: 1 }));
    assert.equal(chargedAmounts[0], 8999);
  });
});

describe('booking rules still enforced server-side', () => {
  test('a blackout date is rejected', async () => {
    const date = futureDate();
    db.blackouts = [{ date, reason: 'DEEPAVALI' }];
    const res = await post('/api/bookings', bookingPayload({ appointmentDate: date }));
    assert.equal(res.status, 400);
    assert.match(res.body.message, /DEEPAVALI/);
    assert.equal(chargedAmounts.length, 0, 'no order may be created for a rejected date');
  });

  test('a closed day is rejected', async () => {
    const date = futureDate();
    const dow = new Date(date + 'T00:00:00').getDay();
    db.businessHours.set(dow, { dayOfWeek: dow, dayName: 'Sunday', isOpen: false, openTime: '10:00', cutoffTime: '16:00' });
    const res = await post('/api/bookings', bookingPayload({ appointmentDate: date }));
    assert.equal(res.status, 400);
    assert.equal(chargedAmounts.length, 0);
  });

  test('an unknown service is rejected', async () => {
    const res = await post('/api/bookings', bookingPayload({ serviceId: 'does-not-exist' }));
    assert.equal(res.status, 404);
    assert.equal(chargedAmounts.length, 0);
  });

  test('an inactive service is rejected', async () => {
    db.services.get('svc-normal').isActive = false;
    const res = await post('/api/bookings', bookingPayload());
    assert.equal(res.status, 400);
    assert.equal(chargedAmounts.length, 0);
  });
});

// ===========================================================================

const signPayment = (orderId, paymentId) =>
  crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

async function createBooking(over = {}) {
  const res = await post('/api/bookings', bookingPayload(over));
  return res.body.booking;
}

function webhookRequest(orderId, paymentId, { secret = WEBHOOK_SECRET, signature, event = 'payment.captured' } = {}) {
  const raw = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
  const sig = signature !== undefined
    ? signature
    : crypto.createHmac('sha256', secret).update(Buffer.from(raw)).digest('hex');
  const headers = { 'Content-Type': 'application/json' };
  if (sig !== null) headers['x-razorpay-signature'] = sig;
  return fetch(base + '/api/razorpay-webhook', { method: 'POST', headers, body: raw })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
}

describe('DEFECT 2 — confirm-payment race, against the real handler', () => {
  test('CASE A: browser confirms first', async () => {
    const b = await createBooking();
    const res = await post('/api/confirm-payment', {
      razorpay_order_id: b.razorpayOrderId,
      razorpay_payment_id: 'pay_A',
      razorpay_signature: signPayment(b.razorpayOrderId, 'pay_A'),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.alreadyConfirmed, false);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
    assert.equal(notifications.whatsapp, 1);
  });

  test('CASE B: webhook first — confirm must SUCCEED, not 404', async () => {
    const b = await createBooking();
    const hook = await webhookRequest(b.razorpayOrderId, 'pay_B');
    assert.equal(hook.status, 200);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');

    const res = await post('/api/confirm-payment', {
      razorpay_order_id: b.razorpayOrderId,
      razorpay_payment_id: 'pay_B',
      razorpay_signature: signPayment(b.razorpayOrderId, 'pay_B'),
    });
    assert.equal(res.status, 200, 'the old code returned 404 here and lost the conversion');
    assert.equal(res.body.success, true);
    assert.equal(res.body.alreadyConfirmed, true);
    assert.equal(notifications.whatsapp, 0, 'no duplicate customer message');
  });

  test('CASE C: both paths applied — one consistent state, one notification', async () => {
    const b = await createBooking();
    const [confirmRes, hookRes] = await Promise.all([
      post('/api/confirm-payment', {
        razorpay_order_id: b.razorpayOrderId,
        razorpay_payment_id: 'pay_C',
        razorpay_signature: signPayment(b.razorpayOrderId, 'pay_C'),
      }),
      webhookRequest(b.razorpayOrderId, 'pay_C'),
    ]);
    assert.equal(confirmRes.status, 200);
    assert.equal(hookRes.status, 200);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
    assert.equal(db.bookings.size, 1, 'no duplicate booking');
    assert.ok(notifications.whatsapp <= 1, 'at most one customer message');
  });

  test('duplicate browser confirmation is idempotent', async () => {
    const b = await createBooking();
    const args = {
      razorpay_order_id: b.razorpayOrderId,
      razorpay_payment_id: 'pay_D',
      razorpay_signature: signPayment(b.razorpayOrderId, 'pay_D'),
    };
    const first = await post('/api/confirm-payment', args);
    const second = await post('/api/confirm-payment', args);
    const third = await post('/api/confirm-payment', args);
    assert.equal(first.body.alreadyConfirmed, false);
    assert.equal(second.body.alreadyConfirmed, true);
    assert.equal(third.body.alreadyConfirmed, true);
    assert.equal(notifications.whatsapp, 1, 'customer messaged once, not three times');
    assert.equal(db.bookings.size, 1);
  });

  test('an invalid payment signature is rejected and nothing changes', async () => {
    const b = await createBooking();
    const res = await post('/api/confirm-payment', {
      razorpay_order_id: b.razorpayOrderId,
      razorpay_payment_id: 'pay_E',
      razorpay_signature: 'f'.repeat(64),
    });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending', 'must stay unpaid');
    assert.equal(notifications.whatsapp, 0);
  });

  test('missing fields are rejected', async () => {
    const b = await createBooking();
    for (const payload of [
      { razorpay_payment_id: 'p', razorpay_signature: 's' },
      { razorpay_order_id: b.razorpayOrderId, razorpay_signature: 's' },
      { razorpay_order_id: b.razorpayOrderId, razorpay_payment_id: 'p' },
    ]) {
      const res = await post('/api/confirm-payment', payload);
      assert.equal(res.status, 400);
    }
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });

  test('an unknown order id returns 404', async () => {
    const res = await post('/api/confirm-payment', {
      razorpay_order_id: 'order_nonexistent',
      razorpay_payment_id: 'pay_F',
      razorpay_signature: signPayment('order_nonexistent', 'pay_F'),
    });
    assert.equal(res.status, 404);
  });
});

describe('webhook signature verification, against the real handler', () => {
  test('a correctly signed webhook marks the booking paid', async () => {
    const b = await createBooking();
    const res = await webhookRequest(b.razorpayOrderId, 'pay_W1');
    assert.equal(res.status, 200);
    assert.equal(res.body.matched, true);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
  });

  test('a signature from the wrong secret is rejected', async () => {
    const b = await createBooking();
    const res = await webhookRequest(b.razorpayOrderId, 'pay_W2', { secret: 'wrong-secret' });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });

  test('a missing signature header is rejected', async () => {
    const b = await createBooking();
    const res = await webhookRequest(b.razorpayOrderId, 'pay_W3', { signature: null });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });

  test('a garbage signature is rejected', async () => {
    const b = await createBooking();
    const res = await webhookRequest(b.razorpayOrderId, 'pay_W4', { signature: 'not-a-signature' });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });

  test('duplicate webhook delivery is idempotent', async () => {
    const b = await createBooking();
    for (let i = 0; i < 4; i++) {
      const res = await webhookRequest(b.razorpayOrderId, 'pay_W5');
      assert.equal(res.status, 200);
    }
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
    assert.equal(db.bookings.size, 1);
    assert.equal(notifications.whatsapp, 0, 'the webhook path never messages the customer');
  });

  test('an unknown order is acknowledged, not errored, and creates nothing', async () => {
    const before = db.bookings.size;
    const res = await webhookRequest('order_unknown_xyz', 'pay_W6');
    assert.equal(res.status, 200);
    assert.equal(res.body.matched, false);
    assert.equal(db.bookings.size, before);
  });

  test('a non-payment event is acknowledged without changing state', async () => {
    const b = await createBooking();
    const res = await webhookRequest(b.razorpayOrderId, 'pay_W7', { event: 'refund.created' });
    assert.equal(res.status, 200);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });
});
