import { blogCategories, categorySlug } from "./blog-posts";

/**
 * Static content for the header's three mega-menus (Services / Products / Resources).
 *
 * Every href below is a route that already exists elsewhere in the app — the /service/:slug
 * slugs are the ones asserted as the 17 production services in tests/service-taxonomy
 * (via lib/service-taxonomy.ts), and the /services/:seoSlug guides are the four pages in
 * lib/seo-pages.ts (the same four site-footer.tsx already links under "Services"). Nothing
 * here is a new page or a new destination — this is a second, richer way to reach pages
 * that were previously only linked from the footer or the catalogue grid.
 *
 * Deliberately NOT linked from here: the Meta Ads campaign landing pages
 * (/ceramic-coating/car, /ceramic-coating/bike, /ppf, /ppf-ceramic-coating). Those exist to
 * receive paid traffic and carry their own attribution/pixel logic (see App.tsx) — routing
 * permanent site nav into them would mix organic clicks into ad-campaign pages that were
 * built and worded for a specific offer, not general browsing.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

export const SERVICES_COLUMNS: NavColumn[] = [
  {
    heading: "Ceramic Coating",
    links: [
      { label: "Car — 1 Year Ceramic Coating", href: "/service/1-year-ceramic-coating" },
      { label: "Bike — 1 Year Ceramic Coating", href: "/service/1-year-bike-ceramic-coating" },
      { label: "Ceramic coating overview", href: "/services/ceramic-coating-bangalore" },
    ],
  },
  {
    heading: "Paint Protection Film",
    links: [
      { label: "PPF — Hatchback", href: "/service/ppf-hatchback" },
      { label: "PPF — Sedan", href: "/service/ppf-sedan" },
      { label: "PPF — SUV", href: "/service/ppf-suv" },
      { label: "PPF overview", href: "/services/paint-protection-film-bangalore" },
    ],
  },
  {
    heading: "Detailing",
    links: [
      { label: "Interior Detailing", href: "/service/interior-detailing-service" },
      { label: "Exterior Detailing", href: "/service/exterior-detailing-hard-water-new" },
      { label: "Car Polishing", href: "/service/car-polishing" },
    ],
  },
  {
    heading: "Glass & Restoration",
    links: [
      { label: "Windshield Glass Coating", href: "/service/windshield-glass-coating-new" },
      { label: "Glass Polishing", href: "/service/windshield-glass-polishing" },
      { label: "Headlight Restoration", href: "/service/headlight-restoration-both" },
      { label: "Glass & sun film overview", href: "/services/glass-sun-control-film-bangalore" },
    ],
  },
  {
    // The three prepaid/one-time wash and maintenance products — previously reachable only
    // by browsing /services, with no dedicated nav entry (Annual Maintenance Package used
    // to sit under Detailing, which is where it least belongs). Ordered by commitment:
    // one-time, then wash-only for a year, then the fuller wash+detailing year plan.
    heading: "Packages",
    links: [
      { label: "Premium Car Wash Special", href: "/service/premium-car-wash-special" },
      { label: "1 Year Car Wash Package", href: "/service/annual-car-wash-package" },
      { label: "Annual Maintenance Package", href: "/service/annual-maintenance-package" },
    ],
  },
];

/**
 * Brand cards for the "Products" menu — the same three names home.tsx's "Films and coatings
 * we fit" section already publishes, with the same fine print. P91 doesn't sell these as a
 * take-home product; every one is fitted in-studio, hence each card links to the service
 * page that books the install rather than to a storefront that doesn't exist.
 */
export const PRODUCT_BRANDS: { name: string; tagline: string; href: string }[] = [
  { name: "STEK", tagline: "Paint protection film — self-healing, matte & gloss", href: "/services/paint-protection-film-bangalore" },
  { name: "Nasiol", tagline: "Ceramic coating — long-term gloss & hydrophobic protection", href: "/services/ceramic-coating-bangalore" },
  { name: "P91 Premium PPF", tagline: "Our own PPF line, fitted and warranty-backed in-studio", href: "/service/ppf-suv" },
];

export const PRODUCT_FINE_PRINT =
  "Warranty on any job is the film or coating manufacturer's, issued in writing at handover.";

/** Blog categories, derived live from BLOG_POSTS so this can never list a category with no posts. */
export function resourcesGuideLinks(): NavLink[] {
  return blogCategories().map((c) => ({ label: c, href: `/blog/category/${categorySlug(c)}` }));
}

export const RESOURCES_CONTACT_LINKS: NavLink[] = [
  { label: "Contact us", href: "/contact" },
];
