/**
 * Restructures the two yearly packages (2026-09-24):
 *
 *   1. "1 Year Car Wash Package" -> "Annual Car Wash": price 999, 8 car washes.
 *      (slug annual-car-wash-package unchanged; the row is already listed in the admin
 *      services table, which reads every row via /api/admin/services.)
 *   2. Annual Maintenance Package: contents become 6 car washes + 2 interior
 *      rejuvenation + 1 exterior restoration, and the row is reactivated (it was
 *      deactivated earlier the same week).
 *
 * Only the first 4 what_included items render on the service page, so the package
 * composition sits first.
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

const UPDATES = [
  {
    slug: 'annual-car-wash-package',
    fields: {
      title: 'Annual Car Wash',
      price: '999.00',
      why_choose:
        'One prepaid package covering 8 professional car washes across the year, so your car stays consistently clean without paying per visit.',
      what_included: [
        '8 Car Washes across the year',
        'Pre-wash foam application',
        'Wheel and tire cleaning',
        'Window cleaning inside and out',
      ],
      hero_title: 'Annual Car Wash',
      hero_subtitle: '8 washes, one price, the whole year',
      discount_text: '8 car washes for 1 year',
    },
  },
  {
    slug: 'annual-maintenance-package',
    fields: {
      is_active: true,
      description:
        'Complete yearly car care package with 6 car washes, 2 interior rejuvenation sessions, and 1 exterior restoration. Best value for year-round car maintenance!',
      what_included: [
        '6 Car Washes across the year',
        '2 Interior Rejuvenation sessions',
        '1 Exterior Restoration session',
        'Serviced every 4 months, valid for 1 year',
      ],
      discount_text:
        '6 Car Washes + 2 Interior Rejuvenation + 1 Exterior Restoration — Serviced Every 4 Months, For 1 Year',
      meta_description:
        'Complete annual car maintenance package for ₹18,000. Includes 6 car washes, 2 interior rejuvenation sessions, and 1 exterior restoration with pickup service.',
    },
  },
];

const JSON_COLS = new Set(['what_included']);

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;

  for (const { slug, fields } of UPDATES) {
    const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [slug]);
    const row = rows[0];
    if (!row) { console.log(`SKIP  ${slug}: no such row`); continue; }

    const diffs = Object.entries(fields).filter(
      ([k, v]) => JSON.stringify(row[k]) !== JSON.stringify(v),
    );
    if (diffs.length === 0) { console.log(`OK    ${slug}: already up to date`); continue; }

    console.log(`FIX   ${row.title} (${slug})`);
    for (const [k, v] of diffs) {
      console.log(`        ${k}: ${JSON.stringify(row[k])}  ->  ${JSON.stringify(v)}`);
    }
    changes++;

    if (APPLY) {
      const cols = diffs.map(([k], i) => `${k} = $${i + 1}`).join(', ');
      const vals = diffs.map(([k, v]) => (JSON_COLS.has(k) ? JSON.stringify(v) : v));
      await pool.query(`UPDATE services SET ${cols} WHERE id = $${diffs.length + 1}`, [...vals, row.id]);
    }
  }

  console.log(`\n${changes} row(s) ${APPLY ? 'updated' : 'pending'}.`);
  if (!APPLY && changes > 0) console.log('Re-run with --apply to write these.');
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
