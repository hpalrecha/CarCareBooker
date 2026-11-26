/**
 * Foreign e-commerce spam URLs that were crawled on this domain (Search Console "Soft 404", 22
 * pages such as /PIZARRA-DE-DIBUJO-12-quot-KOOME-692765). They are not ours and never existed
 * here. A missing page answers 404; these answer 410 Gone, which tells Google the page is
 * permanently absent and so removes it from reports sooner.
 *
 * Shape: ONE path segment, at least four hyphen-separated parts, ending in a 5-7 digit id.
 * No real route of this site matches: every page is /name or /group/name, and none ends in
 * -12345. Query strings are ignored by the caller.
 *
 * Shared by the API (apps/api/src/lib/spam-paths.ts re-exports it) and the web app's proxy
 * (apps/web/proxy.ts), so the old and the new site can never disagree on what is gone.
 */
const SPAM_PRODUCT_PATH = /^\/(?:[^/-]+-){3,}\d{5,7}\/?$/;

/**
 * Exact leftover paths from the domain's previous owner that Googlebot still requests. Nothing
 * in this repo, its git history, the served HTML or the JS bundle references them.
 * Compared without the trailing slash, case-sensitively.
 */
const LEGACY_GONE_PATHS = new Set(["/le48"]);

/**
 * Pages the studio removed on purpose (mirrors REMOVED_PAGES in apps/api/src/middleware/gone-paths.ts).
 * /offer/de-dhana-dhan: the Dussehra and Diwali offer ended on 8 November 2026. Compared lower-case, no trailing slash.
 */
export const REMOVED_PAGES: ReadonlySet<string> = new Set(["/offer/de-dhana-dhan"]);

export function isSpamProductPath(pathname: string): boolean {
  return SPAM_PRODUCT_PATH.test(pathname) || LEGACY_GONE_PATHS.has(pathname.replace(/\/+$/, ""));
}

/** True for every path the site answers with 410 Gone + X-Robots-Tag: noindex. */
export function isGonePath(pathname: string): boolean {
  return isSpamProductPath(pathname) || REMOVED_PAGES.has(pathname.replace(/\/+$/, "").toLowerCase());
}
