/**
 * Security regression: unauthenticated callers cannot perform protected production actions.
 *
 *   node --import tsx --experimental-test-module-mocks --test tests/security-unauthenticated-endpoints.itest.mjs
 *
 * Mounts the REAL route table (server/routes.ts) with only the outer edges faked: storage,
 * the Razorpay wrapper and the notification services. Nothing here touches a database,
 * Razorpay or WhatsApp. global fetch is wrapped so that ANY call to graph.facebook.com is
 * recorded and answered locally, so even if a protected action were reachable it could never
 * leave this process.
 *
 * Background (INDEXING-INVESTIGATION-REPORT.md, section 5): three debug routes were mounted with no
 * authentication in production:
 *   POST /api/test-payment-confirmation  - marked ANY booking paid (fake payment id) and sent a WhatsApp
 *                                          confirmation to the booking's phone, returning the whole booking
 *   POST /api/test-whatsapp              - sent a WhatsApp template through the business account to an
 *                                          arbitrary phone number with caller-chosen text
 *   POST /api/test-payment               - echo (logged the request body)
 * A caller could chain the first with the public POST /api/bookings (which returns the booking id) to get a
 * "paid" booking without paying. They had no references anywhere in the app, tests, scripts or docs.
 *
 * WHAT IS PROVEN HERE
 *   - the three routes no longer exist, and no /api/test*, /api/debug* or similar route is registered
 *   - the full exploit chain (create booking, then force it to paid) leaves the booking pending
 *   - no WhatsApp message and no Meta API call is made
 *   - forged payment proofs (bad confirm-payment signature, unsigned or wrongly signed webhook) change nothing
 *   - admin endpoints reject unauthenticated callers
 *   - the legitimate flows still work: booking creation, signed confirm-payment, signed webhook
 */
import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { __resetRateLimitsForTests } from '../server/lib/rate-limit.ts';

const WEBHOOK_SECRET = 'security-test-webhook-secret';
const KEY_SECRET = 'security-test-key-secret';

const db = { services: new Map(), bookings: new Map(), settings: new Map(), businessHours: new Map() };
const notifications = { whatsapp: 0 };
const writes = []; // every storage.updateBooking call
const metaCalls = []; // every attempted call to graph.facebook.com

let seq = 0;
const storage = {
  getService: async (id) => db.services.get(id),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async (dow) => db.businessHours.get(dow),
  getBookingCountForSlot: async () => 0,
  getSetting: async (key) => db.settings.get(key),
  createBooking: async (values) => {
    const b = { id: 'bk_' + ++seq, whatsappSent: false, emailSent: false, paymentVerifiedAt: null, paymentId: null, ...values };
    db.bookings.set(b.id, b);
    return b;
  },
  createBookingWithCapacity: async (values) => storage.createBooking(values),
  updateBooking: async (id, patch) => {
    writes.push({ id, patch });
    const b = db.bookings.get(id);
    Object.assign(b, patch);
    return b;
  },
  getBooking: async (id) => db.bookings.get(id),
  getBookingByPaymentOrderId: async (orderId) => [...db.bookings.values()].find((b) => b.razorpayOrderId === orderId),
  getPpfLeadByOrderId: async () => undefined,
  getTimeSlot: async () => ({ id: 'ts', startTime: '10:00 AM', endTime: '11:00 AM' }),
  getBookingsByStatus: async (status) => [...db.bookings.values()].filter((b) => b.paymentStatus === status),
  getAdmin: async () => undefined, // nobody is an admin
  getAllBusinessHours: async () => [...db.businessHours.values()],
};
class SlotFullError extends Error {}

mock.module('../server/storage.ts', { exports: { storage, SlotFullError } });
mock.module('../server/lib/diwali-offer.ts', { exports: { ...(await import('../server/lib/diwali-offer.ts')), isDiwaliOfferOpen: () => false } });
mock.module('../server/services/payment.ts', {
  exports: {
    createPaymentOrder: async (amount, receipt) => ({ id: 'order_' + ++seq, amount: Math.round(Number(amount) * 100), currency: 'INR', receipt }),
    verifyPaymentSignature: async (orderId, paymentId, signature) =>
      signature === crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex'),
  },
});
// getConfig is included so that, on code that still had the debug route, the handler would run to completion
// against the fake fetch below instead of failing early and hiding the problem.
mock.module('../server/services/whatsapp.ts', {
  exports: {
    whatsappService: {
      getConfig: async () => ({ phoneNumberId: 'FAKE_PHONE_ID', accessToken: 'FAKE_TOKEN' }),
      sendBookingConfirmation: async () => { notifications.whatsapp++; return { success: true, messageId: 'wamid.TEST' }; },
      sendAppointmentReminder: async () => ({ success: true }),
    },
  },
});
mock.module('../server/services/scheduler.ts', { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module('../server/services/email.ts', { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module('../server/services/webhook.ts', { exports: { sendBookingWebhook: async () => ({ ok: true, n8nExecutionId: 'exec_test' }) } });

let server;
let base;
let app;
const realFetch = globalThis.fetch;

before(async () => {
  process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/none';
  process.env.SESSION_SECRET = 'security-test-session-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_securityfake';
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NODE_ENV = 'test';

  // Nothing may reach the real Meta API from this process, whatever the code under test does.
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('graph.facebook.com')) {
      metaCalls.push({ url: String(url), body: opts?.body });
      return new Response(JSON.stringify({ messages: [{ id: 'wamid.FAKE_FROM_TEST_HARNESS' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return realFetch(url, opts);
  };

  const { registerRoutes } = await import('../server/routes.ts');
  app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
  app.use(express.urlencoded({ extended: false }));
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  globalThis.fetch = realFetch;
  if (server) await new Promise((r) => server.close(r));
});

beforeEach(() => {
  __resetRateLimitsForTests();
  db.services.clear(); db.bookings.clear(); db.settings.clear(); db.businessHours.clear();
  notifications.whatsapp = 0; writes.length = 0; metaCalls.length = 0;
  db.services.set('svc-normal', { id: 'svc-normal', slug: 'car-polishing', title: 'Car Polishing', price: '2999.00', originalPrice: '5999.00', duration: 120, isActive: true, maxBookingsPerSlot: 3 });
  db.settings.set('booking_amount', { key: 'booking_amount', value: '299' });
  for (let d = 0; d <= 6; d++) db.businessHours.set(d, { dayOfWeek: d, dayName: 'Day' + d, isOpen: true, openTime: '00:00', cutoffTime: '23:59' });
});

const futureDate = () => {
  const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const call = async (method, path, body, headers = {}) => {
  const res = await realFetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};
const post = (path, body, headers) => call('POST', path, body, headers);
const bookingPayload = (over = {}) => ({ serviceId: 'svc-normal', timeSlotId: '10:00', appointmentDate: futureDate(), appointmentTime: '10:00', customerName: 'Test Person', customerEmail: 'test.person@example.com', customerPhone: '9876500011', ...over });
const createBooking = async () => (await post('/api/bookings', bookingPayload())).body.booking;
const sign = (orderId, paymentId) => crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

/** Every registered route path (flattens nested routers). */
function registeredRoutes() {
  const out = [];
  const walk = (stack, prefix = '') => {
    for (const layer of stack || []) {
      if (layer.route) out.push({ path: prefix + layer.route.path, methods: Object.keys(layer.route.methods) });
      else if (layer.handle?.stack) walk(layer.handle.stack, prefix);
    }
  };
  walk(app._router?.stack);
  return out;
}

describe('the three debug endpoints are gone', () => {
  test('no /api/test*, /api/debug*, /api/dev* or similar route is registered', () => {
    const bad = registeredRoutes().filter((r) => typeof r.path === 'string' && /^\/api\/(test|debug|dev|tmp|temp|demo|sandbox)\b/i.test(r.path));
    assert.deepEqual(bad, [], 'debug routes must not be mounted in the production route table');
  });

  for (const path of ['/api/test-payment-confirmation', '/api/test-whatsapp', '/api/test-payment']) {
    test(`POST ${path} is not served (404), with an empty and with a realistic body`, async () => {
      assert.equal((await post(path, {})).status, 404);
      assert.equal((await post(path, { bookingId: 'bk_1', to: '919999999999', customerName: 'x' })).status, 404);
    });
  }
});

describe('the exploit chain no longer works', () => {
  test('create a booking, then try to force it to "paid": it stays pending, unpaid, with no message sent', async () => {
    const booking = await createBooking();
    assert.ok(booking?.id, 'the public booking endpoint still returns the booking');
    assert.equal(booking.paymentStatus, 'pending');

    writes.length = 0; // creating the booking legitimately writes once (ERP status); count only what the attacker causes
    const forced = await post('/api/test-payment-confirmation', { bookingId: booking.id });
    assert.equal(forced.status, 404);

    const after = db.bookings.get(booking.id);
    assert.equal(after.paymentStatus, 'pending', 'a caller with no payment proof must not be able to mark a booking paid');
    assert.equal(after.paymentId ?? null, null);
    assert.equal(notifications.whatsapp, 0, 'no confirmation message may be sent');
    assert.equal(writes.length, 0, 'no booking write may occur');
  });

  test('no WhatsApp message can be sent to an arbitrary number through the business account', async () => {
    const res = await post('/api/test-whatsapp', { to: '+919999999999', customerName: 'Click this link', serviceName: 'http://evil.example', appointmentDate: 'today', appointmentTime: 'now' });
    assert.equal(res.status, 404);
    assert.equal(metaCalls.length, 0, 'the Meta Graph API must not be called');
  });
});

describe('forged payment proofs change nothing', () => {
  test('confirm-payment with a wrongly signed payload is rejected and the booking stays pending', async () => {
    const b = await createBooking();
    const res = await post('/api/confirm-payment', { razorpay_order_id: b.razorpayOrderId, razorpay_payment_id: 'pay_forged', razorpay_signature: 'f'.repeat(64) });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
    assert.equal(notifications.whatsapp, 0);
  });

  test('confirm-payment signed with the wrong secret is rejected', async () => {
    const b = await createBooking();
    const wrong = crypto.createHmac('sha256', 'not-the-key-secret').update(`${b.razorpayOrderId}|pay_x`).digest('hex');
    const res = await post('/api/confirm-payment', { razorpay_order_id: b.razorpayOrderId, razorpay_payment_id: 'pay_x', razorpay_signature: wrong });
    assert.equal(res.status, 400);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
  });

  test('the webhook rejects a missing signature header and a signature made with the wrong secret', async () => {
    const b = await createBooking();
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_w', order_id: b.razorpayOrderId } } } });
    const unsigned = await realFetch(base + '/api/razorpay-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw });
    assert.ok(unsigned.status === 400 || unsigned.status === 401 || unsigned.status === 403, 'unsigned webhook: ' + unsigned.status);
    const wrongSig = crypto.createHmac('sha256', 'attacker-secret').update(Buffer.from(raw)).digest('hex');
    const forged = await realFetch(base + '/api/razorpay-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': wrongSig }, body: raw });
    assert.ok(forged.status === 400 || forged.status === 401 || forged.status === 403, 'forged webhook: ' + forged.status);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'pending');
    assert.equal(notifications.whatsapp, 0);
  });
});

describe('admin endpoints reject unauthenticated callers', () => {
  const adminGets = ['/api/admin/me', '/api/admin/services', '/api/admin/campaigns', '/api/admin/chatbot-knowledge'];
  for (const path of adminGets) {
    test(`GET ${path} -> 401 without a session`, async () => {
      assert.equal((await call('GET', path)).status, 401);
    });
  }
  test('creating a service (admin write) -> 401 without a session', async () => {
    assert.equal((await post('/api/services', { title: 'x', slug: 'x' })).status, 401);
  });
});

describe('the legitimate flows still work', () => {
  test('booking creation returns a pending booking, a confirmation token and a payment order', async () => {
    const res = await post('/api/bookings', bookingPayload());
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.booking.paymentStatus, 'pending');
    assert.ok(res.body.confirmationToken);
    assert.ok(res.body.paymentOrder?.id);
  });

  test('a correctly signed confirm-payment marks the booking paid and sends exactly one confirmation', async () => {
    const b = await createBooking();
    const res = await post('/api/confirm-payment', { razorpay_order_id: b.razorpayOrderId, razorpay_payment_id: 'pay_ok', razorpay_signature: sign(b.razorpayOrderId, 'pay_ok') });
    assert.equal(res.status, 200);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
    assert.equal(db.bookings.get(b.id).paymentId, 'pay_ok');
    assert.equal(notifications.whatsapp, 1);
  });

  test('a correctly signed webhook marks the booking paid', async () => {
    const b = await createBooking();
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_hook', order_id: b.razorpayOrderId } } } });
    const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(Buffer.from(raw)).digest('hex');
    const res = await realFetch(base + '/api/razorpay-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig }, body: raw });
    assert.equal(res.status, 200);
    assert.equal(db.bookings.get(b.id).paymentStatus, 'paid');
  });

  test('the public read endpoints used by the marketing pages still answer', async () => {
    assert.equal((await call('GET', '/api/business-hours')).status, 200);
  });
});
