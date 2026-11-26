/**
 * Owner rule (26 Nov 2026): no price on any public page. No exact figure, no range, no
 * struck-through "was" price, no Offer/price in JSON-LD, nothing in llms.txt. Only checkout
 * (the booking modal's payment/summary step) and the booking confirmation show an amount.
 *
 * Guards:
 *   1. the server-sent HTML (crawlable SSR content for /service/:slug, /services, /ppf),
 *      the Service JSON-LD and llms.txt, built from records that DO carry prices;
 *   2. the prerendered build output (dist/public/**\/*.html), when a build exists;
 *   3. the public SPA components: formatINR is used only where checkout lives.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUPEE_FIGURE = /₹\s?\d/;

let m;
before(async () => {
  const dir = path.join(repoRoot, 'node_modules', '.cache');
  fs.mkdirSync(dir, { recursive: true });
  const entry = path.join(dir, 'no-public-prices-entry.ts');
  fs.writeFileSync(
    entry,
    [
      'export * from "@p91/content/static-seo";',
      'export * from "@p91/content/crawlable-content";',
      'export * from "@p91/content/service-seo";',
      'export * from "@p91/content/llms-txt";',
    ].join('\n'),
  );
  const out = path.join(dir, 'no-public-prices.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
    alias: { '@': path.join(repoRoot, 'apps/admin', 'src'), '@p91/content': path.join(repoRoot, 'packages', 'content', 'src'), '@p91/db': path.join(repoRoot, 'packages', 'db', 'src'), '@p91/domain': path.join(repoRoot, 'packages', 'domain', 'src') },
    external: ['drizzle-orm', 'drizzle-zod', 'zod', 'drizzle-orm/*'],
  });
  m = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

const SERVICES = [
  { title: 'Interior Detailing', slug: 'interior-detailing-service', price: '4000.00', originalPrice: '5000.00', description: 'Deep clean.', isActive: true },
  { title: 'P91 Basic PPF Hatchback', slug: 'ppf-hatchback', price: '50000.00', originalPrice: '65000.00', whatIncluded: ['5-year warranty'], durationText: '2-3 days', isActive: true },
  { title: 'P91 Premium PPF SUV', slug: 'ppf-premium-suv', price: '90000.00', whatIncluded: ['7-year warranty'], durationText: '2-3 days', isActive: true },
];

describe('no price in server-sent HTML, JSON-LD or llms.txt', () => {
  test('/service/:slug SSR content', () => {
    for (const s of SERVICES) assert.doesNotMatch(m.servicePageContent(s), RUPEE_FIGURE, s.slug);
  });

  test('/services SSR content', () => {
    assert.doesNotMatch(m.servicesListContent(m.SERVICES_SEO, SERVICES), RUPEE_FIGURE);
  });

  test('/ppf SSR packages', () => {
    assert.doesNotMatch(m.ppfPackagesContent(SERVICES), RUPEE_FIGURE);
  });

  test('Service JSON-LD has no offers or price', () => {
    for (const s of SERVICES) {
      const json = JSON.stringify(m.serviceStructuredData(s, { origin: 'https://p91carcare.com' }));
      assert.doesNotMatch(json, /"offers"|"price"|"lowPrice"|"highPrice"|priceCurrency/, s.slug);
      assert.doesNotMatch(json, RUPEE_FIGURE, s.slug);
    }
  });

  test('llms.txt', () => {
    const body = m.buildLlmsTxt({ origin: 'https://p91carcare.com', services: SERVICES, businessHours: [] });
    assert.doesNotMatch(body, RUPEE_FIGURE);
    assert.doesNotMatch(body, /\b(4000|50000|90000|50,000|90,000)\b/);
  });

  test('static page titles and descriptions', () => {
    for (const p of [...m.STATIC_SEO_PAGES, m.SERVICES_SEO, m.OFFER_SEO, m.OFFER_ENDED_SEO].filter(Boolean)) {
      assert.doesNotMatch(`${p.title} ${p.description}`, RUPEE_FIGURE, p.path);
    }
  });
});

describe('prerendered build output', () => {
  const dist = path.join(repoRoot, 'dist', 'public');
  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));

  test('no rupee figure and no Offer price in any built HTML page', { skip: !fs.existsSync(dist) && 'no build (run npm run build:app)' }, () => {
    const pages = walk(dist);
    assert.ok(pages.length > 0);
    for (const file of pages) {
      const html = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(html, RUPEE_FIGURE, file);
      assert.doesNotMatch(html, /"lowPrice"|"highPrice"|"price"\s*:/, file);
    }
  });
});

describe('public SPA components', () => {
  // Checkout keeps the amount; the two offer strips only test that a price exists (they print none);
  // ppf-ceramic-landing.tsx is not routed (/ppf-ceramic-coating 301s to /services).
  const ALLOWED = new Set([
    'components/booking-modal.tsx',
    'components/hero-offer-strip.tsx',
    'components/campaign-offer.tsx',
    'pages/ppf-ceramic-landing.tsx',
    // The booking FEE ("Pay ₹299 to book"), the amount checkout charges; not a service price.
    'pages/home.tsx',
  ]);
  const src = path.join(repoRoot, 'apps', 'admin', 'src');
  const files = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));

  test('formatINR is used only by checkout (and admin)', () => {
    for (const file of files(src)) {
      const rel = path.relative(src, file).split(path.sep).join('/');
      if (ALLOWED.has(rel) || /(^|\/)admin[-/]/.test(rel)) continue;
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /formatINR\(/, rel);
    }
  });

  test('the offer strips print no amount', () => {
    for (const f of ['components/hero-offer-strip.tsx', 'components/campaign-offer.tsx']) {
      const s = fs.readFileSync(path.join(src, f), 'utf8');
      assert.doesNotMatch(s, /\{price\}|\{priceLabel\}/, f);
    }
  });
});
