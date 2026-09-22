/**
 * Fix the three PPF Premium tier pages' images.
 *
 * SEO audit (2026-09-22) found: ppf-premium-sedan and ppf-premium-suv were pointed at
 * STOCK PHOTOS OF CERAMIC COATING (filenamed car_ceramic_coating_*.jpg) — a different
 * service entirely, on a PPF product page. ppf-premium-hatchback used a generic
 * ppf-application.jpg with no vehicle shown, not matched to "hatchback" at all.
 *
 * There is no separate Premium-tier photoshoot — the fitting process P91 photographs is
 * the same one used for the Basic tier, just a different film grade. So the fix is to
 * reuse the Basic tier's own real, vehicle-size-matched studio photos
 * (p91-full-ppf-{hatchback,sedan,suv}.webp, already used by ppf-hatchback/sedan/suv) —
 * real P91 work, correctly matched by vehicle size, no fabricated or unrelated imagery.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/fix-ppf-premium-images.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/fix-ppf-premium-images.mjs --apply
 *
 * Idempotent. The prior value is backed up before each write.
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

const TARGETS = [
  {
    id: 'c844422a-3312-4ee1-8e69-58a6b22ec283',
    slug: 'ppf-premium-hatchback',
    title: 'P91 PPF Premium - Hatchback',
    file: 'p91-full-ppf-hatchback.webp',
  },
  {
    id: 'febc9277-a176-4a73-ab3b-170c6cc8e25e',
    slug: 'ppf-premium-sedan',
    title: 'P91 PPF Premium - Sedan',
    file: 'p91-full-ppf-sedan.webp',
  },
  {
    id: '33fdbbbb-bc25-4ad7-92c1-d7722a0cf5ae',
    slug: 'ppf-premium-suv',
    title: 'P91 PPF Premium - SUV',
    file: 'p91-full-ppf-suv.webp',
  },
];

const pool = new Pool({ connectionString });

try {
  for (const t of TARGETS) {
    const onDisk = path.join(repoRoot, 'attached_assets', 'services', t.file);
    if (!fs.existsSync(onDisk)) {
      console.error(`ABORT: asset missing from the repo: ${onDisk}`);
      process.exit(1);
    }
    const url = `/attached_assets/services/${t.file}`;

    const { rows } = await pool.query(
      'select id, trim(title) as title, slug, images from services where id = $1 and slug = $2',
      [t.id, t.slug],
    );
    if (rows.length !== 1) {
      console.error(`ABORT: ${t.slug}: id+slug matched ${rows.length} rows, expected exactly 1`);
      process.exit(1);
    }
    const row = rows[0];
    if (row.title !== t.title) {
      console.error(`ABORT: ${t.slug}: title is "${row.title}", expected "${t.title}"`);
      process.exit(1);
    }

    const newImages = [url];
    console.log(`${row.title}  (${row.slug})`);
    console.log(`  old images: ${JSON.stringify(row.images)}`);
    console.log(`  new images: ${JSON.stringify(newImages)}`);

    if (JSON.stringify(row.images) === JSON.stringify(newImages)) {
      console.log('  already correct — no write needed\n');
      continue;
    }

    if (APPLY) {
      await pool.query('update services set images = $1, updated_at = now() where id = $2', [
        JSON.stringify(newImages),
        row.id,
      ]);

      const backupDir = path.join(repoRoot, '..', '..');
      const backupPath = path.join(backupDir, `${t.slug}-image-backup.json`);
      fs.writeFileSync(
        backupPath,
        JSON.stringify({ id: row.id, slug: row.slug, title: row.title, oldImages: row.images }, null, 2),
      );
      console.log(`  prior value backed up to ${backupPath}`);

      const check = await pool.query('select images from services where id = $1', [row.id]);
      console.log(
        JSON.stringify(check.rows[0].images) === JSON.stringify(newImages)
          ? '  ✅ APPLIED — verified by re-read\n'
          : `  ⚠ MISMATCH after write: got ${JSON.stringify(check.rows[0].images)}\n`,
      );
    } else {
      console.log('  (dry run — nothing written)\n');
    }
  }
} finally {
  await pool.end();
}
