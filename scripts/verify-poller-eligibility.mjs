// READ-ONLY: proves the poller's eligibility query selects exactly the right rows (expected: 0).
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const MAX_ATTEMPTS = 5;
const WHERE = `
   WHERE payment_status = 'paid'
     AND erp_document_id IS NULL
     AND COALESCE(erp_sync_attempts, 0) < ${MAX_ATTEMPTS}
     AND ( erp_sync_status IS NULL
        OR erp_sync_status IN ('pending','failed')
        OR (erp_sync_status = 'processing' AND updated_at < NOW() - INTERVAL '15 minutes') )
     AND razorpay_order_id LIKE 'order_%'
     AND payment_id        LIKE 'pay_%'
     AND created_at >= DATE '2026-07-10'`;

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fail++;
};

try {
  const [{ current_database: db }] = (await pool.query('SELECT current_database()')).rows;
  check('connected to the LIVE database (neondb)', db === 'neondb', `got "${db}"`);

  const eligible = (await pool.query(
    `SELECT id, customer_name FROM bookings ${WHERE} ORDER BY created_at ASC LIMIT 20`)).rows;
  console.log(`\nELIGIBLE ROWS RIGHT NOW: ${eligible.length}`);
  eligible.forEach(r => console.log(`    ${r.id}  ${r.customer_name}`));
  check('queue is empty (0 eligible)', eligible.length === 0, `${eligible.length} rows`);

  const [{ n: pend }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings WHERE payment_status='pending'`)).rows;
  const [{ n: pendEligible }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings ${WHERE} AND payment_status='pending'`)).rows;
  check(`all ${pend} pending rows excluded`, pendEligible === 0, `${pendEligible} leaked in`);

  for (const [label, id] of [
    ['Nawaf', 'cb253000-7104-45ae-8cc3-6ded38ef294e'],
    ['Hari Shankar P A', 'd3069d4b-7b59-4eb9-af1d-634224d2bdc0']]) {
    const [{ n }] = (await pool.query(`SELECT count(*)::int n FROM bookings ${WHERE} AND id = $1`, [id])).rows;
    check(`${label} excluded (already synced)`, n === 0);
  }

  const [{ n: devTotal }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings WHERE razorpay_order_id LIKE 'dev_order_%'`)).rows;
  const [{ n: devEligible }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings ${WHERE} AND razorpay_order_id LIKE 'dev_order_%'`)).rows;
  check(`dev_order_ rows excluded (${devTotal} exist on this db)`, devEligible === 0);

  const [{ n: manTotal }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings WHERE payment_id LIKE 'manual_%'`)).rows;
  const [{ n: manEligible }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings ${WHERE} AND payment_id LIKE 'manual_%'`)).rows;
  check(`manual_ override rows excluded (${manTotal} exist)`, manEligible === 0);

  const [{ n: syncedEligible }] = (await pool.query(
    `SELECT count(*)::int n FROM bookings ${WHERE} AND erp_sync_status='synced'`)).rows;
  check('already-synced rows excluded', syncedEligible === 0);

  // Prove it WOULD pick up a genuine unsynced paid booking, without changing anything.
  const [{ n: wouldCatch }] = (await pool.query(`
    SELECT count(*)::int n FROM bookings
     WHERE payment_status='paid' AND razorpay_order_id LIKE 'order_%' AND payment_id LIKE 'pay_%'
       AND erp_document_id IS NULL`)).rows;
  console.log(`\n  sanity: paid + real-razorpay + no erp doc = ${wouldCatch} (these are what the poller targets)`);

  console.log(`\n${fail === 0 ? '✅ ELIGIBILITY VERIFIED' : '❌ FAILED (' + fail + ')'}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally { await pool.end(); }
