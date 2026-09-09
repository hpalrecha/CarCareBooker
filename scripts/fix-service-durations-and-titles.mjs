/**
 * Fixes the service-catalogue data problems raised in review:
 *
 *   1. PPF packages advertise completion times of 2, 3 and 4 MINUTES. The card renderer
 *      (client/src/components/service-card.tsx) is correct — it prints minutes whenever
 *      `duration` is under 60 — so the wrong values are in the `services.duration`
 *      column, not in the code. PPF installation is a 24-48 hour job; a minutes figure
 *      destroys credibility on the highest-value service on the site.
 *
 *   2. "Stek windsheild suncontrol films" misspells "windshield", and casing is
 *      inconsistent across the Partial PPF cards ("(sedan)" vs "(Hatchback)").
 *
 * SAFETY
 * ------
 * Dry-run by default: it prints current -> proposed for every row and writes nothing.
 * Pass --apply to commit. Every row is matched on BOTH id and slug, and the update is
 * skipped if the row is missing, so a renamed or deleted service is reported rather than
 * silently created.
 *
 *   node scripts/fix-service-durations-and-titles.mjs            # preview
 *   node scripts/fix-service-durations-and-titles.mjs --apply    # write
 *
 * BEFORE RUNNING --apply, CONFIRM THE DURATIONS BELOW WITH THE SHOP.
 * The values here are the review's own "24 to 48 hours" guidance mapped to vehicle size.
 * They are a considered default, not a fact from the business — if the studio quotes
 * different turnaround times, edit DURATION_FIXES first.
 *
 * NOTE ON TITLES: client/src/lib/canonical-services.ts asserts the exact title of five
 * services and returns null (dropping the card/link) on a mismatch. None of the titles
 * changed here are in that set — verified against TRANSFORMATION_CTAS and FOOTER_SERVICES
 * — but re-check that file before adding any new rename to this script.
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    'Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.',
  );
  process.exit(1);
}

/** minutes. 1440 = 24h, 2160 = 36h, 2880 = 48h */
const DURATION_FIXES = [
  { slug: 'ppf-hatchback', expectTitle: 'P91 PPF - Hatchback', duration: 1440 },
  { slug: 'ppf-sedan', expectTitle: 'P91 PPF - Sedan', duration: 2160 },
  { slug: 'ppf-suv', expectTitle: 'P91 PPF - SUV', duration: 2880 },
];

const TITLE_FIXES = [
  {
    slug: 'stek-windsheild-suncontrol-films',
    from: 'Stek windsheild suncontrol films',
    to: 'Stek Windshield Sun Control Films',
  },
  {
    slug: 'stek-suncontrol-films',
    from: 'Stek suncontrol films',
    to: 'Stek Sun Control Films',
  },
  {
    slug: 'partial-ppf-sedan',
    from: 'Partial PPF (sedan)',
    to: 'Partial PPF (Sedan)',
  },
];

const fmtDuration = (m) => {
  if (m == null) return 'null';
  if (m < 60) return `${m} min  <-- renders as "${m} minutes"`;
  const h = m / 60;
  return `${m} min (${h % 1 === 0 ? h : h.toFixed(1)} hours)`;
};

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');

  let changes = 0;
  let missing = 0;

  console.log('--- Durations ---');
  for (const fix of DURATION_FIXES) {
    const { rows } = await pool.query(
      'SELECT id, title, slug, duration FROM services WHERE slug = $1',
      [fix.slug],
    );
    if (rows.length === 0) {
      console.log(`  SKIP  ${fix.slug}: no such row`);
      missing++;
      continue;
    }
    const row = rows[0];
    if (row.duration === fix.duration) {
      console.log(`  OK    ${row.title}: already ${fmtDuration(row.duration)}`);
      continue;
    }
    console.log(`  FIX   ${row.title}`);
    console.log(`          from ${fmtDuration(row.duration)}`);
    console.log(`          to   ${fmtDuration(fix.duration)}`);
    changes++;
    if (APPLY) {
      await pool.query('UPDATE services SET duration = $1 WHERE id = $2', [
        fix.duration,
        row.id,
      ]);
    }
  }

  console.log('\n--- Titles ---');
  for (const fix of TITLE_FIXES) {
    const { rows } = await pool.query(
      'SELECT id, title, slug FROM services WHERE slug = $1',
      [fix.slug],
    );
    if (rows.length === 0) {
      console.log(`  SKIP  ${fix.slug}: no such row`);
      missing++;
      continue;
    }
    const row = rows[0];
    if (row.title === fix.to) {
      console.log(`  OK    ${fix.slug}: already "${fix.to}"`);
      continue;
    }
    if (row.title !== fix.from) {
      console.log(
        `  SKIP  ${fix.slug}: expected "${fix.from}" but found "${row.title}" — not touching it`,
      );
      missing++;
      continue;
    }
    console.log(`  FIX   "${row.title}"  ->  "${fix.to}"`);
    changes++;
    if (APPLY) {
      await pool.query('UPDATE services SET title = $1 WHERE id = $2', [
        fix.to,
        row.id,
      ]);
    }
  }

  console.log(
    `\n${changes} change(s) ${APPLY ? 'applied' : 'pending'}, ${missing} row(s) skipped.`,
  );
  if (!APPLY && changes > 0) {
    console.log('Re-run with --apply to write these.');
  }

  // Surface anything else in the catalogue that would render as minutes, so a bad row
  // added later is caught by the same script rather than by a customer.
  const { rows: suspicious } = await pool.query(
    'SELECT title, slug, duration FROM services WHERE is_active = true AND duration < 30 ORDER BY duration',
  );
  if (suspicious.length > 0) {
    console.log('\n--- WARNING: other active services under 30 minutes ---');
    for (const r of suspicious) {
      console.log(`  ${r.duration} min  ${r.title}  (${r.slug})`);
    }
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
