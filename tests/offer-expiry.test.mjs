/**
 * The expired offer page: /offer/de-dhana-dhan must not present the De Dhana Dhan promotion as available after 8 November
 * 2026, and must keep everything else about the page (canonical, robots, sitemap, no redirect).
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
const built = fs.existsSync(path.join(DIST, 'offer', 'de-dhana-dhan', 'index.html'));
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

describe('the page component', () => {
  test('uses the date-aware metadata and shows "Limited time" only while live', () => {
    const page = read('client/src/pages/offer.tsx');
    assert.match(page, /currentOfferSeo\(\)/);
    assert.match(page, /festivalOfferSchema\("https:\/\/p91carcare\.com"\) \?\? undefined/);
    assert.match(page, /live \? `\$\{o\.kicker\} · Limited time` : o\.kicker/);
    assert.ok(!/OFFER_SEO\./.test(page.replace(/\/\*[\s\S]*?\*\//g, '')), 'the page no longer reads the live constant directly');
  });
});

describe('the prerendered page (after `npm run build`)', { skip: !built ? 'run `npm run build` first' : false }, () => {
  const html = () => read('dist/public/offer/de-dhana-dhan/index.html');

  test('canonical, robots and the path are unchanged', () => {
    assert.match(html(), /<link rel="canonical" href="https:\/\/p91carcare\.com\/offer\/de-dhana-dhan"/);
    assert.match(html(), /<meta name="robots" content="index,follow"/);
  });

  test('the offer is stated as ended once the build date is past the end', { skip: !ended ? 'built before the offer ended' : false }, () => {
    const h = html();
    assert.match(h, /<title>De Dhana Dhan Offer \(Ended\)/);
    assert.match(h, /name="description" content="The De Dhana Dhan Dussehra and Diwali offer ended on 8 November 2026/);
    assert.match(h, /This offer ended on 8 November 2026/);
    assert.ok(!/Free Dash Cam|Slots ₹499|Valid till 8 November/i.test(h.replace(/<script[\s\S]*?<\/script>/g, '')), 'no live promotion text in the page');
    assert.ok(!/"@type":"Offer"/.test(h) && !/InStock/.test(h));
  });

  test('the page is still not in the sitemap and no redirect was added for it', () => {
    const routes = read('server/routes.ts');
    const start = routes.indexOf('app.get("/sitemap.xml"');
    assert.ok(start > 0, 'found the sitemap handler');
    assert.ok(!/de-dhana-dhan/.test(routes.slice(start, start + 6000)), 'not listed in the sitemap handler');
    assert.ok(!/redirect\([^)]*de-dhana/.test(routes), 'no redirect');
  });
});
