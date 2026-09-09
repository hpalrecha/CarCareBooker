/**
 * Blog hub structure and SEO invariants.
 *
 *   npm test
 *
 * The editorial hub earns its keep only if each listing is a real, crawlable URL and each
 * page has one honest heading hierarchy. These are the rules that are cheap to break and
 * expensive to notice: a category added to a post but not to the sitemap, a filter turned
 * into a click handler, an image without dimensions reintroducing layout shift.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const posts = read('client/src/lib/blog-posts.ts');
const index = read('client/src/pages/blog-index.tsx');
const routes = read('server/routes.ts');
const editorial = read('client/src/styles/editorial.css');

/** Categories declared on posts, via the same slug rule the app uses. */
function categories() {
  const found = [...posts.matchAll(/category:\s*"([^"]+)"/g)].map((m) => m[1]);
  return [...new Set(found)];
}
const slugify = (c) =>
  c.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

describe('every category is reachable and indexable', () => {
  test('categories exist and derive clean slugs', () => {
    const cats = categories();
    assert.ok(cats.length >= 2, 'expected at least two categories');
    for (const c of cats) {
      const slug = slugify(c);
      assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `"${c}" produced a bad slug: "${slug}"`);
    }
  });

  test('each category listing is in the sitemap', () => {
    for (const c of categories()) {
      const loc = `/blog/category/${slugify(c)}`;
      assert.ok(
        routes.includes(`{ loc: "${loc}"`),
        `${loc} is missing from the sitemap — the category page exists but nothing points ` +
          `a crawler at it, so it will never be discovered`,
      );
    }
  });

  test('the category list is derived from the posts, not hand-kept', () => {
    // A separate hardcoded list lets a post carry a category the filter cannot show,
    // making that post unreachable from the index.
    assert.match(posts, /export function blogCategories\(\)/);
    assert.match(posts, /for \(const post of BLOG_POSTS\)/);
    assert.match(index, /blogCategories\(\)/);
  });

  test('an unknown category slug renders the 404, not an empty page', () => {
    // An empty listing returning 200 is a soft 404: indexed, ranks for nothing, and it
    // hides the typo that caused it.
    assert.match(index, /unknownCategory/);
    assert.match(index, /if \(unknownCategory\) return <NotFound \/>;/);
  });
});

describe('the category filter is navigation, not state', () => {
  test('categories are links to URLs', () => {
    assert.match(index, /<nav className="ed-cats" aria-label="Guide categories">/);
    assert.match(index, /href=\{`\/blog\/category\/\$\{categorySlug\(c\)\}`\}/);
  });

  test('no onClick filtering', () => {
    // A click handler would leave the site with one indexable listing page.
    const nav = index.slice(index.indexOf('ed-cats'), index.indexOf('</nav>'));
    assert.ok(!/onClick/.test(nav), 'the category nav must not filter in JavaScript');
  });

  test('the active category is exposed to assistive tech, not just coloured', () => {
    assert.match(index, /aria-current=\{category === c \? "page" : undefined\}/);
    // and the styling hooks off that same attribute, so they cannot disagree
    assert.match(editorial, /\.ed-cat\[aria-current="page"\]/);
  });
});

describe('heading hierarchy', () => {
  test('the index has exactly one h1', () => {
    const h1s = (index.match(/<h1[\s>]/g) || []).length;
    assert.equal(h1s, 1, `expected exactly one <h1>, found ${h1s}`);
  });

  test('the h1 changes with the listing', () => {
    // Otherwise every category page is a duplicate of /blog with different cards.
    const h1 = index.slice(index.indexOf('<h1'), index.indexOf('</h1>'));
    assert.match(h1, /category/, 'the h1 must reflect the category being listed');
  });

  test('no heading level is skipped in the index', () => {
    const levels = [...index.matchAll(/<h([1-3])[\s>]/g)].map((m) => Number(m[1]));
    let seen = 0;
    for (const level of levels) {
      assert.ok(level <= seen + 1, `h${level} follows h${seen} — a level was skipped`);
      seen = Math.max(seen, level);
    }
  });
});

describe('layout stability', () => {
  test('every image in the index declares width and height', () => {
    // Reserved boxes are what stop the grid jumping as thumbnails arrive.
    const imgs = [...index.matchAll(/<ImageWithFallback[\s\S]*?\/>/g)].map((m) => m[0]);
    assert.ok(imgs.length >= 2, 'expected the featured image and card images');
    for (const img of imgs) {
      assert.match(img, /width=\{\d+\}/, `missing width: ${img.slice(0, 60)}`);
      assert.match(img, /height=\{\d+\}/, `missing height: ${img.slice(0, 60)}`);
      assert.match(img, /sizes=/, `missing sizes, so the browser assumes 100vw: ${img.slice(0, 60)}`);
    }
  });

  test('card and featured images have a fixed aspect ratio', () => {
    assert.match(editorial, /\.ed-featured-img img[\s\S]*?aspect-ratio/);
    assert.match(editorial, /\.ed-card-img img[\s\S]*?aspect-ratio/);
  });

  test('animation is composited only', () => {
    // transform/opacity never trigger layout. Animating height or margin here would
    // reintroduce exactly the CLS this phase removed.
    // Bounded to the keyframes block itself. Slicing to end-of-file would sweep in every
    // later rule (.ed-dot sets height: 3px) and fail for no reason.
    const m = /@keyframes ed-rise\s*\{([\s\S]*?\n\s*\})\s*\}/.exec(editorial);
    assert.ok(m, 'ed-rise keyframes not found');
    const motion = m[1];
    assert.match(motion, /transform: translate3d/);
    assert.match(motion, /opacity/);
    const animatable = [...motion.matchAll(/^\s*([a-z-]+)\s*:/gm)].map((x) => x[1]);
    for (const prop of animatable) {
      assert.ok(
        prop === 'transform' || prop === 'opacity',
        `"${prop}" is animated — only transform and opacity are composited; anything else ` +
          `triggers layout and reintroduces the CLS this phase removed`,
      );
    }
  });

  test('motion respects prefers-reduced-motion', () => {
    assert.match(editorial, /@media \(prefers-reduced-motion: no-preference\)/);
  });
});

describe('the editorial layer stays scoped', () => {
  test('every rule is under .p91x-editorial', () => {
    // Generic names like .ed-card are only safe because they are scoped; an unscoped rule
    // here would reach the admin screens.
    const selectors = editorial
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((block) => block.split('{')[0].trim())
      .filter((s) => s && !s.startsWith('@') && !s.startsWith('from') && !s.startsWith('to'));
    for (const sel of selectors) {
      for (const part of sel.split(',').map((s) => s.trim()).filter(Boolean)) {
        assert.ok(
          part.includes('.p91x-editorial'),
          `unscoped selector would leak site-wide: "${part}"`,
        );
      }
    }
  });

  test('the blog index opts into both layers', () => {
    // .p91x supplies header, footer and buttons; .p91x-editorial supplies the reading
    // treatment. Dropping either leaves the page half-styled.
    assert.match(index, /className="p91x p91x-editorial min-h-screen"/);
  });
});
