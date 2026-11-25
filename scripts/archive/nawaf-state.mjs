// READ-ONLY state capture for the controlled Nawaf test (pre and post).
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const BOOKING = 'cb253000-7104-45ae-8cc3-6ded38ef294e';
const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const erpBase = (process.env.ERPNEXT_BASE_URL || '').replace(/\/$/, '');
const erpToken = (process.env.ERPNEXT_TOKEN || '').replace(/^token\s+/i, '').replace(/^"|"$/g, '');
const erpGet = async (p) => (await fetch(`${erpBase}${p}`, {
  headers: { Authorization: `token ${erpToken}` }, signal: AbortSignal.timeout(30000) })).json();

try {
  const b = (await pool.query(`
    SELECT id, customer_name, customer_phone, payment_status, payment_id, razorpay_order_id,
           erp_sync_status, erp_document_id, erp_document_type, erp_sync_attempts,
           erp_sync_error, n8n_execution_id,
           to_char(erp_synced_at,'YYYY-MM-DD HH24:MI:SS') AS synced_at,
           to_char(updated_at,'YYYY-MM-DD HH24:MI:SS')  AS updated
    FROM bookings WHERE id = $1`, [BOOKING])).rows[0];

  console.log('--- DATABASE ROW ---');
  console.log(`  customer          : ${b.customer_name}`);
  console.log(`  phone (masked)    : ${String(b.customer_phone).slice(0,3)}***${String(b.customer_phone).slice(-3)}`);
  console.log(`  payment_status    : ${b.payment_status}`);
  console.log(`  razorpay payment  : ${b.payment_id}`);
  console.log(`  erp_sync_status   : ${b.erp_sync_status ?? 'NULL'}`);
  console.log(`  erp_document_id   : ${b.erp_document_id ?? 'NULL'}`);
  console.log(`  erp_document_type : ${b.erp_document_type ?? 'NULL'}`);
  console.log(`  erp_sync_attempts : ${b.erp_sync_attempts ?? 0}`);
  console.log(`  erp_sync_error    : ${b.erp_sync_error ?? 'NULL'}`);
  console.log(`  erp_synced_at     : ${b.synced_at ?? 'NULL'}`);
  console.log(`  n8n_execution_id  : ${b.n8n_execution_id ?? 'NULL'}`);
  console.log(`  updated_at        : ${b.updated}`);

  const marker = await erpGet(`/api/resource/Appointment?limit_page_length=10&fields=${
    encodeURIComponent(JSON.stringify(['name','creation','customer_name']))}&filters=${
    encodeURIComponent(JSON.stringify([['customer_details','like',`%booking:${BOOKING}%`]]))}`);
  console.log('\n--- ERP: Appointment carrying this booking marker ---');
  console.log(`  matches: ${(marker.data||[]).length}`);
  (marker.data||[]).forEach(a => console.log(`    ${a.creation.slice(0,19)}  ${a.name}`));

  const ph = String(b.customer_phone).replace(/\D/g,'').slice(-10);
  const byPhone = await erpGet(`/api/resource/Appointment?limit_page_length=20&fields=${
    encodeURIComponent(JSON.stringify(['name','creation']))}&filters=${
    encodeURIComponent(JSON.stringify([['customer_phone_number','like',`%${ph}%`]]))}`);
  console.log('\n--- ERP: ALL Appointments for this phone ---');
  console.log(`  total: ${(byPhone.data||[]).length}`);
  (byPhone.data||[]).forEach(a => console.log(`    ${a.creation.slice(0,19)}  ${a.name}`));
} finally { await pool.end(); }
