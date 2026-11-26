import { LINK_MAP, remapPath } from "./link-map.ts";

/**
 * Old-site URLs that 301/308 to their new page after cutover (Plan 3 Task 1), consumed by
 * apps/web/next.config.ts redirects() and checked live by scripts/web/check-redirects.mjs.
 *
 * Built from LINK_MAP (the same table that rewrites links in copy) plus the old URLs the map only
 * covers through its prefix rules. `/service/*` and `/booking-confirmation/*` are never here: nginx
 * keeps them on the API container, where the working online booking lives until Plan 2c.
 * Every destination is a live page and never itself a source, so each old URL is one hop.
 */
export type Redirect = { source: string; destination: string; permanent: true };

/** Routes of apps/web that are not registry pages (legal pages, generated files). */
export const NON_REGISTRY_ROUTES = ["/privacy-policy", "/terms-conditions", "/refund-policy", "/sitemap.xml", "/robots.txt", "/llms.txt"] as const;

/** Old blog posts (packages/content/src/blog-posts.ts); tests/web-redirects.test.mjs fails if one is added there and not here. */
const OLD_BLOG_SLUGS = [
  "ppf-koramangala-hsr-layout-shanti-nagar-adugodi",
  "ppf-vs-ceramic-coating-bangalore",
  "hard-water-spot-removal-bangalore",
  "windshield-heat-rejection-film-summer",
  "how-much-ppf-does-your-car-need",
  "is-your-ppf-really-made-in-usa",
  "monsoon-damage-car-bangalore",
  "best-car-detailing-in-bangalore",
];
/** Old brand pages /products/<brand> (brand-pages.ts). */
const OLD_PRODUCT_SLUGS = ["stek", "nasiol", "p91-premium-ppf"];
/** Old blog category listings (blogCategories() in blog-posts.ts; audit 20 Nov). */
const OLD_BLOG_CATEGORIES = ["glass-film", "paint-care", "protection"];

const EXACT: Array<[string, string]> = [
  ...Object.entries(LINK_MAP).filter(([from]) => !from.startsWith("/service/")),
  ...OLD_PRODUCT_SLUGS.map((s): [string, string] => [`/products/${s}`, remapPath(`/products/${s}`)]),
  ...OLD_BLOG_SLUGS.map((s): [string, string] => [`/blog/${s}`, remapPath(`/blog/${s}`)]),
  ...OLD_BLOG_CATEGORIES.map((c): [string, string] => [`/blog/category/${c}`, remapPath(`/blog/category/${c}`)]),
  // Already 301s on the old site (apps/api/src/routes.ts): the old combined PPF + ceramic page, and /index.html.
  ["/ppf-ceramic-coating", "/services"],
  ["/index.html", "/"],
];

const seen = new Set<string>();
export const OLD_URL_REDIRECTS: Redirect[] = [
  ...EXACT.filter(([from]) => (seen.has(from) ? false : (seen.add(from), true)))
    .map(([source, destination]) => ({ source, destination, permanent: true as const })),
  // Any other category listing (old site, /blog/category/:categorySlug).
  { source: "/blog/category/:slug", destination: "/guides", permanent: true },
];

function matches(source: string, path: string): boolean {
  if (!source.includes(":")) return source === path;
  const re = new RegExp("^" + source.replace(/:[a-z]+/g, "[^/]+") + "$");
  return re.test(path);
}

/** Where an old URL redirects (first match, as Next applies them), or null when it is not redirected. */
export function redirectTarget(path: string): string | null {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return OLD_URL_REDIRECTS.find((r) => matches(r.source, clean))?.destination ?? null;
}
