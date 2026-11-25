/**
 * P0 internal links (SEO proposal, 2026-11-16): the footer, the two service hubs, and the car/bike cross-links.
 *
 *   1. footer: the canonical bike ceramic link beside the car link
 *   2. footer: the interior detailing overview
 *   3. ceramic hub: links straight to /ceramic-coating/car and /ceramic-coating/bike
 *   4. PPF hub: links straight to /ppf instead of the six /service/ppf-* pages
 *   5. car and bike pages link to each other
 *
 * Both the page (React source) and the crawlable HTML (built by lib/crawlable-content.ts) are checked, so the first response and
 * the rendered page list the same links. Nothing here touches content, prices, metadata, FAQ, structured data or canonicals.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

let hub, content, seoPages, canon, landing;
before(async () => {
  const dir = path.join(repoRoot, 'node_modules', '.cache');
  fs.mkdirSync(dir, { recursive: true });
  const bundle = async (entry, name) => {
    const out = path.join(dir, name);
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src'), '@p91/content': path.join(repoRoot, 'packages', 'content', 'src'), '@p91/db': path.join(repoRoot, 'packages', 'db', 'src'), '@p91/domain': path.join(repoRoot, 'packages', 'domain', 'src') } });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  hub = await bundle('packages/content/src/hub-option-links.ts', 'p0-hub.mjs');
  content = await bundle('packages/content/src/crawlable-content.ts', 'p0-content.mjs');
  seoPages = await bundle('packages/content/src/seo-pages.ts', 'p0-seopages.mjs');
  canon = await bundle('packages/content/src/canonical-overrides.ts', 'p0-canon.mjs');
  landing = await bundle('packages/content/src/landing-pages.ts', 'p0-landing.mjs');
});

const hrefs = (html) => [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const guide = (slug) => seoPages.SEO_PAGES.find((p) => p.slug === slug);
const PPF_VARIANTS = ['ppf-hatchback', 'ppf-sedan', 'ppf-suv', 'ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv'];

describe('hubOptionLinks', () => {
  const rows = (slugs) => slugs.map((s) => ({ slug: s, title: `Title ${s}` }));

  test('six PPF rows become ONE link to /ppf, with the shared label', () => {
    const out = hub.hubOptionLinks(rows(PPF_VARIANTS), 'Explore car PPF pricing and booking');
    assert.deepEqual(out.map((o) => o.href), ['/ppf']);
    assert.equal(out[0].label, 'Explore car PPF pricing and booking');
  });

  test('the two ceramic rows keep their own titles and point at their canonical landing pages; other rows are untouched', () => {
    const out = hub.hubOptionLinks(rows(['1-year-ceramic-coating', '1-year-bike-ceramic-coating', 'windshield-glass-coating-new']), 'x');
    assert.deepEqual(out.map((o) => o.href), ['/ceramic-coating/car', '/ceramic-coating/bike', '/service/windshield-glass-coating-new']);
    assert.deepEqual(out.map((o) => o.label), ['Title 1-year-ceramic-coating', 'Title 1-year-bike-ceramic-coating', 'Title windshield-glass-coating-new']);
  });

  test('every link points at a canonical URL: a /service/ link never names a consolidated record', () => {
    for (const slugs of [PPF_VARIANTS, ['1-year-ceramic-coating', '1-year-bike-ceramic-coating', 'windshield-glass-coating-new']]) {
      for (const o of hub.hubOptionLinks(rows(slugs), 'x')) {
        const m = /^\/service\/(.+)$/.exec(o.href);
        if (m) assert.ok(!canon.isConsolidatedServiceSlug(m[1]), `${o.href} is a consolidated, non-canonical URL`);
      }
    }
  });
});

describe('3. ceramic hub (/services/ceramic-coating-bangalore): crawlable HTML', () => {
  const html = () => content.seoGuideContent(guide('ceramic-coating-bangalore'));
  test('links directly to the car and the bike landing pages', () => {
    const h = hrefs(html());
    assert.ok(h.includes('/ceramic-coating/car'));
    assert.ok(h.includes('/ceramic-coating/bike'));
  });
  test('no longer links the two non-canonical ceramic /service/ pages', () => {
    const h = hrefs(html());
    assert.ok(!h.includes('/service/1-year-ceramic-coating'));
    assert.ok(!h.includes('/service/1-year-bike-ceramic-coating'));
  });
  test('the windshield glass coating option is unchanged', () => assert.ok(hrefs(html()).includes('/service/windshield-glass-coating-new')));
});

describe('4. PPF hub (/services/paint-protection-film-bangalore): crawlable HTML', () => {
  const html = () => content.seoGuideContent(guide('paint-protection-film-bangalore'));
  test('links directly to /ppf', () => assert.ok(hrefs(html()).includes('/ppf')));
  test('none of the six /service/ppf-* URLs is linked any more', () => {
    for (const s of PPF_VARIANTS) assert.ok(!hrefs(html()).includes(`/service/${s}`), s);
  });
  test('the options list holds exactly one /ppf link, so it is not padded', () => {
    const h = html();
    const start = h.indexOf('All Paint protection film options');
    assert.ok(start > 0, 'found the options heading');
    const list = h.slice(start, h.indexOf('</ul>', start));
    assert.equal(hrefs(list).filter((x) => x === '/ppf').length, 1);
    assert.equal(hrefs(list).length, 1, 'and nothing else is in the list');
  });
});

describe('the hub page component uses the same helper', () => {
  const src = () => read('client/src/pages/seo-service-page.tsx');
  test('the options list is built from hubOptionLinks, not a hand-written /service/ href', () => {
    assert.match(src(), /hubOptionLinks\(/);
    assert.ok(!/href=\{`\/service\/\$\{s\.slug\}`\}\s+style=\{\{ color: "#4ade80" \}\} data-testid=\{`link-option/.test(src()), 'the old per-row /service/ link is gone');
  });
  test('the bottom landing link is dropped only when an option already has the same href and label', () => {
    assert.match(src(), /!optionLinks\.some\(\(o\) => o\.href === landingLink\.href && o\.label === landingLink\.label\)/);
  });
});

describe('1 and 2. footer', () => {
  const homeHtml = () => content.homePageContent({ path: '/', title: 't', description: 'd', h1: 'h', lede: 'l' });
  test('crawlable footer block: bike beside car, then the interior overview, both canonical', () => {
    const h = hrefs(homeHtml());
    const car = h.indexOf('/ceramic-coating/car');
    assert.ok(car >= 0);
    assert.equal(h[car + 1], '/ceramic-coating/bike', 'the bike link sits directly after the car link');
    assert.ok(h.includes('/services/interior-detailing-bangalore'));
  });
  test('crawlable footer block: descriptive anchors', () => {
    const html = homeHtml();
    assert.match(html, /<a href="\/ceramic-coating\/bike"[^>]*>Bike ceramic coating price in Bangalore<\/a>/);
    assert.match(html, /<a href="\/services\/interior-detailing-bangalore"[^>]*>Interior detailing overview<\/a>/);
  });
  test('the visible footer links both, and its other links are unchanged', () => {
    const src = read('client/src/components/redesign/site-footer.tsx');
    assert.match(src, /<li><Link href="\/ceramic-coating\/car">Car ceramic coating<\/Link><\/li>\s*<li><Link href="\/ceramic-coating\/bike">Bike ceramic coating<\/Link><\/li>/, 'car then bike, side by side');
    assert.match(src, /<Link href="\/services\/interior-detailing-bangalore">Interior detailing<\/Link>/);
    for (const keep of ['/services/paint-protection-film-bangalore', '/services/ceramic-coating-bangalore', '/service/exterior-detailing-hard-water-new', '/services">All services']) assert.ok(src.includes(keep), keep);
  });
});

describe('5. car and bike link to each other (already present: pinned so they stay)', () => {
  const page = (p) => landing.LANDING_PAGES.find((l) => l.path === p);
  test('page data: each lists the other under related', () => {
    assert.ok(page('/ceramic-coating/car').related.some((r) => r.href === '/ceramic-coating/bike'));
    assert.ok(page('/ceramic-coating/bike').related.some((r) => r.href === '/ceramic-coating/car'));
  });
  test('crawlable HTML of each carries the link', () => {
    assert.ok(hrefs(content.landingPageContent(page('/ceramic-coating/car'))).includes('/ceramic-coating/bike'));
    assert.ok(hrefs(content.landingPageContent(page('/ceramic-coating/bike'))).includes('/ceramic-coating/car'));
  });
});
