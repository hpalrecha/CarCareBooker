/**
 * Delete the identified test bookings from the LIVE database.
 * Backs every row up to JSON first, deletes by explicit id inside a transaction,
 * and rolls back if the affected row count is not exactly what we expect.
 *
 *   node delete-test-bookings.mjs           # dry run
 *   node delete-test-bookings.mjs --apply
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';
neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');

// Exactly the seven rows shown in the dashboard screenshot.
const IDS = [
  '852be8de-51b2-4fe1-b3ad-d9dce085b88c', // test           04 Aug
  '74890ee5-8ca1-4eef-8aad-09c34e8dd93f', // kgerhuew       03 Aug 11:20
  'b4fa2d7a-1428-47c9-84bc-8d07d8f327ab', // kgerhuew       03 Aug 11:16
  'b538a9ac-ab06-4f91-8193-e93d0161fe55', // kgerhuew       03 Aug 11:15
  'eec246a1-fa61-42b9-8f66-2945f1480e31', // test booking   28 Jul 09:27
  'b638a5e3-9870-4362-9508-c02c3fa77069', // test booking   28 Jul 07:57
  'e8ee2dff-357a-4479-9d72-8b232d30464f', // test booking   28 Jul 07:51
];

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });

try {
  const before = (await pool.query('select count(*)::int n from bookings')).rows[0].n;
  const rows = (await pool.query('select * from bookings where id = any($1)', [IDS])).rows;

  console.log(`live database rows       : ${before}`);
  console.log(`ids requested            : ${IDS.length}`);
  console.log(`rows found               : ${rows.length}`);

  // Refuse to touch anything that shows signs of being a real booking.
  const unsafe = rows.filter(r => r.payment_status !== 'pending' || r.payment_id || r.erp_document_id);
  console.log(`rows that look real      : ${unsafe.length}`);
  if (unsafe.length) {
    console.log('ABORT — these are not test rows:', unsafe.map(r => r.customer_name));
    process.exit(1);
  }
  if (rows.length !== IDS.length) {
    console.log('ABORT — id list does not resolve cleanly');
    process.exit(1);
  }

  // No backup by explicit instruction — these are test rows, deleted permanently.

  console.log('\nrows to delete:');
  rows.sort((a, b) => b.created_at - a.created_at).forEach(r => console.log(
    `  ${r.created_at.toISOString().slice(0, 16)}  ${String(r.customer_name).padEnd(16)} ${r.customer_phone}  ${r.razorpay_order_id}`));

  if (!APPLY) { console.log('\n(dry run — nothing deleted)'); process.exit(0); }

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const res = await c.query('delete from bookings where id = any($1)', [IDS]);
    if (res.rowCount !== IDS.length) {
      await c.query('ROLLBACK');
      console.log(`\nABORT — delete affected ${res.rowCount} rows, expected ${IDS.length}. Rolled back.`);
      process.exit(1);
    }
    await c.query('COMMIT');
    console.log(`\nDELETED ${res.rowCount} rows, committed.`);
  } finally { c.release(); }

  const after = (await pool.query('select count(*)::int n from bookings')).rows[0].n;
  const left = (await pool.query('select count(*)::int n from bookings where id = any($1)', [IDS])).rows[0].n;
  const paid = (await pool.query(`select count(*)::int n from bookings where payment_status='paid'`)).rows[0].n;
  console.log(`\nrows before / after      : ${before} -> ${after}   (removed ${before - after})`);
  console.log(`deleted ids still present: ${left}`);
  console.log(`paid bookings            : ${paid}  (must still be 215)`);
} finally {
  await pool.end();
}
