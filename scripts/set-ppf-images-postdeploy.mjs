/**
 * PPF image assignment — HELD until deploy.
 *
 * The approved PPF image is the repo asset /attached_assets/ppf-application.jpg, which
 * only exists on the reliability branch, NOT on the deployed production server. Pointing
 * the live DB at it before deploy would make production serve HTML for that path and show
 * a broken image (worse than the current generic fallback). So the 3 PPF services are kept
 * at their prior empty state until the branch (asset + static-404 fix + global fallback)
 * is deployed.
 *
 * default        -> HOLD: revert the 3 PPF services to [] (their prior state)
 * --apply-postdeploy  -> set PPF images to /attached_assets/ppf-application.jpg
 *                        RUN THIS ONLY AFTER the branch is deployed and the asset returns 200.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const POSTDEPLOY = process.argv.includes('--apply-postdeploy');
const PPF = '/attached_assets/ppf-application.jpg';
const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });

try {
  const titles = ['P91 PPF - Hatchback', 'P91 PPF - SUV', 'P91 PPF - Sedan'];

  if (POSTDEPLOY) {
    // Safety: refuse unless the asset actually resolves as an image on production.
    const r = await fetch('https://p91carcare.com' + PPF, { headers: { Range: 'bytes=0-0' } });
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      console.log(`ABORT: ${PPF} on production is "${ct}", not an image. Deploy the asset first.`);
      process.exit(1);
    }
    for (const t of titles) {
      await pool.query('update services set images=$1, updated_at=now() where title=$2 and is_active=true',
        [JSON.stringify([PPF]), t]);
      console.log(`set ${t} -> ${PPF}`);
    }
    console.log('\n✅ PPF images assigned (post-deploy).');
  } else {
    for (const t of titles) {
      await pool.query(`update services set images='[]'::jsonb, updated_at=now() where title=$1 and is_active=true`, [t]);
      console.log(`HELD: ${t} reverted to [] (prior state)`);
    }
    console.log('\nPPF images held until deploy. After deploying the branch, run:');
    console.log('  node scripts/set-ppf-images-postdeploy.mjs --apply-postdeploy');
  }
} finally {
  await pool.end();
}
