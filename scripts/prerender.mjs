/**
 * Bakes per-route <head> metadata into static HTML.
 *
 *   node scripts/prerender.mjs        (runs as part of `npm run build`, after vite)
 *
 * THE PROBLEM: this is a client-rendered SPA. Every <title>, canonical and JSON-LD block
 * is written by useSeoMeta AFTER React mounts, so the HTML served for /blog/whatever is
 * the same shell as every other route — one generic title, no canonical, no schema.
 * Googlebot executes JS and usually recovers; most other crawlers (Bing, social cards,
 * AI agents) do not, and even Google measures the first HTML it receives.
 *
 * WHAT THIS DOES: emits dist/public/<route>/index.html for every known route, identical
 * to the SPA shell except that the head carries that route's real title, description,
 * canonical, Open Graph, Twitter and JSON-LD. The body stays the SPA shell and React
 * hydrates as normal, so there is no markup for the client and the server to disagree
 * about — this cannot cause a hydration mismatch.
 *
 * WHAT THIS DOES NOT DO: it does not server-render the article body. That would need real
 * SSR, and the production image is node:20-bookworm-slim with no browser available. Body
 * text still arrives via JS. This is a deliberate scope line, not an oversight.
 *
 * FAILS HARD, unlike the image pipeline. A silent fallback here would ship an SPA shell
 * with a generic title on every URL and nobody would notice until rankings moved, so every
 * error exits non-zero. That is safe on this host: the deploy script builds BEFORE it swaps
 * containers, so a failed build leaves the running site untouched.
 *
 * Content comes from the same modules the app renders — blog-posts.ts and seo-pages.ts are
 * bundled with esbuild and imported here, so a post's title cannot drift between the page
 * and its prerendered head. The handful of hand-written pages are listed in STATIC_ROUTES
 * below, and tests/prerender.test.mjs asserts those strings still match the components.
 */
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "public");
const SHELL = path.join(DIST, "index.html");
const ORIGIN = "https://p91carcare.com";
// 1200x630, built by scripts/make-og-images.mjs. The old default was the logo PNG, whose file name has spaces
// and parentheses (some crawlers refuse such URLs) and which says nothing about the studio in a link preview.
const OG_IMAGE = "/og/og-default.jpg";
const IMAGE_MANIFEST = JSON.parse(readFileSync(path.join(ROOT, "client", "src", "lib", "image-manifest.json"), "utf8"));

/**
 * The homepage hero/LCP photo, preloaded ONLY on "/" — this same set of widths is what
 * ImageWithFallback (client/src/components/image-with-fallback.tsx) generates into the
 * <picture>'s AVIF <source> for "exterior-hero-poster" (a colour-matched frame of the hero video),
 * the fallback client/src/pages/home.tsx renders before /api/services answers. Kept in
 * sync by hand (no shared module — this is a Node build script, the other is browser
 * code) rather than duplicated blindly: if the hero photo or its widths ever change,
 * update both, or the browser preloads a variant the <picture> does not end up using.
 */
const HERO_IMAGE_BASE = "exterior-hero-poster";
const HERO_IMAGE_WIDTHS = [96, 320, 640, 1280, 1600];
function heroPreloadTag() {
  const srcset = HERO_IMAGE_WIDTHS.map(
    (w) => `/attached_assets/_opt/${HERO_IMAGE_BASE}-${w}.avif ${w}w`,
  ).join(", ");
  return `<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="100vw" type="image/avif" fetchpriority="high" />`;
}

/**
 * First-paint poster for "/". The page is a client-rendered app, so without this the hero photo (the
 * LCP element) cannot appear until React has downloaded, parsed and rendered: on a throttled phone that
 * is the 2.5 s "element render delay" in Lighthouse. This is the same photo (same preloaded AVIF set),
 * in plain HTML with inline styles, so it paints from the document alone.
 *
 * It is an UNDERLAY (position:absolute, z-index:-1, no layout space): the app's own hero paints the
 * identical photo over it, so nothing visible changes, and it is NOT removed after the app paints.
 * Two measured reasons: removing an LCP candidate makes the browser fall back to the later React image,
 * and Chrome ignores an image that covers the whole viewport (treated as a background), which is why the
 * <img> is 94% of the container's height and not 100%. Home removes it only when the visitor leaves "/".
 */
function bootHeroHtml() {
  const srcset = HERO_IMAGE_WIDTHS.map(
    (w) => `/attached_assets/_opt/${HERO_IMAGE_BASE}-${w}.avif ${w}w`,
  ).join(", ");
  return (
    '<div id="boot-hero" aria-hidden="true" style="position:absolute;top:0;left:0;width:100%;height:100vh;height:100svh;z-index:-1;background:#060708;pointer-events:none;overflow:hidden">' +
    '<picture><img src="/attached_assets/_opt/' + HERO_IMAGE_BASE + '-1280.avif" srcset="' + srcset + '" sizes="100vw" ' +
    'width="1600" height="900" alt="" fetchpriority="high" decoding="async" ' +
    'style="position:absolute;top:0;left:0;width:100%;height:94%;object-fit:cover;object-position:center 42%"></picture>' +
    '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(6,7,8,.34) 0%,transparent 14%),linear-gradient(to top,rgba(6,7,8,.84) 0%,rgba(6,7,8,.55) 32%,rgba(6,7,8,0) 62%)"></div>' +
    "</div>"
  );
}

/** Static pages that stay accessible to users but are excluded from search: noindex,follow, and not in the sitemap. */
const NOINDEX_STATIC_PATHS = new Set(["/terms-conditions", "/privacy-policy", "/refund-policy"]);

/**
 * Preload for a landing page's first carousel slide (client/src/components/redesign/slide-carousel.tsx renders
 * the same <picture>: AVIF source, widths from the image manifest, sizes below). Returns undefined, so no tag is
 * emitted, when the manifest has no entry for the image.
 */
const CAROUSEL_SIZES = "(min-width: 800px) 700px, 92vw";
function carouselPreloadTag(dir) {
  const key = `carousels/${dir}/01`;
  const entry = IMAGE_MANIFEST[key + ".jpg"];
  if (!entry) return undefined;
  const srcset = entry.widths.map((w) => `/attached_assets/_opt/${key}-${w}.avif ${w}w`).join(", ");
  return `<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="${CAROUSEL_SIZES}" type="image/avif" fetchpriority="high" />`;
}

function die(message) {
  console.error("\n[prerender] FAILED: " + message);
  console.error("[prerender] The build is stopped deliberately. Shipping an SPA shell with");
  console.error("[prerender] a generic <title> on every URL is a silent SEO regression, so");
  console.error("[prerender] this fails loudly instead.\n");
  process.exit(1);
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/*
 * STATIC PAGES. The title, description, h1 and lede of the hand-written pages used to be
 * copied here (STATIC_ROUTES) and compared to the components by TITLE only, so descriptions
 * drifted. They now come from client/src/lib/static-seo.ts, which the components import too.
 */

/** Bundle the TS content modules so their real data drives the output. */
async function loadContent() {
  const tmp = path.join(ROOT, "node_modules", ".cache", "prerender-content.mjs");
  await fs.mkdir(path.dirname(tmp), { recursive: true });
  try {
    await esbuild.build({
      entryPoints: [path.join(ROOT, "scripts", "prerender-content-entry.ts")],
      bundle: true,
      format: "esm",
      platform: "node",
      outfile: tmp,
      logLevel: "silent",
      alias: { "@": path.join(ROOT, "client", "src") },
    });
  } catch (error) {
    die("could not bundle the content modules — " + (error?.message ?? error));
  }
  try {
    return await import(new URL("file://" + tmp.replace(/\\/g, "/")).href + "?t=" + Date.now());
  } catch (error) {
    die("bundled content module would not import — " + (error?.message ?? error));
  }
}

function headFor(route, canonicalPathFor) {
  // Through client/src/lib/canonical-overrides.ts, the same map server/vite.ts and the
  // client use, so a consolidated /service/ variant can never be baked self-canonical.
  // Today no /service/ route is prerendered (they need the database), so this is a guard.
  const canonical = ORIGIN + canonicalPathFor(route.path);
  // encodeURI: a path with spaces or brackets is not a valid URL for every crawler.
  const image = ORIGIN + encodeURI(route.image || OG_IMAGE);
  const tags = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta name="robots" content="${route.noindex ? "noindex,follow" : "index,follow"}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="${route.ogType || "website"}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(route.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];
  for (const block of route.jsonLd || []) {
    // JSON-LD is data, not markup: only "<" needs neutralising so a value can never
    // close the script element early.
    // data-seo="prerender": useSeoMeta removes these when the page sets its own schema, so a
    // browser that runs JavaScript does not end up with every block twice.
    tags.push(
      `<script type="application/ld+json" data-seo="prerender">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`,
    );
  }
  // Only "/" carries the hero preload — every other route would just be spending its own
  // bandwidth budget on a photo it never shows.
  if (route.path === "/") tags.push(heroPreloadTag());
  if (route.preloadImage) tags.push(route.preloadImage);
  return tags.map((t) => "    " + t).join("\n");
}

async function main() {
  if (!existsSync(SHELL)) {
    die(`no built shell at ${path.relative(ROOT, SHELL)} — run vite build first`);
  }
  const shell = await fs.readFile(SHELL, "utf8");
  if (!/<\/head>/i.test(shell)) die("the built index.html has no </head> to inject into");

  const content = await loadContent();
  if (typeof content.canonicalPathFor !== "function") die("canonicalPathFor missing from the content bundle");
  const { BLOG_POSTS, SEO_PAGES, LANDING_PAGES, BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION } = content;
  if (!Array.isArray(BLOG_POSTS) || !BLOG_POSTS.length) die("BLOG_POSTS is empty");
  if (!Array.isArray(SEO_PAGES) || !SEO_PAGES.length) die("SEO_PAGES is empty");
  if (!Array.isArray(LANDING_PAGES) || !LANDING_PAGES.length) die("LANDING_PAGES is empty");

  const { STATIC_SEO_PAGES } = content;
  if (!Array.isArray(STATIC_SEO_PAGES) || !STATIC_SEO_PAGES.length) die("STATIC_SEO_PAGES is empty");

  // Every route carries `content`: the page's real text, baked into <div id="root"> so a
  // crawler that does not run JavaScript still reads the page (see lib/crawlable-content.ts).
  const routes = STATIC_SEO_PAGES.map((page) => ({
    path: page.path,
    title: page.title,
    description: page.description,
    // The homepage is the one hand-written page with real depth — sections, internal
    // links, brand mentions — so it gets its own builder instead of the generic
    // h1+lede-only staticPageContent() every other simple page uses (SEO audit: the
    // homepage's non-JS snapshot was ~47 words and 4 internal links; the real page has
    // dozens of each, just behind client-side rendering).
    content:
      page.path === "/"
        ? content.homePageContent(page)
        : page.path === "/contact"
          ? content.contactPageContent(page)
          : page.path === "/gallery"
            ? content.galleryPageContent(page)
            : content.staticPageContent(page),
    // Legal pages stay reachable for people but are kept out of search (and out of the sitemap).
    noindex: NOINDEX_STATIC_PATHS.has(page.path),
    image: page.image,
    // The homepage and /contact set the business schema at runtime; the raw HTML carried
    // none, so a crawler without JavaScript never saw the address, phone or hours. Emitted
    // here without opening hours — those are live data the build cannot know; the page
    // replaces this block with the full one (hours included) once it loads.
    jsonLd: page.path === "/" ? [content.localBusinessSchema(ORIGIN), content.homeFaqSchema()] : page.path === "/contact" ? [content.localBusinessSchema(ORIGIN)] : extraJsonLd(page.path, content),
  }));

  // /blog — title and description come from the shared constants, not a copy here.
  routes.push({
    path: "/blog",
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    content: content.blogListContent(BLOG_POSTS),
    jsonLd: [breadcrumbs([["Home", "/"], ["Blog", "/blog"]])],
  });

  // /blog/category/<slug> — one indexable listing per category. Without these the site
  // has a single crawlable blog page no matter how much gets written, and the category
  // nav would be links to URLs that only exist client-side.
  for (const category of content.blogCategories()) {
    const slug = content.categorySlug(category);
    const posts = content.postsInCategory(category);
    if (!posts.length) continue; // never emit a page that lists nothing
    routes.push({
      path: `/blog/category/${slug}`,
      // Thin listings (1 to 5 articles each): noindex,follow until they carry their own content.
      noindex: true,
      title: content.categoryTitle(category),
      description: content.categoryDescription(category),
      content: content.blogListContent(posts, category),
      jsonLd: [
        breadcrumbs([["Home", "/"], ["Blog", "/blog"], [category, `/blog/category/${slug}`]]),
      ],
    });
  }

  for (const p of BLOG_POSTS) {
    if (!p.slug || !p.seoTitle || !p.excerpt) die(`blog post "${p.slug}" is missing metadata`);
    routes.push({
      path: `/blog/${p.slug}`,
      title: p.seoTitle,
      description: p.excerpt,
      ogType: "article",
      content: content.blogPostContent(p),
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${ORIGIN}/blog/${p.slug}`,
          mainEntityOfPage: { "@type": "WebPage", "@id": `${ORIGIN}/blog/${p.slug}` },
          headline: p.title,
          description: p.excerpt,
          articleSection: p.category,
          datePublished: p.date,
          dateModified: p.updated || p.date,
          author: { "@type": "Organization", name: "P91 Car Care", url: ORIGIN },
          publisher: { "@type": "AutoRepair", "@id": `${ORIGIN}/#business`, name: "P91 Car Care" },
          url: `${ORIGIN}/blog/${p.slug}`,
          inLanguage: "en-IN",
        },
        breadcrumbs([
          ["Home", "/"],
          ["Blog", "/blog"],
          [p.category, `/blog/${p.slug}`],
        ]),
      ],
    });
  }

  // /products/stek, /products/nasiol, /products/p91-premium-ppf. Before this they had no prerendered
  // file, so the server answered them with the 404 shell (noindex, "Page not found") and Google could
  // not index three pages that every guide links to.
  const { BRAND_PAGES } = content;
  if (!Array.isArray(BRAND_PAGES) || !BRAND_PAGES.length) die("BRAND_PAGES is empty");
  for (const b of BRAND_PAGES) {
    if (!b.slug || !b.title || !b.description) die(`brand page "${b.slug}" is missing metadata`);
    routes.push({
      path: `/products/${b.slug}`,
      title: b.title,
      description: b.description,
      content: content.brandPageContent(b),
      jsonLd: [
        breadcrumbs([
          ["Home", "/"],
          ["Products", "/products"],
          [b.name, `/products/${b.slug}`],
        ]),
      ],
    });
  }

  for (const p of SEO_PAGES) {
    if (!p.slug || !p.title || !p.description) die(`SEO page "${p.slug}" is missing metadata`);
    routes.push({
      path: `/services/${p.slug}`,
      title: p.title,
      description: p.description,
      content: content.seoGuideContent(p),
      jsonLd: [
        breadcrumbs([
          ["Home", "/"],
          ["Services", "/services"],
          [p.h1 || p.title, `/services/${p.slug}`],
        ]),
        // The page renders these FAQs and sets the same schema at runtime (pages/seo-service-page.tsx); baking it
        // in means a crawler that does not run JavaScript sees it too.
        ...(content.faqPageSchema(p.faqs) ? [content.faqPageSchema(p.faqs)] : []),
      ],
    });
  }

  // The three Meta Ads destinations. Imported from lib/landing-pages.ts — the same module
  // the page component reads — so the prerendered <head> CANNOT drift from what
  // useSeoMeta sets at runtime. No STATIC_ROUTES duplication, so no drift test is needed.
  //
  // Deliberately NO Service/Offer JSON-LD here: the price lives in the catalogue and is
  // fetched at runtime, so a build-time schema would either omit it or hardcode a figure
  // that could drift from checkout. The component emits the priced Service schema once it
  // has the live record; this stage emits only what is knowable at build time.
  for (const p of LANDING_PAGES) {
    if (!p.path || !p.title || !p.description) die(`Landing page "${p.path}" is missing metadata`);
    routes.push({
      path: p.path,
      title: p.title,
      description: p.description,
      content: content.landingPageContent(p),
      // The first hero-carousel slide is this page's LCP element; without a preload the browser only
      // finds it after React has rendered (~1.5 s later on a phone).
      preloadImage: p.heroCarousel ? carouselPreloadTag(p.heroCarousel.dir) : undefined,
      jsonLd: [
        breadcrumbs([
          ["Home", "/"],
          ["Services", "/services"],
          [p.eyebrow || p.h1, p.path],
        ]),
      ],
    });
  }

  // The shell carries generic SEO tags for the SPA. Strip every tag headFor() re-emits,
  // or each prerendered page ships TWO of it and a crawler picks whichever it likes.
  //
  // The title/description/canonical cases were handled from the start. The Open Graph and
  // Twitter tags were not, so every prerendered route was shipping the generic
  // "P91 Car Care — Professional Car Detailing in Bangalore" og:title alongside its own.
  // Confirmed in the built output before fixing: two og:title tags on /ppf.
  //
  // Kept from the shell deliberately: og:site_name, og:locale, twitter:title and
  // twitter:description — headFor() does not emit those, so stripping them would leave
  // the page with fewer tags than it has now.
  const REEMITTED = [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:type"],
    ["property", "og:image"],
    ["name", "twitter:card"],
    ["name", "twitter:image"],
  ];

  let stripped = shell
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/i, "")
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/>\r?\n?/i, "")
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\r?\n?/i, "");

  for (const [attr, value] of REEMITTED) {
    // Anchored on the exact attribute pair so a tag with a similar prefix
    // (og:image_alt, twitter:card_type) is not removed by accident.
    stripped = stripped.replace(
      new RegExp(`[ \\t]*<meta\\s+${attr}="${value.replace(/[:]/g, "\\$&")}"[^>]*>\\r?\\n?`, "gi"),
      "",
    );
  }

  if (/<title>/i.test(stripped)) die("could not strip the shell's own <title>");
  for (const [attr, value] of REEMITTED) {
    if (new RegExp(`<meta\\s+${attr}="${value}"`, "i").test(stripped)) {
      die(`could not strip the shell's own ${value} — prerendered pages would ship two`);
    }
  }

  let written = 0;
  for (const route of routes) {
    if (!route.content) die(`${route.path}: no crawlable content built`);
    let html = content.injectRootContent(
      stripped.replace(/<\/head>/i, headFor(route, content.canonicalPathFor) + "\n  </head>"),
      route.content,
    );
    if (route.path === "/") html = html.replace('<div id="root">', bootHeroHtml() + '<div id="root">');

    // The body must now carry the page: an empty root is exactly the defect this fixes, and
    // one <h1> is what every page renders.
    const root = (html.match(/<div id="root">([\s\S]*?)<\/div>\s*(?:<script|<!--)/) || [])[1] || "";
    if (!root.includes('data-prerender="content"')) die(`${route.path}: crawlable content missing from #root`);
    if ((html.match(/<h1\b/g) || []).length !== 1) {
      die(`${route.path}: ${(html.match(/<h1\b/g) || []).length} <h1> tags in the HTML — expected exactly 1`);
    }

    // Validate the OUTPUT, not the input. A silently mangled shell would otherwise ship.
    if (!/<title>[^<]{10,}<\/title>/.test(html)) die(`${route.path}: no usable <title> emitted`);
    if (!html.includes(`rel="canonical"`)) die(`${route.path}: no canonical emitted`);
    for (const block of route.jsonLd || []) {
      const json = JSON.stringify(block);
      if (!html.includes(json.replace(/</g, "\\u003c"))) {
        die(`${route.path}: JSON-LD did not survive injection`);
      }
    }
    // The shell's own generic title must be GONE, or crawlers see two.
    if ((html.match(/<title>/g) || []).length !== 1) {
      die(`${route.path}: ${(html.match(/<title>/g) || []).length} <title> tags — expected exactly 1`);
    }

    const outDir = route.path === "/" ? DIST : path.join(DIST, route.path);
    if (route.path !== "/") await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "index.html"), html);
    written++;
  }

  /**
   * A dedicated shell for unknown URLs.
   *
   * The SPA answers any unmatched path with 200 and the shell, which was harmless while
   * that shell had a generic title. Now that index.html carries the HOMEPAGE's title,
   * canonical and schema, serving it for /blog/typo would claim every wrong URL is a
   * duplicate of the homepage. This shell says what it is and carries noindex.
   *
   * Deliberately still 200, not 404: changing the status code for unmatched paths is a
   * behavioural change to a live site with health checks and third-party monitors on it,
   * and that belongs in its own reviewed change. noindex is what actually keeps these out
   * of the index.
   */
  const notFound = stripped.replace(
    /<\/head>/i,
    [
      `    <title>Page not found — P91 Car Care</title>`,
      `    <meta name="robots" content="noindex, follow" />`,
      `    <meta name="description" content="This page could not be found. Browse our car detailing, ceramic coating and paint protection services in Adugodi, Bangalore." />`,
      "  </head>",
    ].join("\n"),
  );
  if (!/robots/.test(notFound)) die("404 shell lost its noindex");
  await fs.writeFile(path.join(DIST, "404.html"), notFound);

  /**
   * app.html — the INDEXABLE shell, for valid routes whose metadata cannot be known at
   * build time.
   *
   * /service/:slug is driven by the services table. The build has no database, so those
   * 17 URLs cannot be prerendered here — and until now they fell through to 404.html and
   * were served "Page not found" with noindex while the sitemap asked Google to index
   * them. That is the defect this file exists to prevent, arriving through the one door
   * it did not cover.
   *
   * This shell carries NO route metadata and NO robots directive: the server injects the
   * real title, description, canonical and Service schema per request (it has the
   * database), and useSeoMeta sets the same values again after hydration.
   *
   * It is deliberately NOT index.html. Since prerendering, index.html carries the
   * HOMEPAGE's title, canonical and schema, so serving it for /service/x would tell every
   * crawler that page is a duplicate of the homepage.
   */
  if (/<title>/i.test(stripped)) die("app shell must not carry a title");
  if (/name="robots"/i.test(stripped)) die("app shell must not carry a robots directive");
  await fs.writeFile(path.join(DIST, "app.html"), stripped);

  console.log(`[prerender] ${written} routes -> dist/public/**/index.html`);
  console.log(`[prerender]   plus 404.html (noindex) for unmatched URLs`);
  console.log(
    `[prerender]   ${STATIC_SEO_PAGES.length} static, ${BLOG_POSTS.length} posts, ${SEO_PAGES.length} service pages, ${LANDING_PAGES.length} campaign pages — each with crawlable body content`,
  );
}

/** Schema for the hand-written pages other than the homepage and /contact: the live offer, and breadcrumbs. */
function extraJsonLd(pagePath, content) {
  if (pagePath === "/offer/de-dhana-dhan") {
    return [content.festivalOfferSchema(ORIGIN), breadcrumbs([["Home", "/"], ["De Dhana Dhan offer", pagePath]])];
  }
  if (pagePath === "/gallery" || pagePath === "/products") {
    return [breadcrumbs([["Home", "/"], [pagePath === "/gallery" ? "Gallery" : "Products", pagePath]])];
  }
  return [];
}

function breadcrumbs(pairs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pairs.map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: ORIGIN + href,
    })),
  };
}

main().catch((error) => die(error?.stack || error?.message || String(error)));
