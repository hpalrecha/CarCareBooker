/**
 * Recovers ONE paid booking into ERPNext, idempotently.
 *
 *   node scripts/recover-booking.mjs <bookingId> [--prod]
 *
 * The database side lives here (transactional, audited); n8n only does the ERP work.
 *
 *   1. Atomic claim  : FOR UPDATE SKIP LOCKED -> 'processing', attempts+1
 *   2. ERP           : POST to the n8n webhook, which duplicate-checks then creates
 *   3. Verify        : response must carry a real Appointment id, and ERP must show
 *                      exactly ONE appointment bearing the [booking:<id>] marker
 *   4. Settle        : 'synced' + erp_document_id (+ ids)   OR   'failed' + erp_sync_error
 *
 * Refuses anything that is not a real Razorpay payment (dev_order_ / manual_ excluded).
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const BOOKING = process.argv[2];
const USE_PROD = process.argv.includes('--prod');
if (!BOOKING) { console.error('usage: recover-booking.mjs <bookingId> [--prod]'); process.exit(1); }

const N8N = 'https://n8n.plus91inc.in';
const PATH = 'carcare-erp-sync-recovery';
const HOOK = `${N8N}/${USE_PROD ? 'webhook' : 'webhook-test'}/${PATH}`;

const erpBase = (process.env.ERPNEXT_BASE_URL || '').replace(/\/$/, '');
const erpToken = (process.env.ERPNEXT_TOKEN || '').replace(/^token\s+/i, '').replace(/^"|"$/g, '');
const erpGet = async (p) => (await fetch(`${erpBase}${p}`, {
  headers: { Authorization: `token ${erpToken}` }, signal: AbortSignal.timeout(30000) })).json();
const marked = async (id) => (await erpGet(
  `/api/resource/Appointment?limit_page_length=20&fields=${
    encodeURIComponent(JSON.stringify(['name', 'creation']))}&filters=${
    encodeURIComponent(JSON.stringify([['customer_details', 'like', `%booking:${id}%`]]))}`)).data || [];

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const log = (k, v) => console.log(`  ${String(k).padEnd(24)}: ${v}`);

let claimed = null;
try {
  console.log(`\n=== 1. ATOMIC CLAIM (${USE_PROD ? 'production' : 'TEST'} webhook) ===`);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await c.query(`
      WITH candidates AS (
        SELECT id FROM bookings
         WHERE id = $1
           AND payment_status = 'paid'
           AND razorpay_order_id LIKE 'order_%'
           AND payment_id LIKE 'pay_%'
           AND ( erp_sync_status IS NULL
              OR erp_sync_status = 'pending'
              OR (erp_sync_status = 'processing' AND updated_at < NOW() - INTERVAL '15 minutes')
              OR (erp_sync_status = 'failed' AND COALESCE(erp_sync_attempts,0) < 5) )
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      UPDATE bookings b
         SET erp_sync_status = 'processing',
             erp_sync_attempts = COALESCE(b.erp_sync_attempts,0) + 1,
             erp_sync_error = NULL,
             updated_at = NOW()
        FROM candidates cd
       WHERE b.id = cd.id
      RETURNING b.id, b.customer_name, b.customer_phone, b.customer_email, b.amount,
                b.appointment_date, b.appointment_time, b.payment_id, b.razorpay_order_id,
                b.erp_sync_attempts,
                (SELECT s.title FROM services s WHERE s.id = b.service_id) AS service_name`,
      [BOOKING]);
    await c.query('COMMIT');
    claimed = r.rows[0] || null;
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }

  if (!claimed) { console.log('  not claimable (already synced, in flight, or not a real payment) — STOP'); process.exit(0); }
  log('booking', claimed.id);
  log('customer', claimed.customer_name);
  log('phone (masked)', String(claimed.customer_phone).slice(0,3) + '***' + String(claimed.customer_phone).slice(-3));
  log('razorpay payment', claimed.payment_id);
  log('erp_sync_attempts', claimed.erp_sync_attempts);

  const before = await marked(BOOKING);
  console.log(`\n=== 2. ERP PRE-CHECK ===`);
  log('appointments with marker', before.length + (before.length ? ' -> ' + before.map(a=>a.name).join(', ') : ' (none)'));

  console.log(`\n=== 3. CALL n8n ===`);
  log('endpoint', HOOK);
  const phone10 = String(claimed.customer_phone).replace(/\D/g, '').slice(-10);
  const payload = {
    bookingId: claimed.id,
    customerName: claimed.customer_name,
    customerPhone: claimed.customer_phone,
    phone10,
    customerEmail: claimed.customer_email,
    serviceName: claimed.service_name,
    appointmentDate: claimed.appointment_date,
    appointmentTime: claimed.appointment_time,
    amount: claimed.amount,
    paymentId: claimed.payment_id,
    orderId: claimed.razorpay_order_id,
  };
  console.log('  payload (sanitised):');
  console.log('    ' + JSON.stringify({ ...payload,
    customerPhone: '***', phone10: '***',
    customerEmail: String(payload.customerEmail).replace(/^(.).*@/, '$1***@') }));

  const res = await fetch(HOOK, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(120000),
  });
  const text = await res.text();
  log('http status', res.status);
  let body = null; try { body = JSON.parse(text); } catch { /* non-JSON */ }
  console.log('  response:', text.slice(0, 300));

  const apptId = body && (Array.isArray(body) ? body[0]?.appointmentId : body.appointmentId);

  console.log(`\n=== 4. VERIFY IN ERP ===`);
  const after = await marked(BOOKING);
  log('appointments with marker', after.length);
  after.forEach(a => console.log(`    ${a.creation.slice(0,19)}  ${a.name}`));

  if (!res.ok || !apptId || after.length !== 1) {
    const why = !res.ok ? `http ${res.status}` : !apptId ? 'no appointmentId in response'
      : `expected exactly 1 marked appointment, found ${after.length}`;
    await pool.query(
      `UPDATE bookings SET erp_sync_status='failed', erp_sync_error=LEFT($2,500), updated_at=NOW() WHERE id=$1`,
      [BOOKING, `recovery: ${why}`]);
    console.log(`\n  ❌ NOT marked synced — ${why}. Row set to 'failed' and remains retryable.`);
    process.exit(1);
  }

  console.log(`\n=== 5. SETTLE ===`);
  await pool.query(
    `UPDATE bookings
        SET erp_sync_status='synced', erp_document_type='Appointment', erp_document_id=$2,
            erp_synced_at=NOW(), erp_sync_error=NULL, n8n_execution_id=$3, updated_at=NOW()
      WHERE id=$1`,
    [BOOKING, apptId, String((body.executionId ?? '') || '')]);
  const row = (await pool.query(
    `SELECT erp_sync_status, erp_document_id, erp_document_type, erp_sync_attempts,
            n8n_execution_id, to_char(erp_synced_at,'YYYY-MM-DD HH24:MI:SS') AS synced_at
       FROM bookings WHERE id=$1`, [BOOKING])).rows[0];
  Object.entries(row).forEach(([k, v]) => log(k, v ?? 'NULL'));
  console.log(`\n  ✅ recovered: ${claimed.customer_name} -> ${apptId} (created=${body.created})`);
} finally { await pool.end(); }
