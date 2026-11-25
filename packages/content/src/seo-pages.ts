/**
 * Content for the four local-intent SEO landing pages.
 *
 * These target the searches a Bangalore customer actually types — "ceramic coating
 * bangalore", "ppf adugodi" — which the per-service pages at /service/:slug cannot
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
  /**
   * Conversion page this guide should send a ready-to-book reader to.
   *
   * These pages serve the INFORMATIONAL intent ("what is ceramic coating"); the campaign
   * landing pages serve the transactional one ("what does it cost, book it"). Without
   * this the CTA dropped the reader on the generic catalogue, and the landing pages had
   * no inbound internal links at all.
   *
   * Set ONLY where the mapping is unambiguous. It is derived from primaryServiceSlug,
   * not guessed: the ceramic guide s primary service is the CAR record, so it points at
   * the car page. Pages without an obvious single destination leave this unset and keep
   * the existing /services CTA.
   */
  bookHref?: string;

  /** Anchor text for the link to bookHref. Both are needed for the link to render. */
  bookLabel?: string;

  /** Slugs of the other SEO pages linked at the foot. */
  related: string[];
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "ceramic-coating-bangalore",
    h1: "Ceramic Coating in Adugodi, Bangalore",
    title: "Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "Nano-ceramic coating with machine paint correction in Adugodi, Bangalore. Resists borewell water staining and makes every wash easier.",
    crumb: "Ceramic coating",
    lede:
      "A plain guide to nano-ceramic coating in Bangalore: how borewell water damages clearcoat, what we do in the studio, and what a coating can and cannot do.",
    primaryServiceSlug: "1-year-ceramic-coating",
    bookHref: "/ceramic-coating/car",
    bookLabel: "Explore car ceramic coating pricing and booking",
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
        "Most of Adugodi and the surrounding areas run on borewell supply with a high dissolved mineral content. When a droplet dries on a hot panel, the water leaves and the calcium and magnesium stay behind as a hard, alkaline deposit sitting right on your clearcoat.",
        "In shade it washes off. In direct sun it starts etching a crater within days, and after that no chemical will fix it. The panel needs machine polishing. A coating does not make paint immune, but it gives you more time between the water landing and the damage starting.",
      ],
    },
    faqs: [
      {
        question: "How long does the car stay with you?",
        answer:
          "Usually a full day. Paint correction is the slow part. The coating itself goes on quickly, but it needs to cure properly before the car goes back out.",
      },
      {
        question: "Is 9H a meaningful number?",
        answer:
          "Not really. It comes from a pencil hardness test on a flat panel and says little about scratches on a real car. Judge a coating by its warranty and by who is installing it.",
      },
      {
        question: "Can I wash the car normally afterwards?",
        answer:
          "Yes, once it has cured. Use pH-neutral shampoo and dry the car by hand instead of letting it air-dry. The coating helps with hard water, but hard water can still mark it.",
      },
    ],
    related: ["paint-protection-film-bangalore", "interior-detailing-bangalore", "glass-sun-control-film-bangalore"],
  },

  {
    slug: "paint-protection-film-bangalore",
    h1: "Paint Protection Film (PPF) in Adugodi, Bangalore",
    title: "Paint Protection Film in Bangalore | P91 Car Care",
    description:
      "Paint protection film fitted in Adugodi, Bangalore. Full-body and partial coverage for stone chips and kerb damage.",
    crumb: "Paint protection film",
    lede:
      "A clear urethane layer over your paint, cut to each panel and fitted in a controlled bay, so stone chips, trolleys and kerbs hit the film instead of the clearcoat.",
    primaryServiceSlug: "ppf-sedan",
    bookHref: "/ppf",
    bookLabel: "Explore car PPF pricing and booking",
    priceServiceSlugs: [
      "ppf-hatchback",
      "ppf-sedan",
      "ppf-suv",
      "ppf-premium-hatchback",
      "ppf-premium-sedan",
      "ppf-premium-suv",
      "partial-ppf-hatchback",
      "partial-ppf-sedan",
      "partial-ppf-suv",
    ],
    includes: [
      "Panel-by-panel measurement and plotter-cut film",
      "Full decontamination and paint inspection before fitting",
      "Wrapped edges where the panel allows, so no lifting line is visible",
      "Squeegee and heat-set, then a controlled cure",
      "Written warranty terms provided at handover",
    ],
    context: {
      heading: "How Bangalore traffic damages a front bumper",
      paragraphs: [
        "Stop-start traffic is the problem, not speed. Sit in a queue on the Outer Ring Road and your bumper is right behind someone else's tyres for an hour, with every one of them flicking grit at the nearest panel.",
        "That is why the damage collects on the bumper, the front edge of the bonnet and the wing mirrors instead of spreading evenly. Film on just those panels costs a fraction of full-body coverage and takes most of what a Bangalore commute throws at it.",
      ],
    },
    faqs: [
      {
        question: "Full body or just the front?",
        answer:
          "For a daily commute, the front end takes most of the real damage. Full body makes sense if you plan to keep the car for years or sell it at a good price.",
      },
      {
        question: "Does film change the colour of the paint?",
        answer:
          "Gloss film should look the same as bare paint once it is fitted. Matte film changes the finish on purpose, so that is your choice, not a side effect.",
      },
      {
        question: "Can film be removed later?",
        answer:
          "Yes. Good film is made to come off without pulling the clearcoat with it, which is one reason the film brand matters more than the price.",
      },
    ],
    related: ["ceramic-coating-bangalore", "glass-sun-control-film-bangalore", "interior-detailing-bangalore"],
  },

  {
    slug: "interior-detailing-bangalore",
    h1: "Car Interior Detailing in Adugodi, Bangalore",
    title: "Car Interior Detailing in Bangalore | P91 Car Care",
    description:
      "Deep interior cleaning in Adugodi, Bangalore: seat shampoo, dashboard and vents, leather conditioning and odour removal.",
    crumb: "Interior detailing",
    lede:
      "Seats shampooed, vents cleared, leather conditioned and the cabin deodorised. A full reset of the space you sit in.",
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
        "Humidity and dust both work against a cabin here. In the monsoon the upholstery stays damp enough for mould to settle into the foam under the seat cover, which is why a car can smell musty even when it looks clean.",
        "The dust is finer than a home vacuum can lift, and it settles in the vents and comes back every time the fan runs. Extraction cleaning and vent work deal with both. Surface vacuuming deals with neither.",
      ],
    },
    faqs: [
      {
        question: "How long does interior detailing take?",
        answer:
          "Most cars take a few hours. The upholstery has to dry properly before the car goes back out, and that part cannot be rushed.",
      },
      {
        question: "Will it remove smoke or pet odour?",
        answer:
          "Usually, because the smell sits in the fabric, not the air. Odour that has soaked into the foam over years can need a second treatment.",
      },
      {
        question: "Are the products safe for leather?",
        answer:
          "Yes. Leather is cleaned with a pH-suitable product and conditioned afterwards. We do not scrub it with an all-purpose cleaner.",
      },
    ],
    related: ["ceramic-coating-bangalore", "paint-protection-film-bangalore", "glass-sun-control-film-bangalore"],
  },

  {
    slug: "glass-sun-control-film-bangalore",
    h1: "Windshield Glass Coating & Sun Control Film in Bangalore",
    title: "Sun Control Film & Glass Coating Bangalore | P91",
    description:
      "Heat-rejection sun control film and rain-repellent windshield glass coating fitted in Adugodi, Bangalore.",
    crumb: "Glass & sun film",
    lede:
      "Heat-rejection film for the cabin and a rain-repellent coating for the windshield. They are two different jobs, but people usually ask about both.",
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
      heading: "What the numbers on sun film mean",
      paragraphs: [
        "Film is sold on three figures, and only one of them tells you how cool the car will be. VLT is how dark the film looks, and it is what the law regulates. IR rejection is measured at a single wavelength, so a film can advertise a high number and still let plenty of heat through.",
        "TSER (total solar energy rejected) is the one that matters, because it counts visible light, infrared and ultraviolet together. Ask for the manufacturer's TSER figure for the exact film being fitted, and check your state's VLT limits before you commit.",
      ],
    },
    faqs: [
      {
        question: "Is sun film legal in Karnataka?",
        answer:
          "Visible light transmission limits are set by law and they are enforced. Ask for the VLT figure of the exact film before it is fitted, and keep the spec sheet in the car.",
      },
      {
        question: "Does darker film mean a cooler cabin?",
        answer:
          "No. Darkness and heat rejection are separate things. A nearly clear film with a high TSER can beat a much darker cheap one.",
      },
      {
        question: "What does windshield glass coating do?",
        answer:
          "It makes rain bead up and clear off at speed, which helps most with night driving in the monsoon. It is a different product from sun film, and we often do both at the same visit.",
      },
    ],
    related: ["ceramic-coating-bangalore", "paint-protection-film-bangalore", "interior-detailing-bangalore"],
  },
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.slug === slug);
}

/** The in-page link from a guide to the campaign landing page that sells what it describes, or null. */
export function guideLandingLink(page: SeoPage): { href: string; label: string } | null {
  if (!page.bookHref || !page.bookLabel) return null;
  return { href: page.bookHref, label: page.bookLabel };
}
