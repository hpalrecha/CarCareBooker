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
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "public");
const SHELL = path.join(DIST, "index.html");
const ORIGIN = "https://p91carcare.com";
const OG_IMAGE = "/Car Care (4)_1753951564515.png";

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

/**
 * Routes whose copy lives in a page component rather than a data module.
 *
 * Duplicated deliberately and narrowly — extracting the strings out of nine TSX files
 * would be a far larger change than this phase justifies. tests/prerender.test.mjs asserts
 * each of these still matches the useSeoMeta call in its component, so the duplication
 * cannot rot silently.
 */
const STATIC_ROUTES = [
  {
    path: "/",
    title: "P91 Car Care — Car Detailing, PPF & Ceramic Coating in Indiranagar, Bangalore",
    description:
      "Ceramic coating, paint protection film and full interior detailing in Indiranagar, " +
      "Bangalore — warranty-backed and bookable online in under a minute.",
  },
  {
    path: "/services",
    title: "All Car Detailing Services in Bangalore | P91 Car Care",
    description:
      "Every P91 Car Care service with live pricing — ceramic coating, paint protection " +
      "film, detailing, glass coating and headlight restoration in Indiranagar, Bangalore.",
  },
  // The three legal pages and the combined PPF/ceramic page were in the SITEMAP but not
  // here, so serveStatic fell through to 404.html and served them "Page not found" with
  // noindex — the sitemap asking Google to index a page while the page told it not to.
  // Their copy is static, so prerendering is the correct fix; /service/:slug is database
  // driven and is handled at request time instead (see server/vite.ts).
  {
    path: "/privacy-policy",
    title: "Privacy Policy — P91 Car Care",
    description:
      "How P91 Car Care collects, uses and stores customer information for bookings, " +
      "payments and service reminders, and the cookies used on this site.",
  },
  {
    path: "/terms-conditions",
    title: "Terms & Conditions — P91 Car Care",
    description:
      "The terms that apply to booking and paying for detailing, ceramic coating and " +
      "paint protection film services at P91 Car Care in Indiranagar, Bangalore.",
  },
  {
    path: "/refund-policy",
    title: "Refund Policy — P91 Car Care",
    description:
      "When booking fees are refundable, how cancellations and reschedules are handled, " +
      "and how to request a refund from P91 Car Care.",
  },
  {
    path: "/ppf-ceramic-coating",
    title: "Paint Protection Film & Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "PPF and 9H ceramic coating for cars and bikes in Bangalore. See real before-and-after " +
      "work, compare packages, and get a quote from P91 Car Care.",
  },
  {
    path: "/contact",
    title: "Contact P91 Car Care | Indiranagar, Bangalore",
    description:
      "Call, WhatsApp or visit the P91 Car Care detailing studio in Indiranagar, Bangalore. " +
      "Opening hours, directions and enquiry form.",
  },
];

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

function headFor(route) {
  const canonical = ORIGIN + route.path;
  const image = ORIGIN + OG_IMAGE;
  const tags = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="${route.ogType || "website"}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];
  for (const block of route.jsonLd || []) {
    // JSON-LD is data, not markup: only "<" needs neutralising so a value can never
    // close the script element early.
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`,
    );
  }
  return tags.map((t) => "    " + t).join("\n");
}

async function main() {
  if (!existsSync(SHELL)) {
    die(`no built shell at ${path.relative(ROOT, SHELL)} — run vite build first`);
  }
  const shell = await fs.readFile(SHELL, "utf8");
  if (!/<\/head>/i.test(shell)) die("the built index.html has no </head> to inject into");

  const content = await loadContent();
  const { BLOG_POSTS, SEO_PAGES, LANDING_PAGES, BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION } = content;
  if (!Array.isArray(BLOG_POSTS) || !BLOG_POSTS.length) die("BLOG_POSTS is empty");
  if (!Array.isArray(SEO_PAGES) || !SEO_PAGES.length) die("SEO_PAGES is empty");
  if (!Array.isArray(LANDING_PAGES) || !LANDING_PAGES.length) die("LANDING_PAGES is empty");

  const routes = [...STATIC_ROUTES];

  // /blog — title and description come from the shared constants, not a copy here.
  routes.push({
    path: "/blog",
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
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
      title: content.categoryTitle(category),
      description: content.categoryDescription(category),
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

  for (const p of SEO_PAGES) {
    if (!p.slug || !p.title || !p.description) die(`SEO page "${p.slug}" is missing metadata`);
    routes.push({
      path: `/services/${p.slug}`,
      title: p.title,
      description: p.description,
      jsonLd: [
        breadcrumbs([
          ["Home", "/"],
          ["Services", "/services"],
          [p.h1 || p.title, `/services/${p.slug}`],
        ]),
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
    const html = stripped.replace(/<\/head>/i, headFor(route) + "\n  </head>");

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
      `    <meta name="description" content="This page could not be found. Browse our car detailing, ceramic coating and paint protection services in Indiranagar, Bangalore." />`,
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
    `[prerender]   ${STATIC_ROUTES.length} static, ${BLOG_POSTS.length} posts, ${SEO_PAGES.length} service pages, ${LANDING_PAGES.length} campaign pages`,
  );
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
