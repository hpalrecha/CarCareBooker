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
    assert.equal(reels.length, 9);
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
    // No car-PPF reel exists, so car PPF pages borrow nothing (not even the motorcycle one).
    for (const slug of ['ppf-hatchback', 'ppf-sedan', 'ppf-suv', 'partial-ppf-hatchback', 'headlight-restoration-both', 'windshield-glass-polishing', 'windshield-glass-coating-new', 'interior-detailing-service']) {
      assert.equal(byService[slug], undefined, `${slug} must not show an unrelated reel`);
    }
    assert.deepEqual(byService['1-year-ceramic-coating'].map((r) => r.id), ['DciryBCjLvC', 'Dc8N-qdDiLm']);
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

  test('used on service pages, the PPF/ceramic page, blog posts, and linked in the footer', () => {
    assert.match(read('client/src/pages/service-landing.tsx'), /reels=\{REELS_BY_SERVICE\[service\.slug\] \?\? \[\]\}/);
    assert.match(read('client/src/pages/ppf-ceramic-landing.tsx'), /reels=\{REELS_FOR_PPF_CERAMIC_PAGE\}/);
    assert.match(read('client/src/pages/blog-post.tsx'), /reels=\{REELS_BY_POST\[post\.slug\] \?\? \[\]\}/);
    assert.match(read('client/src/components/redesign/site-footer.tsx'), /data-testid="link-footer-instagram"/);
    // service-landing.tsx used to carry a second, page-own Instagram link in its final
    // "Ready to Transform Your Car?" CTA banner, removed by request from every service
    // page — the footer's link above is the only one left on these pages now.
  });

  test('the unverified YouTube shorts are gone from /ppf-ceramic-coating', () => {
    assert.doesNotMatch(read('client/src/pages/ppf-ceramic-landing.tsx'), /youtube\.com\/embed/);
  });
});
