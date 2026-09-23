/**
 * Applies the 2026-09-23 pricing/catalogue change list from the shop:
 *
 *   1. 1 Year Bike Ceramic Coating: turnaround 36-48 hrs (was showing 1 day).
 *   2. 1 Year Car Wash Package: drop "Chamois drying", add 6 car washes /
 *      2 interior rejuvenation / 1 exterior restoration to what's included.
 *   3. Deactivate: Annual Maintenance Package, Car Polishing.
 *   4. Exterior Detailing with Hard Water Spot Removal: turnaround 6-12 hrs.
 *   5. Interior Detailing Service renamed to Interior Rejuvenation Service,
 *      turnaround 18-24 hrs.
 *   6. P91 PPF Premium (hatchback/sedan/suv): add "7-year warranty" to
 *      what's included. (Basic tier already lists "5-year warranty" for all
 *      three body types — no change needed there.)
 *
 * Dry-run by default: prints current -> proposed for every row, writes nothing.
 * Pass --apply to commit. Every row is matched on slug and skipped (reported,
 * not guessed at) if missing or already in an unexpected state.
 *
 *   node scripts/2026-09-23-pricing-catalog-updates.mjs            # preview
 *   node --env-file=.env scripts/2026-09-23-pricing-catalog-updates.mjs --apply
 *
 * NOTE: the `duration` column is minutes and only carries a single number, so
 * the "36-48 hrs" / "6-12 hrs" / "18-24 hrs" ranges from the shop can't live
 * in that column alone. This script sets `duration` to the range's upper
 * bound (for sorting/consistency) and the actual range text is rendered by a
 * slug lookup added to client/src/lib/service-time.ts in this same change.
 *
 * The Interior Detailing Service rename also requires updating
 * client/src/lib/canonical-services.ts (TRANSFORMATION_CTAS.interiorDeepClean
 * .expectedTitle), or the homepage "Interior Deep Clean" CTA silently stops
 * resolving. Do not run this against prod without that file changed too.
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

async function getRow(slug) {
  const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;
  let skipped = 0;

  // 1. Bike ceramic coating duration
  {
    const slug = '1-year-bike-ceramic-coating';
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else if (row.duration === 2880) console.log(`OK    ${row.title}: duration already 2880`);
    else {
      console.log(`FIX   ${row.title}: duration ${row.duration} -> 2880 (36-48 hrs range, text override in service-time.ts)`);
      changes++;
      if (APPLY) await pool.query('UPDATE services SET duration = $1 WHERE id = $2', [2880, row.id]);
    }
  }

  // 2. Car wash package what_included
  {
    const slug = 'annual-car-wash-package';
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else {
      const current = row.what_included || [];
      if (!current.includes('Chamois drying')) {
        console.log(`SKIP  ${slug}: "Chamois drying" not found in what_included, not touching it`);
        skipped++;
      } else {
        const next = current
          .filter((i) => i !== 'Chamois drying')
          .concat(['6 Car Washes across the year', '2 Interior Rejuvenation sessions', '1 Exterior Restoration session']);
        console.log(`FIX   ${row.title}: what_included`);
        console.log(`        from ${JSON.stringify(current)}`);
        console.log(`        to   ${JSON.stringify(next)}`);
        changes++;
        if (APPLY) await pool.query('UPDATE services SET what_included = $1 WHERE id = $2', [JSON.stringify(next), row.id]);
      }
    }
  }

  // 3. Deactivate
  for (const slug of ['annual-maintenance-package', 'car-polishing']) {
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; continue; }
    if (row.is_active === false) { console.log(`OK    ${row.title}: already inactive`); continue; }
    console.log(`FIX   ${row.title}: is_active true -> false`);
    changes++;
    if (APPLY) await pool.query('UPDATE services SET is_active = false WHERE id = $1', [row.id]);
  }

  // 4. Exterior detailing duration
  {
    const slug = 'exterior-detailing-hard-water-new';
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else if (row.duration === 720) console.log(`OK    ${row.title}: duration already 720`);
    else {
      console.log(`FIX   ${row.title}: duration ${row.duration} -> 720 (6-12 hrs range, text override in service-time.ts)`);
      changes++;
      if (APPLY) await pool.query('UPDATE services SET duration = $1 WHERE id = $2', [720, row.id]);
    }
  }

  // 5. Interior Detailing Service rename + duration
  {
    const slug = 'interior-detailing-service';
    const row = await getRow(slug);
    const newTitle = 'Interior Rejuvenation Service';
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else {
      if (row.title.trim() === newTitle && row.duration === 1440) {
        console.log(`OK    ${slug}: already "${newTitle}", duration 1440`);
      } else {
        if (row.title.trim() !== 'Interior Detailing Service' && row.title.trim() !== newTitle) {
          console.log(`SKIP  ${slug}: expected "Interior Detailing Service" but found "${row.title}" — not touching it`);
          skipped++;
        } else {
          console.log(`FIX   ${slug}: title "${row.title}" -> "${newTitle}", duration ${row.duration} -> 1440 (18-24 hrs range, text override in service-time.ts)`);
          changes++;
          if (APPLY) await pool.query('UPDATE services SET title = $1, duration = $2 WHERE id = $3', [newTitle, 1440, row.id]);
        }
      }
    }
  }

  // 6. Premium PPF warranty line
  for (const slug of ['ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv']) {
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; continue; }
    const current = row.what_included || [];
    if (current.includes('7-year warranty')) { console.log(`OK    ${row.title}: already has 7-year warranty`); continue; }
    const next = [...current, '7-year warranty'];
    console.log(`FIX   ${row.title}: what_included += "7-year warranty"`);
    changes++;
    if (APPLY) await pool.query('UPDATE services SET what_included = $1 WHERE id = $2', [JSON.stringify(next), row.id]);
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
