/**
 * Deactivate the `glass-polishing` catalogue row — a near-duplicate of
 * `windshield-glass-polishing` (same photo, same core description, no FAQ, created as a
 * thinner re-entry of the older, richer page).
 *
 * Deactivating rather than deleting: keeps the row, its price and its history for the
 * admin panel and any past booking that references it, while removing it from
 * getAllServices() (active rows only) — which is what feeds the sitemap, /api/services,
 * the /services catalogue grid, and the /service/:slug indexable-metadata handler.
 *
 * The URL itself is additionally hard-redirected: server/routes.ts registers a real HTTP
 * 301 for /service/glass-polishing -> /service/windshield-glass-polishing, ahead of the
 * metadata handler and the SPA catch-all, so this is not the only thing keeping the old
 * URL out of the index — it's belt-and-braces with the redirect.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/deactivate-glass-polishing.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/deactivate-glass-polishing.mjs --apply
 *
 * Idempotent. The prior value is backed up before the write.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const connectionString =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const TARGET = {
  id: '6c1cf9ee-5d0f-4311-a140-d9451110ad78',
  slug: 'glass-polishing',
  title: 'Glass Polishing',
};

const pool = new Pool({ connectionString });

try {
  const { rows } = await pool.query(
    'select id, trim(title) as title, slug, is_active from services where id = $1 and slug = $2',
    [TARGET.id, TARGET.slug],
  );
  if (rows.length !== 1) {
    console.error(`ABORT: ${TARGET.slug}: id+slug matched ${rows.length} rows, expected exactly 1`);
    process.exit(1);
  }
  const row = rows[0];
  if (row.title !== TARGET.title) {
    console.error(`ABORT: ${TARGET.slug}: title is "${row.title}", expected "${TARGET.title}"`);
    process.exit(1);
  }
  console.log('row resolved by id+slug, title verified.\n');
  console.log(`${row.title}`);
  console.log(`  ${row.id}  (${row.slug})`);
  console.log(`  old is_active: ${row.is_active}`);
  console.log(`  new is_active: false`);

  if (row.is_active === false) {
    console.log('\nalready inactive — no write needed');
  } else if (APPLY) {
    await pool.query('update services set is_active = false, updated_at = now() where id = $1', [row.id]);

    const backupPath = path.join(repoRoot, '..', '..', 'glass-polishing-deactivation-backup.json');
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ id: row.id, slug: row.slug, title: row.title, wasActive: row.is_active }, null, 2),
    );
    console.log(`\nprior value backed up to ${backupPath}`);

    const check = await pool.query('select is_active from services where id = $1', [row.id]);
    console.log(
      check.rows[0].is_active === false
        ? '\n✅ APPLIED — verified by re-read'
        : `\n⚠ MISMATCH after write: got ${JSON.stringify(check.rows[0].is_active)}`,
    );
  } else {
    console.log('\n(dry run — nothing written)');
  }
} finally {
  await pool.end();
}
