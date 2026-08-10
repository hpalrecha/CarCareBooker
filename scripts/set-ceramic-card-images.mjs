/**
 * Point the two ceramic-coating services at their own dedicated card images.
 *
 * Only `services.images[0]` is written. Names, prices, discounts, durations,
 * descriptions, slugs, gallery, before/after, process and every other service are
 * untouched. Any extra entries already in `images` are preserved in place.
 *
 * The assets live in the git-tracked `attached_assets/` tree (served by
 * `express.static('/attached_assets')` in server/index.ts), NOT in `uploads/` —
 * the local uploads directory is ephemeral on the deployed container, which is what
 * broke these two cards in the first place.
 *
 *   # dry run against the DB that booking.p91carcare.com serves
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ceramic-card-images.mjs
 *   # write
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ceramic-card-images.mjs --apply
 *
 * Idempotent and re-runnable. Prior values are written to
 * `ceramic-card-images-backup.json` next to the repo before anything is applied.
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

// exact title -> the public URL its card image should use.
// `repointGalleryUploads` additionally moves any gallery entry still pointing at the dead
// `/uploads/…` disk onto the same asset — the bike gallery slot is captioned "Our expert
// technicians apply ceramic coating with precision and care", which is exactly what the
// new bike image shows. before_after entries are deliberately NOT touched: those need a
// genuine "before" photo, which does not exist in the repo.
const PLAN = [
  {
    title: '1 Year Bike Ceramic Coating',
    url: '/attached_assets/services/bike-ceramic-coating-1-year.webp',
    repointGalleryUploads: true,
  },
  {
    title: '1 Year Ceramic Coating',
    url: '/attached_assets/services/car-ceramic-coating-1-year.webp',
  },
];

// Refuse to point the database at an asset that is not actually in the repo —
// that is exactly the failure mode being fixed here.
for (const step of PLAN) {
  const onDisk = path.join(repoRoot, step.url.replace(/^\//, ''));
  if (!fs.existsSync(onDisk)) {
    console.error(`ABORT: asset missing from the repo: ${onDisk}`);
    process.exit(1);
  }
  const head = fs.readFileSync(onDisk).subarray(0, 12);
  if (head.subarray(0, 4).toString('ascii') !== 'RIFF' || head.subarray(8, 12).toString('ascii') !== 'WEBP') {
    console.error(`ABORT: not a real WebP file: ${onDisk}`);
    process.exit(1);
  }
  console.log(`asset ok: ${step.url} (${fs.statSync(onDisk).size} bytes)`);
}

const pool = new Pool({ connectionString });
const backup = [];

try {
  for (const step of PLAN) {
    const { rows } = await pool.query(
      'select id, title, images, gallery from services where is_active = true and trim(title) = $1',
      [step.title],
    );
    if (rows.length !== 1) {
      console.log(`\n⚠ ${step.title}: matched ${rows.length} rows — skipping to stay safe`);
      continue;
    }
    const r = rows[0];
    const oldImages = Array.isArray(r.images) ? r.images : [];
    // Replace the card image (index 0) and keep any further entries as they are.
    const newImages = oldImages.length > 1 ? [step.url, ...oldImages.slice(1)] : [step.url];

    // Only the dead `/uploads/…` urls move; captions, types and order are preserved.
    const newGallery =
      step.repointGalleryUploads && Array.isArray(r.gallery)
        ? r.gallery.map((g) =>
            g && typeof g === 'object' && typeof g.url === 'string' && g.url.startsWith('/uploads/')
              ? { ...g, url: step.url }
              : g,
          )
        : r.gallery;

    const imagesChanged = JSON.stringify(r.images) !== JSON.stringify(newImages);
    const galleryChanged = JSON.stringify(r.gallery) !== JSON.stringify(newGallery);

    console.log(`\n${r.title.trim()} (${r.id})`);
    console.log(`  images:  ${JSON.stringify(r.images)}`);
    console.log(`        -> ${JSON.stringify(newImages)}`);
    if (step.repointGalleryUploads) {
      console.log(`  gallery: ${JSON.stringify(r.gallery)}`);
      console.log(`        -> ${JSON.stringify(newGallery)}`);
    }

    if (!imagesChanged && !galleryChanged) {
      console.log('  already set — no write needed');
      continue;
    }

    backup.push({ id: r.id, title: r.title.trim(), images: r.images, gallery: r.gallery });

    if (APPLY) {
      await pool.query(
        'update services set images = $1, gallery = $2, updated_at = now() where id = $3',
        [JSON.stringify(newImages), JSON.stringify(newGallery), r.id],
      );
    }
  }

  if (APPLY && backup.length) {
    // Never clobber an earlier backup — the first one holds the true original values.
    let backupPath = path.join(repoRoot, '..', '..', 'ceramic-card-images-backup.json');
    for (let n = 2; fs.existsSync(backupPath); n++) {
      backupPath = path.join(repoRoot, '..', '..', `ceramic-card-images-backup.${n}.json`);
    }
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`\nprior values backed up to ${backupPath}`);
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'}`);

  if (APPLY) {
    console.log('\nverification (re-read from the database):');
    for (const step of PLAN) {
      const { rows } = await pool.query(
        'select title, price, original_price, duration, description, images from services where is_active = true and trim(title) = $1',
        [step.title],
      );
      if (!rows.length) continue;
      const r = rows[0];
      console.log(
        `  ${r.title.trim()}: images[0]=${r.images?.[0]} ` +
          `${r.images?.[0] === step.url ? 'OK' : 'MISMATCH'} | price=${r.price} ` +
          `originalPrice=${r.original_price} duration=${r.duration} (unchanged fields shown for audit)`,
      );
    }
  }
} finally {
  await pool.end();
}
