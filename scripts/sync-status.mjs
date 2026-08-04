// READ-ONLY dashboard of ERP sync state on the LIVE CarCareBooker database.
//   node scripts/sync-status.mjs
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const mask = (p) => (!p ? '-' : String(p).slice(0, 3) + '***' + String(p).slice(-3));
const line = (n = 104) => console.log('─'.repeat(n));

try {
  const [{ current_database: db }] = (await pool.query('SELECT current_database()')).rows;
  console.log(`\nDatabase: ${db}  (live — p91carcare.com / App Engine)`);

  // 1. Overall distribution
  const dist = (await pool.query(`
    SELECT payment_status,
           COALESCE(erp_sync_status,'(null)') AS erp,
           count(*)::int AS n
      FROM bookings GROUP BY 1,2 ORDER BY 1,2`)).rows;
  console.log('\nBOOKINGS BY PAYMENT × ERP SYNC STATE');
  line(52);
  console.log('  payment_status   erp_sync_status      count');
  line(52);
  for (const r of dist) {
    console.log(`  ${r.payment_status.padEnd(16)} ${r.erp.padEnd(20)} ${String(r.n).padStart(5)}`);
  }
  line(52);

  // 2. The two recovered bookings
  const rec = (await pool.query(`
    SELECT customer_name, customer_phone, amount, payment_id, razorpay_order_id,
           erp_sync_status, erp_document_type, erp_document_id, erp_sync_attempts,
           n8n_execution_id,
           to_char(created_at,'YYYY-MM-DD HH24:MI') AS booked,
           to_char(erp_synced_at,'YYYY-MM-DD HH24:MI') AS synced
      FROM bookings
     WHERE erp_document_id IS NOT NULL
     ORDER BY erp_synced_at DESC`)).rows;
  console.log(`\nBOOKINGS WITH AN ERP DOCUMENT ID  (${rec.length})`);
  line();
  for (const r of rec) {
    console.log(`  ${r.customer_name}`);
    console.log(`    booked ${r.booked}   phone ${mask(r.customer_phone)}   Rs ${r.amount}`);
    console.log(`    razorpay      : ${r.razorpay_order_id} / ${r.payment_id}`);
    console.log(`    erp           : ${r.erp_sync_status}  ->  ${r.erp_document_type} ${r.erp_document_id}`);
    console.log(`    synced at     : ${r.synced}   attempts ${r.erp_sync_attempts}   n8n exec ${r.n8n_execution_id}`);
    line();
  }

  // 3. Anything paid but not synced = the live backlog
  const backlog = (await pool.query(`
    SELECT customer_name, customer_phone, razorpay_order_id, payment_id,
           COALESCE(erp_sync_status,'(null)') AS erp, erp_sync_error,
           to_char(created_at,'YYYY-MM-DD HH24:MI') AS booked
      FROM bookings
     WHERE payment_status='paid'
       AND (erp_sync_status IS NULL OR erp_sync_status IN ('pending','processing','failed'))
     ORDER BY created_at DESC`)).rows;
  console.log(`\nPAID BUT NOT SYNCED  (${backlog.length})`);
  if (!backlog.length) console.log('  none — every confirmed-paid booking is accounted for ✅');
  backlog.forEach(b => console.log(
    `  ${b.booked}  ${(b.customer_name||'').padEnd(20).slice(0,20)} ${mask(b.customer_phone)}  ${b.erp}  ${b.erp_sync_error||''}`));

  // 4. Most recent bookings regardless of state
  const recent = (await pool.query(`
    SELECT customer_name, payment_status, razorpay_order_id,
           COALESCE(erp_sync_status,'(null)') AS erp, erp_document_id,
           to_char(created_at,'YYYY-MM-DD HH24:MI') AS booked
      FROM bookings ORDER BY created_at DESC LIMIT 10`)).rows;
  console.log('\nMOST RECENT 10 BOOKINGS');
  line();
  console.log('  booked            customer             payment    erp_sync    erp_document_id');
  line();
  recent.forEach(b => console.log(
    `  ${b.booked}  ${(b.customer_name||'').padEnd(20).slice(0,20)} ${b.payment_status.padEnd(10)} ${b.erp.padEnd(11)} ${b.erp_document_id||'-'}`));
  line();
} finally { await pool.end(); }
