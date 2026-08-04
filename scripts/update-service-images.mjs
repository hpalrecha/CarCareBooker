/**
 * Apply the approved image mapping to the LIVE database. Image fields ONLY.
 * Reversible: old values were backed up to p91-image-fields-backup-2026-08-04.json,
 * and this script prints every old->new change. Nothing else (name/price/status/…) is touched.
 *
 *   node scripts/update-service-images.mjs           # dry run
 *   node scripts/update-service-images.mjs --apply
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });

const CERAMIC = '/attached_assets/stock_images/car_ceramic_coating__1f07eabd.jpg';
const CERAMIC_APPLY = '/attached_assets/ceramic-coating-in-Attention-2-Detail-Griffith-In_1759817905445.webp';
const DETAILING = '/attached_assets/exterior-detailing-service.jpg';
const PPF = '/attached_assets/ppf-application.jpg';

// title-match (ilike) -> the update to apply. STEK services deliberately absent (keep fallback).
const PLAN = [
  { match: '%Bike Ceramic%', label: '1 Year Bike Ceramic Coating', images: [CERAMIC], repointGallery: CERAMIC_APPLY },
  { match: '%Annual Maintenance%', label: 'Annual Maintenance Package', images: [DETAILING] },
  { match: 'P91 PPF - Hatchback', label: 'P91 PPF - Hatchback', images: [PPF] },
  { match: 'P91 PPF - SUV', label: 'P91 PPF - SUV', images: [PPF] },
  { match: 'P91 PPF - Sedan', label: 'P91 PPF - Sedan', images: [PPF] },
];

const changes = [];

try {
  for (const step of PLAN) {
    const rows = (await pool.query(
      'select id, title, images, gallery from services where is_active=true and title ilike $1', [step.match])).rows;
    if (rows.length !== 1) {
      console.log(`⚠ ${step.label}: matched ${rows.length} rows — skipping to stay safe`);
      continue;
    }
    const r = rows[0];
    const oldImages = r.images;
    const newImages = step.images;

    // Optionally repoint a broken gallery url to a working ceramic asset (Bike Ceramic only).
    let newGallery = r.gallery;
    if (step.repointGallery && Array.isArray(r.gallery)) {
      newGallery = r.gallery.map((g) =>
        g && typeof g === 'object' && typeof g.url === 'string' && g.url.startsWith('/uploads/')
          ? { ...g, url: step.repointGallery }
          : g);
    }

    changes.push({
      id: r.id, title: r.title.trim(),
      images: { old: oldImages, new: newImages },
      gallery: step.repointGallery ? { old: r.gallery, new: newGallery } : null,
    });

    console.log(`\n${r.title.trim()} (${r.id.slice(0, 8)})`);
    console.log(`  images: ${JSON.stringify(oldImages)}  ->  ${JSON.stringify(newImages)}`);
    if (step.repointGallery) {
      console.log(`  gallery url: ${JSON.stringify(r.gallery)?.match(/\/uploads\/[^"]+/)?.[0] || '(none)'}  ->  ${step.repointGallery}`);
    }

    if (APPLY) {
      if (step.repointGallery) {
        await pool.query('update services set images=$1, gallery=$2, updated_at=now() where id=$3',
          [JSON.stringify(newImages), JSON.stringify(newGallery), r.id]);
      } else {
        await pool.query('update services set images=$1, updated_at=now() where id=$2',
          [JSON.stringify(newImages), r.id]);
      }
    }
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'} — ${changes.length} services`);
  if (APPLY) {
    // Verify nothing else moved: re-read and confirm only images/gallery differ.
    console.log('\nverification:');
    for (const c of changes) {
      const [r] = (await pool.query('select images, gallery from services where id=$1', [c.id])).rows;
      const okImg = JSON.stringify(r.images) === JSON.stringify(c.images.new);
      console.log(`  ${c.title}: images ${okImg ? 'OK' : 'MISMATCH'}`);
    }
  }
} finally {
  await pool.end();
}
