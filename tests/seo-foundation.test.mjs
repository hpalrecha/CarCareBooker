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
      'export { SEO_PAGES, guideLandingLink } from "@/lib/seo-pages";',
      'export { BLOG_POSTS } from "@/lib/blog-posts";',
      'export { LANDING_PAGES } from "@/lib/landing-pages";',
      'export { SERVICE_RELATED, relatedLinksFor } from "@/lib/service-related-links";',
      'export { PRODUCT_BRANDS } from "@/lib/nav-menu";',
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
      '/gallery': 'client/src/pages/gallery.tsx',
      '/offer/de-dhana-dhan': 'client/src/pages/offer.tsx',
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

  test('service content includes why-choose text and process steps when the record has them', () => {
    const t = text(
      m.servicePageContent({
        ...SERVICE,
        whyChoose: 'Film takes the stone chips.',
        process: [{ title: 'Paint inspection', description: 'We check the paint first.' }, { title: '  ' }],
      }),
    );
    assert.ok(t.includes('Film takes the stone chips.'));
    assert.ok(t.includes('Paint inspection: We check the paint first.'));
    const bare = text(m.servicePageContent(SERVICE));
    assert.ok(!bare.includes('How we do it'), 'no empty headings for records without steps');
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

  test('inline [label](/path) links in blog copy render as real crawlable <a> tags, not literal bracket text', () => {
    // Every post now links to at least one of these brand pages (SEO audit: connect blog
    // content to the STEK/Nasiol/P91 Premium PPF product pages). If blogPostContent still
    // escaped this syntax instead of parsing it, a crawler would see literal
    // "[STEK](/products/stek)" text — the bug this test pins.
    const withBrandLink = m.BLOG_POSTS.filter((post) =>
      post.body.some((b) => (b.type === 'p' || b.type === 'ul') && JSON.stringify(b).includes('/products/')),
    );
    assert.ok(withBrandLink.length >= 5, 'expected most posts to link to a brand page');
    for (const post of withBrandLink) {
      const html = m.blogPostContent(post);
      assert.match(html, /<a href="\/products\/(stek|nasiol|p91-premium-ppf)"/, post.slug);
      assert.ok(!html.includes('](/products/'), `${post.slug}: unparsed markdown link leaked into the snapshot`);
    }
  });

  test('every snapshot carries the site-wide link block: services, products, every guide, legal', () => {
    // Search Console (2026-10-12): 31 of 42 sitemap URLs "unknown to Google" while the raw HTML of each
    // page linked to only 4 pages, because the menus and footer are client-rendered.
    const html = m.blogPostContent(m.BLOG_POSTS[0]);
    const hrefs = new Set([...html.matchAll(/<a href="([^"]+)"/g)].map((x) => x[1]));
    for (const must of ['/services', '/products', '/blog', '/gallery', '/contact', '/terms-conditions', '/privacy-policy', '/refund-policy', '/services/paint-protection-film-bangalore', '/products/stek']) {
      assert.ok(hrefs.has(must), 'missing link ' + must);
    }
    for (const post of m.BLOG_POSTS) assert.ok(hrefs.has('/blog/' + post.slug), 'missing guide ' + post.slug);
    // The two car price pages are linked from the raw HTML so Google can find them; bike stays out.
    for (const must of ['/ppf', '/ceramic-coating/car']) assert.ok(hrefs.has(must), must);
    assert.ok(!hrefs.has('/ceramic-coating/bike'));
  });

  test('campaign pages get the catalogue record sections and FAQPage schema; empty records add nothing', () => {
    const html = m.landingServiceExtras({
      ...SERVICE,
      whyChoose: 'Why text.',
      process: [{ title: 'Step one', description: 'Do it.' }],
    });
    for (const must of ['Why text.', '<li>UV protection</li>', 'Step one: Do it.', 'How long does it last?']) assert.ok(html.includes(must), must);
    assert.ok(!html.includes('orphan answer'));
    assert.equal(m.landingServiceExtras({ slug: 'x' }), '');
    const schema = m.faqPageSchema(SERVICE.faq);
    assert.equal(schema['@type'], 'FAQPage');
    assert.equal(schema.mainEntity.length, 1);
    assert.equal(m.faqPageSchema([]), null);
  });

  test('/contact snapshot carries the studio address, phone and WhatsApp', () => {
    const page = m.STATIC_SEO_PAGES.find((x) => x.path === '/contact');
    const html = m.contactPageContent(page);
    for (const must of ['49, 13th Cross', '560030', 'tel:+917406619191', 'https://wa.me/917406619191', 'info@p91carcare.com']) assert.ok(html.includes(must), must);
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

  test('the homepage and /contact get the business schema in the raw HTML; the homepage also gets FAQPage', () => {
    const script = read('scripts/prerender.mjs');
    assert.match(script, /page\.path === "\/" \? \[content\.localBusinessSchema\(ORIGIN\), content\.homeFaqSchema\(\)\]/);
    assert.match(script, /page\.path === "\/contact" \? \[content\.localBusinessSchema\(ORIGIN\)\]/);
  });

  test('homepage FAQ: one list feeds the page, the raw HTML and the schema, and states no price or duration figure', () => {
    const faq = read('client/src/lib/home-faq.ts');
    const home = read('client/src/pages/home.tsx');
    const crawl = read('client/src/lib/crawlable-content.ts');
    assert.match(home, /HOME_FAQS\.map/);
    assert.match(home, /homeFaqSchema\(\)/);
    assert.match(crawl, /HOME_FAQS/);
    assert.match(crawl, /h2\(HOME_FAQ_HEADING\)/);
    // The four questions the brief asks for: ceramic vs PPF, price, duration, warranty.
    for (const needle of [/ceramic coating and paint protection film\?/i, /cost/i, /How long/, /warranty/i]) {
      assert.match(faq, needle);
    }
    // Prices and durations live in the catalogue; a typed figure would go stale (landing-pages.ts price rule).
    const answers = [...faq.matchAll(/answer:\s*((?:\s*"[^"]*"\s*\+?)+)/g)].map((m) => m[1]).join(' ');
    assert.ok(answers.length > 200, 'found the answers');
    assert.doesNotMatch(answers, /₹|Rs\.?\s?\d|\d+\s*(hours?|hrs?|days?)/i);
  });

  test('homepage H2s carry both target phrases', () => {
    const faq = read('client/src/lib/home-faq.ts');
    for (const name of ['HOME_ABOUT_H2', 'HOME_FAQ_HEADING']) {
      const m = faq.match(new RegExp('export const ' + name + ' = "([^"]+)"'));
      assert.ok(m, name + ' exists');
      assert.match(m[1], /ceramic coating/i);
      assert.match(m[1], /paint protection film/i);
    }
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

  test('each guide page links every catalogue option it lists, so no service page hangs off one link', () => {
    const ppf = m.SEO_PAGES.find((x) => x.slug === 'paint-protection-film-bangalore');
    const html = m.seoGuideContent(ppf);
    for (const slug of ['ppf-hatchback', 'ppf-sedan', 'ppf-suv', 'ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv']) {
      assert.ok(html.includes('href="/service/' + slug + '"'), 'missing link to ' + slug);
    }
    assert.ok(!html.includes('partial-ppf'), 'must not link slugs that are not in the catalogue');
  });

  test('PPF and ceramic guides link to their car pages with descriptive labels; other guides add no landing link', () => {
    const link = (slug) => m.guideLandingLink(m.SEO_PAGES.find((x) => x.slug === slug));
    assert.deepEqual(link('paint-protection-film-bangalore'), { href: '/ppf', label: 'Explore car PPF pricing and booking' });
    assert.deepEqual(link('ceramic-coating-bangalore'), { href: '/ceramic-coating/car', label: 'Explore car ceramic coating pricing and booking' });
    assert.equal(link('interior-detailing-bangalore'), null);
    assert.equal(link('glass-sun-control-film-bangalore'), null);
  });

  test('every guide bookHref points at a real campaign landing page', () => {
    const paths = new Set(m.LANDING_PAGES.map((p) => p.path));
    for (const g of m.SEO_PAGES) if (g.bookHref) assert.ok(paths.has(g.bookHref), g.slug + ' -> ' + g.bookHref);
  });

  test('the guide component renders the landing link from the helper, and the snapshot is left alone', () => {
    const src = read('client/src/pages/seo-service-page.tsx');
    assert.match(src, /guideLandingLink\(page\)/);
    assert.match(src, /data-testid="link-seo-landing"/);
    assert.ok(!read('client/src/lib/crawlable-content.ts').includes('guideLandingLink'), 'the crawler snapshot must not duplicate the link');
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

describe('home links to the pages that carry the prices', () => {
  test('the rendered home page and its snapshot both link /ppf, /ceramic-coating/* and interior detailing', () => {
    const page = m.STATIC_SEO_PAGES.find((x) => x.path === '/');
    const html = m.homePageContent(page);
    const home = read('client/src/pages/home.tsx');
    assert.match(home, /HOME_PACKAGE_LINKS\.map/, 'home.tsx must render the package links');
    for (const href of ['/ppf', '/ceramic-coating/car', '/ceramic-coating/bike', '/services/interior-detailing-bangalore']) {
      assert.ok(html.includes(`<a href="${href}"`), `snapshot missing ${href}`);
    }
  });
});

describe('technical SEO brief: robots meta, hub links, gallery images', () => {
  const prerenderSrc = read('scripts/prerender.mjs');

  test('every prerendered route states index,follow, except the noindex,follow ones', () => {
    assert.match(prerenderSrc, /route\.noindex \? "noindex,follow" : "index,follow"/);
    assert.match(prerenderSrc, /NOINDEX_STATIC_PATHS = new Set\(\["\/terms-conditions", "\/privacy-policy", "\/refund-policy"\]\)/);
    assert.match(read('server/vite.ts'), /content="index,follow"/, 'server-rendered /service/:slug must state index,follow too');
  });

  test('noindex pages are not in the sitemap', () => {
    const routesSrc = read('server/routes.ts');
    for (const p of ['/terms-conditions', '/privacy-policy', '/refund-policy', '/blog/category/']) {
      assert.ok(!routesSrc.includes(`loc: "${p}`), `${p} is noindex and must not be listed`);
    }
  });

  test('/services snapshot links every service guide and price page', () => {
    const page = m.SERVICES_SEO;
    const html = m.servicesListContent(page, []);
    for (const href of ['/services/paint-protection-film-bangalore', '/services/ceramic-coating-bangalore', '/services/interior-detailing-bangalore', '/services/glass-sun-control-film-bangalore', '/ppf', '/ceramic-coating/car', '/ceramic-coating/bike']) {
      assert.ok(html.includes(`<a href="${href}"`), `missing ${href}`);
    }
  });

  test('/gallery snapshot carries crawlable images with alt text and service links', () => {
    const page = m.STATIC_SEO_PAGES.find((x) => x.path === '/gallery');
    const html = m.galleryPageContent(page);
    const imgs = [...html.matchAll(/<img [^>]*alt="([^"]+)"/g)];
    assert.ok(imgs.length >= 10, 'expected the studio photographs');
    assert.ok(html.includes('<a href="/ppf"') && html.includes('<a href="/services/ceramic-coating-bangalore"'));
  });
});

describe('guide pages bake FAQPage schema into the HTML', () => {
  test('prerender adds FAQPage JSON-LD for every guide that has FAQs', () => {
    assert.ok(read('scripts/prerender.mjs').includes('content.faqPageSchema(p.faqs)'));
    for (const page of m.SEO_PAGES) {
      const schema = m.faqPageSchema(page.faqs);
      assert.ok(page.faqs.length === 0 || (schema && schema.mainEntity.length === page.faqs.length), page.slug);
    }
  });
});

describe('duplicate homepage URL', () => {
  test('/index.html is a permanent redirect to "/", not a second 200 page', () => {
    const src = read('server/routes.ts');
    const needle = 'index\\.html$/i'; // the regex source as written in routes.ts: index\.html$/i
    assert.ok(src.includes(needle), 'route missing');
    const at = src.indexOf(needle);
    assert.ok(src.slice(at, at + 120).includes('res.redirect(301, "/")'), 'must be a 301 to "/"');
  });
});

describe('related guides, brands and articles on the /service/* pages', () => {
  const SEVEN = [
    'annual-maintenance-package',
    'exterior-detailing-hard-water-new',
    'headlight-restoration-both',
    'interior-detailing-service',
    'premium-car-wash-special',
    'windshield-glass-coating-new',
    'windshield-glass-polishing',
  ];
  const record = (slug) => ({ ...SERVICE, slug, title: 'Test service' });

  test('all seven catalogue pages have related links, and nothing else does', () => {
    assert.deepEqual(Object.keys(m.SERVICE_RELATED).sort(), [...SEVEN].sort());
    assert.equal(m.relatedLinksFor('ppf-sedan'), null);
    assert.equal(m.relatedLinksFor(undefined), null);
  });

  test('every link points at a real page: blog post, brand page, service guide, hub', () => {
    const posts = new Set(m.BLOG_POSTS.map((p) => '/blog/' + p.slug));
    const brands = new Set(m.PRODUCT_BRANDS.map((b) => b.href));
    const guides = new Set(m.SEO_PAGES.map((g) => '/services/' + g.slug));
    for (const slug of SEVEN) {
      const r = m.SERVICE_RELATED[slug];
      for (const l of r.posts) assert.ok(posts.has(l.href), slug + ' -> ' + l.href);
      for (const l of r.products) assert.ok(l.href === '/products' || brands.has(l.href), slug + ' -> ' + l.href);
      for (const l of r.guides) assert.ok(l.href === '/services' || guides.has(l.href), slug + ' -> ' + l.href);
    }
  });

  test('each page has at least one product link and one article link, no duplicates, descriptive anchors', () => {
    for (const slug of SEVEN) {
      const r = m.SERVICE_RELATED[slug];
      assert.ok(r.products.length >= 1 && r.posts.length >= 1 && r.guides.length >= 1, slug);
      const all = [...r.guides, ...r.products, ...r.posts];
      assert.equal(new Set(all.map((l) => l.href)).size, all.length, slug + ' has a duplicate link');
      for (const l of all) {
        assert.ok(l.label.length >= 15, 'anchor too short: ' + l.label);
        assert.doesNotMatch(l.label, /click here|read more|learn more|^here$/i, l.label);
      }
    }
  });

  test('no service page links to a single brand: product links go to the hub, with a label that names no brand', () => {
    // None of the seven catalogue records says which brand (STEK, Nasiol, P91 Premium PPF) is used for the
    // service, so a brand link would imply a claim the record does not make.
    const brandNames = /stek|nasiol|p91 premium/i;
    for (const slug of SEVEN) {
      const r = m.SERVICE_RELATED[slug];
      assert.equal(r.products.length, 1, slug);
      assert.equal(r.products[0].href, '/products', slug + ' must link the hub, not a brand page');
      assert.doesNotMatch(r.products[0].label, brandNames, slug + ' hub label must not name a brand');
      for (const l of [...r.guides, ...r.posts]) {
        assert.ok(!/^\/products\/[a-z0-9-]+$/.test(l.href), slug + ' links a brand page: ' + l.href);
      }
    }
    // The same text reaches the first HTML, so a crawler reads no brand claim either.
    for (const slug of ['windshield-glass-coating-new', 'windshield-glass-polishing', 'exterior-detailing-hard-water-new']) {
      const html = m.servicePageContent(record(slug));
      const related = html.slice(html.indexOf('Related guides, products and reading'));
      const block = related.slice(0, related.indexOf('</ul>', related.lastIndexOf('Guides from the studio')) + 5);
      assert.ok(block.includes('href="/products"') && block.includes('href="/blog/'), slug + ': the block under test must be the real related list, not an empty slice');
      assert.doesNotMatch(text(block), brandNames, slug);
      assert.ok(!block.includes('href="/products/'), slug);
    }
  });

  test('the car-wash page has no ceramic-coating guide link; it keeps the hub, two articles and all-services', () => {
    const r = m.SERVICE_RELATED['premium-car-wash-special'];
    assert.ok(!r.guides.some((l) => l.href === '/services/ceramic-coating-bangalore'));
    assert.deepEqual(r.guides.map((l) => l.href), ['/services']);
    assert.deepEqual(r.posts.map((l) => l.href), ['/blog/hard-water-spot-removal-bangalore', '/blog/best-car-detailing-in-bangalore']);
  });

  test('the crawlable HTML carries the links and the duration, with one h1 and no invented content', () => {
    const html = m.servicePageContent(record('windshield-glass-coating-new'));
    assert.equal(h1Count(html), 1);
    const r = m.SERVICE_RELATED['windshield-glass-coating-new'];
    for (const l of [...r.guides, ...r.products, ...r.posts]) {
      assert.ok(html.includes('href="' + l.href + '"'), l.href);
      assert.ok(html.includes('>' + l.label.replace(/&/g, '&amp;') + '<'), l.label);
    }
    assert.ok(text(html).includes('Related guides, products and reading'));
    // Duration comes from the same function as the page ("About 24 hrs" there, a legacy range override).
    assert.ok(text(html).includes('Time at the studio: about 24 hrs.'), text(html).slice(0, 300));
  });

  test('records without related links and without a plausible duration get neither section', () => {
    const html = m.servicePageContent({ ...SERVICE, slug: 'ppf-sedan', duration: 4 });
    assert.ok(!text(html).includes('Related guides, products and reading'));
    assert.ok(!text(html).includes('Time at the studio'), 'a duration under 15 minutes is a unit error, not a figure');
    assert.equal(h1Count(html), 1);
  });

  test('the page renders the same helper, as a section with testable cards', () => {
    const src = read('client/src/pages/service-landing.tsx');
    assert.match(src, /relatedLinksFor\(service\.slug\)/);
    assert.match(src, /data-testid="section-related-links"/);
    assert.match(src, /Related guides, products and reading/);
    // The page keeps exactly one h1 (the service title); the new block adds only an h2.
    assert.equal((src.match(/<h1\b/g) || []).length, 2, 'unchanged: the title and the not-found message');
  });
});
