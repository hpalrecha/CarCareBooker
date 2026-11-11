/**
 * Structured data on blog articles.
 *
 * THE DEFECT THIS GUARDS. Every blog post declared its publisher as `AutoRepair` (a LocalBusiness subtype) with
 * only a name and an @id. On a blog page that node had no address, so validators reported "LocalBusiness: address
 * missing" once per article (eight in the Semrush audit of 2026-11-11). The article is the subject of the page; the
 * studio, with its confirmed address, is described on the home page, /contact and the service pages.
 *
 * Two halves:
 *   builder   runs always: the schema function, for every post in BLOG_POSTS.
 *   prerendered  runs against dist/ after `npm run build`: the HTML a crawler without JavaScript reads.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const ORIGIN = 'https://p91carcare.com';
const DIST = path.join(repoRoot, 'dist', 'public');
const built = fs.existsSync(path.join(DIST, 'blog'));

/** schema.org types that are, or extend, LocalBusiness and therefore need an address. */
const LOCAL_BUSINESS_TYPES = new Set(['LocalBusiness', 'AutoRepair', 'AutomotiveBusiness', 'Store', 'ProfessionalService']);

/** Every node of a JSON-LD value, with its @type list. */
function* nodes(value) {
  if (Array.isArray(value)) { for (const v of value) yield* nodes(v); return; }
  if (value && typeof value === 'object') {
    yield value;
    for (const v of Object.values(value)) yield* nodes(v);
  }
}
const typesOf = (n) => [].concat(n['@type'] ?? []);
/** Every string that is an absolute URL. */
function* urlStrings(value) {
  if (typeof value === 'string') { if (/^https?:\/\//.test(value)) yield value; return; }
  if (Array.isArray(value)) { for (const v of value) yield* urlStrings(v); return; }
  if (value && typeof value === 'object') for (const v of Object.values(value)) yield* urlStrings(v);
}
const jsonLdOf = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));

let content;
before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'blog-schema-test.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'scripts', 'prerender-content-entry.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
    alias: { '@': path.join(repoRoot, 'client', 'src') },
  });
  content = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

describe('the BlogPosting builder, for every post', () => {
  test('there are posts to check (eight at the time of the audit)', () => {
    assert.ok(content.BLOG_POSTS.length >= 8, `${content.BLOG_POSTS.length} posts`);
  });

  test('publisher is an Organization with a name, a site URL and a logo, and is not a LocalBusiness', () => {
    for (const p of content.BLOG_POSTS) {
      const s = content.blogPostingSchema(p, ORIGIN, content.BLOG_AUTHOR);
      assert.equal(s['@type'], 'BlogPosting', p.slug);
      assert.deepEqual(typesOf(s.publisher), ['Organization'], `${p.slug}: publisher type`);
      assert.equal(s.publisher.name, 'P91 Car Care', p.slug);
      assert.equal(s.publisher.url, ORIGIN, p.slug);
      assert.equal(s.publisher.logo['@type'], 'ImageObject', p.slug);
      assert.ok(s.publisher.logo.url.startsWith(ORIGIN + '/'), p.slug);
      assert.equal(s.publisher['@id'], undefined, `${p.slug}: no pointer at the business entity`);
      for (const n of nodes(s)) {
        for (const t of typesOf(n)) assert.ok(!LOCAL_BUSINESS_TYPES.has(t), `${p.slug}: ${t} must not appear on an article`);
      }
    }
  });

  test('the article itself is unchanged: headline, dates, author and url (its id is the only change)', () => {
    for (const p of content.BLOG_POSTS) {
      const s = content.blogPostingSchema(p, ORIGIN, content.BLOG_AUTHOR);
      assert.equal(s['@id'], `${ORIGIN}/blog/${p.slug}#article`, 'the article has its own id');
      assert.equal(s.mainEntityOfPage['@id'], `${ORIGIN}/blog/${p.slug}`, 'the page is the article URL');
      assert.notEqual(s['@id'], s.mainEntityOfPage['@id'], 'one id must not name two entities');
      assert.equal(s.url, `${ORIGIN}/blog/${p.slug}`);
      assert.equal(s.headline, p.title);
      assert.equal(s.description, p.excerpt);
      assert.equal(s.datePublished, p.date);
      assert.equal(s.dateModified, p.updated || p.date);
      assert.deepEqual(s.author, { '@type': 'Organization', name: content.BLOG_AUTHOR, url: ORIGIN });
      assert.equal(s.inLanguage, 'en-IN');
    }
  });

  test('an image is included only when the caller supplies one (the prerenderer never did)', () => {
    const p = content.BLOG_POSTS[0];
    assert.equal('image' in content.blogPostingSchema(p, ORIGIN, content.BLOG_AUTHOR), false);
    assert.equal(content.blogPostingSchema(p, ORIGIN, content.BLOG_AUTHOR, ORIGIN + '/x.jpg').image, ORIGIN + '/x.jpg');
  });

  test('every URL in the schema is valid: no raw spaces', () => {
    for (const p of content.BLOG_POSTS) {
      for (const u of urlStrings(content.blogPostingSchema(p, ORIGIN, content.BLOG_AUTHOR, ORIGIN + '/a b.jpg'.replace(' ', '%20')))) {
        assert.ok(!/\s/.test(u), `${p.slug}: "${u}"`);
      }
    }
  });
});

describe('the verified business entity is preserved', () => {
  test('localBusinessSchema still returns the complete AutoRepair with the confirmed address', () => {
    const b = content.localBusinessSchema(ORIGIN);
    assert.equal(b['@type'], 'AutoRepair');
    assert.equal(b['@id'], `${ORIGIN}/#business`);
    assert.equal(b.address.streetAddress, '49, 13th Cross, Ayappa Garden, Adugodi');
    assert.equal(b.address.postalCode, '560030');
    assert.equal(b.address.addressLocality, 'Bengaluru');
    assert.equal(b.telephone, '+917406619191');
  });

  test('its image URL is percent-encoded and points at the same file', () => {
    const b = content.localBusinessSchema(ORIGIN);
    assert.equal(b.image, `${ORIGIN}/Car%20Care%20(4)_1753951564515.png`);
    assert.ok(fs.existsSync(path.join(repoRoot, 'client', 'public', 'Car Care (4)_1753951564515.png')), 'the logo file exists');
  });
});

describe('the two emitters use the shared builder', () => {
  test('blog-post.tsx and prerender.mjs no longer build their own publisher', () => {
    const page = read('client/src/pages/blog-post.tsx');
    const prerender = read('scripts/prerender.mjs');
    assert.match(page, /blogPostingSchema\(post, origin, BLOG_AUTHOR, absoluteImage\)/);
    assert.match(prerender, /content\.blogPostingSchema\(p, ORIGIN, content\.BLOG_AUTHOR\)/);
    assert.ok(!/AutoRepair/.test(page), 'blog-post.tsx must not mention AutoRepair');
    const blogLoop = prerender.slice(prerender.indexOf('for (const p of BLOG_POSTS)'), prerender.indexOf('/products/stek, /products/nasiol'));
    assert.ok(!/AutoRepair/.test(blogLoop), 'the prerendered blog loop must not mention AutoRepair');
  });
});

describe('prerendered HTML after `npm run build`', { skip: !built ? 'run `npm run build` first' : false }, () => {
  const slugs = () => fs.readdirSync(path.join(DIST, 'blog'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'category').map((d) => d.name);

  test('every article file carries a BlogPosting with an Organization publisher and no LocalBusiness node', () => {
    const found = slugs();
    assert.ok(found.length >= 8, `${found.length} article files`);
    for (const slug of found) {
      const blocks = jsonLdOf(fs.readFileSync(path.join(DIST, 'blog', slug, 'index.html'), 'utf8'));
      const posting = blocks.flatMap((b) => [...nodes(b)]).find((n) => typesOf(n).includes('BlogPosting'));
      assert.ok(posting, `${slug}: BlogPosting`);
      assert.deepEqual(typesOf(posting.publisher), ['Organization'], `${slug}: publisher`);
      assert.ok(posting.publisher.logo?.url, `${slug}: logo`);
      for (const b of blocks) for (const n of nodes(b)) for (const t of typesOf(n)) {
        assert.ok(!LOCAL_BUSINESS_TYPES.has(t), `${slug}: ${t} in the prerendered article`);
      }
    }
  });

  test('every prerendered article was produced from a post in BLOG_POSTS (none missed)', () => {
    assert.deepEqual(slugs().sort(), content.BLOG_POSTS.map((p) => p.slug).sort());
  });

  test('no URL inside any prerendered JSON-LD contains a raw space (all pages)', () => {
    const files = [];
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'assets' && e.name !== 'attached_assets') walk(f); } else if (e.name === 'index.html') files.push(f);
    } };
    walk(DIST);
    assert.ok(files.length > 20, `${files.length} prerendered pages`);
    for (const f of files) {
      for (const block of jsonLdOf(fs.readFileSync(f, 'utf8'))) {
        for (const u of urlStrings(block)) assert.ok(!/\s/.test(u), `${path.relative(DIST, f)}: "${u}"`);
      }
    }
  });

  test('the home page still carries the complete business entity with its address', () => {
    const blocks = jsonLdOf(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'));
    const biz = blocks.flatMap((b) => [...nodes(b)]).find((n) => typesOf(n).includes('AutoRepair'));
    assert.ok(biz, 'AutoRepair on the home page');
    assert.equal(biz.address.streetAddress, '49, 13th Cross, Ayappa Garden, Adugodi');
  });
});
