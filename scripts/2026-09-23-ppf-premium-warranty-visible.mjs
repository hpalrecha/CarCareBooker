/**
 * P91 PPF Premium (hatchback/sedan/suv): "7-year warranty" was appended to the END of
 * what_included in 2026-09-23-pricing-catalog-updates.mjs. service-landing.tsx's "What's
 * Included" overview list caps at the first 4 deduped items (overviewFeatureItems,
 * client/src/pages/service-landing.tsx:535), and each row has 6 items — so the warranty
 * line never rendered. Same defect as the car wash package fix.
 *
 * Moves "7-year warranty" to the FRONT of what_included so it's inside the visible cap.
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
const SLUGS = ['ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv'];

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;

  for (const slug of SLUGS) {
    const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [slug]);
    const row = rows[0];
    if (!row) { console.log(`SKIP  ${slug}: no such row`); continue; }
    const current = row.what_included || [];
    if (current[0] === '7-year warranty') {
      console.log(`OK    ${row.title}: warranty already first`);
      continue;
    }
    const next = ['7-year warranty', ...current.filter((i) => i !== '7-year warranty')];
    console.log(`FIX   ${row.title}`);
    console.log(`        from ${JSON.stringify(current)}`);
    console.log(`        to   ${JSON.stringify(next)}`);
    changes++;
    if (APPLY) await pool.query('UPDATE services SET what_included = $1 WHERE id = $2', [JSON.stringify(next), row.id]);
  }

  console.log(`\n${changes} change(s) ${APPLY ? 'applied' : 'pending'}.`);
  if (!APPLY && changes > 0) console.log('Re-run with --apply to write these.');
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
