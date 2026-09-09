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
  {
    path: "/contact",
    title: "Contact P91 Car Care | Indiranagar, Bangalore",
    description:
      "Call, WhatsApp or visit the P91 Car Care detailing studio in Indiranagar, Bangalore. " +
      "Opening hours, directions and enquiry form.",
  },
  {
    path: "/blog",
    title: "Car Care Guides & Detailing Advice | P91 Car Care",
    description:
      "Straight answers on ceramic coating, paint protection film, hard water spots and sun " +
      "control film — written for Bangalore conditions by the P91 Car Care studio.",
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

  const { BLOG_POSTS, SEO_PAGES } = await loadContent();
  if (!Array.isArray(BLOG_POSTS) || !BLOG_POSTS.length) die("BLOG_POSTS is empty");
  if (!Array.isArray(SEO_PAGES) || !SEO_PAGES.length) die("SEO_PAGES is empty");

  const routes = [...STATIC_ROUTES];

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

  // The shell carries a generic title and description for the SPA. Strip them, or every
  // prerendered page ships two <title> tags and crawlers pick whichever they like.
  const stripped = shell
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/i, "")
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/>\r?\n?/i, "")
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\r?\n?/i, "");
  if (/<title>/i.test(stripped)) die("could not strip the shell's own <title>");

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

  console.log(`[prerender] ${written} routes -> dist/public/**/index.html`);
  console.log(`[prerender]   plus 404.html (noindex) for unmatched URLs`);
  console.log(
    `[prerender]   ${STATIC_ROUTES.length} static, ${BLOG_POSTS.length} posts, ${SEO_PAGES.length} service pages`,
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
