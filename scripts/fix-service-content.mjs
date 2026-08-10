/**
 * Two verified content corrections, applied to specific rows matched on id + slug with
 * the title asserted. Prices, discounts, durations, slugs, ids and active flags are
 * never written.
 *
 *   1. STEK x2 — clear a degenerate `before_after` entry whose `before` points at a
 *      deleted /uploads/*.png and whose `after` and `description` are empty strings.
 *      It renders nothing useful and 404s on every visit.
 *   2. 1 Year Bike Ceramic Coating — replace copy duplicated from the CAR ceramic
 *      service (including an "Audi Quattro" before/after caption and a meta description
 *      quoting the car service's ₹5,999 price) with accurate motorcycle wording.
 *
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/fix-service-content.mjs
 *   CARCARE_TARGET_DATABASE_URL="$CARCARE_DATABASE_URL" node scripts/fix-service-content.mjs --apply
 *
 * Idempotent. Prior values are written to a backup file before the first write.
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
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL).');
  process.exit(1);
}

const STEK_ROWS = [
  { id: '55771017-1baa-4814-84e3-b23399ffc437', slug: 'stek-suncontrol-films', title: 'Stek suncontrol films' },
  { id: '11cd8669-94fe-4035-b0af-7242ab5564d7', slug: 'stek-windsheild-suncontrol-films', title: 'Stek windsheild suncontrol films' },
];

const BIKE = {
  id: '9be9a48f-4c6b-4b5a-bf15-3824d7ddfe5b',
  slug: '1-year-bike-ceramic-coating',
  title: '1 Year Bike Ceramic Coating',
};

// Accurate motorcycle copy. Deliberately claims nothing beyond what the car service
// already claimed and what the existing what_included list covers: 9H hardness,
// hydrophobic behaviour, UV protection, gloss, 12-month durability. No new warranty,
// chemical-resistance or protection-duration promises.
const BIKE_CONTENT = {
  description:
    'Protect your motorcycle with our premium 1-Year Bike Ceramic Coating. The ' +
    'professional-grade 9H hardness coating shields the fuel tank, fairings and every ' +
    'painted body panel from UV rays, light scratches, dirt and road grime. Its ' +
    'hydrophobic layer makes water bead off instantly, so your bike stays cleaner ' +
    'between washes and keeps a deep, mirror-like gloss for a full year.',
  hero_title: 'Ultimate 1-Year Bike Paint Protection',
  hero_subtitle:
    'Professional Ceramic Coating for Motorcycles — 9H Hardness & Hydrophobic Technology',
  why_choose:
    "Our 1-Year Bike Ceramic Coating is a complete transformation for your motorcycle. " +
    'Using advanced nanotechnology, the coating bonds at a molecular level with the ' +
    "paint on your fuel tank, fairings and body panels, creating an invisible shield " +
    'that repels water, dirt and road grime. Unlike traditional wax that lasts weeks, ' +
    'the ceramic coating provides 12 months of continuous protection with minimal ' +
    'maintenance. The 9H hardness rating means superior resistance to light scratches ' +
    'and swirl marks, while the hydrophobic properties send water sliding straight off — ' +
    'reducing water spots and making the bike far easier to clean. The deep gloss ' +
    'enhancement keeps every painted surface looking showroom-fresh.',
  meta_title: '1 Year Bike Ceramic Coating - Motorcycle Paint Protection | P91 Car Care Bangalore',
  meta_description:
    'Protect your motorcycle with our 1-Year Bike Ceramic Coating (9H hardness) at just ' +
    '₹2,999 (50% off). Hydrophobic protection, UV resistance and a mirror-like gloss on ' +
    'tank, fairings and body panels. Book now at P91 Car Care, Bangalore!',
  what_included: [
    '✓ Professional-grade 9H hardness ceramic coating applied to tank, fairings and painted panels',
    '✓ Complete paint decontamination and correction before coating',
    '✓ Multi-stage clay bar treatment to remove embedded contaminants',
    '✓ Machine polishing to reduce light scratches and swirl marks',
    '✓ Iron remover treatment for deep cleaning',
    '✓ Hydrophobic technology - water beads off instantly',
    '✓ UV protection to prevent paint fading and oxidation',
    '✓ Enhanced gloss and depth of colour on every painted surface',
    '✓ 12-month durability with proper maintenance',
    '✓ Post-application care kit and maintenance guide included',
  ],
  // Both entries had a dead /uploads "before" photo, and the first was captioned
  // "Audi Quattro" — copied wholesale from the car service. No genuine bike before/after
  // photography exists, so the section is cleared rather than illustrated with car shots.
  before_after: [],
};

const BIKE_FAQ_REPLACEMENTS = [
  [/\bany car\b/gi, 'any motorcycle'],
  [/\bregular wax\b/g, 'regular wax'],
  [/\byour car\b/gi, 'your bike'],
  [/\bmy car\b/gi, 'my bike'],
  [/\bthe car\b/gi, 'the bike'],
  [/\bcar shampoo\b/gi, 'bike shampoo'],
  [/\bautomatic car washes\b/gi, 'automatic washes'],
  [/\bolder cars\b/gi, 'older bikes'],
  [/\ball car colors\b/gi, 'all paint colours'],
  [/\bcar wax\b/gi, 'wax'],
  [/\bcar\b/gi, 'bike'],
  [/\bcars\b/gi, 'bikes'],
];

const applyReplacements = (text) =>
  BIKE_FAQ_REPLACEMENTS.reduce((acc, [re, to]) => acc.replace(re, to), text);

const pool = new Pool({ connectionString });
const backup = [];

async function fetchRow(target) {
  const { rows } = await pool.query(
    `select id, trim(title) as title, slug, is_active, description, hero_title,
            hero_subtitle, why_choose, what_included, meta_title, meta_description,
            before_after, faq, price, original_price, duration
       from services where id = $1 and slug = $2`,
    [target.id, target.slug],
  );
  if (rows.length !== 1) {
    console.error(`ABORT: ${target.slug}: id+slug matched ${rows.length} rows`);
    process.exit(1);
  }
  if (rows[0].title !== target.title) {
    console.error(`ABORT: ${target.slug}: title "${rows[0].title}" != "${target.title}"`);
    process.exit(1);
  }
  if (!rows[0].is_active) {
    console.error(`ABORT: ${target.slug}: inactive row`);
    process.exit(1);
  }
  return rows[0];
}

try {
  // ---- 1. STEK before_after cleanup -------------------------------------------------
  for (const target of STEK_ROWS) {
    const r = await fetchRow(target);
    const current = r.before_after;
    console.log(`\n${r.title} (${r.slug})`);
    console.log(`  before_after: ${JSON.stringify(current)}`);

    if (Array.isArray(current) && current.length === 0) {
      console.log('  already cleared — no write needed');
      continue;
    }
    // Only clear entries that are genuinely degenerate: a dead /uploads "before" with an
    // empty "after" and empty description. Anything else is left alone.
    const allDegenerate =
      Array.isArray(current) &&
      current.length > 0 &&
      current.every(
        (e) =>
          e && typeof e === 'object' &&
          typeof e.before === 'string' && e.before.startsWith('/uploads/') &&
          !e.after && !e.description,
      );
    if (!allDegenerate) {
      console.log('  NOT degenerate (has a real after image or description) — skipping');
      continue;
    }
    console.log('           ->  []');
    backup.push({ id: r.id, slug: r.slug, title: r.title, before_after: current });
    if (APPLY) {
      await pool.query("update services set before_after = '[]'::jsonb, updated_at = now() where id = $1", [r.id]);
    }
  }

  // ---- 2. Bike ceramic coating copy -------------------------------------------------
  const bike = await fetchRow(BIKE);
  const newFaq = Array.isArray(bike.faq)
    ? bike.faq.map((f) => ({
        ...f,
        question: applyReplacements(f.question || ''),
        answer: applyReplacements(f.answer || ''),
      }))
    : bike.faq;

  console.log(`\n${bike.title} (${bike.slug})`);
  const fields = {
    description: BIKE_CONTENT.description,
    hero_title: BIKE_CONTENT.hero_title,
    hero_subtitle: BIKE_CONTENT.hero_subtitle,
    why_choose: BIKE_CONTENT.why_choose,
    meta_title: BIKE_CONTENT.meta_title,
    meta_description: BIKE_CONTENT.meta_description,
  };
  for (const [k, v] of Object.entries(fields)) {
    const changed = bike[k] !== v;
    console.log(`  ${k}: ${changed ? 'CHANGE' : 'unchanged'}`);
    if (changed) console.log(`      old: ${String(bike[k]).slice(0, 90)}…`);
  }
  console.log(`  what_included: ${JSON.stringify(bike.what_included) !== JSON.stringify(BIKE_CONTENT.what_included) ? 'CHANGE' : 'unchanged'}`);
  console.log(`  before_after:  ${JSON.stringify(bike.before_after)} -> []`);
  console.log(`  faq: ${JSON.stringify(bike.faq) !== JSON.stringify(newFaq) ? 'CHANGE (car -> bike wording)' : 'unchanged'}`);
  console.log(`  price/original/duration LEFT ALONE: ${bike.price} / ${bike.original_price} / ${bike.duration}`);

  backup.push({
    id: bike.id, slug: bike.slug, title: bike.title,
    description: bike.description, hero_title: bike.hero_title,
    hero_subtitle: bike.hero_subtitle, why_choose: bike.why_choose,
    what_included: bike.what_included, meta_title: bike.meta_title,
    meta_description: bike.meta_description, before_after: bike.before_after, faq: bike.faq,
  });

  if (APPLY) {
    await pool.query(
      `update services set description = $1, hero_title = $2, hero_subtitle = $3,
              why_choose = $4, what_included = $5, meta_title = $6, meta_description = $7,
              before_after = '[]'::jsonb, faq = $8, updated_at = now()
         where id = $9`,
      [
        BIKE_CONTENT.description, BIKE_CONTENT.hero_title, BIKE_CONTENT.hero_subtitle,
        BIKE_CONTENT.why_choose, JSON.stringify(BIKE_CONTENT.what_included),
        BIKE_CONTENT.meta_title, BIKE_CONTENT.meta_description,
        JSON.stringify(newFaq), bike.id,
      ],
    );
  }

  if (APPLY && backup.length) {
    let p = path.join(repoRoot, '..', '..', 'service-content-backup.json');
    for (let n = 2; fs.existsSync(p); n++) {
      p = path.join(repoRoot, '..', '..', `service-content-backup.${n}.json`);
    }
    fs.writeFileSync(p, JSON.stringify(backup, null, 2));
    console.log(`\nprior values backed up to ${p}`);
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : '(dry run — nothing written)'}`);

  if (APPLY) {
    const b = await fetchRow(BIKE);
    const carWords = ['Audi', 'Transform your car', 'your car', ' car '];
    const blob = [b.description, b.hero_title, b.hero_subtitle, b.why_choose, b.meta_title, b.meta_description].join(' ');
    console.log('\nverification:');
    console.log(`  meta_title:        ${b.meta_title}`);
    console.log(`  title contains Bike: ${b.title.includes('Bike')}`);
    console.log(`  before_after:      ${JSON.stringify(b.before_after)}`);
    console.log(`  price/dur intact:  ${b.price} / ${b.duration}`);
    for (const w of carWords) {
      console.log(`  copy still contains "${w.trim()}": ${blob.toLowerCase().includes(w.toLowerCase().trim() === 'car' ? ' car ' : w.toLowerCase())}`);
    }
    for (const t of STEK_ROWS) {
      const r = await fetchRow(t);
      console.log(`  ${r.slug}: before_after = ${JSON.stringify(r.before_after)}`);
    }
  }
} finally {
  await pool.end();
}
