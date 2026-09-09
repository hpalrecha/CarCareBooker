/**
 * Content for the four local-intent SEO landing pages.
 *
 * These target the searches a Bangalore customer actually types — "ceramic coating
 * bangalore", "ppf indiranagar" — which the per-service pages at /service/:slug cannot
 * rank for on their own, because they are named after catalogue rows rather than intent.
 *
 * ADDITIVE. Nothing here replaces or redirects /service/:slug. Those 17 URLs are indexed
 * and stay exactly as they are; these live alongside at /services/:slug.
 *
 * THE PRICE RULE. No price appears in this file. Each page names the catalogue SLUGS it
 * covers, and the page component reads price, originalPrice and image from
 * GET /api/services at render time. The prototype's own version of these pages carried a
 * disclaimer — "figures shown are sample data, live pricing comes from the services
 * database" — and its sample figures were wrong (ceramic coating at ₹14,999 against a
 * real ₹5,999). Naming slugs rather than numbers makes that class of error impossible.
 *
 * The prose is the prototype's, carried over so the layouts are complete. It states no
 * price, no availability and no offer.
 */

export interface SeoPageSection {
  heading: string;
  /** Rendered as <p> elements in order. */
  paragraphs?: string[];
  /** Rendered as a <ul>. */
  bullets?: string[];
}

export interface SeoPageFaq {
  question: string;
  answer: string;
}

export interface SeoPage {
  /** URL segment: /services/<slug> */
  slug: string;
  /** Single <h1>. */
  h1: string;
  lede: string;
  /** <title>, kept under 60 characters. */
  title: string;
  /** <meta name="description">, kept under 160 characters. */
  description: string;
  /** Breadcrumb leaf label. */
  crumb: string;
  /**
   * Catalogue slug whose photograph illustrates the page, and whose record backs the
   * Service schema. Must exist in /api/services.
   */
  primaryServiceSlug: string;
  /** Catalogue slugs shown in the Prices table, in display order. */
  priceServiceSlugs: string[];
  /** What the customer gets — the prototype's list. */
  includes: string[];
  /** The local-context section that gives the page its reason to rank. */
  context: SeoPageSection;
  faqs: SeoPageFaq[];
  /** Slugs of the other SEO pages linked at the foot. */
  related: string[];
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "ceramic-coating-bangalore",
    h1: "Ceramic Coating in Indiranagar, Bangalore",
    title: "Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "Nano-ceramic coating with machine paint correction in Indiranagar, Bangalore. Resists borewell water staining and makes every wash easier.",
    crumb: "Ceramic coating",
    lede:
      "Machine paint correction followed by a nano-ceramic layer that resists borewell water staining, repels dirt, and makes every wash after it easier.",
    primaryServiceSlug: "1-year-ceramic-coating",
    priceServiceSlugs: [
      "1-year-ceramic-coating",
      "1-year-bike-ceramic-coating",
      "windshield-glass-coating-new",
    ],
    includes: [
      "Full decontamination wash and clay bar treatment",
      "Machine paint correction to remove swirls and water-spot etching",
      "Panel wipe and surface preparation",
      "Nano-ceramic coating applied panel by panel",
      "Controlled curing, then final inspection under inspection lighting",
    ],
    context: {
      heading: "How Bangalore borewell water damages clearcoats",
      paragraphs: [
        "Most of Indiranagar and the surrounding areas run on borewell supply with a high dissolved mineral content. When a droplet dries on a hot panel, the water leaves and the calcium and magnesium stay — sitting as a concentrated alkaline deposit directly on your clearcoat.",
        "In shade that washes off. In direct sun it begins etching a crater within days, and at that point no chemical will fix it — the panel needs machine polishing. A coating does not make paint immune, but it widens the window between the water landing and the damage starting.",
      ],
    },
    faqs: [
      {
        question: "How long does the car stay with you?",
        answer:
          "Typically a full day. Paint correction is the slow part; the coating goes on quickly but needs controlled curing before the car goes back out.",
      },
      {
        question: "Is 9H a meaningful number?",
        answer:
          "Not really. It refers to a pencil hardness test on a flat panel and does not translate to scratch resistance on a car. Judge a coating by its warranty and who is installing it.",
      },
      {
        question: "Can I wash the car normally afterwards?",
        answer:
          "Yes, after the initial cure. Use pH-neutral shampoo and dry the car rather than letting it air-dry — the coating helps with hard water, it does not make it harmless.",
      },
    ],
    related: ["paint-protection-film-bangalore", "interior-detailing-bangalore", "glass-sun-control-film-bangalore"],
  },

  {
    slug: "paint-protection-film-bangalore",
    h1: "Paint Protection Film (PPF) in Indiranagar, Bangalore",
    title: "Paint Protection Film in Bangalore | P91 Car Care",
    description:
      "Self-healing paint protection film fitted in Indiranagar, Bangalore. Full-body and partial coverage for stone chips and kerb damage.",
    crumb: "Paint protection film",
    lede:
      "A self-healing urethane layer over your paint, cut to the panel and fitted in a controlled bay — so stone chips, trolleys and kerbs hit the film instead of the clearcoat.",
    primaryServiceSlug: "ppf-sedan",
    priceServiceSlugs: [
      "ppf-hatchback",
      "ppf-sedan",
      "ppf-suv",
      "partial-ppf-hatchback",
      "partial-ppf-sedan",
      "partial-ppf-suv",
    ],
    includes: [
      "Panel-by-panel measurement and plotter-cut film",
      "Full decontamination and paint inspection before fitting",
      "Wrapped edges where the panel allows, so no lifting line is visible",
      "Squeegee and heat-set, then a controlled cure",
      "Manufacturer warranty card issued at handover",
    ],
    context: {
      heading: "How Bangalore traffic damages a front bumper",
      paragraphs: [
        "Stop-start traffic is the problem, not speed. Sitting in a queue on the Outer Ring Road puts your bumper directly behind someone else's tyres for an hour at a time, and every one of those tyres is throwing grit forward at the panel closest to it.",
        "That is why damage concentrates on the bumper, bonnet leading edge and wing mirrors rather than spreading evenly. Film on those panels costs a fraction of full-body coverage and takes most of the abuse a Bangalore commute delivers.",
      ],
    },
    faqs: [
      {
        question: "Full body or just the front?",
        answer:
          "For a daily commute, front-end coverage handles the majority of real damage. Full body makes sense for a car you intend to keep long-term or resell at a premium.",
      },
      {
        question: "Does film change the colour of the paint?",
        answer:
          "A gloss film should be visually indistinguishable once fitted. Matte film deliberately changes the finish, which is a choice rather than a side effect.",
      },
      {
        question: "Can film be removed later?",
        answer:
          "Yes. Quality film is designed to come off without taking the clearcoat with it, which is one reason the film brand matters more than the price.",
      },
    ],
    related: ["ceramic-coating-bangalore", "glass-sun-control-film-bangalore", "interior-detailing-bangalore"],
  },

  {
    slug: "interior-detailing-bangalore",
    h1: "Car Interior Detailing in Indiranagar, Bangalore",
    title: "Car Interior Detailing in Bangalore | P91 Car Care",
    description:
      "Deep interior cleaning in Indiranagar, Bangalore: seat shampoo, dashboard and vents, leather conditioning and odour removal.",
    crumb: "Interior detailing",
    lede:
      "Seats shampooed, vents cleared, leather conditioned and the cabin deodorised — a full reset of the space you actually sit in.",
    primaryServiceSlug: "interior-detailing-service",
    priceServiceSlugs: ["interior-detailing-service"],
    includes: [
      "Complete vacuum of seats, carpets and crevices",
      "Fabric and upholstery deep cleaning with extraction",
      "Leather cleaning and conditioning where fitted",
      "Dashboard, console, door panels and trim detailing",
      "Air-vent cleaning and cabin odour treatment",
    ],
    context: {
      heading: "Why Bangalore interiors need more than a vacuum",
      paragraphs: [
        "Two things work against a cabin here: humidity and dust. Monsoon humidity keeps upholstery damp enough for mould to establish in the foam under the seat cover, which is why a car can smell musty even when it looks clean.",
        "The dust is finer than a domestic vacuum can lift and settles into the vents, so it returns to the cabin every time the fan runs. Extraction cleaning and vent work address both; surface vacuuming addresses neither.",
      ],
    },
    faqs: [
      {
        question: "How long does interior detailing take?",
        answer:
          "Most cars take a few hours. Upholstery has to dry properly before the car goes back out, which is the part that cannot be rushed.",
      },
      {
        question: "Will it remove smoke or pet odour?",
        answer:
          "Usually, because the source is almost always in the fabric rather than the air. Odour that has soaked into foam over years can need a second treatment.",
      },
      {
        question: "Are the products safe for leather?",
        answer:
          "Yes. Leather is cleaned with a pH-appropriate product and conditioned afterwards, rather than being scrubbed with an all-purpose cleaner.",
      },
    ],
    related: ["ceramic-coating-bangalore", "paint-protection-film-bangalore", "glass-sun-control-film-bangalore"],
  },

  {
    slug: "glass-sun-control-film-bangalore",
    h1: "Windshield Glass Coating & Sun Control Film in Bangalore",
    title: "Sun Control Film & Glass Coating Bangalore | P91",
    description:
      "Heat-rejection sun control film and rain-repellent windshield glass coating fitted in Indiranagar, Bangalore.",
    crumb: "Glass & sun film",
    lede:
      "Heat-rejection film for the cabin and a rain-repellent coating for the windshield — two different jobs that people usually ask about together.",
    primaryServiceSlug: "stek-suncontrol-films",
    priceServiceSlugs: [
      "stek-suncontrol-films",
      "stek-windsheild-suncontrol-films",
      "windshield-glass-coating-new",
      "windshield-glass-polishing",
    ],
    includes: [
      "Glass decontamination and edge preparation",
      "Plotter-cut film fitted in a controlled, dust-managed bay",
      "Heat-shrink to the curvature of the screen where required",
      "Rain-repellent coating applied and buffed to a streak-free finish",
      "Manufacturer spec sheet provided for the film fitted",
    ],
    context: {
      heading: "What the numbers on sun film actually mean",
      paragraphs: [
        "Film is sold on three figures and only one of them describes how cool the car will be. VLT is how dark the film looks and is what the law regulates. IR rejection is measured at a single wavelength, so a film can advertise a high number and still pass plenty of heat.",
        "TSER — total solar energy rejected — is the one that matters, because it accounts for visible light, infrared and ultraviolet together. Ask for the manufacturer's TSER figure for the exact film being fitted, and check your state's VLT limits before committing.",
      ],
    },
    faqs: [
      {
        question: "Is sun film legal in Karnataka?",
        answer:
          "Visible light transmission limits are set by law and are enforced. Ask for the VLT figure of the specific film before it is fitted, and keep the spec sheet in the car.",
      },
      {
        question: "Does darker film mean a cooler cabin?",
        answer:
          "No. Darkness and heat rejection are separate properties. A nearly clear film with a high TSER can outperform a much darker cheap film.",
      },
      {
        question: "What does windshield glass coating do?",
        answer:
          "It makes rain bead and clear at speed, which mostly helps night driving in the monsoon. It is a different product from sun film and is often done at the same time.",
      },
    ],
    related: ["ceramic-coating-bangalore", "paint-protection-film-bangalore", "interior-detailing-bangalore"],
  },
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.slug === slug);
}
