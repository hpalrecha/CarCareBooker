/**
 * Cache-bust the two ceramic card images.
 *
 * These two are the only service images that kept their original filenames from before
 * the container shipped `attached_assets/`. During that window the URLs returned the SPA
 * shell as `200 text/html`, and browsers cached it. Proof: loading the .webp URL directly
 * in an affected browser still renders the OLD not-found page ("Did you forget to add the
 * page to the router?"), a component that no longer exists in the deployed build — so the
 * response never reached the server at all.
 *
 * Every other service image got a brand-new filename and is unaffected.
 *
 * Appending a version query gives the browser and the CDN a cache key they have never
 * seen, so the next request must go to origin. express.static ignores the query string
 * and serves the same file, so no rebuild or redeploy is needed.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/bust-ceramic-image-cache.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/bust-ceramic-image-cache.mjs --apply
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = 'v2';

const PLAN = [
  {
    id: '9be9a48f-4c6b-4b5a-bf15-3824d7ddfe5b',
    slug: '1-year-bike-ceramic-coating',
    title: '1 Year Bike Ceramic Coating',
    file: 'bike-ceramic-coating-1-year.webp',
  },
  {
    id: 'f59283ae-fae1-43a2-a03a-cc0a80cf4a38',
    slug: '1-year-ceramic-coating',
    title: '1 Year Ceramic Coating',
    file: 'car-ceramic-coating-1-year.webp',
  },
];

const connectionString =
  process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL).');
  process.exit(1);
}

for (const s of PLAN) {
  const onDisk = path.join(repoRoot, 'attached_assets', 'services', s.file);
  if (!fs.existsSync(onDisk)) {
    console.error(`ABORT: ${onDisk} missing from the repo`);
    process.exit(1);
  }
}

const pool = new Pool({ connectionString });
const backup = [];

try {
  for (const step of PLAN) {
    const { rows } = await pool.query(
      `select id, trim(title) as title, slug, is_active, images, price, duration
         from services where id = $1 and slug = $2`,
      [step.id, step.slug],
    );
    if (rows.length !== 1) {
      console.error(`ABORT: ${step.slug}: matched ${rows.length} rows`);
      process.exit(1);
    }
    const r = rows[0];
    if (r.title !== step.title) {
      console.error(`ABORT: ${step.slug}: title "${r.title}" != "${step.title}"`);
      process.exit(1);
    }
    if (!r.is_active) {
      console.error(`ABORT: ${step.slug}: inactive`);
      process.exit(1);
    }

    const base = `/attached_assets/services/${step.file}`;
    const versioned = `${base}?${VERSION}`;
    const current = Array.isArray(r.images) ? r.images : [];
    // Only rewrite our own path, and never stack versions on an already-busted url.
    const newImages = current.length
      ? [versioned, ...current.slice(1)]
      : [versioned];

    console.log(`\n${r.title} (${r.slug})`);
    console.log(`  images[0]: ${JSON.stringify(current[0] ?? null)}`);
    console.log(`          -> ${JSON.stringify(versioned)}`);
    console.log(`  price/duration untouched: ${r.price} / ${r.duration}`);

    if (current[0] === versioned) {
      console.log('  already busted — no write needed');
      continue;
    }
    backup.push({ id: r.id, slug: r.slug, title: r.title, images: r.images });

    if (APPLY) {
      await pool.query('update services set images = $1, updated_at = now() where id = $2', [
        JSON.stringify(newImages),
        r.id,
      ]);
    }
  }

  if (APPLY && backup.length) {
    let p = path.join(repoRoot, '..', '..', 'ceramic-cachebust-backup.json');
    for (let n = 2; fs.existsSync(p); n++) {
      p = path.join(repoRoot, '..', '..', `ceramic-cachebust-backup.${n}.json`);
    }
    fs.writeFileSync(p, JSON.stringify(backup, null, 2));
    console.log(`\nprior values backed up to ${p}`);
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'}`);

  if (APPLY) {
    const { rows: all } = await pool.query(
      'select trim(title) as title, images, price, duration from services where is_active = true');
    console.log('\nverification — all active services:');
    const missing = all.filter((s) => !s.images?.[0]);
    const seen = new Map(); const dup = [];
    for (const s of all) {
      const i = s.images?.[0];
      if (!i) continue;
      if (seen.has(i)) dup.push(`${s.title} == ${seen.get(i)}`);
      seen.set(i, s.title);
    }
    console.log(`  count: ${all.length} | without image: ${missing.length} | duplicates: ${dup.length}`);
    for (const step of PLAN) {
      const r = all.find((x) => x.title === step.title);
      console.log(`  ${step.title}: ${r.images[0]}  (price ${r.price}, duration ${r.duration})`);
    }
  }
} finally {
  await pool.end();
}
