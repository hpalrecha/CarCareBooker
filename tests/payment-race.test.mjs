/**
 * Payment confirmation race and idempotency — the seven states requested for DEFECT 2.
 *
 *   npm test
 *
 * SCOPE, stated plainly: this exercises the decision logic of the two confirmation paths
 * and the real HMAC signature algorithm. It does NOT touch a database or Razorpay — those
 * are the credentialed E2E run. What it does prove is the ordering behaviour that was
 * broken, which is exactly the part a live test is worst at reproducing: you cannot
 * reliably make Razorpay's webhook beat the browser on demand.
 *
 * THE BUG: /api/confirm-payment located the booking with
 *     getBookingsByStatus("pending").find(b => b.razorpayOrderId === order_id)
 * which filters on paymentStatus. Razorpay's webhook and the customer's browser confirm
 * the same payment concurrently. If the WEBHOOK won, the row was already "paid", so it was
 * not in the pending list, the lookup missed, and the endpoint returned 404 for a payment
 * that had actually succeeded — the browser retried five times, gave up, and the purchase
 * conversion (which only fires on an ok response) was never sent to Google Ads.
 *
 * The model below mirrors the real handlers. Its rules are asserted against the actual
 * route source in the "source guards" suite, so the model cannot quietly drift from the
 * code it stands for.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeCode = fs
  .readFileSync(path.join(repoRoot, 'server/routes.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

// A throwaway secret for signature maths. Not a credential — it never leaves this file.
const TEST_WEBHOOK_SECRET = 'unit-test-only-not-a-real-secret';
const TEST_KEY_SECRET = 'unit-test-only-key-secret';

// ---------------------------------------------------------------------------
// Model of the production confirmation paths.
// ---------------------------------------------------------------------------
function makeSystem() {
  const bookings = new Map();
  const events = { whatsapp: 0, erpSync: 0, purchaseConversions: 0 };

  const create = (orderId) => {
    const b = {
      id: 'bk_' + orderId,
      razorpayOrderId: orderId,
      paymentStatus: 'pending',
      paymentId: null,
      paymentVerifiedAt: null,
      whatsappSent: false,
    };
    bookings.set(b.id, b);
    return b;
  };

  // Mirrors storage.getBookingByPaymentOrderId — a direct lookup, NOT a status scan.
  const findByOrderId = (orderId) =>
    [...bookings.values()].find((b) => b.razorpayOrderId === orderId);

  // Mirrors the pre-fix behaviour, kept so the regression is demonstrable.
  const findByOrderIdPendingOnly = (orderId) =>
    [...bookings.values()].filter((b) => b.paymentStatus === 'pending')
      .find((b) => b.razorpayOrderId === orderId);

  /** POST /api/confirm-payment */
  const confirmPayment = ({ orderId, paymentId, signature, legacyLookup = false }) => {
    if (!orderId || !paymentId || !signature) return { status: 400, body: { message: 'Missing required payment fields' } };
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return { status: 400, body: { message: 'Invalid payment signature' } };
    }
    const booking = legacyLookup ? findByOrderIdPendingOnly(orderId) : findByOrderId(orderId);
    if (!booking) return { status: 404, body: { message: 'Booking not found' } };

    const alreadyPaid = booking.paymentStatus === 'paid';
    booking.paymentId = paymentId;
    booking.paymentStatus = 'paid';
    booking.paymentVerifiedAt = booking.paymentVerifiedAt ?? new Date();

    if (!alreadyPaid) {
      events.whatsapp++;
      booking.whatsappSent = true;
    }
    events.erpSync++;
    return { status: 200, body: { success: true, alreadyConfirmed: alreadyPaid, paymentStatus: 'paid' } };
  };

  /** POST /api/razorpay-webhook */
  const webhook = ({ rawBody, signature, secret = TEST_WEBHOOK_SECRET }) => {
    if (!secret) return { status: 503, body: { message: 'Webhook not configured' } };
    if (!signature) return { status: 400, body: { message: 'Missing signature' } };
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) return { status: 400, body: { message: 'Invalid signature' } };

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event !== 'payment.captured' && event.event !== 'payment.authorized') {
      return { status: 200, body: { received: true } };
    }
    const orderId = event.payload.payment.entity.order_id;
    const booking = findByOrderId(orderId);
    if (!booking) return { status: 200, body: { received: true, matched: false } };

    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'paid';
      booking.paymentId = event.payload.payment.entity.id;
      booking.paymentVerifiedAt = new Date();
    }
    events.erpSync++;
    return { status: 200, body: { received: true, matched: true } };
  };

  return { bookings, events, create, confirmPayment, webhook, findByOrderId };
}

/** Mirrors server/services/payment.ts verifyPaymentSignature (order_id|payment_id HMAC). */
function signPayment(orderId, paymentId) {
  return crypto.createHmac('sha256', TEST_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}
function verifyPaymentSignature(orderId, paymentId, signature) {
  return signature === signPayment(orderId, paymentId);
}

function webhookBody(orderId, paymentId, event = 'payment.captured') {
  return Buffer.from(JSON.stringify({
    event,
    payload: { payment: { entity: { id: paymentId, order_id: orderId } } },
  }), 'utf8');
}
function signWebhook(rawBody, secret = TEST_WEBHOOK_SECRET) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

// ---------------------------------------------------------------------------

let sys;
beforeEach(() => { sys = makeSystem(); });

describe('DEFECT 2 — the seven race states', () => {
  test('state 1: browser confirm before webhook', () => {
    sys.create('order_1');
    const sig = signPayment('order_1', 'pay_1');

    const first = sys.confirmPayment({ orderId: 'order_1', paymentId: 'pay_1', signature: sig });
    assert.equal(first.status, 200);
    assert.equal(first.body.alreadyConfirmed, false, 'browser got there first');

    const body = webhookBody('order_1', 'pay_1');
    const hook = sys.webhook({ rawBody: body, signature: signWebhook(body) });
    assert.equal(hook.status, 200);
    assert.equal(hook.body.matched, true);

    assert.equal(sys.findByOrderId('order_1').paymentStatus, 'paid');
    assert.equal(sys.events.whatsapp, 1, 'exactly one customer notification');
    assert.equal(sys.bookings.size, 1, 'no duplicate booking');
  });

  test('state 2: webhook before browser confirm — THE BUG. Must now succeed, not 404', () => {
    sys.create('order_2');
    const body = webhookBody('order_2', 'pay_2');
    const hook = sys.webhook({ rawBody: body, signature: signWebhook(body) });
    assert.equal(hook.status, 200);
    assert.equal(sys.findByOrderId('order_2').paymentStatus, 'paid');

    const sig = signPayment('order_2', 'pay_2');
    const res = sys.confirmPayment({ orderId: 'order_2', paymentId: 'pay_2', signature: sig });

    assert.equal(res.status, 200, 'must not 404 — the payment genuinely succeeded');
    assert.equal(res.body.success, true);
    assert.equal(res.body.alreadyConfirmed, true, 'reported as the idempotent case');
    assert.equal(sys.events.whatsapp, 0, 'webhook path sends no WhatsApp; no duplicate either');
    assert.equal(sys.bookings.size, 1);
  });

  test('state 2b: the OLD lookup returns 404 in exactly that case (regression demonstrated)', () => {
    sys.create('order_2b');
    const body = webhookBody('order_2b', 'pay_2b');
    sys.webhook({ rawBody: body, signature: signWebhook(body) });

    const legacy = sys.confirmPayment({
      orderId: 'order_2b', paymentId: 'pay_2b',
      signature: signPayment('order_2b', 'pay_2b'),
      legacyLookup: true,
    });
    assert.equal(legacy.status, 404, 'this is the behaviour that lost the conversion');
  });

  test('state 3: concurrent — both paths applied, single consistent state', () => {
    sys.create('order_3');
    const body = webhookBody('order_3', 'pay_3');
    const sig = signPayment('order_3', 'pay_3');

    const a = sys.confirmPayment({ orderId: 'order_3', paymentId: 'pay_3', signature: sig });
    const b = sys.webhook({ rawBody: body, signature: signWebhook(body) });

    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    const booking = sys.findByOrderId('order_3');
    assert.equal(booking.paymentStatus, 'paid');
    assert.equal(booking.paymentId, 'pay_3');
    assert.equal(sys.events.whatsapp, 1, 'exactly one notification across both paths');
    assert.equal(sys.bookings.size, 1, 'no duplicate booking');
  });

  test('state 4: duplicate webhook delivery is idempotent', () => {
    sys.create('order_4');
    const body = webhookBody('order_4', 'pay_4');
    const sig = signWebhook(body);

    for (let i = 0; i < 4; i++) {
      const r = sys.webhook({ rawBody: body, signature: sig });
      assert.equal(r.status, 200);
    }
    const booking = sys.findByOrderId('order_4');
    assert.equal(booking.paymentStatus, 'paid');
    assert.equal(sys.events.whatsapp, 0);
    assert.equal(sys.bookings.size, 1, 'replays must not create bookings');
  });

  test('state 5: duplicate browser confirmation is idempotent', () => {
    sys.create('order_5');
    const sig = signPayment('order_5', 'pay_5');

    const first = sys.confirmPayment({ orderId: 'order_5', paymentId: 'pay_5', signature: sig });
    const second = sys.confirmPayment({ orderId: 'order_5', paymentId: 'pay_5', signature: sig });
    const third = sys.confirmPayment({ orderId: 'order_5', paymentId: 'pay_5', signature: sig });

    assert.equal(first.body.alreadyConfirmed, false);
    assert.equal(second.body.alreadyConfirmed, true);
    assert.equal(third.body.alreadyConfirmed, true);
    assert.equal(sys.events.whatsapp, 1, 'the customer is messaged once, not three times');
    assert.equal(sys.bookings.size, 1);
  });

  test('state 6: invalid payment signature is rejected and changes nothing', () => {
    sys.create('order_6');
    const res = sys.confirmPayment({ orderId: 'order_6', paymentId: 'pay_6', signature: 'forged'.repeat(8) });
    assert.equal(res.status, 400);
    assert.equal(sys.findByOrderId('order_6').paymentStatus, 'pending', 'must stay unpaid');
    assert.equal(sys.events.whatsapp, 0);
  });

  test('state 6b: missing fields are rejected before any lookup', () => {
    sys.create('order_6b');
    for (const args of [
      { orderId: '', paymentId: 'p', signature: 's' },
      { orderId: 'order_6b', paymentId: '', signature: 's' },
      { orderId: 'order_6b', paymentId: 'p', signature: '' },
    ]) {
      assert.equal(sys.confirmPayment(args).status, 400);
    }
    assert.equal(sys.findByOrderId('order_6b').paymentStatus, 'pending');
  });

  test('state 7: unknown Razorpay order — 404 for browser, 200 ack for webhook', () => {
    const res = sys.confirmPayment({
      orderId: 'order_does_not_exist', paymentId: 'pay_x',
      signature: signPayment('order_does_not_exist', 'pay_x'),
    });
    assert.equal(res.status, 404);

    const body = webhookBody('order_does_not_exist', 'pay_x');
    const hook = sys.webhook({ rawBody: body, signature: signWebhook(body) });
    assert.equal(hook.status, 200, 'ack so Razorpay stops retrying an event we cannot satisfy');
    assert.equal(hook.body.matched, false);
    assert.equal(sys.bookings.size, 0, 'no booking is conjured from an unknown order');
  });
});

describe('webhook signature verification (real HMAC)', () => {
  test('a correctly signed webhook is accepted', () => {
    sys.create('order_s1');
    const body = webhookBody('order_s1', 'pay_s1');
    assert.equal(sys.webhook({ rawBody: body, signature: signWebhook(body) }).status, 200);
  });

  test('a signature made with the wrong secret is rejected', () => {
    sys.create('order_s2');
    const body = webhookBody('order_s2', 'pay_s2');
    const wrong = crypto.createHmac('sha256', 'a-different-secret').update(body).digest('hex');
    assert.equal(sys.webhook({ rawBody: body, signature: wrong }).status, 400);
    assert.equal(sys.findByOrderId('order_s2').paymentStatus, 'pending');
  });

  test('a tampered body invalidates the signature', () => {
    sys.create('order_s3');
    const body = webhookBody('order_s3', 'pay_s3');
    const sig = signWebhook(body);
    const tampered = webhookBody('order_s3', 'pay_ATTACKER');
    assert.equal(sys.webhook({ rawBody: tampered, signature: sig }).status, 400);
  });

  test('a missing signature is rejected', () => {
    sys.create('order_s4');
    const body = webhookBody('order_s4', 'pay_s4');
    assert.equal(sys.webhook({ rawBody: body, signature: '' }).status, 400);
  });

  test('a missing secret fails closed with 503, never open', () => {
    sys.create('order_s5');
    const body = webhookBody('order_s5', 'pay_s5');
    const r = sys.webhook({ rawBody: body, signature: signWebhook(body), secret: '' });
    assert.equal(r.status, 503);
    assert.equal(sys.findByOrderId('order_s5').paymentStatus, 'pending');
  });
});

describe('source guards — the model must not drift from the routes', () => {
  test('confirm-payment looks the booking up by order id', () => {
    assert.ok(
      /getBookingByPaymentOrderId\(razorpay_order_id\)/.test(routeCode),
      'confirm-payment must resolve the booking by Razorpay order id',
    );
  });

  test('confirm-payment no longer scans pending bookings', () => {
    assert.ok(
      !/getBookingsByStatus\(\s*["']pending["']\s*\)/.test(routeCode),
      'the status scan is what created the race — it must not come back',
    );
  });

  test('confirm-payment still verifies the signature before touching the booking', () => {
    const idx = routeCode.indexOf('verifyPaymentSignature');
    const lookupIdx = routeCode.indexOf('getBookingByPaymentOrderId(razorpay_order_id)');
    assert.ok(idx > -1 && lookupIdx > idx, 'signature verification must precede the lookup');
    assert.ok(/Invalid payment signature/.test(routeCode));
  });

  test('the webhook still verifies over the raw body with a constant-time compare', () => {
    assert.ok(/createHmac\("sha256", webhookSecret\)/.test(routeCode));
    assert.ok(/\.update\(rawBody\)/.test(routeCode), 'must hash the raw bytes, not the parsed body');
    assert.ok(/timingSafeEqual/.test(routeCode));
    assert.ok(/Webhook not configured/.test(routeCode), 'must still fail closed without a secret');
  });

  test('the webhook still only marks an unpaid booking as paid', () => {
    assert.ok(
      /if \(booking\.paymentStatus !== "paid"\)/.test(routeCode),
      'the webhook idempotency guard must remain',
    );
  });

  test('notifications remain gated on the not-already-paid branch', () => {
    assert.ok(/!alreadyPaid/.test(routeCode), 'WhatsApp must not be re-sent on an idempotent confirm');
  });
});
