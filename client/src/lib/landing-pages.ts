/**
 * Content for the three Meta Ads landing pages.
 *
 *   /ceramic-coating/car    ad: "Ceramic Coating for Cars"
 *   /ceramic-coating/bike   ad: "Ceramic Coating for Bikes"
 *   /ppf                    ad: "PPF for Your Car"
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE PRICE RULE, inherited from lib/seo-pages.ts and non-negotiable.
 *
 * NO PRICE APPEARS IN THIS FILE. A page names the catalogue SLUGS it covers; the
 * component resolves them against GET /api/services at render time and reads price,
 * originalPrice, title and image off the live record.
 *
 * That is what guarantees the page and checkout cannot disagree. The prototype that
 * preceded this work carried its own sample figures and they were wrong — ceramic coating
 * at ₹14,999 against a real ₹5,999. Naming slugs instead of numbers makes that class of
 * error impossible rather than merely unlikely.
 *
 * There is also no category -> price map here, for the same reason. Choosing "SUV" on the
 * PPF page selects a catalogue ROW; the price comes from that row.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 *   FAQs         Read from the live service record (services.faq), never written here.
 *                Ceramic car and ceramic bike have genuine FAQ data; FULL PPF does not,
 *                so the PPF page renders no FAQ section and emits no FAQPage schema. An
 *                invented FAQ to "complete" the layout is an invented business claim.
 *
 *   duration     PPF only. The catalogue holds 2 / 3 / 4 in a MINUTES field for full PPF
 *                (almost certainly days, mis-entered) against 1440 for partial. Rendering
 *                "2 minutes" beside ₹45,000 destroys the page's credibility, so PPF
 *                duration is suppressed until the data is corrected. Ceramic durations
 *                (420 and 300 minutes) are plausible and are shown.
 *
 *   statistics   No ratings, review counts, customer counts or superlatives. Those were
 *                removed in Phase 1 and must not return in different wording.
 *
 *   self-healing No PPF page claims it. The films sold may well support it, but nothing
 *                in this codebase verifies which product is fitted, and a protection
 *                claim is not something to guess at.
 */

import { BLOG_POSTS, type BlogPost } from "@/lib/blog-posts";
import { type Carousel, PPF_VS_CERAMIC, PPF_COVERAGE } from "@/lib/carousels";

export type LandingVehicle = "car" | "bike";

/** One selectable vehicle category on a page whose price depends on body type. */
export interface CategoryOption {
  /** URL-safe key, also what is stored on the booking as vehicleCategory. */
  key: "hatchback" | "sedan" | "suv";
  /** Button label. The PACKAGE name comes from the catalogue row, not from here. */
  label: string;
  /** Catalogue slug this category selects. The single source of price and package name. */
  serviceSlug: string;
  /** Examples that help a customer self-identify. Not exhaustive, and not a promise. */
  examples: string;
}

export interface LandingBenefit {
  title: string;
  body: string;
}

export interface LandingPage {
  /** Route path. Also the campaign landingPage key and the canonical URL. */
  path: string;
  /** Which ad this serves — used for the vehicle recorded on the booking. */
  vehicle: LandingVehicle;

  /** <title>, under 60 characters. */
  title: string;
  /** <meta name="description">, under 160 characters. */
  description: string;

  eyebrow: string;
  /** The single <h1>. */
  h1: string;
  lede: string;

  /**
   * Catalogue slug backing this page when there is exactly one package.
   * Mutually exclusive with `categories`.
   */
  primaryServiceSlug?: string;
  /**
   * Selectable packages when price genuinely depends on body category.
   * Mutually exclusive with `primaryServiceSlug`.
   */
  categories?: CategoryOption[];
  /**
   * Which category is selected when the page opens.
   *
   * Stated explicitly rather than defaulting to categories[0], so the opening price is a
   * decision someone made rather than a consequence of array order — reordering the
   * buttons for layout reasons must not silently change which price a customer sees first.
   */
  defaultCategoryKey?: CategoryOption["key"];

  /** Alt text for the hero image. Descriptive, not keyword-stuffed. */
  heroAlt: string;

  /**
   * A studio carousel to run in the hero instead of the single service photograph.
   *
   * `dir` is a folder under attached_assets/carousels/ and `slides` is the alt text for
   * 01.jpg, 02.jpg, ... in order — the SAME shape the blog uses, so a carousel is written
   * once and can appear in both places without a second copy of the alt text.
   *
   * When absent the hero keeps the service image, so this is purely additive and a page
   * without a relevant carousel is never given an irrelevant one.
   */
  heroCarousel?: Carousel;

  /**
   * The brand of film or coating fitted on this page's job, shown as a small mark under
   * the hero carousel.
   *
   * Only set it where the studio genuinely fits that brand for that service — a logo is a
   * factual claim about what goes on the customer's car, not decoration, and putting the
   * wrong one on a page would be a worse problem than having none.
   */
  heroBrand?: { src: string; alt: string; label: string };

  benefitsHeading: string;
  benefits: LandingBenefit[];

  /** Plain, ordered, and true of how the studio actually works. */
  howItWorks: string[];

  /** Suppress the duration line — see the header note on corrupt PPF data. */
  hideDuration?: boolean;

  /** Blog posts to surface first. Slugs, so a renamed post fails loudly rather than silently. */
  preferredPostSlugs: string[];

  /** Cross-links to the informational pages, so the two do not compete blindly. */
  related: { label: string; href: string }[];
}

/**
 * Benefits are written to be true of the treatment itself, not of P91's performance of
 * it. "A ceramic layer is hydrophobic" is a property of the product; "we are the best in
 * Bangalore" is an unverifiable claim about us. Only the first kind appears here.
 *
 * The borewell-water framing is carried over verbatim in substance from
 * lib/seo-pages.ts, which is already-approved production copy.
 */
export const LANDING_PAGES: LandingPage[] = [
  {
    path: "/ceramic-coating/car",
    vehicle: "car",
    title: "Car Ceramic Coating Price in Bangalore | P91 Car Care",
    description:
      "1-year nano-ceramic coating for cars in Indiranagar, Bangalore. See the live price, " +
      "what the job includes, and book your appointment free.",
    eyebrow: "Ceramic coating · Cars",
    h1: "Ceramic Coating for Your Car",
    lede:
      "Machine paint correction followed by a nano-ceramic layer that deepens the gloss, " +
      "repels water and dirt, and makes every wash after it easier.",
    primaryServiceSlug: "1-year-ceramic-coating",
    heroAlt:
      "A car being ceramic coated panel by panel at the P91 Car Care studio in Indiranagar, Bangalore",
    // The ceramic buyer's real question is what coating does and does not do — this is the
    // carousel that answers it, and it is honest about the limit (ceramic will not stop a
    // stone chip) rather than overselling the product the page is here to sell.
    heroCarousel: PPF_VS_CERAMIC,
    benefitsHeading: "What a ceramic coating actually does",
    benefits: [
      {
        title: "Resists Bangalore's borewell water",
        body:
          "Most of Indiranagar runs on borewell supply with a high dissolved mineral content. " +
          "When a droplet dries on a hot panel the water leaves and the calcium stays. A coating " +
          "does not make paint immune, but it widens the window between the water landing and the " +
          "damage starting.",
      },
      {
        title: "Water beads and rolls off",
        body:
          "The coated surface is hydrophobic, so rain and wash water sheet away instead of sitting " +
          "in flat puddles and evaporating in place. That is the mechanism behind coated cars " +
          "staying clean longer, not just looking glossier.",
      },
      {
        title: "Easier to wash, harder to mark",
        body:
          "Road film and dust have less to key into, so routine cleaning takes less agitation — " +
          "and less agitation is what keeps swirl marks out of the clearcoat over time.",
      },
      {
        title: "Gloss with depth, not just shine",
        body:
          "The machine correction stage removes swirls and water-spot etching before anything is " +
          "applied. The coating then locks in that corrected surface rather than sitting on top of " +
          "defects.",
      },
      {
        title: "UV and environmental resistance",
        body:
          "A sacrificial layer between your clearcoat and sunlight, tree sap, bird lime and road " +
          "grime — the things that dull and oxidise paint on a car parked outdoors.",
      },
    ],
    howItWorks: [
      "Choose your service",
      "Select your vehicle",
      "Check the price",
      "Book your appointment",
      "Visit P91 (Booking is free — service charges apply at the studio)",
    ],
    preferredPostSlugs: ["ppf-vs-ceramic-coating-bangalore", "hard-water-spot-removal-bangalore"],
    related: [
      { label: "Ceramic coating: the full guide", href: "/services/ceramic-coating-bangalore" },
      { label: "Ceramic coating for bikes", href: "/ceramic-coating/bike" },
      { label: "Paint protection film", href: "/ppf" },
    ],
  },

  {
    path: "/ceramic-coating/bike",
    vehicle: "bike",
    title: "Bike Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "1-year ceramic coating for motorcycles in Indiranagar, Bangalore. Tank, fairings and " +
      "panels. See the live price and book your appointment free.",
    eyebrow: "Ceramic coating · Motorcycles",
    h1: "Ceramic Coating for Your Motorcycle",
    lede:
      "A nano-ceramic layer over the tank, fairings and painted panels — so fuel splashes, road " +
      "grime and chain fling wipe off instead of settling in.",
    primaryServiceSlug: "1-year-bike-ceramic-coating",
    heroAlt:
      "A motorcycle tank and fairings after ceramic coating at the P91 Car Care studio in Indiranagar, Bangalore",
    // Same coating explainer as the car page. Worth knowing: the slides are shot on cars,
    // so this is the one page where the artwork and the vehicle do not match. Swap it the
    // day a motorcycle carousel exists.
    heroCarousel: PPF_VS_CERAMIC,
    benefitsHeading: "Why coating a motorcycle is a different job",
    // Motorcycle-specific throughout: every point below is about something a bike has and
    // a car does not, or about how a bike is used. None of it is car copy with the noun
    // swapped, and none of it is a technical claim this codebase cannot support.
    benefits: [
      {
        title: "The tank takes fuel, not just weather",
        body:
          "Petrol runs down the tank flank at almost every fill. On an uncoated finish that means " +
          "repeated wiping exactly where your knees and the filler cap already sit. A coated tank " +
          "sheds a splash instead of holding it against the paint.",
      },
      {
        title: "Chain fling and road grime release more easily",
        body:
          "Lube thrown off the chain lands on the swingarm, rear panels and wheel. It comes off a " +
          "coated surface with far less scrubbing — and scrubbing is what puts marks into paint.",
      },
      {
        title: "Most bikes live outdoors",
        body:
          "A motorcycle rarely gets a garage. That means more sun on the tank, more dew, and more " +
          "of the mineral-heavy water this city runs on drying on the surface between rides.",
      },
      {
        title: "Complex surfaces, coated by hand",
        body:
          "Fairings, mudguards, tank flanks and side panels are curved, vented and interrupted by " +
          "fasteners. There is no large flat area to work across, so the whole job is done panel by " +
          "panel by hand.",
      },
      {
        title: "Gloss that survives the wash routine",
        body:
          "Bikes get cleaned more often than cars and usually with less equipment. Making each of " +
          "those washes gentler is most of what protects the finish over a year.",
      },
    ],
    howItWorks: [
      "Choose your service",
      "Select your vehicle",
      "Check the price",
      "Book your appointment",
      "Visit P91 (Booking is free — service charges apply at the studio)",
    ],
    // No motorcycle-specific article exists yet. Rather than force a false match, the
    // carousel falls back to the most recent posts — see relevantPosts() below.
    preferredPostSlugs: [],
    related: [
      { label: "Ceramic coating for cars", href: "/ceramic-coating/car" },
      { label: "Ceramic coating: the full guide", href: "/services/ceramic-coating-bangalore" },
    ],
  },

  {
    path: "/ppf",
    vehicle: "car",
    // Targets the PRICE/package intent deliberately, so it does not compete head-on with
    // /services/paint-protection-film-bangalore, which serves the informational intent.
    title: "Car PPF Price in Bangalore — Hatchback, Sedan, SUV | P91",
    description:
      "Paint protection film for cars in Indiranagar, Bangalore. Pick your body type for the " +
      "exact package and live price, then book your appointment free.",
    eyebrow: "Paint protection film · Cars",
    h1: "Paint Protection Film for Your Car",
    lede:
      "A clear urethane film fitted over your paint, so stone chips, grit and washing marks land " +
      "on the film instead of the panel underneath.",
    // Hatchback opens the page: it is the lowest entry price of the three, so the first
    // figure an ad visitor sees is the most accessible one rather than the largest.
    defaultCategoryKey: "hatchback",
    categories: [
      {
        key: "hatchback",
        label: "Hatchback",
        serviceSlug: "ppf-hatchback",
        examples: "Swift, i20, Baleno, Altroz",
      },
      {
        key: "sedan",
        label: "Sedan",
        serviceSlug: "ppf-sedan",
        examples: "City, Verna, Ciaz, Virtus",
      },
      {
        key: "suv",
        label: "SUV",
        serviceSlug: "ppf-suv",
        examples: "Creta, Seltos, XUV700, Fortuner",
      },
    ],
    heroAlt:
      "Paint protection film being fitted to a car panel at the P91 Car Care studio in Indiranagar, Bangalore",
    // The coverage carousel, not the origin one: this page's visitor is choosing between
    // partial front, full front and full body, which is exactly what these slides walk
    // through. Deliberately NOT the "PPF vs ceramic" set — none of its slides make the
    // self-healing claim this page is required to stay clear of.
    heroCarousel: PPF_COVERAGE,
    heroBrand: {
      src: "/attached_assets/brands/stek-india.png",
      alt: "STEK India",
      label: "Film we fit",
    },
    benefitsHeading: "What paint protection film does",
    // No self-healing claim. See the header note — the films sold may support it, but
    // nothing here verifies which product is fitted to a given car.
    benefits: [
      {
        title: "Stone chips hit the film, not the paint",
        body:
          "The bonnet, bumper and mirror backs take the constant low-level impacts of city and " +
          "highway driving. A urethane layer absorbs that instead of the clearcoat.",
      },
      {
        title: "Washing marks stay on a replaceable layer",
        body:
          "Light scratching from washing and drying collects in the film. The panel underneath is " +
          "kept in the condition it was in when the film went on.",
      },
      {
        title: "The original paint is preserved",
        body:
          "Factory paint is only original once. Film is fitted over it and removed later without " +
          "taking it with them, which is the whole argument for protecting rather than repairing.",
      },
      {
        title: "Optically clear",
        body:
          "The film is transparent — the colour and gloss you see are still your own paint, not a " +
          "coating over the top of it.",
      },
    ],
    howItWorks: [
      "Choose your service",
      "Select your vehicle",
      "Check the price",
      "Book your appointment",
      "Visit P91 (Booking is free — service charges apply at the studio)",
    ],
    // Full PPF rows carry 2 / 3 / 4 in a MINUTES column. Suppressed until corrected.
    hideDuration: true,
    preferredPostSlugs: ["ppf-vs-ceramic-coating-bangalore"],
    related: [
      { label: "PPF: the full guide", href: "/services/paint-protection-film-bangalore" },
      { label: "PPF vs ceramic coating", href: "/blog/ppf-vs-ceramic-coating-bangalore" },
      { label: "Ceramic coating for cars", href: "/ceramic-coating/car" },
    ],
  },
];

/** The landing page for a path, or undefined. */
export function getLandingPage(path: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.path === path);
}

/**
 * Claims withheld from these pages pending business confirmation.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY A FILTER AND NOT AN EDIT.
 *
 * The PPF catalogue rows list "Self-healing technology" in `whatIncluded`. That is
 * business-entered data, and it may well be accurate — STEK and several other films do
 * self-heal. But nothing in this codebase records WHICH film is fitted to a given car,
 * and a protection claim on a page carrying paid traffic is not something to take on
 * trust. The standing instruction is not to claim it until the specific product is
 * confirmed.
 *
 * So it is suppressed HERE, on the new ad landing pages, rather than deleted from the
 * database. Deleting genuine business data to satisfy a display rule would be the wrong
 * direction: the catalogue is the business's record, not this page's.
 *
 * SCOPE, stated plainly: /service/:slug and the booking modal still render the catalogue
 * list verbatim, because changing shared components is outside this phase and the right
 * fix is a business answer, not a wider filter. Both are flagged in the phase report.
 *
 * TO REMOVE: confirm the film sold supports self-healing, then delete this list. It is
 * deliberately one shared constant so there is exactly one place to undo.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
const WITHHELD_CLAIM_PATTERNS: RegExp[] = [/self[-\s]?heal/i];

/**
 * A catalogue `whatIncluded` list with unconfirmed claims removed.
 *
 * Everything else is passed through untouched — this drops lines, it never rewrites them.
 * Rewriting business copy to be "safer" would be inventing content just as surely as
 * adding a claim would.
 */
export function displayableIncludes(items: unknown): string[] {
  // Takes `unknown` deliberately: ServiceRecord.whatIncluded is typed loosely because it
  // comes back from a JSON API, and this function already validates every element. A
  // narrower signature would only move the cast to the call sites.
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is string => {
    if (typeof item !== "string") return false;
    return !WITHHELD_CLAIM_PATTERNS.some((pattern) => pattern.test(item));
  });
}

/**
 * Posts for a page's carousel: preferred ones first, then the most recent to fill.
 *
 * Deliberately not a recommendation engine. There are three articles in total, and the
 * honest options for a page with no genuinely related one are "show recent posts" or
 * "show nothing" — inventing a relevance score over three items would be dressing up a
 * hardcoded list as an algorithm.
 *
 * A preferred slug that no longer matches a post is skipped rather than rendered as a
 * broken card, and the fill step means the carousel is never short because of it.
 */
export function relevantPosts(page: LandingPage, limit = 3): BlogPost[] {
  const bySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

  const picked: BlogPost[] = [];
  for (const slug of page.preferredPostSlugs) {
    const post = bySlug.get(slug);
    if (post && !picked.includes(post)) picked.push(post);
  }

  const recent = [...BLOG_POSTS].sort(
    (a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? ""),
  );
  for (const post of recent) {
    if (picked.length >= limit) break;
    if (!picked.includes(post)) picked.push(post);
  }

  return picked.slice(0, limit);
}
