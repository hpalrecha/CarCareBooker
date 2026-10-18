/**
 * Foreign e-commerce spam URLs that were crawled on this domain (Search Console "Soft 404", 22
 * pages such as /PIZARRA-DE-DIBUJO-12-quot-KOOME-692765). They are not ours and never existed
 * here. A missing page answers 404; these answer 410 Gone, which tells Google the page is
 * permanently absent and so removes it from reports sooner.
 *
 * Shape: ONE path segment, at least four hyphen-separated parts, ending in a 5-7 digit id.
 * No real route of this site matches: every page is /name or /group/name, and none ends in
 * -12345. Query strings are ignored by the caller.
 */
const SPAM_PRODUCT_PATH = /^\/(?:[^/-]+-){3,}\d{5,7}\/?$/;

/**
 * Exact leftover paths from the domain's previous owner that Googlebot still requests. Nothing
 * in this repo, its git history, the served HTML or the JS bundle references them.
 * Compared without the trailing slash, case-sensitively.
 */
const LEGACY_GONE_PATHS = new Set(["/le48"]);

export function isSpamProductPath(pathname: string): boolean {
  return SPAM_PRODUCT_PATH.test(pathname) || LEGACY_GONE_PATHS.has(pathname.replace(/\/+$/, ""));
}
