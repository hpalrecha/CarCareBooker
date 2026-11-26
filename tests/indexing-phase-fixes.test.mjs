/**
 * Indexing investigation, phases 1 and 2 (2026-11-18):
 *  - /ppf no longer carries the default hatchback package's own sections or FAQs (server HTML, page and FAQPage JSON-LD);
 *  - /ceramic-coating/bike has a FAQ written for motorcycles, not the car-worded one in its catalogue row;
 *  - the unverified ceramic testimonials are hidden, not deleted;
 *  - nothing in the code links to the old booking.p91carcare.com host.
 *
 * The rows below mirror the live catalogue rows' relevant fields (the package text lives in the database).
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const hatchback = {
  slug: 'ppf-hatchback', title: 'P91 PPF Basic - Hatchback', price: '50000.00', isActive: true,
  whyChoose: 'Paint protection film puts a clear urethane layer between your hatchback and the road.',
  whatIncluded: ['Full body PPF coverage', '5-year warranty', 'Stone chip protection'],
  process: [{ title: 'Paint inspection', description: 'We inspect the paint.' }],
  faq: [
    { question: 'What does P91 PPF Basic - Hatchback cover?', answer: 'This package lists: Full body PPF coverage; 5-year warranty.' },
    { question: 'What warranty comes with it?', answer: 'This package lists a 5-year warranty. Written warranty terms provided at handover.' },
    { question: 'How long does it take?', answer: 'The catalogue lists 2-3 days for this package at our Adugodi studio.' },
    { question: 'Where is the work done?', answer: 'At our studio: 49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru 560030.' },
    { question: 'How is paint protection film different from ceramic coating?', answer: 'Paint protection film is a physical film that absorbs stone chips and washing marks.' },
  ],
};
const bike = { slug: '1-year-bike-ceramic-coating', title: '1 Year Bike Ceramic Coating', isActive: true, whyChoose: 'Our 1-Year Ceramic Coating ... your car', process: [{ title: 'Paint Correction & Polishing' }], whatIncluded: ['Coating applied to tank, fairings and painted panels'], faq: [{ question: 'Is the coating safe for my bike paint?', answer: 'Absolutely! Our ceramic coating is 100% safe.' }] };

let withheld, content, bikeCopy;
before(async () => {
  const dir = path.join(repoRoot, 'node_modules', '.cache');
  fs.mkdirSync(dir, { recursive: true });
  const bundle = async (entry, name) => {
    const out = path.join(dir, name);
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'apps/admin', 'src'), '@p91/content': path.join(repoRoot, 'packages', 'content', 'src'), '@p91/db': path.join(repoRoot, 'packages', 'db', 'src'), '@p91/domain': path.join(repoRoot, 'packages', 'domain', 'src') } });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  withheld = await bundle('packages/content/src/withheld-claims.ts', 'indexing-phase-withheld.mjs');
  content = await bundle('packages/content/src/crawlable-content.ts', 'indexing-phase-content.mjs');
  bikeCopy = await bundle('packages/content/src/bike-landing-copy.ts', 'indexing-phase-bike.mjs');
});

const textOf = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('/ppf: only what is true of every package', () => {
  test('generalPackageFaqs drops the FAQs written for one package and keeps the general ones', () => {
    const kept = withheld.generalPackageFaqs(hatchback.faq).map((f) => f.question);
    assert.deepEqual(kept, ['Where is the work done?', 'How is paint protection film different from ceramic coating?']);
    assert.deepEqual(withheld.generalPackageFaqs(undefined), []);
  });

  test('the default server extras for a multi-package page carry no package-specific section or FAQ', () => {
    const t = textOf(content.landingServiceExtras(hatchback, { general: true }));
    assert.ok(!/hatchback/i.test(t), 'no hatchback wording');
    assert.ok(!/This package lists|catalogue lists/i.test(t));
    assert.ok(!/Why P91 PPF|What's included|How the job works/.test(t));
    assert.match(t, /Frequently asked questions/);
    assert.match(t, /Where is the work done\?/);
    assert.match(t, /How is paint protection film different from ceramic coating\?/);
  });

  test('a single-package page keeps its full extras (default behaviour is unchanged)', () => {
    const t = textOf(content.landingServiceExtras(hatchback));
    assert.match(t, /Why P91 PPF Basic - Hatchback/);
    assert.match(t, /What's included/);
    assert.match(t, /What does P91 PPF Basic - Hatchback cover\?/);
  });

  test('server, page and schema all use the same filter', () => {
    assert.match(read('apps/api/src/vite.ts'), /landingServiceExtras\(landingService as CrawlableService, \{ general \}\)/);
    assert.match(read('apps/api/src/vite.ts'), /general \? generalPackageFaqs\(rowFaqs\) : rowFaqs/);
    assert.match(read('apps/admin/src/pages/campaign-landing.tsx'), /page\.packageComparison \? generalPackageFaqs\(rowFaqs\) : rowFaqs/);
  });
});

describe('/ceramic-coating/bike: its own FAQ', () => {
  test('the bike FAQ is written for motorcycles and carries no car wording or absolute claim', () => {
    const faq = bikeCopy.bikeLandingFaq();
    assert.ok(faq.length >= 6);
    const all = faq.map((f) => `${f.question} ${f.answer}`).join(' ');
    assert.ok(!/\bcar\b|your vehicle|100%|permanent|Absolutely|Transform/i.test(all), all);
    assert.match(all, /tank/);
    assert.match(all, /Approx\. 36–48 hours in the studio\./);
    assert.ok(faq.every((f) => f.question.trim() && f.answer.trim()));
  });

  test('unconfirmed studio promises are not published: no care guide, care kit, "require" or "we can"', () => {
    const all = bikeCopy.bikeLandingFaq().map((f) => f.answer).join(' ');
    assert.ok(!/care (guide|kit)|\brequire|we can |we provide|included/i.test(all), all);
    assert.match(all, /please ask us before you book/);
  });

  test('withBikeLandingCopy applies to the bike record only, and leaves the original untouched', () => {
    const out = bikeCopy.withBikeLandingCopy(bike);
    assert.notStrictEqual(out, bike);
    assert.equal(out.whyChoose, '');
    assert.deepEqual(out.process, []);
    assert.equal(bike.faq.length, 1, 'the source row is not mutated');
    assert.equal(bikeCopy.withBikeLandingCopy(hatchback), hatchback, 'other records pass through as the same object');
    assert.equal(bikeCopy.withBikeLandingCopy(undefined), undefined);
  });

  test('the bike server extras share no sentence with the car record text', () => {
    const t = textOf(content.landingServiceExtras(bikeCopy.withBikeLandingCopy(bike)));
    assert.ok(!/Paint Correction & Polishing/.test(t));
    assert.ok(!/100% safe/.test(t));
    assert.match(t, /Which parts of my motorcycle are coated\?/);
  });

  test('the page and the server both go through withBikeLandingCopy', () => {
    assert.match(read('apps/admin/src/pages/campaign-landing.tsx'), /withBikeLandingCopy\(withCeramicTiming\(catalogueRow\)\)/);
    assert.match(read('apps/api/src/vite.ts'), /withBikeLandingCopy\(service as CrawlableService\)/);
  });
});

describe('testimonials and the old booking host', () => {
  test('both ceramic records have their testimonials hidden in the page, not deleted from the data', () => {
    const landing = read('apps/admin/src/pages/service-landing.tsx');
    assert.match(landing, /TESTIMONIALS_SUPPRESSED = new Set<string>\(\['1-year-bike-ceramic-coating', '1-year-ceramic-coating'\]\)/);
    assert.match(landing, /\{showTestimonials && service\.testimonials/);
  });

  test('no page, component or library links to booking.p91carcare.com (only the host redirect mentions it)', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const hits = walk(path.join(repoRoot, 'apps/admin', 'src')).filter((f) => /\.(tsx?|css|json)$/.test(f) && /booking\.p91carcare\.com/.test(fs.readFileSync(f, 'utf8')));
    assert.deepEqual(hits, []);
  });
});
