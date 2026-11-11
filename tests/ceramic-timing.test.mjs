/**
 * Ceramic coating studio time: the visible FAQ, the server-rendered HTML and the FAQPage JSON-LD must agree, and none may
 * carry the old "6-8 hours" claim. Car and bike are kept separate.
 *
 *   car:  "Approx. 36–48+ hours in the studio, depending on the preparation required."
 *   bike: "Approx. 36–48 hours in the studio."
 *
 * The stale catalogue rows below mirror the live database rows' relevant fields (the claim lives in the database, not the code).
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const CAR = 'Approx. 36–48+ hours in the studio, depending on the preparation required.';
const BIKE = 'Approx. 36–48 hours in the studio.';
const Q = 'How long does the application process take?';
const OLD = (v) => `The complete process takes 6-8 hours including paint preparation, correction, coating application, and curing. We recommend leaving your ${v} with us for the day to ensure perfect results.`;

const row = (slug, title, vehicle, durationText, duration) => ({
  slug, title, duration, durationText, price: '1000.00', description: `${title} description.`, whatIncluded: ['Paint prep'],
  faq: [
    { question: 'How long does the ceramic coating last?', answer: 'It lasts 12 months with proper care.' },
    { question: Q, answer: OLD(vehicle) },
  ],
});
const carRow = () => row('1-year-ceramic-coating', '1 Year Ceramic Coating', 'car', '36-48 hrs', 1440);
const bikeRow = () => row('1-year-bike-ceramic-coating', '1 Year Bike Ceramic Coating', 'bike', null, 2880);

let timing, content, seo;
before(async () => {
  const dir = path.join(repoRoot, 'node_modules', '.cache');
  fs.mkdirSync(dir, { recursive: true });
  const bundle = async (entry, name) => {
    const out = path.join(dir, name);
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src') } });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  timing = await bundle('client/src/lib/ceramic-timing.ts', 'ceramic-timing-t.mjs');
  content = await bundle('client/src/lib/crawlable-content.ts', 'ceramic-timing-content.mjs');
  seo = await bundle('client/src/lib/service-seo.ts', 'ceramic-timing-seo.mjs');
});

const OLD_CLAIM = /6\s*[-–]\s*8\s*(hours|hrs)/i;
const textOf = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const pageAnswer = (svc) => timing.withCeramicTiming(svc).faq.find((f) => f.question === Q).answer;
const faqLd = (schemas) => schemas.find((s) => s['@type'] === 'FAQPage').mainEntity.find((m) => m.name === Q).acceptedAnswer.text;
const ORIGIN = { origin: 'https://p91carcare.com' };

describe('the visible FAQ answer (what the page renders)', () => {
  test('car says the car wording', () => assert.equal(pageAnswer(carRow()), CAR));
  test('bike says the bike wording', () => assert.equal(pageAnswer(bikeRow()), BIKE));
  test('the other FAQs are untouched and no question is added', () => {
    const out = timing.withCeramicTiming(carRow());
    assert.equal(out.faq.length, 2);
    assert.deepEqual(out.faq[0], carRow().faq[0]);
  });
  test('a row without the timing question gets none added', () => {
    const r = carRow(); r.faq = [r.faq[0]];
    assert.equal(timing.withCeramicTiming(r).faq.length, 1);
  });
  test('time text: car 36-48+ hrs, bike 36-48 hrs', () => {
    assert.equal(timing.withCeramicTiming(carRow()).durationText, '36-48+ hrs');
    assert.equal(timing.withCeramicTiming(bikeRow()).durationText, '36-48 hrs');
  });
  test('any other record passes through unchanged (same object)', () => {
    const other = { slug: 'ppf-basic-sedan', faq: [{ question: Q, answer: 'x' }], durationText: '2 days' };
    assert.equal(timing.withCeramicTiming(other), other);
  });
  test('price, amount and booking fields are never touched', () => {
    const before = carRow();
    const after = timing.withCeramicTiming(before);
    for (const k of ['price', 'duration', 'slug', 'title', 'description', 'whatIncluded']) assert.deepEqual(after[k], before[k], k);
  });
});

describe('server-rendered HTML agrees with the page', () => {
  for (const [name, mk, want] of [['car', carRow, CAR], ['bike', bikeRow, BIKE]]) {
    test(`/service/:slug (${name}) HTML has the ${name} answer and no 6-8 hours`, () => {
      const t = textOf(content.servicePageContent(mk()));
      assert.ok(t.includes(want));
      assert.ok(!OLD_CLAIM.test(t));
      if (name === 'bike') assert.ok(!t.includes('36–48+'), 'bike must not carry the car wording');
    });
    test(`landing page extras (${name}) HTML has the ${name} answer and no 6-8 hours`, () => {
      const t = textOf(content.landingServiceExtras(mk()));
      assert.ok(t.includes(want));
      assert.ok(!OLD_CLAIM.test(t));
    });
  }
  test('time line follows the confirmed text', () => {
    assert.match(textOf(content.servicePageContent(carRow())), /Time at the studio: about 36-48\+ hrs\./);
    assert.match(textOf(content.servicePageContent(bikeRow())), /Time at the studio: about 36-48 hrs\./);
  });
});

describe('FAQPage JSON-LD agrees with the page and the HTML', () => {
  for (const [name, mk, want] of [['car', carRow, CAR], ['bike', bikeRow, BIKE]]) {
    test(`/service/:slug schema (${name})`, () => {
      const ld = seo.serviceStructuredData(mk(), ORIGIN);
      assert.equal(faqLd(ld), want);
      assert.equal(faqLd(ld), pageAnswer(mk()));
      assert.ok(!OLD_CLAIM.test(JSON.stringify(ld)));
    });
    test(`landing page schema (${name}): same filtered FAQ the server injects`, () => {
      const ld = content.faqPageSchema(timing.withCeramicTiming(mk()).faq);
      assert.equal(ld.mainEntity.find((m) => m.name === Q).acceptedAnswer.text, want);
    });
    test(`visible, HTML and JSON-LD all carry the identical ${name} sentence`, () => {
      const html = textOf(content.servicePageContent(mk()));
      const ld = faqLd(seo.serviceStructuredData(mk(), ORIGIN));
      assert.ok(html.includes(ld));
      assert.equal(ld, pageAnswer(mk()));
    });
  }
});

describe('every surface is wired to the shared module (source guards)', () => {
  test('page, server and schema builders all apply withCeramicTiming', () => {
    for (const f of ['client/src/pages/service-landing.tsx', 'client/src/pages/campaign-landing.tsx', 'client/src/lib/crawlable-content.ts', 'client/src/lib/service-seo.ts', 'server/vite.ts']) {
      assert.match(read(f), /withCeramicTiming/, f);
    }
  });
  test('no application source states a 6-8 hour duration', () => {
    const walk = (d) => fs.readdirSync(path.join(repoRoot, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const files = ['client/src', 'server', 'shared'].flatMap(walk).filter((f) => /\.(tsx?|json|html)$/.test(f));
    assert.deepEqual(files.filter((f) => OLD_CLAIM.test(read(f))), []);
  });
});
