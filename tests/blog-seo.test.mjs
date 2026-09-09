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

describe('the build can actually run in the container', () => {
  const pkg = JSON.parse(read('package.json'));
  const dockerignore = read('.dockerignore');

  /** Does .dockerignore exclude this path, honouring later `!` negations? */
  function isIgnored(file) {
    const patterns = dockerignore
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    // Only the pattern shapes this file actually uses — an exact path, a directory
    // prefix, and `dir/*.ext`. Deliberately not a reimplementation of Docker's matcher:
    // a wrong answer here would be worse than no test at all.
    const matches = (pattern, target) => {
      if (pattern.includes('*')) {
        const cut = pattern.lastIndexOf('/') + 1;
        const dir = pattern.slice(0, cut);
        const tail = pattern.slice(cut);
        if (!target.startsWith(dir)) return false;
        const name = target.slice(dir.length);
        if (name.includes('/')) return false; // a single * does not cross directories
        return name.endsWith(tail.startsWith('*') ? tail.slice(1) : tail);
      }
      return target === pattern || target.startsWith(pattern + '/');
    };

    // Last matching pattern wins, which is how Docker resolves `!` re-inclusion.
    let ignored = false;
    for (const pattern of patterns) {
      const negate = pattern.startsWith('!');
      const body = negate ? pattern.slice(1) : pattern;
      if (matches(body, file)) ignored = !negate;
    }
    return ignored;
  }

  test('the matcher itself is right', () => {
    // A matcher that always returned false would make every assertion below pass.
    assert.equal(isIgnored('scripts/build-erp-poller-workflow.mjs'), true, 'local tooling stays out');
    assert.equal(isIgnored('scripts/optimize-images.mjs'), false, 're-included by name');
    assert.equal(isIgnored('tests/blog-seo.test.mjs'), true, 'tests stay out');
    assert.equal(isIgnored('client/src/main.tsx'), false, 'app source is included');
  });

  test('every script the build invokes is in the Docker build context', () => {
    // This failed in production: `npm run build` called scripts/optimize-images.mjs while
    // .dockerignore excluded scripts/*.mjs, so the container build died with
    // MODULE_NOT_FOUND and auto-deploy silently stopped shipping.
    const invoked = [...pkg.scripts.build.matchAll(/(scripts\/[\w-]+\.mjs)/g)].map((m) => m[1]);
    assert.ok(invoked.length >= 2, 'expected the build to invoke the image and prerender scripts');
    for (const file of invoked) {
      assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} does not exist`);
      assert.ok(
        !isIgnored(file),
        `${file} is excluded by .dockerignore but the build runs it — the container build ` +
          `will fail with "Cannot find module /app/${file}"`,
      );
    }
  });

  test('sharp cannot break npm ci', () => {
    // A native binary that fails to build must not take the whole install with it. The
    // optimiser already degrades to original images; the install has to degrade too.
    assert.ok(!('sharp' in (pkg.dependencies || {})), 'sharp must not be a hard dependency');
    assert.ok(!('sharp' in (pkg.devDependencies || {})), 'sharp must not be a devDependency');
    assert.ok(
      'sharp' in (pkg.optionalDependencies || {}),
      'sharp belongs in optionalDependencies so npm ci survives a failed native build',
    );
  });

  test('the prerender content entry is not excluded either', () => {
    // It is a .ts file, so scripts/*.mjs does not cover it — but if that pattern is ever
    // widened this catches it.
    assert.ok(!isIgnored('scripts/prerender-content-entry.ts'));
  });
});
