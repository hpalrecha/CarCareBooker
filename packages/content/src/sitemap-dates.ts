/**
 * sitemap.xml <lastmod> values, in ONE place, each backed by the last MATERIAL change to the text a reader sees.
 *
 * Why this exists. The dates used to be typed into apps/api/src/routes.ts. The eight articles carried their publish dates
 * (30 Jul to 10 Sep) although every one was edited on 2026-11-17, and /faq said 2026-11-19 although six FAQs were added
 * on 2026-11-20. Google only trusts lastmod if it is accurate across the site, so a date here must be a real change
 * date, never "today" and never copied across pages.
 *
 * What counts as material: wording, claims, FAQs, prices shown, or sections a reader sees were added, removed or
 * rewritten. A colour, a spacing rule or a two-line typo is not material, and a page with no material change since it was
 * published carries no date at all (leave it out of this map).
 *
 * Evidence (git history of origin/main, 2026-11-20):
 *   2026-11-17  42e8fe9  plain-English copy pass: all eight articles (4 to 11 lines each; self-healing and warranty sentences
 *                         removed or reworded), the four guides, /ppf and the ceramic pages
 *   2026-11-18  af30871  How it works and Visit the studio sections added to /services, /products and the four guides
 *   2026-11-18  e9593af  /ppf shows package-neutral FAQs only; /ceramic-coating/bike gets its own FAQ
 *   2026-11-20  6aa74de  homepage title, description and H1; six FAQs added on /faq
 *   2026-09-24  Nasiol brand entry (30 lines), no later material change
 * Left out on purpose: /products/stek and /products/p91-premium-ppf (2 and 3 lines on 17 Nov), /gallery and /contact (2 lines).
 *
 * Service items (/service/<slug>) are separate: their date is the later of the catalogue row's updatedAt and
 * SERVICE_TEMPLATE_MODIFIED, because the page is the row plus the template (see serviceItemLastmod).
 *
 * WHEN YOU DEPLOY A CHANGE THAT ALTERS PAGE TEXT, update the date of exactly the pages it altered, with its commit in the
 * comment above. Do not touch the others.
 *
 * Relative imports only: apps/api/src/routes.ts bundles this through esbuild.
 */
export const SITEMAP_LASTMOD: Readonly<Record<string, string>> = Object.freeze({
  "/": "2026-11-20",
  "/services": "2026-11-18",
  "/products": "2026-11-18",
  "/products/nasiol": "2026-09-24",
  "/services/ceramic-coating-bangalore": "2026-11-18",
  "/services/paint-protection-film-bangalore": "2026-11-18",
  "/services/interior-detailing-bangalore": "2026-11-18",
  "/services/glass-sun-control-film-bangalore": "2026-11-18",
  "/blog": "2026-11-17",
  "/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi": "2026-11-17",
  "/blog/ppf-vs-ceramic-coating-bangalore": "2026-11-17",
  "/blog/hard-water-spot-removal-bangalore": "2026-11-17",
  "/blog/windshield-heat-rejection-film-summer": "2026-11-17",
  "/blog/is-your-ppf-really-made-in-usa": "2026-11-17",
  "/blog/how-much-ppf-does-your-car-need": "2026-11-17",
  "/blog/monsoon-damage-car-bangalore": "2026-11-17",
  "/blog/best-car-detailing-in-bangalore": "2026-11-17",
  "/ceramic-coating/car": "2026-11-17",
  "/ceramic-coating/bike": "2026-11-18",
  "/ppf": "2026-11-18",
  "/faq": "2026-11-20",
});

/** Last material change to the service-item template (How it works and Visit sections, commit af30871). */
export const SERVICE_TEMPLATE_MODIFIED = "2026-11-18";

/** `YYYY-MM-DD` of the later of the row's updatedAt and the template date, or the template date alone when the row has none. */
export function serviceItemLastmod(updatedAt: unknown): string {
  const t = updatedAt ? new Date(updatedAt as string | number | Date).getTime() : NaN;
  const row = Number.isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
  return row > SERVICE_TEMPLATE_MODIFIED ? row : SERVICE_TEMPLATE_MODIFIED;
}
