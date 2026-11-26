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
 *   - apps/api/src/vite.ts         /service/:slug HTML served per request
 *   - scripts/prerender.mjs  build-time HTML (via scripts/prerender-content-entry.ts)
 *   - service-landing.tsx    useSeoMeta after hydration
 *   - apps/api/src/routes.ts       /sitemap.xml exclusion
 *
 * Every slug not listed here keeps its self-canonical. Deliberately NOT listed:
 * premium-car-wash-special (kept as its own page on purpose).
 *
 * Since Plan 3 (cutover) this map only drives the OLD site's hub option links and the old API
 * sitemap; the /service/<slug> canonical itself is serviceCanonicalPath() below (new site pages).
 */
import { remapPath } from "./site/link-map.ts";

/** service slug -> root-relative campaign page it was consolidated onto (old site) */
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

/**
 * True when /service/<slug> is one of the eight records consolidated onto an old campaign page.
 * The old API sitemap leaves these out (Plan 3: the API sitemap stays as it is; after cutover nginx
 * serves /sitemap.xml from the new site, so the API copy goes unused).
 */
export function isConsolidatedServiceSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(CANONICAL_OVERRIDES, slug);
}

/**
 * The old campaign page a consolidated record stands for, else its own /service/<slug>. The old
 * site's hub option lists (hub-option-links.ts) link by this until those hubs are retired at cutover.
 */
export function consolidatedTargetPath(slug: string): string {
  return isConsolidatedServiceSlug(slug) ? CANONICAL_OVERRIDES[slug] : `/service/${slug}`;
}

/**
 * Plan 3 Task 3 (cutover, 26 Nov 2026): the old booking pages /service/<slug> stay live (online
 * booking and payment, until Plan 2c) but stop competing in search. Every one is noindex,follow and
 * names the NEW site page for its service as canonical, from the same table the new site uses for
 * links (site/link-map.ts; its /service/* rows are the Book-online map of site/booking-links.ts
 * inverted to the family page). A record with no page of its own on the new site points at /services.
 */
export const OLD_BOOKING_PAGE_ROBOTS = "noindex,follow";

/** Root-relative canonical path for /service/<slug>: always a page of the new site. */
export function serviceCanonicalPath(slug: string): string {
  const to = remapPath(`/service/${slug}`);
  return to.startsWith("/service/") ? "/services" : to;
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
