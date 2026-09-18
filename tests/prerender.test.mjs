/**
 * The prerender contract.
 *
 *   npm test
 *
 * scripts/prerender.mjs bakes each route's title, canonical and JSON-LD into static HTML,
 * because this is a client-rendered SPA and every crawler otherwise receives one generic
 * shell for every URL.
 *
 * Two failure modes are worth a permanent test:
 *
 *   1. DRIFT. Nothing is duplicated any more: the hand-written pages read their copy from
 *      lib/static-seo.ts, and blog posts, guides and campaign pages from their content
 *      modules, and the script imports the same modules. These tests fail if a literal copy
 *      comes back.
 *
 *   2. WIRING. Prerendered files on disk do nothing unless the server prefers them over
 *      the SPA catch-all, and the build must actually run the script. Both are asserted
 *      against source rather than a built artefact, so the suite works on a clean checkout.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const script = read('scripts/prerender.mjs');

/*
 * The hand-written pages' SEO copy now lives in client/src/lib/static-seo.ts, imported by
 * BOTH the page components and the prerender script. It used to be duplicated in a
 * STATIC_ROUTES table here and compared by TITLE only — which is how the /services and
 * /ppf-ceramic-coating descriptions drifted apart unnoticed.
 */
describe('prerendered metadata matches the page it represents', () => {
  const PAIRS = [
    ['HOME_SEO', 'client/src/pages/home.tsx'],
    ['CONTACT_SEO', 'client/src/pages/contact.tsx'],
    ['SERVICES_SEO', 'client/src/pages/services.tsx'],
    ['PPF_CERAMIC_SEO', 'client/src/pages/ppf-ceramic-landing.tsx'],
  ];

  for (const [constant, file] of PAIRS) {
    test(`${file.split('/').pop()} reads its title AND description from ${constant}`, () => {
      const src = read(file);
      const call = src.slice(src.indexOf('useSeoMeta({'));
      assert.ok(call.includes(`title: ${constant}.title`), 'title must come from the shared constant');
      assert.ok(
        call.includes(`description: ${constant}.description`),
        'description must come from the shared constant — descriptions are what drifted',
      );
    });
  }

  test('the prerender script carries no copy of its own', () => {
    assert.ok(!script.includes('const STATIC_ROUTES'), 'the duplicated table must not come back');
    assert.match(script, /STATIC_SEO_PAGES\.map\(/);
    assert.match(read('scripts/prerender-content-entry.ts'), /export \{ STATIC_SEO_PAGES/);
  });

  test('the blog index title is a shared constant, not duplicated', () => {
    // It used to live in STATIC_ROUTES and in the component. Both now read one export,
    // so there is nothing left to drift.
    assert.ok(!/path:\s*"\/blog",\s*\n\s*title:\s*"/.test(script), '/blog title must not be a literal copy');
    assert.match(script, /title: BLOG_INDEX_TITLE/);
    assert.match(read('client/src/pages/blog-index.tsx'), /BLOG_INDEX_TITLE/);
  });

  test('category listings are prerendered, one per category', () => {
    assert.match(script, /content\.blogCategories\(\)/);
    assert.ok(
      script.includes('path: `/blog/category/${slug}`'),
      'each category needs its own prerendered URL, or the nav links to pages that only exist client-side',
    );
    assert.ok(
      script.includes('if (!posts.length) continue'),
      'an empty category page is a soft 404: indexed, ranks for nothing, hides the typo',
    );
  });

  test('blog posts, SEO pages and campaign landing pages are imported, never duplicated', () => {
    const entry = read('scripts/prerender-content-entry.ts');
    assert.match(entry, /BLOG_POSTS,/);
    assert.match(entry, /export \{ SEO_PAGES \} from "@\/lib\/seo-pages"/);
    assert.match(entry, /export \{ LANDING_PAGES \} from "@\/lib\/landing-pages"/);

    // The script must read them from the bundle, not carry its own copies.
    assert.match(script, /const content = await loadContent\(\)/);
    // Matched as a SET rather than as one exact line: the destructure grows every time a
    // content module is added, and pinning its literal text made this test fail for a
    // reason that had nothing to do with the contract it exists to protect.
    const destructure = /const \{([^}]*)\} = content;/.exec(script);
    assert.ok(destructure, 'the script destructures the bundled content');
    for (const name of ['BLOG_POSTS', 'SEO_PAGES', 'LANDING_PAGES', 'BLOG_INDEX_TITLE']) {
      assert.ok(destructure[1].includes(name), `${name} must be read from the bundle`);
    }

    assert.ok(
      !/slug:\s*"ppf-vs-ceramic-coating-bangalore"/.test(script),
      'post content must not be copied into the prerender script',
    );
    assert.ok(
      !/path:\s*"\/ceramic-coating\/car"/.test(script),
      'campaign page content must not be copied into the prerender script',
    );
  });
});

describe('prerendering fails the build rather than degrading', () => {
  test('every error path exits non-zero', () => {
    assert.match(script, /function die\(message\)/);
    assert.match(script, /process\.exit\(1\)/);
    // The image pipeline deliberately exits 0 on failure; this one must not.
    assert.ok(
      !/process\.exit\(0\)/.test(script),
      'a silent success here would ship a generic <title> on every URL',
    );
    assert.match(script, /main\(\)\.catch\(\(error\) => die\(/);
  });

  test('the output is validated, not just written', () => {
    assert.match(script, /no usable <title> emitted/);
    assert.match(script, /no canonical emitted/);
    assert.match(script, /JSON-LD did not survive injection/);
    assert.match(script, /expected exactly 1/);
  });

  test('the shell own title is stripped so no page ships two', () => {
    assert.match(script, /could not strip the shell's own <title>/);
  });
});

describe('the server prefers prerendered HTML', () => {
  const vite = read('server/vite.ts');

  test('a directory index is served without a trailing-slash redirect', () => {
    // express.static's default redirect would 301 /blog -> /blog/, contradicting the
    // canonical baked into that very page.
    assert.match(vite, /express\.static\(distPath, \{ redirect: false \}\)/);
  });

  test('the prerender lookup sits before the SPA catch-all', () => {
    // Scoped to serveStatic(): setupVite() has its own app.use("*") for the dev server,
    // earlier in the file, and comparing against that one proves nothing.
    const prod = vite.slice(vite.indexOf('export function serveStatic'));
    assert.ok(prod.length > 0, 'serveStatic not found');
    const lookup = prod.indexOf('const candidate = path.resolve(distPath');
    const catchAll = prod.indexOf('app.use("*"');
    assert.ok(lookup > -1, 'no prerendered-file lookup in serveStatic');
    assert.ok(catchAll > -1, 'no SPA catch-all in serveStatic');
    assert.ok(lookup < catchAll, 'the catch-all would answer first and prerendering would be dead weight');
  });

  test('the lookup cannot escape the build directory', () => {
    assert.match(vite, /candidate\.startsWith\(distPath \+ path\.sep\)/);
  });

  test('unmatched URLs get the noindex 404 shell, not the homepage', () => {
    assert.match(vite, /404\.html/);
    assert.match(script, /robots" content="noindex/);
    const idx = vite.indexOf('const notFound = path.resolve(distPath, "404.html")');
    assert.ok(idx > -1, 'the catch-all must prefer 404.html');
  });
});

describe('the build runs it, in the right order', () => {
  const pkg = JSON.parse(read('package.json'));

  test('prerender runs after vite build', () => {
    const build = pkg.scripts.build;
    assert.match(build, /prerender\.mjs/);
    assert.ok(
      build.indexOf('vite build') < build.indexOf('prerender.mjs'),
      'prerendering reads dist/public/index.html, which vite writes',
    );
  });

  test('the font fetch is NOT in the build', () => {
    // Downloading from fonts.googleapis.com at build time would make a Google outage a
    // failed deploy here.
    assert.ok(!/fetch-fonts/.test(pkg.scripts.build), 'the build must not depend on Google');
  });
});
