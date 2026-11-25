// READ-ONLY provenance audit of recent bookings across both databases.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const LIVE = process.env.CARCARE_LIVE_DATABASE_URL;
const STALE = process.env.CARCARE_DATABASE_URL;
const mask = (s) => (!s ? '-' : String(s).slice(0, 4) + '***' + String(s).slice(-3));

const open = (u) => new Pool({ connectionString: u });
const q = async (p, s, a = []) => (await p.query(s, a)).rows;

const live = open(LIVE), stale = open(STALE);
try {
  // ---- 1. When did the two databases diverge? -------------------------------
  const liveIds = new Map((await q(live, 'select id, created_at from bookings')).map(r => [r.id, r.created_at]));
  const staleIds = new Map((await q(stale, 'select id, created_at from bookings')).map(r => [r.id, r.created_at]));
  const common = [...liveIds.keys()].filter(id => staleIds.has(id));
  const lastCommon = common.map(id => liveIds.get(id)).sort((a, b) => b - a)[0];
  const onlyLive = [...liveIds.keys()].filter(id => !staleIds.has(id));
  const onlyStale = [...staleIds.keys()].filter(id => !liveIds.has(id));
  console.log('=== DIVERGENCE ===');
  console.log(`  rows in both        : ${common.length}`);
  console.log(`  newest shared row   : ${lastCommon?.toISOString().slice(0, 16)}  <-- the fork point`);
  console.log(`  only in LIVE        : ${onlyLive.length}`);
  console.log(`  only in STALE       : ${onlyStale.length}`);
  const firstDivergent = onlyLive.map(id => liveIds.get(id)).sort((a, b) => a - b)[0];
  console.log(`  first LIVE-only row : ${firstDivergent?.toISOString().slice(0, 16)}`);

  // ---- 2. Categorise every booking since the fork ---------------------------
  console.log('\n=== BOOKINGS ON LIVE SINCE 2026-06-01 ===');
  const rows = await q(live, `
    SELECT id, customer_name, customer_phone, amount,
           razorpay_order_id, payment_id, payment_status, booking_status,
           whatsapp_sent, email_sent, payment_verified_at,
           erp_sync_status, erp_document_id, erp_sync_attempts, n8n_execution_id,
           created_at, updated_at, appointment_date, appointment_time
      FROM bookings
     WHERE created_at >= DATE '2026-06-01'
     ORDER BY created_at DESC`);

  const classify = (b) => {
    const realOrder = /^order_/.test(b.razorpay_order_id || '');
    const realPay = /^pay_/.test(b.payment_id || '');
    if (/^dev_order_/.test(b.razorpay_order_id || '')) return 'Development fallback';
    if (/^manual_/.test(b.payment_id || '')) return 'Manual admin override';
    if (realOrder && realPay && b.payment_status === 'paid') return 'Genuine Razorpay payment';
    if (realOrder && !realPay && b.payment_status === 'pending') return 'Pending / abandoned checkout';
    if (realOrder && !realPay) return 'Unknown — order created, no payment id';
    return 'Unknown — needs evidence';
  };

  const tally = {};
  for (const b of rows) {
    const c = classify(b);
    tally[c] = (tally[c] || 0) + 1;
  }
  console.log('  category counts:');
  Object.entries(tally).forEach(([k, v]) => console.log(`    ${k.padEnd(38)} ${v}`));

  console.log('\n  detail (newest first):');
  for (const b of rows) {
    const gap = Math.round((b.updated_at - b.created_at) / 1000);
    console.log(`\n  ${b.created_at.toISOString().slice(0, 16)}  ${b.customer_name}`);
    console.log(`     category   : ${classify(b)}`);
    console.log(`     id         : ${b.id}`);
    console.log(`     order/pay  : ${b.razorpay_order_id || '-'}  /  ${b.payment_id || '-'}`);
    console.log(`     status     : payment=${b.payment_status}  booking=${b.booking_status}`);
    console.log(`     amount     : Rs ${b.amount}   phone ${mask(b.customer_phone)}   appt ${b.appointment_date} ${b.appointment_time}`);
    console.log(`     created    : ${b.created_at.toISOString().slice(0, 19)}`);
    console.log(`     updated    : ${b.updated_at.toISOString().slice(0, 19)}   (+${gap}s after creation)`);
    console.log(`     wa_sent=${b.whatsapp_sent}  email_sent=${b.email_sent}  payment_verified_at=${b.payment_verified_at ? b.payment_verified_at.toISOString().slice(0, 19) : 'null'}`);
    console.log(`     erp        : ${b.erp_sync_status || '(null)'}  ${b.erp_document_id || ''}  attempts=${b.erp_sync_attempts ?? 0}  n8n_exec=${b.n8n_execution_id || '-'}`);
    console.log(`     in stale db: ${staleIds.has(b.id) ? 'YES' : 'NO'}`);
  }

  // ---- 3. Audit metadata availability --------------------------------------
  console.log('\n=== AUDIT FIELD AVAILABILITY ===');
  const cols = (await q(live, `select column_name from information_schema.columns where table_name='bookings'`)).map(r => r.column_name);
  for (const f of ['created_by', 'updated_by', 'source', 'ip_address', 'user_agent', 'audit_log']) {
    console.log(`  ${f.padEnd(14)} ${cols.includes(f) ? 'present' : 'ABSENT'}`);
  }
  const tables = (await q(live, `select table_name from information_schema.tables where table_schema='public'`)).map(r => r.table_name);
  console.log(`  audit/log table present: ${tables.some(t => /audit|log|history/i.test(t)) ? 'yes' : 'NO'}`);
} finally {
  await live.end(); await stale.end();
}
