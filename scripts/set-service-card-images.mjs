/**
 * Point the 14 remaining service cards at their own dedicated images.
 *
 * Records are matched on BOTH the stable id and the slug, and the row's title is
 * asserted against the expected name before anything is written. Title matching alone
 * is unsafe here: the database holds inactive rows that reuse active titles
 * ("Exterior Detailing with Hard Water Spot Removal" on slug `premium-wash-detail`,
 * "Windshield Glass Coating" on `glass-coating`, "Partial PPF (Hatchback)" on
 * `annual-maintenance-package-copy`). Any mismatch aborts the whole run.
 *
 * Only `services.images[0]` is written. Prices, discounts, descriptions, durations,
 * slugs, sort order, gallery, before/after, process, booking logic and every service
 * outside this list are untouched. Extra entries already in `images` are preserved.
 *
 * Assets live in the git-tracked `attached_assets/` tree, served by
 * `express.static('/attached_assets')` in server/index.ts — not in `uploads/`, whose
 * container-local disk is wiped on every redeploy, and not in `/objects/`, which needs
 * object storage that is not configured.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-service-card-images.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-service-card-images.mjs --apply
 *
 * Idempotent. Prior values are backed up before the first write.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = '/attached_assets/services';

const connectionString =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const PLAN = [
  { id: '2d0a6a5c-e642-4624-97e0-a7e3026d4684', slug: 'car-polishing',                    title: 'Car Polishing',                                   file: 'car-polishing.webp' },
  { id: 'd7fae6bd-fbf4-445f-8faa-e67d8461fbdc', slug: 'headlight-restoration-both',        title: 'Headlight Restoration - Both Lights',              file: 'headlight-restoration-both-lights.webp' },
  { id: 'd5e11a48-afe4-4757-9796-a98322ac5bf2', slug: 'exterior-detailing-hard-water-new', title: 'Exterior Detailing with Hard Water Spot Removal',  file: 'exterior-detailing-hard-water-spot-removal.webp' },
  { id: '43f050c6-488b-4657-9458-99d23364c72a', slug: 'interior-detailing-service',        title: 'Interior Detailing Service',                       file: 'interior-detailing-service.webp' },
  { id: 'ppf-hatchback',                        slug: 'ppf-hatchback',                     title: 'P91 PPF - Hatchback',                              file: 'p91-full-ppf-hatchback.webp' },
  { id: 'ppf-suv',                              slug: 'ppf-suv',                           title: 'P91 PPF - SUV',                                    file: 'p91-full-ppf-suv.webp' },
  { id: 'ppf-sedan',                            slug: 'ppf-sedan',                         title: 'P91 PPF - Sedan',                                  file: 'p91-full-ppf-sedan.webp' },
  { id: '74ab0ab1-5b10-4f40-b62e-c2523b105808', slug: 'partial-ppf-hatchback',             title: 'Partial PPF (Hatchback)',                          file: 'partial-ppf-hatchback.webp' },
  { id: '9578876d-7729-40b9-8292-3d93a498983a', slug: 'partial-ppf-suv',                   title: 'Partial PPF (SUV)',                                file: 'partial-ppf-suv.webp' },
  { id: '8caa62f9-4ba4-4179-a1af-cdd1e7f0d1a1', slug: 'partial-ppf-sedan',                 title: 'Partial PPF (sedan)',                              file: 'partial-ppf-sedan.webp' },
  { id: '55771017-1baa-4814-84e3-b23399ffc437', slug: 'stek-suncontrol-films',             title: 'Stek suncontrol films',                            file: 'stek-full-car-sun-control-film.webp' },
  { id: '11cd8669-94fe-4035-b0af-7242ab5564d7', slug: 'stek-windsheild-suncontrol-films',  title: 'Stek windsheild suncontrol films',                 file: 'stek-windshield-sun-control-film.webp' },
  { id: 'c2517260-3e7e-4de1-9886-542fb5d7df8f', slug: 'windshield-glass-coating-new',      title: 'Windshield Glass Coating',                         file: 'windshield-glass-coating.webp' },
  { id: 'f4609691-75b1-4d3c-a4e0-641fdf4a4400', slug: 'windshield-glass-polishing',        title: 'Windshield Glass Polishing',                       file: 'windshield-glass-polishing.webp' },
];

// Refuse to point the database at anything that is not a real WebP present in the repo.
for (const step of PLAN) {
  const onDisk = path.join(repoRoot, 'attached_assets', 'services', step.file);
  if (!fs.existsSync(onDisk)) {
    console.error(`ABORT: asset missing from the repo: ${onDisk}`);
    process.exit(1);
  }
  const head = fs.readFileSync(onDisk).subarray(0, 12);
  if (head.subarray(0, 4).toString('ascii') !== 'RIFF' || head.subarray(8, 12).toString('ascii') !== 'WEBP') {
    console.error(`ABORT: not a real WebP file: ${onDisk}`);
    process.exit(1);
  }
}
// No two services may share an image.
const dupes = PLAN.map((s) => s.file).filter((f, i, a) => a.indexOf(f) !== i);
if (dupes.length) {
  console.error(`ABORT: the same file is mapped to more than one service: ${dupes.join(', ')}`);
  process.exit(1);
}
console.log(`${PLAN.length} assets verified on disk, all distinct.\n`);

const pool = new Pool({ connectionString });
const backup = [];

try {
  // Pass 1 — resolve and validate every row before writing anything.
  const resolved = [];
  for (const step of PLAN) {
    const { rows } = await pool.query(
      'select id, trim(title) as title, slug, is_active, images from services where id = $1 and slug = $2',
      [step.id, step.slug],
    );
    if (rows.length !== 1) {
      console.error(`ABORT: ${step.slug}: id+slug matched ${rows.length} rows, expected exactly 1`);
      process.exit(1);
    }
    const r = rows[0];
    if (r.title !== step.title) {
      console.error(`ABORT: ${step.slug}: title is "${r.title}", expected "${step.title}"`);
      process.exit(1);
    }
    if (!r.is_active) {
      console.error(`ABORT: ${step.slug}: row is inactive — refusing to touch it`);
      process.exit(1);
    }
    resolved.push({ step, row: r });
  }
  console.log('all 14 rows resolved by id+slug, titles and active flags verified.\n');

  // Pass 2 — write.
  for (const { step, row } of resolved) {
    const url = `${DIR}/${step.file}`;
    const oldImages = Array.isArray(row.images) ? row.images : [];
    const newImages = oldImages.length > 1 ? [url, ...oldImages.slice(1)] : [url];

    console.log(`${row.title}`);
    console.log(`  ${row.id}  (${row.slug})`);
    console.log(`  old: ${JSON.stringify(oldImages[0] ?? null)}`);
    console.log(`  new: ${JSON.stringify(url)}`);

    if (JSON.stringify(row.images) === JSON.stringify(newImages)) {
      console.log('  already set — no write needed\n');
      continue;
    }
    backup.push({ id: row.id, slug: row.slug, title: row.title, images: row.images });

    if (APPLY) {
      await pool.query('update services set images = $1, updated_at = now() where id = $2', [
        JSON.stringify(newImages),
        row.id,
      ]);
    }
    console.log('');
  }

  if (APPLY && backup.length) {
    let backupPath = path.join(repoRoot, '..', '..', 'service-card-images-backup.json');
    for (let n = 2; fs.existsSync(backupPath); n++) {
      backupPath = path.join(repoRoot, '..', '..', `service-card-images-backup.${n}.json`);
    }
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`prior values backed up to ${backupPath}`);
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'} — ${backup.length} rows`);

  if (APPLY) {
    console.log('\nverification (re-read, unchanged fields shown for audit):');
    const seen = new Map();
    for (const step of PLAN) {
      const { rows } = await pool.query(
        'select trim(title) as title, images, price, original_price, duration, slug, is_active from services where id = $1',
        [step.id],
      );
      const r = rows[0];
      const got = r.images?.[0];
      const want = `${DIR}/${step.file}`;
      if (seen.has(got)) console.log(`  ⚠ DUPLICATE IMAGE: ${r.title} shares ${got} with ${seen.get(got)}`);
      seen.set(got, r.title);
      console.log(
        `  ${got === want ? 'OK ' : 'MISMATCH'} ${r.title.padEnd(48)} price=${r.price} ` +
          `orig=${r.original_price} dur=${r.duration} slug=${r.slug} active=${r.is_active}`);
    }
    console.log(`\ndistinct images across the 14 rows: ${seen.size} (must be 14)`);
  }
} finally {
  await pool.end();
}
