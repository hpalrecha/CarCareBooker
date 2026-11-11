/**
 * /ppf: the Basic and Premium packages.
 *
 * What these tests pin down:
 *   - every price, title, studio time and warranty on the page is read from the catalogue rows, never written in code;
 *   - all six prices and both tiers are in the plain HTML the server sends (the builder the server calls);
 *   - nothing unverified is added: no previous price, no discount label, no availability promise, no self-healing line;
 *   - a missing or inactive row removes its card instead of leaving a blank or invented figure.
 *
 * The fixture is the six live rows (public GET /api/services, 2026-11-11).
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const six = JSON.parse(read('tests/fixtures/ppf-six-records.json')).records;
const bySlug = Object.fromEntries(six.map((r) => [r.slug, r]));

const EXPECTED_PRICES = {
  'ppf-hatchback': 50000, 'ppf-sedan': 60000, 'ppf-suv': 70000,
  'ppf-premium-hatchback': 70000, 'ppf-premium-sedan': 80000, 'ppf-premium-suv': 90000,
};

let pk;       // lib/ppf-packages.ts
let content;  // lib/crawlable-content.ts
let landing;  // lib/landing-pages.ts
let withheld; // lib/withheld-claims.ts
before(async () => {
  const bundle = async (entry, name) => {
    const out = path.join(repoRoot, 'node_modules', '.cache', name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await esbuild.build({
      entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node',
      outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src') },
    });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  pk = await bundle('client/src/lib/ppf-packages.ts', 'ppf-packages-test.mjs');
  content = await bundle('client/src/lib/crawlable-content.ts', 'ppf-packages-content-test.mjs');
  landing = await bundle('client/src/lib/landing-pages.ts', 'ppf-packages-landing-test.mjs');
  withheld = await bundle('client/src/lib/withheld-claims.ts', 'ppf-packages-withheld-test.mjs');
});

const withoutSlugs = (...slugs) => six.filter((r) => !slugs.includes(r.slug));

describe('the fixture matches what the page must show', () => {
  test('six rows, with the prices the studio publishes', () => {
    assert.equal(six.length, 6);
    for (const [slug, price] of Object.entries(EXPECTED_PRICES)) {
      assert.equal(parseFloat(bySlug[slug].price), price, slug);
    }
  });
});

describe('buildPpfPackages', () => {
  test('two tiers, three body types each, in the catalogue order', () => {
    const tiers = pk.buildPpfPackages(six);
    assert.deepEqual(tiers.map((t) => t.key), ['basic', 'premium']);
    assert.deepEqual(tiers.map((t) => t.label), ['Basic PPF', 'Premium PPF']);
    for (const t of tiers) assert.deepEqual(t.cards.map((c) => c.bodyKey), ['hatchback', 'sedan', 'suv']);
  });

  test('every price is the catalogue price of its row (all six)', () => {
    const tiers = pk.buildPpfPackages(six);
    for (const card of tiers.flatMap((t) => t.cards)) {
      assert.equal(card.price, EXPECTED_PRICES[card.slug], card.slug);
      assert.equal(card.price, parseFloat(bySlug[card.slug].price), card.slug);
      assert.equal(card.title, bySlug[card.slug].title.trim(), card.slug);
    }
    assert.equal(tiers[0].cards[0].priceLabel, '₹50,000');
    assert.equal(tiers[1].cards[2].priceLabel, '₹90,000');
  });

  test('the warranty of each tier is read from the rows: 5 years and 7 years', () => {
    const [basic, premium] = pk.buildPpfPackages(six);
    assert.equal(basic.warrantyYears, 5);
    assert.equal(premium.warrantyYears, 7);
  });

  test('a tier whose rows disagree on the warranty states none', () => {
    const rows = six.map((r) => (r.slug === 'ppf-suv' ? { ...r, whatIncluded: r.whatIncluded.map((i) => i.replace('5-year', '3-year')) } : r));
    assert.equal(pk.buildPpfPackages(rows)[0].warrantyYears, null);
  });

  test('the studio time is the catalogue\'s own words, shared by the tier', () => {
    const [basic, premium] = pk.buildPpfPackages(six);
    assert.equal(basic.sharedStudioTime, '2-3 days');
    assert.equal(premium.sharedStudioTime, '2-3 days');
    assert.equal(pk.studioTimeLine('2-3 days'), 'Approx. 2-3 days in the studio');
  });

  test('includes come from the rows and keep the self-healing lines withheld', () => {
    const [basic, premium] = pk.buildPpfPackages(six);
    for (const t of [basic, premium]) assert.ok(!t.includes.some((i) => /self[-\s]?heal/i.test(i)), t.key);
    assert.ok(basic.includes.includes('5-year warranty'));
    assert.ok(premium.includes.includes('7-year warranty'));
    assert.ok(premium.includes.includes('Full body PPF coverage — premium-grade film'));
  });

  test('differences are the lines the other tier does not list word for word', () => {
    const [basic, premium] = pk.buildPpfPackages(six);
    assert.deepEqual([...premium.differsFromOther].sort(), [
      '7-year warranty', 'Full body PPF coverage — premium-grade film', 'Stone chip and scratch protection',
    ].sort());
    assert.deepEqual([...basic.differsFromOther].sort(), [
      '5-year warranty', 'Full body PPF coverage', 'Stone chip protection',
    ].sort());
  });

  test('a missing row removes only its card', () => {
    const tiers = pk.buildPpfPackages(withoutSlugs('ppf-premium-sedan'));
    assert.equal(tiers[0].cards.length, 3);
    assert.deepEqual(tiers[1].cards.map((c) => c.bodyKey), ['hatchback', 'suv']);
  });

  test('an inactive row, or one with an unreadable price, is not shown', () => {
    const rows = six.map((r) => (r.slug === 'ppf-sedan' ? { ...r, isActive: false } : r.slug === 'ppf-suv' ? { ...r, price: '' } : r));
    const basic = pk.buildPpfPackages(rows)[0];
    assert.deepEqual(basic.cards.map((c) => c.bodyKey), ['hatchback']);
  });

  test('a tier with no rows is dropped; no rows at all is null', () => {
    assert.deepEqual(pk.buildPpfPackages(withoutSlugs('ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv')).map((t) => t.key), ['basic']);
    assert.equal(pk.buildPpfPackages([]), null);
    assert.equal(pk.buildPpfPackages(undefined), null);
  });
});

describe('ppfPackagesContent: the HTML the server sends', () => {
  const html = () => content.ppfPackagesContent(six);

  test('one section heading, a heading per tier with its warranty, and all six prices', () => {
    const h = html();
    assert.match(h, /<h2>Choose your PPF package<\/h2>/);
    assert.match(h, /<h3>Basic PPF: 5-year warranty<\/h3>/);
    assert.match(h, /<h3>Premium PPF: 7-year warranty<\/h3>/);
    for (const price of ['₹50,000', '₹60,000', '₹70,000', '₹80,000', '₹90,000']) assert.ok(h.includes(price), price);
    assert.equal((h.match(/₹70,000/g) || []).length, 2, '₹70,000 is both Basic SUV and Premium Hatchback');
  });

  test('each price sits in the line of its own package, with the row title', () => {
    const h = html();
    for (const [slug, price] of Object.entries(EXPECTED_PRICES)) {
      const label = '₹' + price.toLocaleString('en-IN');
      const line = [...h.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]).find((l) => l.includes(bySlug[slug].title.trim()));
      assert.ok(line, `${slug}: line`);
      assert.ok(line.includes(label), `${slug}: ${line}`);
    }
  });

  test('installation time is stated once per tier, as the catalogue words it', () => {
    assert.equal((html().match(/<p>Approx\. 2-3 days in the studio<\/p>/g) || []).length, 2);
  });

  test('every rupee amount in the HTML is the price of a catalogue row', () => {
    const allowed = new Set(Object.values(EXPECTED_PRICES).map((p) => '₹' + p.toLocaleString('en-IN')));
    for (const m of html().matchAll(/₹[\d,]+/g)) assert.ok(allowed.has(m[0]), m[0]);
  });

  test('no discount, previous price, same-day promise or self-healing claim', () => {
    const h = html();
    assert.ok(!/%/.test(h), 'no percentage');
    assert.ok(!/\bOFF\b/i.test(h), 'no OFF label');
    assert.ok(!/85,000|95,000/.test(h), 'no previous price');
    assert.ok(!/same[-\s]?day/i.test(h), 'no same-day promise');
    assert.ok(!/finished the day/i.test(h));
    assert.ok(!/self[-\s]?heal/i.test(h), 'withheld claim stays withheld');
  });

  test('it ends with the approved warranty line, which does not say who issues the warranty', () => {
    assert.match(html(), /<p>Written warranty terms provided at handover\.<\/p>$/);
    assert.ok(!/manufacturer/i.test(html()), 'the issuer is not stated or assumed');
  });

  test('it is empty when no row exists, and drops a missing tier', () => {
    assert.equal(content.ppfPackagesContent([]), '');
    assert.ok(!/Premium PPF/.test(content.ppfPackagesContent(withoutSlugs('ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv'))));
  });

  test('text from a row is escaped', () => {
    const rows = six.map((r) => (r.slug === 'ppf-suv' ? { ...r, title: 'P91 <script>alert(1)</script> SUV' } : r));
    const h = content.ppfPackagesContent(rows);
    assert.ok(!/<script>/.test(h));
    assert.ok(h.includes('&lt;script&gt;'));
  });
});

describe('ppfAggregateOffer: structured data', () => {
  test('prices only: the lowest, the highest, and one Offer per package', () => {
    const offer = pk.ppfAggregateOffer(pk.buildPpfPackages(six), 'https://p91carcare.com');
    assert.equal(offer['@type'], 'AggregateOffer');
    assert.equal(offer.priceCurrency, 'INR');
    assert.equal(offer.lowPrice, '50000');
    assert.equal(offer.highPrice, '90000');
    assert.equal(offer.offerCount, 6);
    assert.deepEqual(offer.offers.map((o) => o.price).sort(), ['50000', '60000', '70000', '70000', '80000', '90000']);
    for (const o of offer.offers) {
      assert.equal(o.url, 'https://p91carcare.com/ppf');
      assert.deepEqual(Object.keys(o).sort(), ['@type', 'name', 'price', 'priceCurrency', 'url']);
    }
  });

  test('no discount, validity, availability or seller invented', () => {
    const json = JSON.stringify(pk.ppfAggregateOffer(pk.buildPpfPackages(six), 'https://p91carcare.com'));
    for (const word of ['availability', 'priceValidUntil', 'discount', 'highPrice":"85', 'seller']) assert.ok(!json.includes(word), word);
  });

  test('it follows the rows that exist, and is null when none do', () => {
    const offer = pk.ppfAggregateOffer(pk.buildPpfPackages(withoutSlugs('ppf-premium-suv', 'ppf-premium-sedan', 'ppf-premium-hatchback')), 'https://p91carcare.com');
    assert.equal(offer.highPrice, '70000');
    assert.equal(offer.offerCount, 3);
    assert.equal(pk.ppfAggregateOffer(null, 'https://p91carcare.com'), null);
  });
});

describe('withheld claims (self-healing) on every surface the /ppf page draws from the catalogue', () => {
  const SELF = /self[-\s]?heal/i;
  const basic = bySlug['ppf-hatchback'];

  test('the live catalogue does carry the claim, so the filter has something to remove', () => {
    assert.ok(six.every((r) => r.whatIncluded.some((i) => SELF.test(i))), 'every row lists it');
    assert.ok(six.every((r) => r.faq.some((f) => SELF.test(f.answer))), 'every row FAQ restates it');
  });

  test('a FAQ answer loses only the withheld list item, in order, and nothing is rewritten', () => {
    const raw = basic.faq[0].answer;
    assert.match(raw, /Self-healing technology/);
    const clean = withheld.withholdClaimsFromAnswer(raw);
    assert.ok(!SELF.test(clean));
    assert.equal(clean, raw.replace('Self-healing technology; ', ''));
    assert.match(clean, /^This package lists: Full body PPF coverage; 5-year warranty; Stone chip protection; UV protection; Hydrophobic coating\. It is fitted to a hatchback at our studio in Adugodi, Bangalore\.$/);
  });

  test('Premium: "Enhanced self-healing technology" is removed from the answer the same way', () => {
    const prem = bySlug['ppf-premium-sedan'].faq[0].answer;
    assert.match(prem, /Enhanced self-healing technology/);
    const clean = withheld.withholdClaimsFromAnswer(prem);
    assert.ok(!SELF.test(clean));
    assert.match(clean, /7-year warranty; Full body PPF coverage — premium-grade film; Stone chip and scratch protection; UV protection; Hydrophobic coating\./);
  });

  test('displayableFaqs keeps every question, cleans the answers, and drops an entry that still states the claim', () => {
    const cleaned = withheld.displayableFaqs(basic.faq);
    assert.equal(cleaned.length, basic.faq.length);
    assert.ok(cleaned.every((f) => !SELF.test(f.question) && !SELF.test(f.answer)));
    const kept = withheld.displayableFaqs([
      { question: 'Is it self-healing?', answer: 'Yes.' },
      { question: 'How is it fitted?', answer: 'Our films are self-healing and fitted by hand.' },
      { question: 'Where?', answer: 'Adugodi.' },
      { question: '', answer: 'x' },
    ]);
    assert.deepEqual(kept.map((f) => f.question), ['Where?']);
    assert.deepEqual(withheld.displayableFaqs(undefined), []);
  });

  test('the server HTML for a landing page (includes list, FAQ) carries no withheld claim', () => {
    const h = content.landingServiceExtras(basic);
    assert.ok(h.length > 200);
    assert.ok(!SELF.test(h), 'no self-healing text in the server-rendered catalogue sections');
    assert.match(h, /<li>Full body PPF coverage<\/li><li>5-year warranty<\/li>/);
    assert.match(h, /Frequently asked questions/);
  });

  test('the FAQPage JSON-LD built from the filtered FAQ carries no withheld claim and keeps all questions', () => {
    const schema = content.faqPageSchema(withheld.displayableFaqs(basic.faq));
    const json = JSON.stringify(schema);
    assert.ok(!SELF.test(json));
    assert.equal(schema.mainEntity.length, basic.faq.length);
    assert.match(json, /5-year warranty/);
  });

  test('server/vite.ts and campaign-landing.tsx both use the filter for the FAQ', () => {
    assert.match(read('server/vite.ts'), /faqPageSchema\(displayableFaqs\(/);
    assert.match(read('client/src/pages/campaign-landing.tsx'), /const faqs = displayableFaqs\(/);
  });

  test('displayableIncludes keeps its behaviour and is still exported from landing-pages', () => {
    assert.deepEqual(landing.displayableIncludes(['A', 'Self-healing technology', 'B']), ['A', 'B']);
    assert.deepEqual(landing.displayableIncludes('nope'), []);
  });
});

describe('nothing is written in code', () => {
  const src = read('client/src/lib/ppf-packages.ts');
  const component = read('client/src/components/ppf-packages.tsx');
  test('ppf-packages.ts holds no price and no discount or promise text', () => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/\b\d{2},?\d{3}\b/.test(code), 'a five-digit amount appears in code');
    assert.ok(!/50%|same-day|OFF\b/i.test(code));
  });
  test('the component shows no previous price, discount or availability promise', () => {
    const code = component.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/originalPrice|lp-price-was|Previous price|%|same[-\s]?day|OFF\b/i.test(code));
  });
  test('only /ppf turns the comparison on', () => {
    assert.equal(landing.getLandingPage('/ppf').packageComparison, true);
    assert.ok(!landing.getLandingPage('/ceramic-coating/car').packageComparison);
    assert.ok(!landing.getLandingPage('/ceramic-coating/bike').packageComparison);
  });
  test('/ppf stays self-canonical and the six service pages stay consolidated to it', () => {
    const overrides = read('client/src/lib/canonical-overrides.ts');
    for (const slug of Object.keys(EXPECTED_PRICES)) assert.match(overrides, new RegExp(`"${slug}": "/ppf"`), slug);
  });
});
