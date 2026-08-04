/**
 * PPF image assignment — RUN AFTER commit 9b188a7 IS DEPLOYED.
 *
 * The approved PPF image is /attached_assets/ppf-application.jpg, which ships in the
 * deployed build. This script points the 3 full-PPF services at it, but ONLY after
 * confirming the asset actually resolves as an image on production — so it can never
 * repeat the pre-deploy problem of pointing the DB at a path that serves HTML.
 *
 *   node scripts/set-ppf-images-postdeploy.mjs            # verify -> backup -> apply -> report
 *   node scripts/set-ppf-images-postdeploy.mjs --dry-run  # verify + show old/new, write nothing
 *
 * Safe to re-run: idempotent (already-correct rows report "unchanged").
 * Only the `images` field is written. Name, price, discount, duration, status, slug and
 * scheduling are never touched.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';
neonConfig.webSocketConstructor = ws;

const DRY = process.argv.includes('--dry-run');
const ASSET = '/attached_assets/ppf-application.jpg';
const PROD = 'https://p91carcare.com';
const TITLES = ['P91 PPF - Hatchback', 'P91 PPF - SUV', 'P91 PPF - Sedan'];

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });

try {
  // 1. Verify the asset on production BEFORE touching anything.
  const res = await fetch(PROD + ASSET, { headers: { Range: 'bytes=0-0' } });
  const ct = (res.headers.get('content-type') || '').split(';')[0];
  console.log(`production asset check: ${PROD}${ASSET}`);
  console.log(`  HTTP ${res.status}  Content-Type: ${ct}`);
  if (!(res.status === 200 || res.status === 206) || !ct.startsWith('image/')) {
    console.log('\n❌ REFUSING to update: the PPF asset is not a deployed image yet.');
    console.log('   Deploy commit 9b188a7 first, then re-run this script.');
    process.exitCode = 1;
  } else {
  console.log('  ✅ asset is a real image on production.\n');

  // 2. Read current values (only the fields we might change) and back them up.
  const rows = (await pool.query(
    'select id, title, images from services where title = any($1) and is_active = true', [TITLES])).rows;

  const backup = rows.map((r) => ({ id: r.id, title: r.title, images_old: r.images }));
  const stamp = process.env.STAMP || 'postdeploy';
  const backupPath = `D:/company project/p91-ppf-images-backup-${stamp}.json`;
  if (!DRY) fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  // 3. Apply (idempotent), image field only. Report old -> new.
  let applied = 0, unchanged = 0;
  console.log('PPF services:');
  for (const r of rows) {
    const already = JSON.stringify(r.images) === JSON.stringify([ASSET]);
    console.log(`  ${r.title.padEnd(22)} old=${JSON.stringify(r.images)}  ->  new=["${ASSET}"]${already ? '  (already set)' : ''}`);
    if (already) { unchanged++; continue; }
    if (!DRY) {
      await pool.query('update services set images = $1, updated_at = now() where id = $2',
        [JSON.stringify([ASSET]), r.id]);
    }
    applied++;
  }

  if (rows.length !== 3) console.log(`\n⚠ matched ${rows.length} PPF services, expected 3 — check titles.`);

  console.log(`\n${DRY ? '(dry run — nothing written)' : '✅ done'}: ${applied} updated, ${unchanged} already correct.`);
  if (!DRY) console.log(`backup: ${backupPath}`);

  // 4. Verify only the image field changed, nothing else.
  if (!DRY && applied) {
    const check = (await pool.query(
      'select title, images, price, is_active from services where title = any($1)', [TITLES])).rows;
    console.log('\nverification (image + guard fields):');
    check.forEach((c) => console.log(`  ${c.title.padEnd(22)} images=${JSON.stringify(c.images)}  price=${c.price}  active=${c.is_active}`));
  }
  } // end asset-verified branch
} finally {
  await pool.end();
}
