/**
 * Point every car PPF service's heroVideo at the studio's own saved reel.
 *
 * All 9 car PPF catalogue rows (Basic/Premium x hatchback/sedan/suv, plus Partial x the
 * same three) — none had a heroVideo before this. The video is the studio's own
 * Instagram reel (instagram.com/reel/DWVdUp1Aa-W/), downloaded (the signed CDN URL
 * Instagram serves expires) and saved under the git-tracked attached_assets/reels/ tree —
 * the same "download once, serve from the repo forever" approach
 * set-service-card-images.mjs documents for photos.
 *
 * Trimmed to 27.0s-34.0s of the original ~44.7s reel (7s): the full reel is shot inside
 * the studio in front of its wall-mounted STEK branding, visible in frame for most of the
 * clip as the camera pans; this window is the one continuous close-up stretch (film being
 * applied to a hood/fender) where the camera is tight enough that the STEK signage is
 * never in frame — verified frame-by-frame at both cut points, not just at the exact
 * boundary seconds.
 *
 * client/src/pages/service-landing.tsx renders this as a real <video> (autoplay, muted,
 * loop, playsInline) in the hero, the Overview section, and the closing section — all
 * three read the same heroVideo field, same as every other service.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ppf-car-hero-video.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ppf-car-hero-video.mjs --apply
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

const FILE = 'ppf-car-hero.mp4';
const DIR = '/attached_assets/reels';

const TARGETS = [
  { id: '74ab0ab1-5b10-4f40-b62e-c2523b105808', slug: 'partial-ppf-hatchback', title: 'Partial PPF (Hatchback)' },
  { id: '8caa62f9-4ba4-4179-a1af-cdd1e7f0d1a1', slug: 'partial-ppf-sedan', title: 'Partial PPF (sedan)' },
  { id: '9578876d-7729-40b9-8292-3d93a498983a', slug: 'partial-ppf-suv', title: 'Partial PPF (SUV)' },
  { id: 'ppf-hatchback', slug: 'ppf-hatchback', title: 'P91 PPF Basic - Hatchback' },
  { id: 'c844422a-3312-4ee1-8e69-58a6b22ec283', slug: 'ppf-premium-hatchback', title: 'P91 PPF Premium - Hatchback' },
  { id: 'febc9277-a176-4a73-ab3b-170c6cc8e25e', slug: 'ppf-premium-sedan', title: 'P91 PPF Premium - Sedan' },
  { id: '33fdbbbb-bc25-4ad7-92c1-d7722a0cf5ae', slug: 'ppf-premium-suv', title: 'P91 PPF Premium - SUV' },
  { id: 'ppf-sedan', slug: 'ppf-sedan', title: 'P91 PPF Basic - Sedan' },
  { id: 'ppf-suv', slug: 'ppf-suv', title: 'P91 PPF Basic - SUV' },
];

// Refuse to point the database at anything that is not a real MP4 present in the repo.
const onDisk = path.join(repoRoot, 'attached_assets', 'reels', FILE);
if (!fs.existsSync(onDisk)) {
  console.error(`ABORT: asset missing from the repo: ${onDisk}`);
  process.exit(1);
}
const head = fs.readFileSync(onDisk).subarray(0, 12);
if (head.subarray(4, 8).toString('ascii') !== 'ftyp') {
  console.error(`ABORT: not a real MP4 file: ${onDisk}`);
  process.exit(1);
}
const sizeMb = (fs.statSync(onDisk).size / (1024 * 1024)).toFixed(1);
console.log(`asset verified on disk: ${onDisk} (${sizeMb} MB)\n`);

const url = `${DIR}/${FILE}`;
const pool = new Pool({ connectionString });

try {
  for (const t of TARGETS) {
    const { rows } = await pool.query(
      'select id, trim(title) as title, slug, is_active, hero_video from services where id = $1 and slug = $2',
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
    if (!row.is_active) {
      console.error(`ABORT: ${t.slug}: row is inactive — refusing to touch it`);
      process.exit(1);
    }

    console.log(`${row.title}  (${row.slug})`);
    console.log(`  old heroVideo: ${JSON.stringify(row.hero_video)}`);
    console.log(`  new heroVideo: ${JSON.stringify(url)}`);

    if (row.hero_video === url) {
      console.log('  already set — no write needed\n');
      continue;
    }

    if (APPLY) {
      await pool.query('update services set hero_video = $1, updated_at = now() where id = $2', [url, row.id]);

      const backupPath = path.join(repoRoot, '..', '..', `${t.slug}-hero-video-backup.json`);
      fs.writeFileSync(
        backupPath,
        JSON.stringify({ id: row.id, slug: row.slug, title: row.title, heroVideo: row.hero_video }, null, 2),
      );
      console.log(`  prior value backed up to ${backupPath}`);

      const check = await pool.query('select hero_video from services where id = $1', [row.id]);
      console.log(
        check.rows[0].hero_video === url
          ? '  ✅ APPLIED — verified by re-read\n'
          : `  ⚠ MISMATCH after write: got ${JSON.stringify(check.rows[0].hero_video)}\n`,
      );
    } else {
      console.log('  (dry run — nothing written)\n');
    }
  }
} finally {
  await pool.end();
}
