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
    // Individual service links removed — the overview page (Explore tabs, see
    // seo-service-page.tsx) already lists every variant with real pricing/images, so this
    // column just points straight at it instead of duplicating the list here.
    heading: "Ceramic Coating",
    links: [
      { label: "Ceramic coating overview", href: "/services/ceramic-coating-bangalore" },
    ],
  },
  {
    heading: "Paint Protection Film",
    links: [
      { label: "PPF overview", href: "/services/paint-protection-film-bangalore" },
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
    // The three prepaid/one-time wash and maintenance products — previously reachable only
    // by browsing /services, with no dedicated nav entry (Annual Maintenance Package used
    // to sit under Detailing, which is where it least belongs). Ordered by commitment:
    // one-time, then wash-only for a year, then the fuller wash+detailing year plan.
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
  // By request (2026-09-23): the brand card now sends the visitor to the
  // manufacturer's own real site — verified official domains, not guessed — rather
  // than P91's own service page for the film/coating.
  {
    name: "STEK",
    tagline: "Paint protection film — self-healing, matte & gloss",
    line: "Paint protection film, fitted in our Adugodi studio.",
    points: ["Gloss & matte finishes", "Self-healing film", "Written manufacturer warranty"],
    href: "https://stek-india.in/",
    external: true,
  },
  {
    name: "Nasiol",
    tagline: "Ceramic coating — long-term gloss & hydrophobic protection",
    line: "Nano-ceramic coating technology from Turkey.",
    points: ["Long-term gloss", "Hydrophobic protection", "Written manufacturer warranty"],
    href: "https://www.nasiol.in/",
    external: true,
  },
  {
    name: "P91 Premium PPF",
    tagline: "Our own PPF line, fitted and warranty-backed in-studio",
    line: "Our own PPF line, fitted in-studio.",
    points: ["Hatchback, sedan and SUV packages", "Self-healing film", "Warranty-backed, in-studio"],
    href: "/service/ppf-suv",
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
