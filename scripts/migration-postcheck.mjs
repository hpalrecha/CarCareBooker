// READ-ONLY post-migration verification.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.CARCARE_DATABASE_URL });
let fail = 0;
const check = (n, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

try {
  const cols = (await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='bookings'`)).rows.map(r => r.column_name);
  const added = ['payment_verified_at','erp_sync_status','erp_document_type','erp_document_id',
    'erp_sync_error','erp_synced_at','erp_sync_attempts','n8n_execution_id',
    'customer_whatsapp_message_id','internal_notification_message_id'];
  check('all 10 columns present', added.every(c => cols.includes(c)));
  check('column count is 27', cols.length === 27, `got ${cols.length}`);

  const [{ n: rows }] = (await pool.query('SELECT count(*)::int AS n FROM bookings')).rows;
  check('row count unchanged (548)', rows === 548, `got ${rows}`);
  const [{ n: paid }] = (await pool.query(`SELECT count(*)::int AS n FROM bookings WHERE payment_status='paid'`)).rows;
  check('paid count unchanged (215)', paid === 215, `got ${paid}`);

  // No pre-existing column was disturbed.
  const [{ n: nulls }] = (await pool.query(
    `SELECT count(*)::int AS n FROM bookings WHERE customer_name IS NULL OR amount IS NULL OR payment_status IS NULL`)).rows;
  check('no existing data nulled out', nulls === 0, `got ${nulls}`);

  // Nullable check: old build writes rows without these columns -> must not be NOT NULL.
  const notNull = (await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='bookings' AND is_nullable='NO'`)).rows.map(r => r.column_name);
  check('no added column is NOT NULL (old build stays compatible)',
    added.every(c => !notNull.includes(c)), notNull.filter(c => added.includes(c)).join(',') || 'ok');

  const backfilled = (await pool.query(
    `SELECT count(*)::int AS n FROM bookings WHERE erp_sync_status='synced'`)).rows[0].n;
  console.log(`\n  backfilled as 'synced': ${backfilled}`);

  const stragglers = (await pool.query(
    `SELECT id, customer_name, to_char(created_at,'YYYY-MM-DD') AS d
     FROM bookings WHERE payment_status='paid' AND erp_sync_status IS NULL ORDER BY created_at`)).rows;
  console.log(`  paid but erp_sync_status IS NULL: ${stragglers.length}`);
  for (const s of stragglers) console.log(`    - ${s.d}  ${s.customer_name}  ${s.id.slice(0,8)}…`);

  console.log(`\n${fail === 0 ? '✅ POST-CHECK PASSED' : '❌ POST-CHECK FAILED (' + fail + ')'}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally { await pool.end(); }
