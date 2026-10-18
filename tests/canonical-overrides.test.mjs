/**
 * Canonical consolidation of near-duplicate /service/ pages (SEO, 2026-10).
 *
 * Search Console had most pages as "Crawled - currently not indexed". The six PPF size
 * variants share their text, and /ppf, /ceramic-coating/car and /ceramic-coating/bike embed
 * the same service records' sections and FAQPage schema. The decided mapping lives in ONE
 * module, client/src/lib/canonical-overrides.ts, and every canonical emitter must use it:
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
    entryPoints: [path.join(repoRoot, 'client', 'src', 'lib', 'canonical-overrides.ts')],
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
    const landing = read('client/src/lib/landing-pages.ts');
    for (const target of new Set(Object.values(EXPECTED))) {
      assert.match(landing, new RegExp(`path: "${target.replace(/\//g, '\\/')}"`), target);
    }
  });

  test('consolidated slugs resolve to their target', () => {
    for (const [slug, target] of Object.entries(EXPECTED)) {
      assert.equal(m.serviceCanonicalPath(slug), target, slug);
      assert.equal(m.isConsolidatedServiceSlug(slug), true, slug);
      assert.equal(m.canonicalPathFor(`/service/${slug}`), target, slug);
    }
  });

  test('a non-mapped service keeps its self-canonical', () => {
    for (const slug of ['windshield-glass-polishing', 'car-polishing', 'premium-car-wash-special', 'partial-ppf-suv']) {
      assert.equal(m.serviceCanonicalPath(slug), `/service/${slug}`, slug);
      assert.equal(m.isConsolidatedServiceSlug(slug), false, slug);
      assert.equal(m.canonicalPathFor(`/service/${slug}`), `/service/${slug}`, slug);
    }
    // Prototype keys must not be mistaken for overrides.
    assert.equal(m.serviceCanonicalPath('constructor'), '/service/constructor');
  });

  test('non-service routes are their own canonical', () => {
    for (const p of ['/', '/ppf', '/ceramic-coating/car', '/services/paint-protection-film-bangalore', '/blog/x']) {
      assert.equal(m.canonicalPathFor(p), p);
    }
  });
});

describe('every emitter uses the shared module', () => {
  test('server-rendered /service/:slug head (server/vite.ts)', () => {
    const vite = read('server/vite.ts');
    assert.match(vite, /from "\.\.\/client\/src\/lib\/canonical-overrides"/);
    assert.match(vite, /const canonical = `\$\{origin\}\$\{serviceCanonicalPath\(service\.slug\)\}`/);
    assert.doesNotMatch(vite, /const canonical = `\$\{origin\}\/service\/\$\{service\.slug\}`/, 'the old self-canonical is gone');
    // og:url is emitted from the same variable, so it follows the canonical.
    assert.match(vite, /og:url" content="\$\{esc\(canonical\)\}"/);
  });

  test('prerender (scripts/prerender.mjs) routes canonicals through canonicalPathFor', () => {
    assert.match(read('scripts/prerender-content-entry.ts'), /canonicalPathFor.*canonical-overrides/);
    const pre = read('scripts/prerender.mjs');
    assert.match(pre, /const canonical = ORIGIN \+ canonicalPathFor\(route\.path\)/);
    assert.match(pre, /headFor\(route, content\.canonicalPathFor\)/);
  });

  test('client (ServiceSeo) sets the override, so hydration does not restore a self-canonical', () => {
    const page = read('client/src/pages/service-landing.tsx');
    assert.match(page, /canonicalPath: serviceCanonicalPath\(service\.slug\)/);
    assert.doesNotMatch(page, /canonicalPath: `\/service\/\$\{service\.slug\}`/);
  });

  test('client og:url follows the canonical rather than location.href', () => {
    const hook = read('client/src/hooks/use-seo-meta.ts');
    assert.match(hook, /setMeta\("property", "og:url", canonicalHref \?\? window\.location\.href\)/);
  });

  test('sitemap filters the consolidated slugs out', () => {
    const routes = read('server/routes.ts');
    assert.match(routes, /\.filter\(\(s: any\) => !isConsolidatedServiceSlug\(s\.slug\)\)/);
  });
});
