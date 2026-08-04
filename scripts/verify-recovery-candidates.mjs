// READ-ONLY verification of ERP recovery candidates on the LIVE database.
// Applies the exclusion rules: no dev_order_, no manual overrides, no already-synced.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const erpBase = (process.env.ERPNEXT_BASE_URL || '').replace(/\/$/, '');
const erpToken = (process.env.ERPNEXT_TOKEN || '').replace(/^token\s+/i, '').replace(/^"|"$/g, '');

const mask = (p) => (!p ? '(none)' : String(p).slice(0, 3) + '***' + String(p).slice(-3));
const erpGet = async (path) => {
  const r = await fetch(`${erpBase}${path}`, {
    headers: { Authorization: `token ${erpToken}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`ERP ${r.status}`);
  return r.json();
};

try {
  console.log('=== ALL paid bookings, classified by payment provenance ===');
  const all = (await pool.query(`
    SELECT id, customer_name, customer_phone, customer_email, amount,
           payment_status, payment_id, razorpay_order_id, appointment_date, appointment_time,
           to_char(created_at,'YYYY-MM-DD HH24:MI') AS created,
           to_char(updated_at,'YYYY-MM-DD HH24:MI') AS updated,
           erp_sync_status, erp_document_id, erp_sync_attempts
    FROM bookings
    WHERE payment_status = 'paid'
    ORDER BY created_at DESC`)).rows;

  const cls = (b) => {
    if ((b.razorpay_order_id || '').startsWith('dev_order_')) return 'DEV_ORDER (exclude)';
    if ((b.payment_id || '').startsWith('manual_')) return 'MANUAL_OVERRIDE (exclude)';
    if ((b.payment_id || '').startsWith('pay_') && (b.razorpay_order_id || '').startsWith('order_'))
      return 'REAL_RAZORPAY';
    return 'UNVERIFIED (exclude)';
  };
  const counts = {};
  all.forEach((b) => { const c = cls(b); counts[c] = (counts[c] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(26)} ${v}`));

  console.log('\n=== CANDIDATES: real Razorpay payment AND not yet synced ===');
  const cands = all.filter((b) => cls(b) === 'REAL_RAZORPAY' &&
    (b.erp_sync_status === null || b.erp_sync_status === 'pending' || b.erp_sync_status === 'failed'));
  console.log(`  count: ${cands.length}\n`);

  for (const b of cands) {
    console.log('─'.repeat(78));
    console.log(`  booking id        : ${b.id}`);
    console.log(`  customer          : ${b.customer_name}`);
    console.log(`  phone (masked)    : ${mask(b.customer_phone)}`);
    console.log(`  amount            : Rs ${b.amount}`);
    console.log(`  razorpay order id : ${b.razorpay_order_id}`);
    console.log(`  razorpay payment  : ${b.payment_id}`);
    console.log(`  payment_status    : ${b.payment_status}`);
    console.log(`  created / updated : ${b.created}  /  ${b.updated}`);
    console.log(`  appointment       : ${b.appointment_date} ${b.appointment_time}`);
    console.log(`  erp_sync_status   : ${b.erp_sync_status ?? 'NULL'}`);
    console.log(`  erp_document_id   : ${b.erp_document_id ?? 'NULL'}`);
    console.log(`  erp_sync_attempts : ${b.erp_sync_attempts ?? 0}`);

    const ph = String(b.customer_phone).replace(/\D/g, '').slice(-10);
    const leads = await erpGet(`/api/resource/Lead?limit_page_length=5&fields=${
      encodeURIComponent(JSON.stringify(['name', 'creation', 'lead_name']))
    }&filters=${encodeURIComponent(JSON.stringify([['mobile_no', 'like', `%${ph}%`]]))}`);
    console.log(`  ERP Leads (phone) : ${leads.data.length} -> ${leads.data.map(l => l.name).join(', ') || 'none'}`);

    const appts = await erpGet(`/api/resource/Appointment?limit_page_length=20&fields=${
      encodeURIComponent(JSON.stringify(['name', 'creation', 'customer_name', 'customer_phone_number']))
    }&filters=${encodeURIComponent(JSON.stringify([['customer_phone_number', 'like', `%${ph}%`]]))}`);
    console.log(`  ERP Appts (phone) : ${appts.data.length}`);
    appts.data.forEach(a => console.log(`      ${a.creation.slice(0,16)}  ${a.name}`));

    const after = appts.data.filter(a => new Date(a.creation) >= new Date(b.created.replace(' ', 'T')));
    console.log(`  Appt created AFTER this booking: ${after.length} ${after.length === 0 ? '=> MISSING FROM ERP ✅ candidate' : '=> already present, EXCLUDE'}`);
  }
  console.log('─'.repeat(78));
} finally { await pool.end(); }
