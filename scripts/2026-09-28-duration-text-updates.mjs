/**
 * Applies the 2026-09-28 duration/turnaround-text change list from the studio, using the
 * new `duration_text` column (see migrations/manual/2026-09-28-service-duration-text.sql)
 * instead of a hardcoded slug map in service-time.ts — that was last time's approach
 * (see scripts/2026-09-23-pricing-catalog-updates.mjs) and required a code deploy for
 * every turnaround change. This only touches `duration_text`; the `duration` (minutes)
 * column, unused by booking/availability, is left exactly as it is.
 *
 *   1. 1 Year Ceramic Coating (car): "1 day" -> "36-48 hrs".
 *   2. Exterior Detailing with Hard Water Spot Removal: "6-12 hrs" -> "12-18 hrs".
 *   3. Interior Rejuvenation Service: "18-24 hrs" -> "18-36 hrs".
 *   4. Windshield Glass Coating: "24 hrs" -> "36-48 hrs".
 *   5. All 9 PPF (car) rows — Basic/Premium/Partial x hatchback/sedan/suv -> "2-3 days".
 *      Previously suppressed entirely on the PPF pages (hideDuration) pending real data;
 *      this is that real data.
 *
 * Dry-run by default: prints current -> proposed for every row, writes nothing.
 * Pass --apply to commit. Every row is matched on slug and skipped (reported, not guessed
 * at) if missing.
 *
 *   node --env-file=.env scripts/2026-09-28-duration-text-updates.mjs            # preview
 *   node --env-file=.env scripts/2026-09-28-duration-text-updates.mjs --apply
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

const UPDATES = [
  { slug: '1-year-ceramic-coating', text: '36-48 hrs' },
  { slug: 'exterior-detailing-hard-water-new', text: '12-18 hrs' },
  { slug: 'interior-detailing-service', text: '18-36 hrs' },
  { slug: 'windshield-glass-coating-new', text: '36-48 hrs' },
  { slug: 'ppf-hatchback', text: '2-3 days' },
  { slug: 'ppf-sedan', text: '2-3 days' },
  { slug: 'ppf-suv', text: '2-3 days' },
  { slug: 'ppf-premium-hatchback', text: '2-3 days' },
  { slug: 'ppf-premium-sedan', text: '2-3 days' },
  { slug: 'ppf-premium-suv', text: '2-3 days' },
  { slug: 'partial-ppf-hatchback', text: '2-3 days' },
  { slug: 'partial-ppf-sedan', text: '2-3 days' },
  { slug: 'partial-ppf-suv', text: '2-3 days' },
];

async function getRow(slug) {
  const { rows } = await pool.query('SELECT id, title, slug, duration, duration_text FROM services WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;
  let skipped = 0;

  for (const { slug, text } of UPDATES) {
    const row = await getRow(slug);
    if (!row) {
      console.log(`SKIP  ${slug}: no such row`);
      skipped++;
      continue;
    }
    if (row.duration_text === text) {
      console.log(`OK    ${row.title} (${slug}): duration_text already "${text}"`);
      continue;
    }
    console.log(`FIX   ${row.title} (${slug}): duration_text ${JSON.stringify(row.duration_text)} -> "${text}"`);
    changes++;
    if (APPLY) await pool.query('UPDATE services SET duration_text = $1 WHERE id = $2', [text, row.id]);
  }

  console.log(`\n${changes} change(s) ${APPLY ? 'applied' : 'pending'}, ${skipped} row(s) skipped.`);
  if (!APPLY && changes > 0) console.log('Re-run with --apply to write these.');

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
