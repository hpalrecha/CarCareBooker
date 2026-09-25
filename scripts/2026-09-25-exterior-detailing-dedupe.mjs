/**
 * 2026-09-25: one Exterior Detailing with Hard Water Spot Removal, at ₹3,500.
 *
 *   - premium-wash-detail (₹1,999, duplicate title, placeholder YouTube heroVideo) is
 *     deactivated, not deleted, so any booking that references it keeps its row.
 *     /service/premium-wash-detail then falls through to the real 404.
 *   - exterior-detailing-hard-water-new goes from ₹5,999 to ₹3,500.
 *
 * Dry-run by default: prints current -> proposed and writes nothing.
 *
 *   node --env-file=.env scripts/2026-09-25-exterior-detailing-dedupe.mjs            # preview
 *   node --env-file=.env scripts/2026-09-25-exterior-detailing-dedupe.mjs --apply
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const KEEP = 'exterior-detailing-hard-water-new';
const DROP = 'premium-wash-detail';
const NEW_PRICE = '3500.00';

async function main() {
  console.log(`database host: ${new URL(DATABASE_URL).host}`);
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');

  const { rows: found } = await pool.query(
    'SELECT slug, title, price, is_active FROM services WHERE slug = ANY($1)',
    [[KEEP, DROP]],
  );
  const bySlug = Object.fromEntries(found.map((r) => [r.slug, r]));
  for (const slug of [KEEP, DROP]) {
    if (!bySlug[slug]) {
      console.error(`${slug}: row not found — nothing changed.`);
      process.exit(1);
    }
    console.log(`${slug}: price ${bySlug[slug].price}, active ${bySlug[slug].is_active}`);
  }

  console.log(`\n${DROP}: is_active -> false`);
  console.log(`${KEEP}: price ${bySlug[KEEP].price} -> ${NEW_PRICE}`);
  if (!APPLY) return console.log('\nDry run only. Re-run with --apply to write.');

  await pool.query('BEGIN');
  try {
    await pool.query('UPDATE services SET is_active = false WHERE slug = $1', [DROP]);
    await pool.query('UPDATE services SET price = $1 WHERE slug = $2', [NEW_PRICE, KEEP]);
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => pool.end());
