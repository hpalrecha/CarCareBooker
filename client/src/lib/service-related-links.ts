/**
 * Related guides, products and articles for each /service/:slug page, with descriptive anchor text.
 *
 * Why this exists (technical-SEO brief, section 7): individual service pages must link to related
 * services, relevant products and related blog articles. The seven catalogue pages below used to
 * link to one or two other services and nothing else, so neither a reader nor Google had a path from
 * "Headlight restoration" to the article or brand page that explains the surrounding topic.
 *
 * Rules for this file:
 *  - A link is added only where the destination really covers the service's topic. The topic match is
 *    checked against the blog posts' own text (hard water, windshield/glass, interior, headlights in
 *    the PPF coverage article), not guessed.
 *  - No service here links to a single brand page (STEK, Nasiol, P91 Premium PPF). None of these
 *    catalogue records says which brand, if any, is used for that service, so a brand link would imply
 *    a claim the record does not make. Every product link goes to the /products hub instead, and its
 *    anchor text names no brand, so it cannot be read as "this service uses X".
 *  - Anchor text describes the destination; no "click here". Blog labels are the articles' own
 *    subjects, not invented claims.
 *  - Slugs are checked against BLOG_POSTS and the brand pages in tests/seo-foundation.test.mjs, so a
 *    renamed post fails a test instead of leaving a dead link.
 *
 * Shared by the page (pages/service-landing.tsx) and the crawlable HTML (lib/crawlable-content.ts),
 * so what a crawler reads is what a visitor sees.
 */
export interface RelatedLink {
  href: string;
  label: string;
}

export interface ServiceRelated {
  guides: RelatedLink[];
  products: RelatedLink[];
  posts: RelatedLink[];
}

const PRODUCTS_HUB: RelatedLink = {
  href: "/products",
  label: "Browse the films and coatings P91 Car Care fits, on the products page",
};

const POST = (slug: string, label: string): RelatedLink => ({ href: `/blog/${slug}`, label });
const HARD_WATER = POST("hard-water-spot-removal-bangalore", "How to protect your car paint from hard water spots in Bangalore");
const MONSOON = POST("monsoon-damage-car-bangalore", "5 things the monsoon does to your car that you cannot see yet");
const CHOOSE_STUDIO = POST("best-car-detailing-in-bangalore", "How to choose a car detailing studio in Bangalore");
const WINDSHIELD_FILM = POST("windshield-heat-rejection-film-summer", "Windshield heat rejection film: what the numbers actually mean");
const PPF_COVERAGE = POST("how-much-ppf-does-your-car-need", "How much PPF your car needs, from front-end to full body");

const GUIDE_CERAMIC: RelatedLink = { href: "/services/ceramic-coating-bangalore", label: "Ceramic coating in Bangalore: the full guide" };
const GUIDE_INTERIOR: RelatedLink = { href: "/services/interior-detailing-bangalore", label: "Car interior detailing in Bangalore: the full guide" };
const GUIDE_GLASS: RelatedLink = { href: "/services/glass-sun-control-film-bangalore", label: "Sun control film and glass coating in Bangalore" };
const GUIDE_PPF: RelatedLink = { href: "/services/paint-protection-film-bangalore", label: "Paint protection film in Bangalore: the full guide" };
const ALL_SERVICES: RelatedLink = { href: "/services", label: "All P91 Car Care services in Bangalore" };

export const SERVICE_RELATED: Record<string, ServiceRelated> = {
  "exterior-detailing-hard-water-new": {
    guides: [GUIDE_CERAMIC, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [HARD_WATER, MONSOON],
  },
  "headlight-restoration-both": {
    guides: [GUIDE_PPF, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [PPF_COVERAGE, CHOOSE_STUDIO],
  },
  "interior-detailing-service": {
    guides: [GUIDE_INTERIOR, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [CHOOSE_STUDIO, MONSOON],
  },
  "premium-car-wash-special": {
    guides: [ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [HARD_WATER, CHOOSE_STUDIO],
  },
  "windshield-glass-coating-new": {
    guides: [GUIDE_GLASS, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [WINDSHIELD_FILM, CHOOSE_STUDIO],
  },
  "windshield-glass-polishing": {
    guides: [GUIDE_GLASS, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [WINDSHIELD_FILM, CHOOSE_STUDIO],
  },
  "annual-maintenance-package": {
    guides: [GUIDE_INTERIOR, ALL_SERVICES],
    products: [PRODUCTS_HUB],
    posts: [CHOOSE_STUDIO, MONSOON],
  },
};

/** Related links for a service, or null for a service that has none listed (e.g. PPF and ceramic records). */
export function relatedLinksFor(slug: string | undefined | null): ServiceRelated | null {
  if (!slug) return null;
  return SERVICE_RELATED[slug] ?? null;
}
