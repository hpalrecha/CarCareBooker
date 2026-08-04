/**
 * Offline verification for the booking -> n8n webhook service.
 *
 * Runs sendBookingWebhook against a LOCAL mock n8n on 127.0.0.1. It never contacts
 * production n8n, ERPNext, Razorpay or WhatsApp, and never messages a customer.
 *
 *   npx tsx scripts/verify-webhook-integration.ts
 */
import http from 'http';
import type { AddressInfo } from 'net';
import type { Booking, Service } from '../shared/schema';
import { sendBookingWebhook, buildBookingWebhookPayload } from '../server/services/webhook';

type Mode = 'ok' | 'ok-with-execution' | 'server-error' | 'client-error' | 'hang';

let mode: Mode = 'ok';
let requestCount = 0;
let lastBody: any = null;
let lastIdempotencyHeader: string | undefined;

const server = http.createServer((req, res) => {
  requestCount++;
  lastIdempotencyHeader = req.headers['x-idempotency-key'] as string | undefined;
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    try {
      lastBody = JSON.parse(raw);
    } catch {
      lastBody = raw;
    }
    if (mode === 'hang') return; // never respond -> exercises the client timeout
    if (mode === 'server-error') {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('upstream boom');
    }
    if (mode === 'client-error') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('webhook not registered');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      mode === 'ok-with-execution'
        ? JSON.stringify({ message: 'ok', executionId: 'exec-12345' })
        : JSON.stringify({ message: 'Workflow was started' }),
    );
  });
});

const booking = {
  id: 'test-booking-0001',
  serviceId: 'svc-1',
  timeSlotId: '11:00',
  appointmentDate: '2026-08-10',
  appointmentTime: '11:00',
  customerName: 'Local Test',
  customerEmail: 'local.test@example.invalid',
  customerPhone: '9000000001',
  amount: '299.00',
  paymentId: 'pay_TEST',
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
  razorpayOrderId: 'order_TEST',
  whatsappSent: true,
  emailSent: false,
  createdAt: new Date('2026-08-03T10:00:00Z'),
  updatedAt: new Date('2026-08-03T10:05:00Z'),
} as unknown as Booking;

const service = { title: 'Windshield Glass Coating', slug: 'windshield-glass-coating' } as unknown as Service;

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}/webhook/local-test`;

  console.log('\n── 1. URL not configured → visible, retryable failure (never silent) ──');
  delete process.env.N8N_BOOKING_WEBHOOK_URL;
  requestCount = 0;
  let r = await sendBookingWebhook(booking, service);
  check('ok === false', r.ok === false);
  check('status === "failed"', r.status === 'failed', `got ${r.status}`);
  check('errorKind === "not_configured"', r.errorKind === 'not_configured', `got ${r.errorKind}`);
  check('retryable === true', r.retryable === true);
  check('no HTTP request attempted', requestCount === 0, `got ${requestCount}`);

  process.env.N8N_BOOKING_WEBHOOK_URL = url;

  console.log('\n── 2. Happy path (200) ──');
  mode = 'ok';
  requestCount = 0;
  r = await sendBookingWebhook(booking, service);
  check('ok === true', r.ok === true);
  check('status === "sent"', r.status === 'sent', `got ${r.status}`);
  check('exactly one attempt', r.attempts === 1, `got ${r.attempts}`);
  check('httpStatus 200', r.httpStatus === 200, `got ${r.httpStatus}`);
  check('idempotency header sent', lastIdempotencyHeader === booking.id, `got ${lastIdempotencyHeader}`);
  check('payload carries idempotencyKey', lastBody?.idempotencyKey === booking.id);
  check('eventType is booking_payment_confirmed', lastBody?.eventType === 'booking_payment_confirmed');
  check('paymentStatus forwarded as paid', lastBody?.paymentStatus === 'paid');

  console.log('\n── 3. n8n returns an execution id ──');
  mode = 'ok-with-execution';
  r = await sendBookingWebhook(booking, service);
  check('n8nExecutionId captured', r.n8nExecutionId === 'exec-12345', `got ${r.n8nExecutionId}`);

  console.log('\n── 4. 5xx → retried, classified server_error, retryable ──');
  mode = 'server-error';
  requestCount = 0;
  r = await sendBookingWebhook(booking, service);
  check('ok === false', r.ok === false);
  check('errorKind === "server_error"', r.errorKind === 'server_error', `got ${r.errorKind}`);
  check('retryable === true', r.retryable === true);
  check('retried 3 times', requestCount === 3, `got ${requestCount}`);
  check('error summary present and short', !!r.error && r.error.length <= 260);

  console.log('\n── 5. 4xx → NOT retried (a bad path will never fix itself) ──');
  mode = 'client-error';
  requestCount = 0;
  r = await sendBookingWebhook(booking, service);
  check('errorKind === "client_error"', r.errorKind === 'client_error', `got ${r.errorKind}`);
  check('retryable === false', r.retryable === false);
  check('exactly one attempt', requestCount === 1, `got ${requestCount}`);

  console.log('\n── 6. Hanging server → timeout, not an infinite stall ──');
  mode = 'hang';
  requestCount = 0;
  const started = Date.now();
  r = await sendBookingWebhook(booking, service);
  const elapsed = Date.now() - started;
  check('errorKind === "timeout"', r.errorKind === 'timeout', `got ${r.errorKind}`);
  check('retryable === true', r.retryable === true);
  check('bounded (< 45s for 3 attempts @10s)', elapsed < 45_000, `took ${elapsed}ms`);

  console.log('\n── 7. Payload shape / no leakage ──');
  const payload = buildBookingWebhookPayload(booking, service);
  check('idempotencyKey === booking.id', payload.idempotencyKey === booking.id);
  const serialised = JSON.stringify(payload);
  check('no token-like keys in payload', !/token|secret|apikey|authorization/i.test(serialised));

  server.close();
  console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
