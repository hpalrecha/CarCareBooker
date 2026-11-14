/**
 * The ended De Dhana Dhan offer (8 November 2026). The offer window and the (now unused) ended-notice copy are still pinned
 * below. The page itself /offer/de-dhana-dhan was REMOVED: 410 Gone, no route, no prerender, not in the sitemap.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const DIST = path.join(repoRoot, 'dist', 'public');
const ended = new Date() > new Date('2026-11-08T23:59:59+05:30');

let seo, win;
before(async () => {
  const bundle = async (entry, name) => {
    const out = path.join(repoRoot, 'node_modules', '.cache', name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src') } });
    return import(pathToFileURL(out).href + '?t=' + Date.now());
  };
  seo = await bundle('client/src/lib/static-seo.ts', 'offer-expiry-seo.mjs');
  win = await bundle('client/src/lib/festival-offer-window.ts', 'offer-expiry-window.mjs');
});

describe('the end date', () => {
  test('is the same instant in the three places that hold it (window, server, countdown)', () => {
    const iso = '2026-11-08T23:59:59+05:30';
    assert.equal(win.FESTIVAL_OFFER_ENDS_AT.getTime(), new Date(iso).getTime());
    assert.match(read('server/lib/diwali-offer.ts'), /endsAt: new Date\("2026-11-08T23:59:59\+05:30"\)/);
    assert.match(read('client/src/components/festival-offer.tsx'), /endsAt: new Date\("2026-11-08T23:59:59\+05:30"\)/);
  });
  test('the last second of 8 November is inside the offer; the next moment is not', () => {
    assert.equal(win.festivalOfferHasEnded(new Date('2026-11-08T23:59:59+05:30')), false);
    assert.equal(win.festivalOfferHasEnded(new Date('2026-11-09T00:00:00+05:30')), true);
  });
});

describe('currentOfferSeo', () => {
  test('before the end: the live offer copy, unchanged', () => {
    const s = seo.currentOfferSeo(new Date('2026-11-01T12:00:00+05:30'));
    assert.equal(s, seo.OFFER_SEO);
    assert.match(s.title, /Free Dash Cam/);
  });
  test('after the end: an ended notice that promises nothing, with the same path and image', () => {
    const s = seo.currentOfferSeo(new Date('2026-11-09T12:00:00+05:30'));
    assert.equal(s.path, '/offer/de-dhana-dhan');
    assert.equal(s.image, seo.OFFER_SEO.image);
    assert.match(s.title, /Ended/);
    assert.match(s.description, /ended on 8 November 2026/);
    assert.ok(s.title.length <= 60, `${s.title.length} characters`);
    assert.ok(s.description.length >= 70 && s.description.length <= 160, `${s.description.length} characters`);
    for (const text of [s.title, s.description, s.lede]) {
      assert.ok(!/free dash cam|₹\s?99|₹\s?499|book your slot|valid till|limited time/i.test(text), text);
    }
  });
});

describe('the page was removed (410 Gone), not just marked ended', () => {
  test('no client route and no page component remain', () => {
    assert.ok(!fs.existsSync(path.join(repoRoot, 'client/src/pages/offer.tsx')));
    assert.ok(!/de-dhana-dhan|pages\/offer"/.test(read('client/src/App.tsx')), 'App.tsx no longer routes it');
  });

  test('it is no longer in the static SEO list, so it is not prerendered', () => {
    assert.ok(!seo.STATIC_SEO_PAGES.some((p) => p.path === '/offer/de-dhana-dhan'));
    assert.ok(!/OFFER_SEO\.path|currentOfferSeo\(\)/.test(read('scripts/prerender.mjs').replace(/\/\/.*$/gm, '')), 'prerender does not special-case it');
  });

  test('the server answers it 410 early, with or without a trailing slash, GET and HEAD only', () => {
    const src = read('server/middleware/gone-paths.ts');
    assert.match(src, /REMOVED_PAGES[^=]*=\s*new Set\(\["\/offer\/de-dhana-dhan"\]\)/);
    assert.match(src, /req\.method !== "GET" && req\.method !== "HEAD"\) return next\(\)/);
    assert.match(src, /return sendGone\(res\)/);
    const idx = read('server/index.ts');
    assert.ok(idx.indexOf('app.use(goneForRemovedPages)') > 0 && idx.indexOf('app.use(goneForRemovedPages)') < idx.indexOf('app.use(stripTrailingSlash)'), 'mounted before the slash redirect');
  });

  test('it is not in the sitemap and has no redirect', () => {
    const routes = read('server/routes.ts');
    const start = routes.indexOf('app.get("/sitemap.xml"');
    assert.ok(start > 0, 'found the sitemap handler');
    assert.ok(!/de-dhana-dhan/.test(routes.slice(start, start + 6000)), 'not listed in the sitemap handler');
    assert.ok(!/redirect\([^)]*de-dhana/.test(routes), 'no redirect');
  });

  test('a build contains no prerendered file for it', { skip: !fs.existsSync(DIST) ? 'run `npm run build` first' : false }, () => {
    assert.ok(!fs.existsSync(path.join(DIST, 'offer', 'de-dhana-dhan', 'index.html')));
  });
});
