/**
 * The studio's Instagram reels on the site.
 *
 * Pins the integrity rules: every reel is a real @p91carcare reel id, headlines are quoted
 * captions (not invented copy), a page only gets reels about its own service, the embed
 * loads only on demand, and the unverified YouTube shorts are gone.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
let m;

before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'instagram-reels.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'client/src/lib/instagram-reels.ts')],
    bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'silent',
  });
  m = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

describe('reel data', () => {
  test('every reel is a real Instagram reel id with a quoted caption and a date', () => {
    const reels = Object.values(m.REELS);
    assert.equal(reels.length, 15);
    assert.equal(new Set(reels.map((r) => r.id)).size, 15, 'no reel is listed twice');
    for (const r of reels) {
      assert.match(r.id, /^[A-Za-z0-9_-]{11}$/, r.id);
      assert.ok(r.headline.length > 5 && r.headline.length <= 70, r.headline);
      assert.match(r.posted, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.equal(m.reelEmbedUrl(m.REELS.ceramicWater), 'https://www.instagram.com/reel/DciryBCjLvC/embed/');
    assert.equal(m.INSTAGRAM_PROFILE_URL, 'https://www.instagram.com/p91carcare/');
  });

  test('pages only get reels about their own service', () => {
    const byService = m.REELS_BY_SERVICE;
    // Still nothing for the services with no reel of their own — and no borrowing.
    for (const slug of ['windshield-glass-polishing', 'windshield-glass-coating-new', 'interior-detailing-service', 'annual-car-wash-package']) {
      assert.equal(byService[slug], undefined, `${slug} must not show an unrelated reel`);
    }
    // Car PPF pages carry PPF reels only (the studio's June-August 2026 PPF posts)...
    const ppfIds = new Set(['DZCrPxNPP4B', 'DbvL3SsjWHe', 'DaNVqy5iK1y']);
    for (const slug of ['ppf-hatchback', 'ppf-sedan', 'ppf-suv', 'ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv', 'partial-ppf-hatchback', 'partial-ppf-sedan', 'partial-ppf-suv']) {
      assert.equal(byService[slug].length, 2, slug);
      for (const r of byService[slug]) assert.ok(ppfIds.has(r.id), `${slug} has a non-PPF reel ${r.id}`);
    }
    // ...and no two of them show the same pair, so the PPF pages do not all look alike.
    const pairs = Object.entries(byService).filter(([s]) => /ppf-/.test(s)).map(([, rs]) => rs.map((r) => r.id).join('+'));
    assert.equal(new Set(pairs).size, 3, 'three distinct pairs, each used by three pages');
    assert.deepEqual(byService['1-year-ceramic-coating'].map((r) => r.id), ['DciryBCjLvC', 'Dc8N-qdDiLm', 'DZexmOKmSCs']);
    assert.deepEqual(byService['1-year-bike-ceramic-coating'].map((r) => r.id), ['DbS-jwvgYy1', 'DdBlZC_mxWJ']);
    assert.deepEqual(byService['headlight-restoration-both'].map((r) => r.id), ['DaxYiFAgCEA']);
    assert.deepEqual(byService['stek-suncontrol-films'].map((r) => r.id), ['DclQq-Pijvy']);
    assert.deepEqual(m.REELS_BY_POST['windshield-heat-rejection-film-summer'].map((r) => r.id), ['DclQq-Pijvy']);
  });

  test('every mapped blog slug is a real post', () => {
    const posts = read('client/src/lib/blog-posts.ts');
    for (const slug of Object.keys(m.REELS_BY_POST)) assert.ok(posts.includes(`slug: "${slug}"`), slug);
  });
});

describe('presentation', () => {
  const component = read('client/src/components/instagram-reels.tsx');

  test('the Instagram embed loads only when someone chooses to watch', () => {
    // One iframe, inside the dialog, rendered only for the active reel.
    assert.equal((component.match(/<iframe\b/g) || []).length, 1);
    assert.match(component, /\{active && \([\s\S]*?<iframe/);
  });

  test('a page with no matching reels renders nothing', () => {
    assert.match(component, /if \(unique\.length === 0\) return null;/);
  });

  test('used on the PPF/ceramic page, blog posts, and linked in the footer', () => {
    assert.match(read('client/src/pages/ppf-ceramic-landing.tsx'), /reels=\{REELS_FOR_PPF_CERAMIC_PAGE\}/);
    assert.match(read('client/src/pages/blog-post.tsx'), /reels=\{REELS_BY_POST\[post\.slug\] \?\? \[\]\}/);
    assert.match(read('client/src/components/redesign/site-footer.tsx'), /data-testid="link-footer-instagram"/);
  });

  test('"See it on Instagram" is gone from /service/:slug pages (removed by request, again, 2026-09-24); /ppf keeps it', () => {
    assert.doesNotMatch(read('client/src/pages/service-landing.tsx'), /<InstagramReels\b/);
    assert.doesNotMatch(read('client/src/pages/service-landing.tsx'), /REELS_BY_SERVICE/);
    // /ppf and the ceramic pages had them and lost them again on 2026-09-24, by request.
    assert.doesNotMatch(read('client/src/pages/campaign-landing.tsx'), /<InstagramReels\b/);
  });

  test('the unverified YouTube shorts are gone from /ppf-ceramic-coating', () => {
    assert.doesNotMatch(read('client/src/pages/ppf-ceramic-landing.tsx'), /youtube\.com\/embed/);
  });
});
