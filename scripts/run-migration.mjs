// Applies a single .sql migration file to CARCARE_DATABASE_URL, then reports the result.
//   node scripts/run-migration.mjs scripts/migrations/<file>.sql [--dry-run]
//
// Uses the same Pool/WebSocket client as server/db.ts, because the neon() HTTP client
// (v0.10.x) only supports tagged templates and cannot execute raw DDL.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync } from 'fs';

neonConfig.webSocketConstructor = ws;

const file = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <file.sql> [--dry-run]');
  process.exit(1);
}
const url = process.env.CARCARE_DATABASE_URL;
if (!url) {
  console.error('CARCARE_DATABASE_URL not set');
  process.exit(1);
}

const sqlText = readFileSync(file, 'utf8');
const pool = new Pool({ connectionString: url });

const colsQuery = `SELECT column_name FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='bookings'
                   ORDER BY ordinal_position`;

try {
  const before = (await pool.query(colsQuery)).rows.map((r) => r.column_name);
  console.log(`bookings columns BEFORE: ${before.length}`);

  if (dryRun) {
    console.log('\n--- DRY RUN, nothing executed ---\n');
    console.log(sqlText);
    await pool.end();
    process.exit(0);
  }

  const statements = sqlText
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  // One transaction: either every statement lands or none does.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [i, stmt] of statements.entries()) {
      const label = stmt.slice(0, 62).replace(/\s+/g, ' ');
      const res = await client.query(stmt);
      console.log(
        `  ✅ [${i + 1}/${statements.length}] ${label}…` +
          (res.rowCount != null ? `  (rowCount=${res.rowCount})` : '')
      );
    }
    await client.query('COMMIT');
    console.log('\nCOMMITTED');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ ROLLED BACK — no changes applied:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }

  const after = (await pool.query(colsQuery)).rows.map((r) => r.column_name);
  console.log(`bookings columns AFTER: ${after.length}`);
  const added = after.filter((c) => !before.includes(c));
  console.log('added:', added.length ? added.join(', ') : '(none — already applied)');
} finally {
  await pool.end();
}
