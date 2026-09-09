/**
 * Blog content for the approved redesign.
 *
 * The prose is the prototype's, carried over so the layouts are complete — the business
 * intends to replace it with its own writing. It is marketing copy only: no price, offer,
 * availability or voucher claim appears here, because all of those must come from the
 * database. A future post that needs a price should read it from /api/services rather
 * than typing it into this file.
 *
 * Bodies are structured BLOCKS rather than flat paragraphs, for two reasons the brief
 * asked for: a strict h1 -> h2 -> h3 cascade, and contextual internal links into the
 * local-intent service pages. A flat string array could deliver neither.
 *
 * Images are not bundled with posts. Each post names a service SLUG and the artwork is
 * resolved from that live service record at render time, so blog imagery follows whatever
 * the admin uploads and there is no second copy of the photography to go stale.
 */

/** Inline markup allowed in `text`: **bold** and [label](/internal-path). Nothing else. */
export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  /** Mid-article prompt. `text` is the pitch; the button always goes to /services. */
  | { type: "cta"; text: string; label: string };

export interface BlogPost {
  slug: string;
  title: string;
  /**
   * <title> for the tab and search results, kept under 60 characters.
   *
   * Explicit rather than derived: every headline here is 61-70 characters, so appending
   * the brand would overflow, and truncating a headline at runtime produces sentences cut
   * mid-phrase. Writing it once is clearer and reviewable.
   */
  seoTitle: string;
  /** ISO date, used for display, <time datetime> and datePublished. */
  date: string;
  /** ISO date of the last substantive edit. Feeds dateModified. */
  updated?: string;
  readMinutes: number;
  category: string;
  /** One-line teaser for the homepage and blog index. */
  excerpt: string;
  /** Longer opening line shown under the h1. */
  lede: string;
  /** Slug of the live service whose image illustrates this post. */
  imageServiceSlug: string;
  body: BlogBlock[];
}

export const BLOG_AUTHOR = "P91 Car Care";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ppf-vs-ceramic-coating-bangalore",
    title: "PPF vs Ceramic Coating: Which is Best for Bangalore Traffic & Weather?",
    seoTitle: "PPF vs Ceramic Coating in Bangalore | P91",
    date: "2026-08-21",
    readMinutes: 6,
    category: "Protection",
    excerpt:
      "Stop-start traffic chips paint; monsoon and hard water dull it. Which one your car actually needs.",
    lede:
      "They get compared as if they were rival products. They are not — one is a physical barrier, the other is a chemical one, and they fail in completely different ways.",
    imageServiceSlug: "ppf-sedan",
    body: [
      { type: "h2", text: "The short answer" },
      {
        type: "p",
        text:
          "If your car spends its life in stop-start traffic on Outer Ring Road or Hosur Road, **paint protection film** is what you want on the front end. If your car is parked outside, washed with borewell water, and you are tired of it looking dull two days after a wash, **ceramic coating** is what you want.",
      },
      {
        type: "p",
        text:
          "Most cars in Bangalore benefit from both — [PPF](/services/paint-protection-film-bangalore) on the impact zones, [ceramic coating](/services/ceramic-coating-bangalore) over the rest.",
      },

      { type: "h2", text: "What PPF actually does" },
      {
        type: "p",
        text:
          "PPF is a clear thermoplastic urethane film, roughly 150–200 microns thick, laid over the paint. It is a physical shield. When a stone thrown up by the truck ahead of you hits the bonnet at 60 km/h, the film absorbs the impact instead of the clearcoat.",
      },
      {
        type: "p",
        text:
          "Good film is self-healing: light swirl marks and fingernail scratches close up with heat — a warm afternoon or a bucket of hot water is enough.",
      },
      {
        type: "p",
        text:
          "What PPF does not do is make the car easier to clean. Film has its own surface, and an uncoated film still holds water spots.",
      },

      { type: "h2", text: "What ceramic coating actually does" },
      {
        type: "p",
        text:
          "Ceramic coating is a liquid polymer that cures into a hard, slick, hydrophobic layer a few microns thick. It is chemical protection, not impact protection.",
      },
      {
        type: "p",
        text:
          "It resists staining from bird droppings, tree sap and — the one that matters most here — the mineral deposits in Bangalore's borewell water. It makes the surface slippery enough that dirt struggles to bond, so washes are quicker and safer.",
      },
      {
        type: "p",
        text:
          "What ceramic coating does not do is stop a stone chip. A 9H coating is still measured in microns. It will not survive gravel.",
      },

      {
        type: "cta",
        text:
          "Not sure which your car needs? Bring it to the Indiranagar studio and we will tell you what the paint actually calls for before you spend anything.",
        label: "Book an inspection",
      },

      { type: "h2", text: "How Bangalore specifically changes the answer" },
      { type: "h3", text: "Traffic" },
      {
        type: "p",
        text:
          "Long periods at low speed behind heavy vehicles is the worst possible environment for the front bumper, bonnet leading edge and wing mirrors. This is the strongest argument for at least a [partial PPF](/services/paint-protection-film-bangalore).",
      },
      { type: "h3", text: "Water" },
      {
        type: "p",
        text:
          "Most of the city is on borewell supply with high dissolved mineral content. Let that dry on paint in direct sun and it etches into the clearcoat within days. A ceramic coating buys you the time to get the water off before it bonds.",
      },
      { type: "h3", text: "Parking" },
      {
        type: "p",
        text:
          "Open parking means UV, tree sap and bird droppings. Both products help; ceramic helps more, and helps daily.",
      },

      { type: "h2", text: "What we would recommend" },
      {
        type: "ul",
        items: [
          "**New car, kept long term** — partial PPF on the front, ceramic over the whole car. This is the combination most of our customers end up choosing.",
          "**Older car, paint already marked** — [paint correction and ceramic](/services/ceramic-coating-bangalore) first. Film over damaged paint locks the damage in.",
          "**Car parked outside daily** — ceramic is the higher priority, because water and UV are doing more damage than gravel.",
          "**Weekend car, garaged** — neither is urgent. A good sealant and proper drying goes a long way.",
        ],
      },
      {
        type: "p",
        text:
          "Whatever you choose, ask to see the batch details of the film or coating before work starts, and get the manufacturer's warranty in writing at handover.",
      },
    ],
  },

  {
    slug: "hard-water-spot-removal-bangalore",
    title: "How to Protect Your Car Paint from Hard Water Spots in Bangalore",
    seoTitle: "Hard Water Spots on Car Paint | P91 Car Care",
    date: "2026-08-12",
    readMinutes: 4,
    category: "Paint care",
    excerpt:
      "Borewell water etches clearcoat within days. How to prevent it, and when it needs correction.",
    lede:
      "A water spot is not dirt. It is a mineral deposit that concentrates as the water evaporates, and in direct sun it starts cutting into your clearcoat within days.",
    imageServiceSlug: "exterior-detailing-hard-water-new",
    body: [
      { type: "h2", text: "Why borewell water is the problem" },
      {
        type: "p",
        text:
          "When borewell water dries on a panel, the water leaves and the calcium and magnesium stay behind. What is left is a concentrated alkaline deposit sitting directly on the clearcoat, and Bangalore's sun bakes it in.",
      },
      {
        type: "p",
        text:
          "Caught the same day it wipes off. Left for a few weeks it becomes a crater you can feel with a fingernail, and no amount of washing will remove it.",
      },

      { type: "h2", text: "The habit that prevents it" },
      {
        type: "p",
        text:
          "Drying. Not washing more often — **drying properly**, with a clean microfibre towel, immediately, in the shade. Most of the spotting we see comes from cars washed at 11am in an open car park and left to air-dry.",
      },
      {
        type: "ul",
        items: [
          "Wash early morning or evening, never in direct sun",
          "Work panel by panel and dry each one before moving on",
          "Use a clean, dedicated drying towel — not the one that was on the wheels",
          "If you cannot dry it, do not wash it",
        ],
      },

      {
        type: "cta",
        text:
          "Already got spotting you cannot wipe off? We will tell you whether it needs a decontamination wash or machine correction before you commit to anything.",
        label: "Book an inspection",
      },

      { type: "h2", text: "When it needs correction" },
      { type: "h3", text: "Surface deposits" },
      {
        type: "p",
        text:
          "If the mark sits on top of the clearcoat, a decontamination wash and clay bar lifts it. This is cleaning, and it is quick.",
      },
      { type: "h3", text: "Etched spots" },
      {
        type: "p",
        text:
          "If you can feel the edge of the mark, the mineral has eaten into the clearcoat. That needs machine polishing to level the surface around it — [exterior detailing with hard water spot removal](/service/exterior-detailing-hard-water-new) rather than a wash.",
      },

      { type: "h2", text: "Stopping it coming back" },
      {
        type: "p",
        text:
          "Once the paint is corrected, a [ceramic coating](/services/ceramic-coating-bangalore) is what stops it recurring. Water beads and rolls off instead of sitting in a flat puddle and evaporating in place. That is the actual mechanism, and it is why coated cars stay clean longer rather than just looking glossier.",
      },
    ],
  },

  {
    slug: "windshield-heat-rejection-film-summer",
    title: "Windshield Heat Rejection Film: What the Numbers Actually Mean",
    seoTitle: "Windshield Heat Rejection Film | P91 Car Care",
    date: "2026-07-30",
    readMinutes: 5,
    category: "Glass & film",
    excerpt:
      "VLT, IR rejection and TSER get quoted loosely. Here is which number matters for a Bangalore summer.",
    lede:
      "Sun film is sold on three numbers and only one of them describes how cool the car will actually be. The other two are what gets quoted at you.",
    imageServiceSlug: "stek-windsheild-suncontrol-films",
    body: [
      { type: "h2", text: "The three numbers" },
      { type: "h3", text: "VLT — visible light transmission" },
      {
        type: "p",
        text:
          "How dark the film looks, as a percentage of light let through. This is the number the law regulates, and it says nothing about heat.",
      },
      { type: "h3", text: "IR rejection" },
      {
        type: "p",
        text:
          "Measured at a single wavelength, which is why it is the number cheap film advertises. A film can claim a very high IR figure and still pass plenty of heat.",
      },
      { type: "h3", text: "TSER — total solar energy rejected" },
      {
        type: "p",
        text:
          "**This is the one that matters.** It accounts for visible light, infrared and ultraviolet together — which is what your cabin actually experiences parked on MG Road in April.",
      },

      { type: "h2", text: "Dark does not mean cool" },
      {
        type: "p",
        text:
          "A good windshield film can be almost clear and still reject a large share of solar energy. That is the point: you are not trying to make the glass dark, you are trying to stop the dashboard becoming too hot to touch.",
      },
      {
        type: "p",
        text:
          "Darkness and heat rejection are separate properties, whatever the roadside shop tells you.",
      },

      {
        type: "cta",
        text:
          "Bring the car in and we will show you the spec sheet for the exact film before anything is fitted.",
        label: "Book a fitting",
      },

      { type: "h2", text: "What to ask for" },
      {
        type: "ul",
        items: [
          "The manufacturer's spec sheet for the **exact film**, not the product range",
          "The TSER figure, not just IR rejection",
          "Your state's VLT limit for the windshield, checked before you commit",
          "The warranty card, issued at handover",
        ],
      },
      {
        type: "p",
        text:
          "A film that is legal on side glass may not be legal at the front, so confirm the windshield limit separately. Our [sun control film and glass coating](/services/glass-sun-control-film-bangalore) page lists what we fit.",
      },

      { type: "h2", text: "Film and coating are different jobs" },
      {
        type: "p",
        text:
          "Sun film manages heat. A [windshield glass coating](/service/windshield-glass-coating-new) makes rain bead and clear at speed, which mostly helps night driving in the monsoon. People ask about them together, but they solve unrelated problems and are priced separately.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Long-form date used in the post header, e.g. "21 Aug 2026". */
export function formatPostDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Categories present in the post list, in the order they first appear.
 *
 * Derived, never a hand-kept list. A separate constant would let a post carry a
 * category the filter cannot show — the post would then be unreachable from the
 * index, which is the kind of bug nobody notices for months.
 */
export function blogCategories(): string[] {
  const seen: string[] = [];
  for (const post of BLOG_POSTS) {
    if (post.category && !seen.includes(post.category)) seen.push(post.category);
  }
  return seen;
}

/**
 * URL-safe form of a category name ("Glass & film" -> "glass-film").
 *
 * Used for /blog/category/:slug. Kept as a function rather than a stored field so
 * a category cannot have two spellings of its own slug.
 */
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The category whose slug matches, or undefined. Case- and spelling-safe. */
export function categoryFromSlug(slug: string): string | undefined {
  return blogCategories().find((c) => categorySlug(c) === slug);
}

/** Posts in a category, newest first. */
export function postsInCategory(category: string): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.category === category).sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

/** All posts, newest first — the order the index renders. */
export function postsNewestFirst(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Index copy, shared by the page and the prerenderer.
 *
 * These live here rather than being typed into both blog-index.tsx and
 * scripts/prerender.mjs because that duplication already bit once: /contact shipped a
 * prerendered <title> that differed from the one useSeoMeta set, so a crawler would have
 * indexed one string and a visitor seen another. Anything the prerenderer can import, it
 * should — a shared constant cannot drift.
 */
export const BLOG_INDEX_TITLE = "Car Care Guides & Detailing Advice | P91 Car Care";

export const BLOG_INDEX_DESCRIPTION =
  "Straight answers on ceramic coating, paint protection film, hard water spots and sun " +
  "control film — written for Bangalore conditions by the P91 Car Care studio.";

/** <title> for a category listing. */
export function categoryTitle(category: string): string {
  return `${category} guides | P91 Car Care`;
}

/** Meta description for a category listing. */
export function categoryDescription(category: string): string {
  return (
    `P91 Car Care guides on ${category.toLowerCase()} — written for Bangalore traffic, ` +
    `water and weather.`
  );
}
