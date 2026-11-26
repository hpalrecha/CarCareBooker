/**
 * Old site path -> new site path (spec section 1). Every internal link in copy migrated from the
 * old modules goes through remapLinks, so no page on the new site links to an old URL.
 *
 * Order: exact matches first, then the prefix rules (/service/ppf-*, /products/*, /blog/*).
 */
export const LINK_MAP: Record<string, string> = {
  "/ppf": "/services/paint-protection-film",
  "/services/paint-protection-film-bangalore": "/services/paint-protection-film",
  "/ceramic-coating/car": "/services/ceramic-coating",
  "/services/ceramic-coating-bangalore": "/services/ceramic-coating",
  "/service/1-year-ceramic-coating": "/services/ceramic-coating",
  "/ceramic-coating/bike": "/services/ceramic-coating/bike",
  "/service/1-year-bike-ceramic-coating": "/services/ceramic-coating/bike",
  "/services/glass-sun-control-film-bangalore": "/services/sun-control-film",
  "/service/windshield-glass-coating-new": "/services/sun-control-film/windshield-glass-coating",
  "/services/interior-detailing-bangalore": "/services/interior-detailing",
  "/service/interior-detailing-service": "/services/interior-detailing",
  "/service/exterior-detailing-hard-water-new": "/services/exterior-detailing/hard-water-spot-removal",
  "/service/headlight-restoration-both": "/services/exterior-detailing/headlight-restoration",
  "/service/windshield-glass-polishing": "/services/exterior-detailing",
  "/service/annual-maintenance-package": "/services/maintenance-plan",
  "/service/premium-car-wash-special": "/services/car-wash",
  "/products": "/brands",
  "/blog": "/guides",
  "/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi": "/areas/koramangala",
};

const PREFIX_RULES: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/^\/service\/ppf-[a-z0-9-]+$/, () => "/services/paint-protection-film"],
  [/^\/products\/([a-z0-9-]+)$/, (m) => `/brands/${m[1]}`],
  [/^\/blog\/category\/[a-z0-9/-]+$/, () => "/guides"],
  [/^\/blog\/([a-z0-9-]+)$/, (m) => `/guides/${m[1]}`],
];

/** One path, remapped; unknown paths come back unchanged. */
export function remapPath(path: string): string {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  if (Object.hasOwn(LINK_MAP, clean)) return LINK_MAP[clean];
  for (const [re, to] of PREFIX_RULES) {
    const m = re.exec(clean);
    if (m) return to(m);
  }
  return path;
}

/**
 * Rewrites `[label](/old)` markdown links and bare old paths in a piece of copy. A bare path is
 * a token that starts with "/" after a space, "(" or the start of the text; trailing punctuation
 * is left where it was.
 */
export function remapLinks(text: string): string {
  return text
    .replace(/\]\((\/[^)\s]*)\)/g, (_m, p: string) => `](${remapPath(p)})`)
    .replace(/(^|[\s"'])(\/[a-z0-9][a-z0-9/-]*)/g, (_m, pre: string, p: string) => `${pre}${remapPath(p)}`);
}
