/**
 * Cross-URL canonicals for consolidated near-duplicate pages.
 *
 * WHY THIS EXISTS (SEO audit, 2026-10): Search Console reported most of the site as
 * "Crawled - currently not indexed". The six PPF size-variant service pages share almost
 * all of their text with each other and with the /ppf campaign page (which embeds the
 * same service record's sections and FAQPage schema), and /service/1-year-ceramic-coating
 * and /service/1-year-bike-ceramic-coating are the records the two ceramic campaign pages
 * are built from. Google was being asked to choose between near-identical URLs and was
 * choosing none. Each group now names ONE canonical: the campaign page, which is already
 * the sitemap's declared destination for that transactional intent.
 *
 * The /service/ pages themselves are NOT redirected and NOT noindexed — ads, the booking
 * flow and internal links keep working exactly as before. Only <link rel="canonical"> and
 * og:url change, and the consolidated URLs leave the sitemap (a sitemap lists canonical
 * URLs only).
 *
 * ONE module, imported by every emitter so they cannot disagree:
 *   - server/vite.ts         /service/:slug HTML served per request
 *   - scripts/prerender.mjs  build-time HTML (via scripts/prerender-content-entry.ts)
 *   - service-landing.tsx    useSeoMeta after hydration
 *   - server/routes.ts       /sitemap.xml exclusion
 *
 * Every slug not listed here keeps its self-canonical. Deliberately NOT listed:
 * premium-car-wash-special (kept as its own page on purpose).
 */

/** service slug -> root-relative canonical path */
export const CANONICAL_OVERRIDES: Readonly<Record<string, string>> = Object.freeze({
  "ppf-hatchback": "/ppf",
  "ppf-sedan": "/ppf",
  "ppf-suv": "/ppf",
  "ppf-premium-hatchback": "/ppf",
  "ppf-premium-sedan": "/ppf",
  "ppf-premium-suv": "/ppf",
  "1-year-ceramic-coating": "/ceramic-coating/car",
  "1-year-bike-ceramic-coating": "/ceramic-coating/bike",
});

/** True when /service/<slug> points its canonical at another URL (so: not in the sitemap). */
export function isConsolidatedServiceSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(CANONICAL_OVERRIDES, slug);
}

/** Root-relative canonical path for /service/<slug>. */
export function serviceCanonicalPath(slug: string): string {
  return isConsolidatedServiceSlug(slug) ? CANONICAL_OVERRIDES[slug] : `/service/${slug}`;
}

/**
 * Root-relative canonical path for any route path. /service/<slug> goes through the
 * override map; every other path is its own canonical. Used by the prerenderer so a
 * service page, if it is ever prerendered, cannot ship a self-canonical by accident.
 */
export function canonicalPathFor(routePath: string): string {
  const m = /^\/service\/([^/?#]+)\/?$/.exec(routePath);
  return m ? serviceCanonicalPath(m[1]) : routePath;
}
