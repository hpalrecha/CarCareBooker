/**
 * Second 2026-09-23 catalogue change:
 *
 *   1. Windshield Glass Coating (windshield-glass-coating-new): base price
 *      ₹1,399 -> ₹1,699. Description's embedded two-tier prices ₹1,399 ->
 *      ₹1,699 and ₹1,999 -> ₹2,499 (windshield-only / full-car upgrade).
 *      Duration column 180 -> 1440 (24 hrs) to match the existing 24-hour
 *      cure note already shown on the page and in service-time.ts.
 *   2. Windshield Glass Polishing (windshield-glass-polishing): main price
 *      ₹1,999 -> ₹2,499. Same embedded-price substitution as above.
 *      Duration column 120 -> 240 (3-4 hrs range, text override added to
 *      client/src/lib/service-time.ts).
 *
 * Confirmed with the shop: apply the price substitution ₹1,399 -> ₹1,699 and
 * ₹1,999 -> ₹2,499 wherever those two figures occur for these two services,
 * nothing else.
 *
 * Dry-run by default. Pass --apply to commit.
 *
 *   node scripts/2026-09-23-glass-pricing-updates.mjs            # preview
 *   node --env-file=.env scripts/2026-09-23-glass-pricing-updates.mjs --apply
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

function substitute(text) {
  return text.replaceAll('₹1,399', '₹1,699').replaceAll('₹1,999', '₹2,499');
}

async function getRow(slug) {
  const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;
  let skipped = 0;

  // 1. Windshield Glass Coating
  {
    const slug = 'windshield-glass-coating-new';
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else {
      const nextDesc = substitute(row.description);
      const nextPrice = row.price === '1399.00' ? '1699.00' : row.price;
      const nextDuration = row.duration === 180 ? 1440 : row.duration;
      if (nextDesc === row.description && nextPrice === row.price && nextDuration === row.duration) {
        console.log(`OK    ${row.title}: already up to date`);
      } else {
        console.log(`FIX   ${row.title}`);
        if (nextPrice !== row.price) console.log(`        price ${row.price} -> ${nextPrice}`);
        if (nextDuration !== row.duration) console.log(`        duration ${row.duration} -> ${nextDuration}`);
        if (nextDesc !== row.description) {
          console.log(`        description from: ${row.description}`);
          console.log(`        description to:   ${nextDesc}`);
        }
        changes++;
        if (APPLY) {
          await pool.query('UPDATE services SET description = $1, price = $2, duration = $3 WHERE id = $4', [
            nextDesc, nextPrice, nextDuration, row.id,
          ]);
        }
      }
    }
  }

  // 2. Windshield Glass Polishing
  {
    const slug = 'windshield-glass-polishing';
    const row = await getRow(slug);
    if (!row) { console.log(`SKIP  ${slug}: no such row`); skipped++; }
    else {
      const nextDesc = substitute(row.description);
      const nextPrice = row.price === '1999.00' ? '2499.00' : row.price;
      const nextDuration = row.duration === 120 ? 240 : row.duration;
      if (nextDesc === row.description && nextPrice === row.price && nextDuration === row.duration) {
        console.log(`OK    ${row.title}: already up to date`);
      } else {
        console.log(`FIX   ${row.title}`);
        if (nextPrice !== row.price) console.log(`        price ${row.price} -> ${nextPrice}`);
        if (nextDuration !== row.duration) console.log(`        duration ${row.duration} -> ${nextDuration}`);
        if (nextDesc !== row.description) {
          console.log(`        description from: ${row.description}`);
          console.log(`        description to:   ${nextDesc}`);
        }
        changes++;
        if (APPLY) {
          await pool.query('UPDATE services SET description = $1, price = $2, duration = $3 WHERE id = $4', [
            nextDesc, nextPrice, nextDuration, row.id,
          ]);
        }
      }
    }
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
