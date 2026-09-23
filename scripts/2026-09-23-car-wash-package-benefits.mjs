/**
 * 1 Year Car Wash Package (annual-car-wash-package): make the package's benefits and
 * coverage actually visible on the page.
 *
 * The previous catalogue update (2026-09-23-pricing-catalog-updates.mjs) appended "6 Car
 * Washes across the year", "2 Interior Rejuvenation sessions" and "1 Exterior Restoration
 * session" to the END of what_included. But service-landing.tsx's "What's Included"
 * overview list caps at the first 4 deduped items (see overviewFeatureItems,
 * client/src/pages/service-landing.tsx:535) — so those 3 items never actually render; the
 * page still shows only the 4 generic wash-process bullets that were already there.
 *
 * This replaces what_included with just the 3 package-coverage items (fits the 4-item cap,
 * all visible), and rewrites the first sentence of `description` and `why_choose` — the
 * only parts of those fields the page ever displays (firstSentence(...)) — to state the
 * same coverage, since "Benefits" only shows why_choose's first sentence.
 *
 * Dry-run by default. Pass --apply to commit.
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const SLUG = 'annual-car-wash-package';

const NEW_WHAT_INCLUDED = [
  '6 Car Washes across the year',
  '2 Interior Rejuvenation sessions',
  '1 Exterior Restoration session',
];

const NEW_DESCRIPTION =
  'A prepaid annual package covering 6 car washes, 2 interior rejuvenation sessions and 1 exterior restoration, so your car gets complete care across the year without paying per visit.';

const NEW_WHY_CHOOSE =
  'One prepaid package covering 6 car washes, 2 interior rejuvenation sessions and 1 exterior restoration across the year, so your car gets complete care without booking or paying for each service separately.';

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');

  const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [SLUG]);
  const row = rows[0];
  if (!row) {
    console.log(`SKIP  ${SLUG}: no such row`);
    await pool.end();
    return;
  }

  console.log(`FIX   ${row.title}`);
  console.log(`        what_included from ${JSON.stringify(row.what_included)}`);
  console.log(`        what_included to   ${JSON.stringify(NEW_WHAT_INCLUDED)}`);
  console.log(`        description from: ${row.description}`);
  console.log(`        description to:   ${NEW_DESCRIPTION}`);
  console.log(`        why_choose from: ${row.why_choose}`);
  console.log(`        why_choose to:   ${NEW_WHY_CHOOSE}`);

  if (APPLY) {
    await pool.query(
      'UPDATE services SET what_included = $1, description = $2, why_choose = $3 WHERE id = $4',
      [JSON.stringify(NEW_WHAT_INCLUDED), NEW_DESCRIPTION, NEW_WHY_CHOOSE, row.id],
    );
    console.log('\n1 change applied.');
  } else {
    console.log('\n1 change pending. Re-run with --apply to write it.');
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
