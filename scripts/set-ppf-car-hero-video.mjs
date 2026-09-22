/**
 * Point the three full-PPF-for-car services at the studio's own PPF install reel.
 *
 * "PPF for car" has no single catalogue row — P91 sells it per tier (Basic / Premium) AND
 * per body size (Hatchback / Sedan / SUV): six separate active records. Applies the SAME
 * real reel to all six rather than guessing one, since the footage is generic PPF
 * installation work, not tied to one tier or body style. Deliberately NOT the Partial-PPF
 * variants (a distinct, cheaper product line) or any bike record.
 *
 * NOTE: an earlier version of this plan used the three Basic-tier titles from
 * scripts/set-service-card-images.mjs verbatim ("P91 PPF - Hatchback" etc.) — a dry run
 * aborted because the live titles have since changed to "P91 PPF Basic - Hatchback" and a
 * Premium tier was added. Re-queried from the live database before writing this list.
 *
 * Each row matched on id, slug AND title before anything is written — same discipline
 * scripts/set-service-card-images.mjs uses, because the database holds inactive rows that
 * reuse active titles. Video downloaded from Instagram (the signed CDN URL expires) and
 * saved under the git-tracked attached_assets/reels/ tree.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ppf-car-hero-video.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/set-ppf-car-hero-video.mjs --apply
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
const FILE = 'ppf-car-hero.mp4';
const DIR = '/attached_assets/reels';

const connectionString =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const PLAN = [
  { id: 'ppf-hatchback', slug: 'ppf-hatchback', title: 'P91 PPF Basic - Hatchback' },
  { id: 'ppf-sedan', slug: 'ppf-sedan', title: 'P91 PPF Basic - Sedan' },
  { id: 'ppf-suv', slug: 'ppf-suv', title: 'P91 PPF Basic - SUV' },
  { id: 'c844422a-3312-4ee1-8e69-58a6b22ec283', slug: 'ppf-premium-hatchback', title: 'P91 PPF Premium - Hatchback' },
  { id: 'febc9277-a176-4a73-ab3b-170c6cc8e25e', slug: 'ppf-premium-sedan', title: 'P91 PPF Premium - Sedan' },
  { id: '33fdbbbb-bc25-4ad7-92c1-d7722a0cf5ae', slug: 'ppf-premium-suv', title: 'P91 PPF Premium - SUV' },
];

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
console.log(`asset verified on disk: ${onDisk} (${(fs.statSync(onDisk).size / 1024 / 1024).toFixed(1)} MB)\n`);

const pool = new Pool({ connectionString });
const backup = [];

try {
  const resolved = [];
  for (const step of PLAN) {
    const { rows } = await pool.query(
      'select id, trim(title) as title, slug, is_active, hero_video from services where id = $1 and slug = $2',
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
    resolved.push(r);
  }
  console.log(`all ${PLAN.length} rows resolved by id+slug, titles and active flags verified.\n`);

  const url = `${DIR}/${FILE}`;
  for (const row of resolved) {
    console.log(`${row.title}`);
    console.log(`  ${row.id}  (${row.slug})`);
    console.log(`  old heroVideo: ${JSON.stringify(row.hero_video)}`);
    console.log(`  new heroVideo: ${JSON.stringify(url)}`);

    if (row.hero_video === url) {
      console.log('  already set — no write needed\n');
      continue;
    }
    backup.push({ id: row.id, slug: row.slug, title: row.title, heroVideo: row.hero_video });

    if (APPLY) {
      await pool.query('update services set hero_video = $1, updated_at = now() where id = $2', [url, row.id]);
    }
    console.log('');
  }

  if (APPLY && backup.length) {
    let backupPath = path.join(repoRoot, '..', '..', 'ppf-car-hero-video-backup.json');
    for (let n = 2; fs.existsSync(backupPath); n++) {
      backupPath = path.join(repoRoot, '..', '..', `ppf-car-hero-video-backup.${n}.json`);
    }
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`prior values backed up to ${backupPath}`);
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'} — ${backup.length} rows`);
} finally {
  await pool.end();
}
