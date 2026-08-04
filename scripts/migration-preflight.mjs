// READ-ONLY pre-flight checks before applying the integration-tracking migration.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const url = process.env.CARCARE_DATABASE_URL;
if (!url) { console.error('CARCARE_DATABASE_URL not set'); process.exit(1); }

const pool = new Pool({ connectionString: url });
let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fail++;
};

try {
  const [{ current_database: db }] = (await pool.query('SELECT current_database()')).rows;
  // The live database is named "neondb"; the stale Lightsail copy is "carcarebooker".
  // Accept either, but prove identity by content below rather than by name.
  check('database name is a known CarCareBooker database',
    db === 'carcarebooker' || db === 'neondb', `got "${db}"`);
  check('database is NOT eventbooker', db !== 'eventbooker');

  // Positive identity: is this the LIVE database (p91carcare.com / Google Cloud)?
  const live = (await pool.query(
    `SELECT 1 FROM bookings WHERE razorpay_order_id = 'order_TLHJDdM0OYZBRJ'`
  )).rowCount > 0;
  console.log(`  ${live ? '🟢' : '⚪'} identity: ${live
    ? 'LIVE database (contains order_TLHJDdM0OYZBRJ)'
    : 'not the live database (stale/duplicate copy)'}`);

  const tables = (await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
  )).rows.map(r => r.table_name).sort();
  const expected = ['bookings', 'services', 'time_slots', 'admins'];
  check('CarCareBooker tables present', expected.every(t => tables.includes(t)),
    expected.filter(t => !tables.includes(t)).join(',') || 'all present');
  check('no EventBooker tables (registrations/coupons)',
    !tables.includes('registrations') && !tables.includes('coupons'));

  const cols = (await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='bookings' ORDER BY ordinal_position`
  )).rows.map(r => r.column_name);
  check('bookings has 17 pre-migration columns', cols.length === 17, `got ${cols.length}`);
  const targets = ['erp_sync_status','erp_document_id','payment_verified_at','n8n_execution_id'];
  check('target columns do NOT yet exist', targets.every(c => !cols.includes(c)),
    targets.filter(c => cols.includes(c)).join(',') || 'none present');

  const [{ n: rows }] = (await pool.query('SELECT count(*)::int AS n FROM bookings')).rows;
  const [{ n: paid }] = (await pool.query(`SELECT count(*)::int AS n FROM bookings WHERE payment_status='paid'`)).rows;
  console.log(`\n  BASELINE: bookings rows = ${rows}, paid = ${paid}`);
  console.log(`  columns  = ${cols.join(', ')}`);

  console.log(`\n${fail === 0 ? '✅ PRE-FLIGHT PASSED' : '❌ PRE-FLIGHT FAILED (' + fail + ')'}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  await pool.end();
}
