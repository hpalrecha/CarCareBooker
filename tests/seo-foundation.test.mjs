/**
 * Phase 1 SEO/GEO foundation.
 *
 * Verified against production before any change (2026-09-17):
 *   - all 41 sitemap URLs served `<div id="root"></div>`: zero words and no <h1> to any
 *     crawler that does not execute JavaScript;
 *   - the homepage and /contact carried no business schema in the raw HTML;
 *   - useSeoMeta APPENDED schema next to the prerendered copy, so pages had every block twice;
 *   - /services and /ppf-ceramic-coating sent crawlers a different description from the page;
 *   - titles ran to 77 (home), 67 (/ppf-ceramic-coating) and 62–82 (seven service records);
 *   - /llms.txt was 404.
 *
 * These tests exercise the real modules — bundled with esbuild the way the prerender script
 * bundles them — rather than pattern-matching source, wherever behaviour can be run.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

let m; // the bundled modules

before(async () => {
  const dir = path.join(repoRoot, 'node_modules', '.cache');
  fs.mkdirSync(dir, { recursive: true });
  const entry = path.join(dir, 'seo-foundation-entry.ts');
  fs.writeFileSync(
    entry,
    [
      'export * from "@/lib/static-seo";',
      'export * from "@/lib/crawlable-content";',
      'export * from "@/lib/service-seo";',
      'export * from "@/lib/llms-txt";',
      'export { SEO_PAGES } from "@/lib/seo-pages";',
      'export { BLOG_POSTS } from "@/lib/blog-posts";',
      'export { LANDING_PAGES } from "@/lib/landing-pages";',
    ].join('\n'),
  );
  const out = path.join(dir, 'seo-foundation.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
    alias: { '@': path.join(repoRoot, 'client', 'src'), '@shared': path.join(repoRoot, 'shared') },
    external: ['drizzle-orm', 'drizzle-zod', 'zod', 'drizzle-orm/*'],
  });
  m = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

const h1Count = (html) => (html.match(/<h1\b/g) || []).length;
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

/** A realistic record, shaped like production's bike ceramic row, plus hostile input. */
const SERVICE = {
  title: '1 Year Bike Ceramic Coating ',
  slug: '1-year-bike-ceramic-coating',
  metaTitle: '1 Year Bike Ceramic Coating - Motorcycle Paint Protection | P91 Car Care Bangalore',
  description: 'Protect your motorcycle with our premium 1-Year Bike Ceramic Coating.',
  price: '2999.00',
  originalPrice: '6000.00',
  whatIncluded: ['✓ UV protection', 'UV protection', 'Iron remover treatment'],
  faq: [
    { question: 'How long does it last?', answer: 'A full year with proper care.' },
    { question: '', answer: 'orphan answer with no question' },
  ],
};

describe('titles and descriptions', () => {
  test('every hand-written page: title ≤ 60, description 70–160', () => {
    for (const page of m.STATIC_SEO_PAGES) {
      assert.ok(page.title.length <= 60, `${page.path} title is ${page.title.length}: ${page.title}`);
      assert.ok(page.description.length >= 70 && page.description.length <= 160, `${page.path} description is ${page.description.length}`);
    }
  });

  test('the h1 and lede fed to crawlers are what the page actually renders', () => {
    const files = {
      '/': 'client/src/pages/home.tsx',
      '/services': 'client/src/pages/services.tsx',
      '/products': 'client/src/pages/products.tsx',
      '/contact': 'client/src/pages/contact.tsx',
      '/ppf-ceramic-coating': 'client/src/pages/ppf-ceramic-landing.tsx',
      '/privacy-policy': 'client/src/pages/privacy-policy.tsx',
      '/terms-conditions': 'client/src/pages/terms-conditions.tsx',
      '/refund-policy': 'client/src/pages/refund-policy.tsx',
    };
    for (const page of m.STATIC_SEO_PAGES) {
      // Render-ish text of the component: tags and {" "} removed, entities decoded.
      const rendered = read(files[page.path])
        .replace(/\{"\s"\}/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ');
      assert.ok(rendered.includes(page.h1), `${page.path}: h1 "${page.h1}" is not on the page`);
      if (page.lede) assert.ok(rendered.includes(page.lede), `${page.path}: lede is not on the page`);
    }
  });

  test('a database metaTitle over 60 characters falls back to the generated title', () => {
    const t = m.serviceSeoTitle(SERVICE);
    assert.equal(t, '1 Year Bike Ceramic Coating in Bangalore | P91 Car Care');
    assert.ok(t.length <= 60);
    // A metaTitle that fits is still respected.
    assert.equal(m.serviceSeoTitle({ ...SERVICE, metaTitle: 'Bike Ceramic Coating | P91' }), 'Bike Ceramic Coating | P91');
  });

  test('service descriptions fit a result snippet', () => {
    const long = { ...SERVICE, metaDescription: 'x '.repeat(230) };
    assert.ok(m.serviceSeoDescription(long).length <= 160);
  });
});

describe('crawlable content baked into the initial HTML', () => {
  test('each builder emits exactly one h1 and the snapshot marker', () => {
    const pages = [
      ...m.STATIC_SEO_PAGES.map((p) => m.staticPageContent(p)),
      ...m.SEO_PAGES.map((p) => m.seoGuideContent(p)),
      ...m.BLOG_POSTS.map((p) => m.blogPostContent(p)),
      ...m.LANDING_PAGES.map((p) => m.landingPageContent(p)),
      m.blogListContent(m.BLOG_POSTS),
      m.servicePageContent(SERVICE),
      m.servicesListContent(m.SERVICES_SEO, [SERVICE]),
    ];
    for (const html of pages) {
      assert.equal(h1Count(html), 1, html.slice(0, 160));
      assert.ok(html.includes('data-prerender="content"'));
    }
  });

  test('service content is the record: price, deduplicated items, answered FAQs only', () => {
    const t = text(m.servicePageContent(SERVICE));
    assert.ok(t.includes('1 Year Bike Ceramic Coating'));
    assert.ok(t.includes('Price: ₹2,999 (regular ₹6,000).'));
    assert.ok(!/paid at the studio/i.test(t), 'false for the annual package, which is paid online');
    assert.equal((t.match(/UV protection/g) || []).length, 1, 'duplicate item and ✓ prefix removed');
    assert.ok(t.includes('How long does it last?') && t.includes('A full year with proper care.'));
    assert.ok(!t.includes('orphan answer'), 'a FAQ without a question is not published');
  });

  test('never states a booking fee, rating or offer the page does not', () => {
    const all = [m.servicePageContent(SERVICE), ...m.LANDING_PAGES.map((p) => m.landingPageContent(p))].map(text).join(' ');
    assert.doesNotMatch(all, /₹\s?299|booking fee|\brating\b|\breviews?\b|limited time/i);
    // Offer state changes without a deploy; build-time HTML must not advertise it.
    assert.doesNotMatch(all, /current offer|free booking/i);
    // Campaign pages load prices live, so the baked HTML carries none.
    for (const p of m.LANDING_PAGES) assert.doesNotMatch(text(m.landingPageContent(p)), /₹/, p.path);
  });

  test('blog posts carry their article text', () => {
    const post = m.BLOG_POSTS[0];
    const t = text(m.blogPostContent(post));
    const firstParagraph = post.body.find((b) => b.type === 'p');
    assert.ok(t.includes(firstParagraph.text.slice(0, 60)));
  });

  test('record values are escaped (they are edited in the admin panel)', () => {
    const html = m.servicePageContent({ ...SERVICE, title: '<script>alert(1)</script>', description: '"quoted" & <b>' });
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('&quot;quoted&quot; &amp; &lt;b&gt;'));
  });

  test('injection only fills an empty root, never an already-filled one', () => {
    assert.equal(m.injectRootContent('<div id="root"></div>', 'X'), '<div id="root">X</div>');
    assert.equal(m.injectRootContent('<div id="root">Y</div>', 'X'), '<div id="root">Y</div>');
  });

  test('the app mounts with createRoot, which replaces the snapshot (no hydration to mismatch)', () => {
    const main = read('client/src/main.tsx');
    assert.match(main, /createRoot\(/);
    assert.doesNotMatch(main, /hydrateRoot/, 'hydrateRoot would try to reuse the snapshot and mismatch');
  });
});

describe('schema', () => {
  test('/services ItemList links every service to its own page', () => {
    const list = m.servicesItemListSchema([SERVICE, { title: 'Car Polishing', slug: 'car-polishing' }], 'https://p91carcare.com');
    assert.equal(list['@type'], 'ItemList');
    assert.equal(list.itemListElement.length, 2);
    assert.equal(list.itemListElement[1].url, 'https://p91carcare.com/service/car-polishing');
    assert.equal(list.itemListElement[0].name, '1 Year Bike Ceramic Coating');
  });

  test('prerendered and server-injected schema is marked, and the hook removes it (no duplicates)', () => {
    assert.match(read('scripts/prerender.mjs'), /application\/ld\+json" data-seo="prerender"/);
    const vite = read('server/vite.ts');
    assert.equal((vite.match(/data-seo="prerender"/g) || []).length >= 2, true, '/service/:slug and /services');
    const hook = read('client/src/hooks/use-seo-meta.ts');
    assert.match(hook, /\[data-seo="prerender"\]'\)/);
    // Only types the page replaces are removed, so BreadcrumbList survives on pages that
    // do not re-emit it; everything goes after an in-app navigation.
    assert.match(hook, /if \(navigatedAway \|\| !type \|\| pageTypes\.has\(type\)\) node\.remove\(\)/);
    assert.match(hook, /const navigatedAway = window\.location\.pathname !== INITIAL_PATH/);
  });

  test('the homepage and /contact get the business schema in the raw HTML', () => {
    assert.match(read('scripts/prerender.mjs'), /page\.path === "\/" \|\| page\.path === "\/contact" \? \[content\.localBusinessSchema\(ORIGIN\)\]/);
  });
});

describe('prerender and server wiring', () => {
  const script = read('scripts/prerender.mjs');
  const vite = read('server/vite.ts');

  test('every prerendered route must ship content and exactly one h1, or the build fails', () => {
    assert.match(script, /no crawlable content built/);
    assert.match(script, /crawlable content missing from #root/);
    assert.match(script, /<h1> tags in the HTML — expected exactly 1/);
  });

  test('/service/:slug and /services are filled from the database per request, with a safe fallback', () => {
    assert.match(vite, /injectRootContent\(\s*fs\.readFileSync\(appShell, "utf8"\)[\s\S]*?servicePageContent\(service/);
    assert.match(vite, /servicesListContent\(SERVICES_SEO, services/);
    assert.match(vite, /services list injection failed[\s\S]*?return res\.sendFile\(candidate\)/);
  });

  test('when a build exists, its HTML really carries the content', { skip: !fs.existsSync(path.join(repoRoot, 'dist/public/index.html')) }, () => {
    const files = ['index.html', 'contact/index.html', 'ppf/index.html', 'blog/index.html', 'services/ceramic-coating-bangalore/index.html'];
    for (const f of files) {
      const html = read(path.join('dist/public', f));
      const root = (html.match(/<div id="root">([\s\S]*?)<\/div>\s*<!--/) || [])[1] || '';
      assert.ok(text(root).split(' ').length > 25, `${f}: root has too little text`);
      assert.equal(h1Count(html), 1, `${f}: h1 count`);
    }
    // The shells must stay empty: app.html is filled per request, 404.html is noindex.
    for (const f of ['app.html', '404.html']) assert.match(read(path.join('dist/public', f)), /<div id="root"><\/div>/);
  });
});

describe('llms.txt', () => {
  test('is served by the server, not left to 404', () => {
    const routes = read('server/routes.ts');
    assert.match(routes, /app\.get\("\/llms\.txt"/);
    // Booking-page descriptions carry the live offer ("book your appointment free"), so
    // they are not republished here.
    assert.match(routes, /campaignPages: LANDING_PAGES\.map\(\(p\) => \(\{ title: p\.h1, path: p\.path \}\)\)/);
  });

  test('states only published facts: address, phone, live services and hours as stored', () => {
    const body = m.buildLlmsTxt({
      origin: 'https://p91carcare.com',
      services: [SERVICE],
      businessHours: [
        { dayOfWeek: 1, isOpen: true, openTime: '10:30', cutoffTime: '16:30' },
        { dayOfWeek: 0, isOpen: false, openTime: '10:30', cutoffTime: '15:00' },
      ],
      guides: [{ title: 'Ceramic Coating in Adugodi, Bangalore', path: '/services/ceramic-coating-bangalore' }],
    });
    assert.match(body, /^# P91 Car Care\n\n> /);
    assert.match(body, /49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru, Karnataka 560030/);
    assert.match(body, /\+91 74066 19191/);
    assert.match(body, /\[1 Year Bike Ceramic Coating\]\(https:\/\/p91carcare\.com\/service\/1-year-bike-ceramic-coating\): ₹2,999$/m);
    // Where a service is paid differs (the annual package is paid online), so it is not stated.
    assert.doesNotMatch(body, /paid at the studio/i);
    // cutoffTime is the LAST BOOKING time, not a closing time.
    assert.match(body, /Monday: opens 10:30, last booking 16:30/);
    assert.match(body, /Sunday: closed/);
    assert.doesNotMatch(body, /rating|review|award|₹299|booking fee|limited/i);
  });
});
