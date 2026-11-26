/**
 * The six /service/ppf-* pages were thin: the Basic three had no why_choose, process or faq, and
 * the Premium three had no process or faq. Search Console reports most of these URLs as unknown or
 * not indexed, and a page with only a title, one sentence and a bullet list gives Google little to
 * index.
 *
 * Every sentence below comes from wording the site already publishes (lib/landing-pages.ts "how it
 * works" steps and benefits, lib/brand-pages.ts, PRODUCT_FINE_PRINT, the studio address) or from the
 * catalogue row itself (warranty years, duration text). Nothing new is claimed: no film brand
 * per package, no ratings, no self-healing claim, no price (a price in an FAQ goes stale).
 *
 * Fills EMPTY fields only. A field that already has content is left untouched, so re-running is
 * safe and nothing the business wrote is overwritten.
 *
 * Dry-run by default. Pass --apply to commit.
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const BODY = {
  'ppf-hatchback': 'hatchback',
  'ppf-sedan': 'sedan',
  'ppf-suv': 'SUV',
  'ppf-premium-hatchback': 'hatchback',
  'ppf-premium-sedan': 'sedan',
  'ppf-premium-suv': 'SUV',
};
const BASIC = new Set(['ppf-hatchback', 'ppf-sedan', 'ppf-suv']);

const PROCESS = [
  {
    step: 1,
    title: 'Book online and bring the car to our Adugodi studio',
    description:
      'Choose your body type and book a slot on this page. The work is done at our studio in Adugodi, Bangalore.',
  },
  {
    step: 2,
    title: 'Paint inspection',
    description: 'We inspect the paint before anything is fitted, so the starting condition is clear.',
  },
  {
    step: 3,
    title: 'Full decontamination',
    description: 'The car is washed and decontaminated so the film goes onto a clean surface.',
  },
  {
    step: 4,
    title: 'Film cut and fitted panel by panel',
    description: 'The film is cut and fitted one panel at a time.',
  },
  {
    step: 5,
    title: 'Final inspection',
    description: 'Every panel is checked before the car is handed over.',
  },
  {
    step: 6,
    title: 'Handover with written warranty terms',
    description: 'You receive the warranty terms in writing when you collect the car.',
  },
];

function whyChoose(body) {
  return (
    `Paint protection film puts a clear urethane layer between your ${body} and the road. ` +
    'The bonnet, bumper and mirror backs take the constant low-level impacts of city and highway driving, ' +
    'and the film absorbs them instead of the clearcoat. Light scratching from washing and drying collects in ' +
    'the film, so the panel underneath stays in the condition it was in when the film went on. The film is ' +
    'optically clear, so the colour and gloss you see are still your own paint. Factory paint is only original ' +
    'once; fitting film over it protects that finish rather than repairing it later.'
  );
}

function faq(row, body) {
  const warranty = (row.what_included || []).map((i) => /(\d+)[-\s]year warranty/i.exec(String(i))).find(Boolean);
  const items = [
    {
      question: `What does ${row.title} cover?`,
      answer:
        (row.what_included || []).length > 0
          ? `This package lists: ${row.what_included.join('; ')}. It is fitted to a ${body} at our studio in Adugodi, Bangalore.`
          : `It is fitted to a ${body} at our studio in Adugodi, Bangalore.`,
    },
  ];
  if (warranty) {
    items.push({
      question: 'What warranty comes with it?',
      answer:
        `This package lists a ${warranty[1]}-year warranty. Warranty on any job is the film manufacturer's, ` +
        'issued in writing at handover.',
    });
  }
  if (row.duration_text) {
    items.push({
      question: 'How long does it take?',
      answer: `The catalogue lists ${row.duration_text} for this package at our Adugodi studio.`,
    });
  }
  items.push(
    {
      question: 'Where is the work done?',
      answer:
        'At our studio: 49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru 560030. Call +91 74066 19191 ' +
        'if you need directions or want to check a slot.',
    },
    {
      question: 'How is paint protection film different from ceramic coating?',
      answer:
        'Paint protection film is a physical film that absorbs stone chips and washing marks. Ceramic coating is a ' +
        'liquid layer that adds gloss and repels water and dirt. Our guide "PPF vs Ceramic Coating" at ' +
        '/blog/ppf-vs-ceramic-coating-bangalore compares the two for Bangalore conditions.',
    },
  );
  return items;
}

const isEmpty = (v) => v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (no writes) ===\n');
  let changes = 0;

  for (const [slug, body] of Object.entries(BODY)) {
    const { rows } = await pool.query('SELECT * FROM services WHERE slug = $1', [slug]);
    const row = rows[0];
    if (!row) { console.log(`SKIP  ${slug}: no such row`); continue; }

    const sets = {};
    if (BASIC.has(slug) && isEmpty(row.why_choose)) sets.why_choose = whyChoose(body);
    if (isEmpty(row.process)) sets.process = JSON.stringify(PROCESS);
    if (isEmpty(row.faq)) sets.faq = JSON.stringify(faq(row, body));

    const cols = Object.keys(sets);
    if (cols.length === 0) { console.log(`OK    ${row.title}: already has content`); continue; }
    console.log(`FILL  ${row.title} (${slug}): ${cols.join(', ')}`);
    changes++;
    if (APPLY) {
      const assignments = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      await pool.query(`UPDATE services SET ${assignments}, updated_at = NOW() WHERE id = $${cols.length + 1}`, [
        ...cols.map((c) => sets[c]),
        row.id,
      ]);
    }
  }

  console.log(`\n${changes} row(s) ${APPLY ? 'updated' : 'would change'}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
