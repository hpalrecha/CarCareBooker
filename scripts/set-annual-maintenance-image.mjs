/**
 * Give the Annual Maintenance Package its own image.
 *
 * It was the only active service with `images = null`, so ServiceCard fell back to a
 * hardcoded images.unsplash.com URL and — once that fallback was removed from the
 * booking modal — the modal showed the branded "image coming soon" placeholder.
 *
 * Writes `images[0]` and nothing else. Price, duration, description, discount, slug,
 * active status and package details are never touched. The row is resolved by id AND
 * slug, with the title and active flag asserted; any mismatch aborts before writing.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-annual-maintenance-image.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-annual-maintenance-image.mjs --apply
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGET = {
  id: '685970ea-b7fe-4965-878a-8fc3a6035d06',
  slug: 'annual-maintenance-package',
  title: 'Annual Maintenance Package',
  file: 'annual-maintenance-package.webp',
};
const URL_PATH = `/attached_assets/services/${TARGET.file}`;

const connectionString =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL).');
  process.exit(1);
}

// Never point the database at something that is not a real WebP in the repo.
const onDisk = path.join(repoRoot, 'attached_assets', 'services', TARGET.file);
if (!fs.existsSync(onDisk)) {
  console.error(`ABORT: asset missing from the repo: ${onDisk}`);
  process.exit(1);
}
const buf = fs.readFileSync(onDisk);
if (buf.subarray(0, 4).toString('ascii') !== 'RIFF' || buf.subarray(8, 12).toString('ascii') !== 'WEBP') {
  console.error(`ABORT: not a real WebP file: ${onDisk}`);
  process.exit(1);
}
console.log(`asset ok: ${URL_PATH} (${buf.length} bytes)\n`);

const pool = new Pool({ connectionString });

try {
  const { rows } = await pool.query(
    `select id, trim(title) as title, slug, is_active, images, price, original_price,
            duration, description
       from services where id = $1 and slug = $2`,
    [TARGET.id, TARGET.slug],
  );
  if (rows.length !== 1) {
    console.error(`ABORT: id+slug matched ${rows.length} rows, expected exactly 1`);
    process.exit(1);
  }
  const r = rows[0];
  if (r.title !== TARGET.title) {
    console.error(`ABORT: title is "${r.title}", expected "${TARGET.title}"`);
    process.exit(1);
  }
  if (!r.is_active) {
    console.error('ABORT: row is inactive — refusing to touch it');
    process.exit(1);
  }
  // No other active service may already use this image.
  const { rows: dupes } = await pool.query(
    `select trim(title) as title from services
      where is_active = true and id <> $1 and images::text like $2`,
    [TARGET.id, `%${TARGET.file}%`],
  );
  if (dupes.length) {
    console.error(`ABORT: ${dupes.map((d) => d.title).join(', ')} already use ${TARGET.file}`);
    process.exit(1);
  }

  const oldImages = Array.isArray(r.images) ? r.images : [];
  const newImages = oldImages.length > 1 ? [URL_PATH, ...oldImages.slice(1)] : [URL_PATH];

  console.log(`${r.title} (${r.id} / ${r.slug})`);
  console.log(`  images: ${JSON.stringify(r.images)}`);
  console.log(`       -> ${JSON.stringify(newImages)}`);
  console.log(`  untouched: price=${r.price} original=${r.original_price} duration=${r.duration}`);

  if (JSON.stringify(r.images) === JSON.stringify(newImages)) {
    console.log('\nalready set — no write needed');
  } else {
    if (APPLY) {
      let backupPath = path.join(repoRoot, '..', '..', 'annual-maintenance-backup.json');
      for (let n = 2; fs.existsSync(backupPath); n++) {
        backupPath = path.join(repoRoot, '..', '..', `annual-maintenance-backup.${n}.json`);
      }
      fs.writeFileSync(backupPath, JSON.stringify(r, null, 2));
      console.log(`\nfull prior row backed up to ${backupPath}`);

      await pool.query('update services set images = $1, updated_at = now() where id = $2', [
        JSON.stringify(newImages),
        r.id,
      ]);
    }
    console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'}`);
  }

  if (APPLY) {
    const { rows: [v] } = await pool.query(
      `select trim(title) as title, images, price, original_price, duration, slug,
              is_active, description from services where id = $1`, [TARGET.id]);
    console.log('\nverification (re-read):');
    console.log(`  images[0]   : ${v.images?.[0]}  ${v.images?.[0] === URL_PATH ? 'OK' : 'MISMATCH'}`);
    console.log(`  price       : ${v.price} (unchanged: ${v.price === r.price})`);
    console.log(`  original    : ${v.original_price} (unchanged: ${v.original_price === r.original_price})`);
    console.log(`  duration    : ${v.duration} (unchanged: ${v.duration === r.duration})`);
    console.log(`  slug/active : ${v.slug} / ${v.is_active}`);
    console.log(`  description : unchanged: ${v.description === r.description}`);

    const { rows: all } = await pool.query(
      'select trim(title) as title, images from services where is_active = true');
    const missing = all.filter((s) => !s.images?.[0]);
    const seen = new Map();
    const dup = [];
    for (const s of all) {
      const i = s.images?.[0];
      if (!i) continue;
      if (seen.has(i)) dup.push(`${s.title} == ${seen.get(i)}`);
      seen.set(i, s.title);
    }
    console.log(`\n  active services: ${all.length}`);
    console.log(`  without an image: ${missing.length ? missing.map((m) => m.title).join(', ') : 'NONE ✅'}`);
    console.log(`  sharing an image: ${dup.length ? dup.join('; ') : 'NONE ✅'}`);
  }
} finally {
  await pool.end();
}
