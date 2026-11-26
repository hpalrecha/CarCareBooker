/**
 * Canonical consolidation of near-duplicate /service/ pages (SEO, 2026-10).
 *
 * Search Console had most pages as "Crawled - currently not indexed". The six PPF size
 * variants share their text, and /ppf, /ceramic-coating/car and /ceramic-coating/bike embed
 * the same service records' sections and FAQPage schema. The decided mapping lives in ONE
 * module, packages/content/src/canonical-overrides.ts, and every canonical emitter must use it:
 * the server-rendered /service/:slug head, the prerenderer, the client after hydration, and
 * the sitemap. The served-HTML half of this lives in tests/sitemap-indexable.itest.mjs.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const EXPECTED = {
  'ppf-hatchback': '/ppf',
  'ppf-sedan': '/ppf',
  'ppf-suv': '/ppf',
  'ppf-premium-hatchback': '/ppf',
  'ppf-premium-sedan': '/ppf',
  'ppf-premium-suv': '/ppf',
  '1-year-ceramic-coating': '/ceramic-coating/car',
  '1-year-bike-ceramic-coating': '/ceramic-coating/bike',
};

let m;
before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'canonical-overrides.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'packages', 'content', 'src', 'canonical-overrides.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  m = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

describe('the mapping', () => {
  test('is exactly the decided eight slugs, each to its campaign page', () => {
    assert.deepEqual({ ...m.CANONICAL_OVERRIDES }, EXPECTED);
  });

  test('every target is a real campaign page (LANDING_PAGES path)', () => {
    const landing = read('packages/content/src/landing-pages.ts');
    for (const target of new Set(Object.values(EXPECTED))) {
      assert.match(landing, new RegExp(`path: "${target.replace(/\//g, '\\/')}"`), target);
    }
  });

  test('consolidated slugs keep their old campaign target for the old hub links and the old sitemap', () => {
    for (const [slug, target] of Object.entries(EXPECTED)) {
      assert.equal(m.consolidatedTargetPath(slug), target, slug);
      assert.equal(m.isConsolidatedServiceSlug(slug), true, slug);
    }
    for (const slug of ['windshield-glass-polishing', 'premium-car-wash-special', 'partial-ppf-suv', 'constructor']) {
      assert.equal(m.consolidatedTargetPath(slug), `/service/${slug}`, slug);
      assert.equal(m.isConsolidatedServiceSlug(slug), false, slug);
    }
  });
});

describe('Plan 3: every old booking page canonicalises to its new site service page', () => {
  // The Book-online map of the new site (site/booking-links.ts), inverted to the family page.
  const NEW_CANONICAL = {
    'ppf-hatchback': '/services/paint-protection-film',
    'ppf-sedan': '/services/paint-protection-film',
    'ppf-suv': '/services/paint-protection-film',
    'ppf-premium-hatchback': '/services/paint-protection-film',
    'ppf-premium-sedan': '/services/paint-protection-film',
    'ppf-premium-suv': '/services/paint-protection-film',
    '1-year-ceramic-coating': '/services/ceramic-coating',
    '1-year-bike-ceramic-coating': '/services/ceramic-coating/bike',
    'interior-detailing-service': '/services/interior-detailing',
    'exterior-detailing-hard-water-new': '/services/exterior-detailing/hard-water-spot-removal',
    'headlight-restoration-both': '/services/exterior-detailing/headlight-restoration',
    'windshield-glass-coating-new': '/services/sun-control-film/windshield-glass-coating',
    'windshield-glass-polishing': '/services/exterior-detailing',
    'annual-maintenance-package': '/services/maintenance-plan',
    'premium-car-wash-special': '/services/car-wash',
  };

  test('each active booking slug -> its new page, for serviceCanonicalPath and canonicalPathFor', () => {
    for (const [slug, target] of Object.entries(NEW_CANONICAL)) {
      assert.equal(m.serviceCanonicalPath(slug), target, slug);
      assert.equal(m.canonicalPathFor(`/service/${slug}`), target, slug);
    }
  });

  test('a slug with no new page of its own points at the /services hub, never at a /service/ URL', () => {
    for (const slug of ['car-polishing', 'partial-ppf-suv', 'constructor']) assert.equal(m.serviceCanonicalPath(slug), '/services', slug);
  });

  test('every target is a live page of the new site, and booking it books the same record (except glass polishing)', async () => {
    const { PAGES } = await import('../packages/content/src/site/registry.ts');
    const { bookingFor } = await import('../packages/content/src/site/booking-links.ts');
    const live = new Set(PAGES.map((p) => p.path));
    for (const [slug, target] of Object.entries(NEW_CANONICAL)) {
      assert.ok(live.has(target), `${slug} -> ${target}`);
      if (slug === 'windshield-glass-polishing' || slug.startsWith('ppf-')) continue;
      assert.equal(bookingFor(target).href, `/service/${slug}`, `${target} books ${slug}`);
    }
    assert.equal(bookingFor('/services/paint-protection-film').href, '/service/ppf-hatchback');
  });

  test('the old booking pages are noindex,follow', () => {
    assert.equal(m.OLD_BOOKING_PAGE_ROBOTS, 'noindex,follow');
  });

  test('non-service routes are their own canonical', () => {
    for (const p of ['/', '/ppf', '/ceramic-coating/car', '/services/paint-protection-film-bangalore', '/blog/x']) {
      assert.equal(m.canonicalPathFor(p), p);
    }
  });
});

describe('every emitter uses the shared module', () => {
  test('server-rendered /service/:slug head (apps/api/src/vite.ts)', () => {
    const vite = read('apps/api/src/vite.ts');
    // Path-agnostic: the module moves between folders, the import must still be the shared one.
    assert.match(vite, /from "(\.\.\/)+[\w/-]*\/canonical-overrides"/);
    assert.match(vite, /const canonical = `\$\{origin\}\$\{serviceCanonicalPath\(service\.slug\)\}`/);
    assert.doesNotMatch(vite, /const canonical = `\$\{origin\}\/service\/\$\{service\.slug\}`/, 'the old self-canonical is gone');
    // og:url is emitted from the same variable, so it follows the canonical.
    assert.match(vite, /og:url" content="\$\{esc\(canonical\)\}"/);
    // Plan 3: noindex,follow from the shared constant; the old index,follow is gone.
    assert.match(vite, /<meta name="robots" content="\$\{OLD_BOOKING_PAGE_ROBOTS\}" \/>/);
    assert.doesNotMatch(vite, /<meta name="robots" content="index,follow" \/>/);
  });

  test('prerender (scripts/prerender.mjs) routes canonicals through canonicalPathFor', () => {
    assert.match(read('scripts/prerender-content-entry.ts'), /canonicalPathFor.*canonical-overrides/);
    const pre = read('scripts/prerender.mjs');
    assert.match(pre, /const canonical = ORIGIN \+ canonicalPathFor\(route\.path\)/);
    assert.match(pre, /headFor\(route, content\.canonicalPathFor\)/);
  });

  test('client (ServiceSeo) sets the override, so hydration does not restore a self-canonical', () => {
    const page = read('apps/admin/src/pages/service-landing.tsx');
    assert.match(page, /canonicalPath: serviceCanonicalPath\(service\.slug\)/);
    assert.doesNotMatch(page, /canonicalPath: `\/service\/\$\{service\.slug\}`/);
    assert.match(page, /robots: OLD_BOOKING_PAGE_ROBOTS/, 'client head is noindex too, so hydration agrees with the server');
  });

  test('client hook sets robots and restores the previous value on unmount', () => {
    const hook = read('apps/admin/src/hooks/use-seo-meta.ts');
    assert.match(hook, /setMeta\("name", "robots", robots\)/);
    assert.match(hook, /robotsPrevious/);
  });

  test('client og:url follows the canonical rather than location.href', () => {
    const hook = read('apps/admin/src/hooks/use-seo-meta.ts');
    assert.match(hook, /setMeta\("property", "og:url", canonicalHref \?\? window\.location\.href\)/);
  });

  test('sitemap filters the consolidated slugs out', () => {
    const routes = read('apps/api/src/routes.ts');
    assert.match(routes, /\.filter\(\(s: any\) => !isConsolidatedServiceSlug\(s\.slug\)\)/);
  });
});
