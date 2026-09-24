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
    // ONE current page per service (2026-09-24): the same redesigned pages the /services catalogue
    // opens. The older /services/:seoSlug guide pages are no longer linked from the menus.
    heading: "Ceramic Coating",
    links: [
      { label: "Ceramic coating", href: "/services/ceramic-coating-bangalore" },
    ],
  },
  {
    heading: "Paint Protection Film",
    links: [
      { label: "Paint protection film", href: "/services/paint-protection-film-bangalore" },
    ],
  },
  {
    heading: "Detailing",
    links: [
      { label: "Interior Rejuvenation", href: "/service/interior-detailing-service" },
      { label: "Exterior Detailing", href: "/service/exterior-detailing-hard-water-new" },
    ],
  },
  {
    heading: "Glass & Restoration",
    links: [
      { label: "Glass & sun film overview", href: "/services/glass-sun-control-film-bangalore" },
    ],
  },
  {
    // The three prepaid/one-time wash and maintenance products, ordered by commitment.
    heading: "Packages",
    links: [
      { label: "Premium Car Wash Special", href: "/service/premium-car-wash-special" },
      { label: "Annual Car Wash", href: "/service/annual-car-wash-package" },
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
export interface ProductBrand {
  name: string;
  tagline: string;
  /** One line on what the brand is. Shown under the name in the Products dropdown and on the
   *  homepage's "Why P91" section. Every word is taken from wording the site already uses
   *  (nav taglines above, the PPF/ceramic landing page's brand table) — nothing new is claimed. */
  line: string;
  /** Two or three short points, same sourcing rule as `line`. */
  points: string[];
  href: string;
  /** True for STEK/Nasiol: the manufacturer's own real site, opened in a new tab —
   *  not the /services page for the P91 job that fits their film/coating. False (or
   *  unset) for P91's own product line, which stays an internal Link. */
  external?: boolean;
}

export const PRODUCT_BRANDS: ProductBrand[] = [
  // 2026-09-24: each brand has its own page on this site (pages/brand-page.tsx). The manufacturer's
  // site is linked from that page, not from here. Benefit points come from the manufacturer's own
  // site or from wording P91 already publishes (see lib/brand-pages.ts).
  {
    name: "STEK",
    tagline: "Paint protection film and window film",
    line: "Paint protection film and sun-control film, fitted in our Adugodi studio.",
    points: ["Gloss & matte finishes", "Self-healing film", "PPF and sun-control films"],
    href: "/products/stek",
  },
  {
    name: "Nasiol",
    tagline: "Nano-ceramic coating from Turkey",
    line: "Nano-ceramic coating from Turkey, applied in our Adugodi studio.",
    points: ["Water & stain repellent", "Scratch, UV & chemical resistant", "Easy to keep clean"],
    href: "/products/nasiol",
  },
  {
    name: "P91 Premium PPF",
    tagline: "Our own PPF line, fitted in-studio",
    line: "Our own paint protection film line, fitted in-studio.",
    points: ["Hatchback, sedan & SUV packages", "Self-healing film", "Fitted and warranty-backed"],
    href: "/products/p91-premium-ppf",
  },
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
