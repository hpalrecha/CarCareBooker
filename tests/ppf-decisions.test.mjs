/**
 * Business decisions on the PPF pages, pinned.
 *
 *   1. Warranty: the catalogue-listed periods are shown; the only warranty sentence is "Written warranty terms provided at
 *      handover."; nothing PPF-related says or implies that the manufacturer is the issuer.
 *   2. The shared Products menu no longer carries the "Self-healing film" lines, and every PRODUCT_BRANDS consumer follows.
 *   3. The /ppf hero shows no struck-through previous price; with no catalogue it says to call the studio, with a phone link,
 *      and Book Now dials instead of opening a booking flow that cannot work.
 *   4. The two ceramic pages no longer promise same-day work or generic "free" booking.
 *
 * What is deliberately NOT changed is pinned too (brand pages, blog), so a later edit to them is a visible decision.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/.*$/gm, '$1');
const six = JSON.parse(read('tests/fixtures/ppf-six-records.json')).records;
const LINE = 'Written warranty terms provided at handover.';

let ww, nav, content, landing, wc;
before(async () => {
  const bundle = async (entry, name) => {
    const out = path.join(repoRoot, 'node_modules', '.cache', name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'apps/admin', 'src'), '@p91/content': path.join(repoRoot, 'packages', 'content', 'src'), '@p91/db': path.join(repoRoot, 'packages', 'db', 'src'), '@p91/domain': path.join(repoRoot, 'packages', 'domain', 'src') } });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  ww = await bundle('packages/content/src/warranty-wording.ts', 'ppf-decisions-ww.mjs');
  nav = await bundle('packages/content/src/nav-menu.ts', 'ppf-decisions-nav.mjs');
  content = await bundle('packages/content/src/crawlable-content.ts', 'ppf-decisions-content.mjs');
  landing = await bundle('packages/content/src/landing-pages.ts', 'ppf-decisions-landing.mjs');
  wc = await bundle('packages/content/src/withheld-claims.ts', 'ppf-decisions-wc.mjs');
});

describe('1. warranty presentation', () => {
  test('the approved line is exact', () => {
    assert.equal(ww.WARRANTY_HANDOVER_LINE, LINE);
  });

  test('the catalogue sentence that names the manufacturer is replaced, in all six rows\' FAQ answers', () => {
    for (const r of six) {
      const raw = r.faq[1].answer;
      assert.match(raw, /film manufacturer's, issued in writing at handover/, `${r.slug}: the stored text still says it`);
      const out = ww.neutraliseWarrantyIssuer(raw);
      assert.ok(!/manufacturer/i.test(out), r.slug);
      assert.ok(out.endsWith(LINE), r.slug);
      assert.match(out, /^This package lists a [57]-year warranty\. /, `${r.slug}: the listed period is kept`);
    }
    assert.equal(ww.neutraliseWarrantyIssuer('no warranty sentence here'), 'no warranty sentence here');
  });

  test('every place that renders catalogue FAQ applies it: landing FAQ, server HTML, FAQPage JSON-LD, service pages', () => {
    for (const row of six) {
      const filtered = wc.displayableFaqs(row.faq);
      assert.ok(!/manufacturer/i.test(JSON.stringify(filtered)), `${row.slug}: landing filter`);
      assert.ok(!/manufacturer/i.test(JSON.stringify(content.faqPageSchema(row.faq))), `${row.slug}: FAQPage JSON-LD`);
      assert.ok(!/manufacturer/i.test(content.servicePageContent ? content.servicePageContent(row) : ''), `${row.slug}: service page HTML`);
    }
    assert.match(code('apps/admin/src/pages/service-landing.tsx'), /neutraliseWarrantyIssuer\(item\.answer\.trim\(\)\)/);
    assert.match(code('packages/content/src/service-seo.ts'), /neutraliseWarrantyIssuer\(String\(f\.answer\)\.trim\(\)\)/);
  });

  test('the listed periods are still shown: 5-year Basic, 7-year Premium', () => {
    const html = content.ppfPackagesContent(six);
    assert.match(html, /Basic PPF: 5-year warranty/);
    assert.match(html, /Premium PPF: 7-year warranty/);
    assert.ok(html.endsWith(`<p>${LINE}</p>`));
  });

  test('PPF-related customer-facing sources make no manufacturer-issuer statement', () => {
    for (const f of [
      'apps/admin/src/pages/campaign-landing.tsx', 'apps/admin/src/components/ppf-packages.tsx', 'packages/content/src/ppf-packages.ts',
      'apps/admin/src/pages/home.tsx', 'packages/content/src/crawlable-content.ts', 'packages/content/src/nav-menu.ts',
      'packages/content/src/static-seo.ts', 'packages/content/src/seo-pages.ts', 'packages/content/src/landing-pages.ts',
    ]) {
      const src = code(f);
      assert.ok(!ww.impliesManufacturerWarranty(src), f);
      assert.ok(!/manufacturer/i.test(src.split('\n').filter((l) => /warrant/i.test(l)).join('\n')), `${f}: a warranty line mentions the manufacturer`);
    }
  });

  test('the strips and the paragraph on the campaign pages use the approved line', () => {
    const src = code('apps/admin/src/pages/campaign-landing.tsx');
    assert.ok((src.match(/\{WARRANTY_HANDOVER_LINE\}/g) || []).length >= 3);
    assert.ok(!/Manufacturer-backed warranty|film or coating maker/.test(src));
  });

  test('nav fine print, home snapshot and /products description carry the line and not the old claim', () => {
    assert.equal(nav.PRODUCT_FINE_PRINT, LINE);
    assert.match(content.homePageContent({ path: '/', title: 't', description: 'd', h1: 'h', lede: 'l' }), new RegExp(LINE.replace(/\./g, '\\.') + ' Ask to see the batch details'));
    assert.match(read('packages/content/src/static-seo.ts'), /with written warranty terms provided at handover\./);
  });

  test('NOT CHANGED, pinned: the brand pages and the blog still carry their own manufacturer statements', () => {
    const count = (p) => read(p).split('\n').filter((l) => /manufactur/i.test(l) && /warrant/i.test(l)).length;
    assert.equal(count('packages/content/src/brand-pages.ts'), 4, 'STEK and Nasiol brand pages: a separate content decision');
    assert.equal(count('packages/content/src/blog-posts.ts'), 7, 'blog posts: a separate content decision');
  });
});

describe('2. the shared Products menu', () => {
  test('the two "Self-healing film" lines are gone and nothing else was removed', () => {
    const by = Object.fromEntries(nav.PRODUCT_BRANDS.map((b) => [b.name, b.points]));
    assert.deepEqual(by.STEK, ['Gloss & matte finishes', 'PPF and sun-control films']);
    assert.deepEqual(by['P91 Premium PPF'], ['Hatchback, sedan & SUV packages', 'Fitted with written warranty terms'], 'the issuer is not verified, so the menu does not say "warranty-backed"');
    assert.deepEqual(by.Nasiol, ['Water & stain repellent', 'Scratch, UV & chemical resistant', 'Easy to keep clean'], 'Nasiol is untouched');
    assert.equal(nav.PRODUCT_BRANDS.length, 3);
    for (const b of nav.PRODUCT_BRANDS) assert.ok(!/self[-\s]?heal/i.test(JSON.stringify(b)), b.name);
  });
  test('every consumer reads the same data, so each follows: header, home grid, /products, home snapshot, chatbot', () => {
    for (const f of ['apps/admin/src/components/redesign/site-header.tsx', 'apps/admin/src/pages/home.tsx', 'apps/admin/src/pages/products.tsx', 'packages/content/src/crawlable-content.ts', 'apps/api/src/lib/chatbot-knowledge.ts']) {
      assert.match(read(f), /PRODUCT_BRANDS/, f);
    }
    const snapshot = content.homePageContent({ path: '/', title: 't', description: 'd', h1: 'h', lede: 'l' });
    const from = snapshot.indexOf('The brands behind our work');
    const brands = snapshot.slice(from, snapshot.indexOf(LINE, from));
    assert.ok(from > 0 && brands.includes('STEK') && brands.length > 100, 'found the brand section of the home snapshot');
    assert.ok(!/self[-\s]?heal/i.test(brands), 'the home snapshot brand section');
    // The home FAQ (HOME_FAQS) is separate home content and still mentions it: reported, not changed here.
  });
});

describe('3. hero pricing and the database-unavailable state', () => {
  const page = () => code('apps/admin/src/pages/campaign-landing.tsx');

  test('the selector shows no price at all, current or struck-through (owner rule 26 Nov 2026)', () => {
    assert.doesNotMatch(code('apps/admin/src/components/vehicle-selector.tsx'), /formatINR|originalPrice|service\.price/);
  });

  test('unavailable catalogue: the exact message, a working phone link, and no price anywhere in the component', () => {
    const src = page();
    assert.match(src, /Call the studio for current pricing:\{" "\}/);
    assert.match(src, /<a href=\{STUDIO_TEL_HREF\} data-testid="link-pricing-call">74066 19191<\/a>/);
    assert.match(src, /const STUDIO_TEL_HREF = "tel:\+917406619191"/);
    const fn = src.slice(src.indexOf('function PricingUnavailable'), src.indexOf('interface CampaignLandingProps'));
    assert.ok(!/₹|\d{2},\d{3}/.test(fn), 'no price in the unavailable state');
  });

  test('the message replaces the selector (categories) and the single price (ceramic) only once the read has settled', () => {
    const src = page();
    assert.match(src, /const pricingUnavailable = catalogueError \|\| \(catalogueLoaded && !service\)/);
    assert.match(src, /pricingUnavailable \? \(\s*<PricingUnavailable \/>/);
    assert.match(src, /: pricingUnavailable \? \(/);
  });

  test('Book Now dials the studio instead of opening a booking flow that cannot work', () => {
    const src = page();
    assert.match(src, /if \(catalogueError \|\| \(catalogueLoaded && \(!rowSlug \|\| !bySlug\.get\(rowSlug\)\)\)\) \{\s*window\.location\.href = STUDIO_TEL_HREF;\s*return;\s*\}/);
    assert.match(src, /<SiteHeader onBookNow=\{\(\) => openBooking\(\)\}/);
  });

  test('nothing is hardcoded as a fallback: no price in landing-pages.ts or ppf-packages.ts', () => {
    assert.ok(!/\b\d{2},?\d{3}\b/.test(code('packages/content/src/ppf-packages.ts')));
    assert.ok(!/₹\s?\d/.test(code('packages/content/src/landing-pages.ts')));
  });
});

describe('4. the ceramic pages', () => {
  test('no generic free promise in their meta description or steps, and no same-day', () => {
    for (const p of ['/ceramic-coating/car', '/ceramic-coating/bike', '/ppf']) {
      const page = landing.getLandingPage(p);
      assert.ok(!/\bfree\b/i.test(page.description), `${p}: ${page.description}`);
      assert.ok(page.description.length <= 160, p);
      assert.ok(!page.howItWorks.some((s) => /\bfree\b|same[-\s]?day/i.test(s)), p);
      assert.equal(page.howItWorks[0] === 'Book your appointment online' || page.howItWorks[1] === 'Book your appointment online', true, p);
    }
  });
});
