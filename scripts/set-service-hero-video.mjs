/**
 * Point one service's heroVideo at the studio's own saved reel.
 *
 * `stek-suncontrol-films` ("Stek suncontrol films", the full-car STEK sun control window
 * film service — matched on id, slug AND title before anything is written, the same
 * discipline scripts/set-service-card-images.mjs uses, because the database holds inactive
 * rows that reuse active titles). The video is a real reel of the studio's own STEK
 * sun-control-film work, downloaded from Instagram (the signed CDN URL Instagram serves
 * expires) and saved under the git-tracked attached_assets/reels/ tree — the same
 * "download once, serve from the repo forever" approach set-service-card-images.mjs
 * documents for photos.
 *
 * client/src/pages/service-landing.tsx's Overview section renders this as a real <video>
 * (autoplay, muted, loop, playsInline) rather than the <iframe> embed it uses for a
 * YouTube/Vimeo heroVideo, because this is a direct .mp4 file, not an embeddable URL.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-service-hero-video.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-service-hero-video.mjs --apply
 *
 * Idempotent. The prior value is backed up before the write.
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

const TARGET = {
  id: '55771017-1baa-4814-84e3-b23399ffc437',
  slug: 'stek-suncontrol-films',
  title: 'Stek suncontrol films',
  file: 'stek-suncontrol-films-hero.mp4',
};
const DIR = '/attached_assets/reels';

// Refuse to point the database at anything that is not a real MP4 present in the repo.
const onDisk = path.join(repoRoot, 'attached_assets', 'reels', TARGET.file);
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

const pool = new Pool({ connectionString });

try {
  const { rows } = await pool.query(
    'select id, trim(title) as title, slug, is_active, hero_video from services where id = $1 and slug = $2',
    [TARGET.id, TARGET.slug],
  );
  if (rows.length !== 1) {
    console.error(`ABORT: ${TARGET.slug}: id+slug matched ${rows.length} rows, expected exactly 1`);
    process.exit(1);
  }
  const row = rows[0];
  if (row.title !== TARGET.title) {
    console.error(`ABORT: ${TARGET.slug}: title is "${row.title}", expected "${TARGET.title}"`);
    process.exit(1);
  }
  if (!row.is_active) {
    console.error(`ABORT: ${TARGET.slug}: row is inactive — refusing to touch it`);
    process.exit(1);
  }
  console.log('row resolved by id+slug, title and active flag verified.\n');

  const url = `${DIR}/${TARGET.file}`;
  console.log(`${row.title}`);
  console.log(`  ${row.id}  (${row.slug})`);
  console.log(`  old heroVideo: ${JSON.stringify(row.hero_video)}`);
  console.log(`  new heroVideo: ${JSON.stringify(url)}`);

  if (row.hero_video === url) {
    console.log('\nalready set — no write needed');
  } else {
    if (APPLY) {
      await pool.query('update services set hero_video = $1, updated_at = now() where id = $2', [url, row.id]);

      const backupPath = path.join(repoRoot, '..', '..', 'service-hero-video-backup.json');
      fs.writeFileSync(
        backupPath,
        JSON.stringify({ id: row.id, slug: row.slug, title: row.title, heroVideo: row.hero_video }, null, 2),
      );
      console.log(`\nprior value backed up to ${backupPath}`);

      const check = await pool.query('select hero_video from services where id = $1', [row.id]);
      console.log(
        check.rows[0].hero_video === url
          ? '\n✅ APPLIED — verified by re-read'
          : `\n⚠ MISMATCH after write: got ${JSON.stringify(check.rows[0].hero_video)}`,
      );
    } else {
      console.log('\n(dry run — nothing written)');
    }
  }
} finally {
  await pool.end();
}
