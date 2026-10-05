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

import {
  type Carousel,
  PPF_VS_CERAMIC,
  PPF_COVERAGE,
  PPF_ORIGIN,
  MONSOON_DAMAGE,
} from "@/lib/carousels";

/** Inline markup allowed in `text`: **bold** and [label](/internal-path). Nothing else. */
export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  /**
   * `variant` only changes how a paragraph is dressed: "lead" is larger intro type, "warranty"
   * a highlighted callout, "price" a callout with quote buttons. The words are unchanged.
   */
  | { type: "p"; text: string; variant?: "lead" | "warranty" | "price" }
  /**
   * `variant` "areas" shows items as service-area cards; "services" as feature blocks, with
   * an optional short `tags` label above each (decorative, so it is not repeated to screen readers).
   */
  | { type: "ul"; items: string[]; variant?: "areas" | "services"; tags?: string[] }
  | { type: "ol"; items: string[] }
  /** Questions and answers as an accessible accordion; the answers are always in the HTML. */
  | { type: "faq"; items: { q: string; a: string }[] }
  /**
   * A small comparison table. `head[0]` labels the row-header column. Cells take the same
   * inline markup as `p`. Rendered as a real <table> (crawlable) that fits a phone without
   * horizontal scrolling for two or three short columns.
   */
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  /** Studio address, phone, map and booking links. Fixed fields, so no raw URLs in prose. */
  | {
      type: "contact";
      address: string;
      phone: string;
      phoneHref: string;
      mapsHref: string;
      bookHref: string;
      bookLabel: string;
    }
  /** Mid-article prompt. `text` is the pitch; the button always goes to /services. */
  | { type: "cta"; text: string; label: string }
  /**
   * The studio's own social carousel, embedded in the article it illustrates.
   *
   * Spread from lib/carousels.ts rather than written here, because the campaign landing
   * pages render the same carousels in their hero and two copies of 11 lines of alt text
   * would drift apart within a month.
   *
   * The article's prose always says what the slides say. The images are the illustration,
   * never the only place a claim lives — a picture of a sentence is worth nothing to a
   * crawler, so a post that leaned on the carousel alone would rank for nothing.
   */
  | ({ type: "carousel" } & Carousel);

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
  /**
   * Own artwork for this post, used instead of the service photo named above. For posts with a
   * dedicated image (for example a branded poster). `square` makes the article header show it
   * uncropped instead of as a wide banner.
   */
  image?: { src: string; alt: string; square?: boolean };
  body: BlogBlock[];
}

export const BLOG_AUTHOR = "P91 Car Care";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ppf-koramangala-hsr-layout-shanti-nagar-adugodi",
    title:
      "Paint Protection Film in Bangalore: A Guide for Koramangala, HSR Layout and Shanti Nagar Car Owners",
    // Supplied wording, longer than the usual 60 characters; search results may truncate it.
    seoTitle:
      "PPF & Ceramic Coating near Koramangala, HSR Layout & Shanti Nagar | P91 Car Care, Adugodi",
    date: "2026-10-05",
    readMinutes: 4,
    category: "Protection",
    // Also the meta description (blog-post.tsx and prerender.mjs both use the excerpt).
    // Supplied wording, over 160 characters; search results may truncate it.
    excerpt:
      "Looking for paint protection film near Koramangala, HSR Layout or Shanti Nagar? P91 Car Care in Adugodi offers STEK PPF and ceramic coating with a written warranty. Book online.",
    lede:
      "If you live in Koramangala, HSR Layout, Shanti Nagar or Adugodi, your car faces the same problems every day: stop-and-go traffic, tight parking, stone chips on the ORR and Hosur Road, monsoon rain and hard water spots. Paint protection film (PPF) is one of the best ways to keep your paint looking new. This guide explains how it works and what to ask before you book a studio near you.",
    imageServiceSlug: "ppf-sedan",
    image: {
      src: "/attached_assets/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi.jpg",
      alt: "P91 Car Care poster: paint protection film and ceramic coating near Koramangala, HSR Layout and Shanti Nagar, on a green sports car. Adugodi, Bengaluru. Call 74066 19191.",
      square: true,
    },
    body: [
      { type: "h2", text: "What is paint protection film?" },
      {
        type: "p",
        variant: "lead",
        text:
          "PPF is a transparent, flexible film fitted over your car's paint. It takes the damage instead of your paint: stone chips, light scratches, and stains from bird droppings and bug splatter.",
      },
      {
        type: "p",
        text:
          "Many modern films are self-healing, so light swirl marks in the film fade away. Films come in gloss and matte finishes, so you can keep the factory look or change it.",
      },

      { type: "h2", text: "PPF vs ceramic coating: which one do you need?" },
      {
        type: "table",
        caption: "PPF compared with ceramic coating",
        head: ["Compare", "PPF", "Ceramic coating"],
        rows: [
          ["What it is", "Physical film layer", "Liquid nano-coating"],
          ["Best against", "Stone chips, scratches", "Water spots, stains, UV, chemicals"],
          ["Look", "Gloss or matte", "Deep gloss, easy to clean"],
          ["Ideal for", "New cars, high-use cars", "Easy maintenance and shine"],
        ],
      },
      {
        type: "p",
        text:
          "If you worry about chips and scratches, choose PPF. If you want easy cleaning and shine, choose ceramic. Many owners use both. Read the full comparison in [PPF vs ceramic coating for Bangalore traffic and weather](/blog/ppf-vs-ceramic-coating-bangalore).",
      },

      { type: "h2", text: "5 questions to ask before booking PPF in Bangalore" },
      {
        type: "ol",
        items: [
          "**Is the warranty in writing?** It should be the manufacturer's warranty, handed over with your car.",
          "**Can I see the batch details before work starts?**",
          "**Which brand is the film?**",
          "**Is the work done in a controlled studio?**",
          "**Is there a package for my car size?** Hatchbacks, sedans and SUVs need different amounts of film.",
        ],
      },

      { type: "h2", text: "PPF studio near Koramangala, HSR Layout and Shanti Nagar" },
      {
        type: "p",
        text:
          "P91 Car Care is in Ayappa Garden, Adugodi, a short drive from some of the city's busiest car-owning neighbourhoods:",
      },
      {
        type: "ul",
        variant: "areas",
        // TODO(drive-times): add approx. drive time for each area once the studio confirms
        // them. Nothing in the project verifies them, so none are stated here.
        items: [
          "**Koramangala:** a short drive from the studio",
          "**Shanti Nagar:** a short drive from the studio",
          "**HSR Layout:** a short drive from the studio",
          "**Adugodi:** right here, so you can drop in and see the studio.",
        ],
      },
      {
        type: "p",
        text: "Can't make it in? Pickup and drop is available across Bangalore at cost.",
      },

      { type: "h2", text: "How we do it at P91" },
      {
        type: "ul",
        variant: "services",
        tags: ["STEK PPF", "P91 Premium PPF", "Nasiol coating"],
        items: [
          "[STEK PPF](/products/stek) in gloss and matte, with self-healing film. We've fitted it on the Toyota Vellfire, Nissan GT-R and Innova Hycross. [See our work](/gallery).",
          "[P91 Premium PPF](/products/p91-premium-ppf), our own film line, in hatchback, sedan and SUV packages.",
          "[Nasiol](/products/nasiol) nano-ceramic coating for water and stain repellence and UV and chemical resistance.",
        ],
      },
      {
        type: "p",
        variant: "warranty",
        text: "Every PPF and coating job comes with a written manufacturer warranty, issued at handover.",
      },

      { type: "h2", text: "What does PPF cost?" },
      {
        type: "p",
        variant: "price",
        // TODO(starting-price): add the starting price per package. Prices live in the
        // services database, not in this file, so none is typed here.
        text:
          "Pricing depends on car size, film and coverage (front-end or full body). Message us your car model for an exact quote.",
      },

      { type: "h2", text: "FAQ" },
      {
        type: "faq",
        items: [
          {
            q: "Where can I get PPF near Koramangala?",
            a: "P91 Car Care in Adugodi is a short drive from Koramangala. We fit STEK PPF and P91 Premium PPF with a written warranty.",
          },
          {
            q: "Is there a ceramic coating studio near HSR Layout?",
            a: "Yes. We apply Nasiol nano-ceramic coating in Adugodi and offer pickup and drop across Bangalore, including HSR Layout, at cost.",
          },
          { q: "Do you offer PPF near Shanti Nagar?", a: "Yes. We're in Adugodi, close to Shanti Nagar." },
          { q: "Can I see the film details before work starts?", a: "Yes. Ask for the batch details before we begin." },
        ],
      },

      { type: "h2", text: "Book your PPF" },
      {
        type: "contact",
        address: "49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru 560030",
        phone: "+91 74066 19191",
        phoneHref: "tel:+917406619191",
        mapsHref:
          "https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Adugodi+Bengaluru",
        bookHref: "/services",
        bookLabel: "Book online in under a minute",
      },
      {
        type: "p",
        text:
          "Related: [PPF services](/services/paint-protection-film-bangalore) · [Ceramic coating](/services/ceramic-coating-bangalore)",
      },
    ],
  },

  {
    slug: "ppf-vs-ceramic-coating-bangalore",
    title: "PPF vs Ceramic Coating: Which is Best for Bangalore Traffic & Weather?",
    seoTitle: "PPF vs Ceramic Coating in Bangalore | P91",
    date: "2026-08-21",
    updated: "2026-09-10",
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

      { type: "carousel", ...PPF_VS_CERAMIC },

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
      {
        type: "p",
        text:
          "P91 fits [STEK](/products/stek) film and our own [P91 Premium PPF](/products/p91-premium-ppf) line, both backed by a written warranty at handover.",
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
        type: "p",
        text: "P91 applies [Nasiol](/products/nasiol) nano-ceramic coating in the Adugodi studio.",
      },

      {
        type: "cta",
        text:
          "Not sure which your car needs? Bring it to the Adugodi studio and we will tell you what the paint actually calls for before you spend anything.",
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
      {
        type: "p",
        text: "P91 applies [Nasiol](/products/nasiol) nano-ceramic coating for this.",
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
      {
        type: "p",
        text: "P91 fits [STEK](/products/stek) sun-control film in the Adugodi studio.",
      },

      { type: "h2", text: "Film and coating are different jobs" },
      {
        type: "p",
        text:
          "Sun film manages heat. A [windshield glass coating](/service/windshield-glass-coating-new) makes rain bead and clear at speed, which mostly helps night driving in the monsoon. People ask about them together, but they solve unrelated problems and are priced separately.",
      },
    ],
  },

  {
    slug: "how-much-ppf-does-your-car-need",
    title: "Don't Wrap the Whole Car: How Much PPF Your Car Actually Needs",
    seoTitle: "How Much PPF Does Your Car Need? | P91",
    date: "2026-09-05",
    readMinutes: 5,
    category: "Protection",
    excerpt:
      "Full-body film is not the default answer. Coverage is a decision about where damage actually lands.",
    lede:
      "More film is not automatically more protection. Cars do not get damaged evenly, and the coverage that suits a daily driver on Outer Ring Road is not the coverage that suits a garaged weekend car.",
    imageServiceSlug: "ppf-sedan",
    body: [
      { type: "h2", text: "Coverage is a decision, not an upsell" },
      {
        type: "p",
        text:
          "The question people arrive with is *how much does PPF cost*. The question that actually decides the bill is **how much of the car needs it** — and that is answered by where stones, grit and door edges land, not by how much film will fit.",
      },
      {
        type: "p",
        text:
          "The front of the car takes the overwhelming majority of road damage. Everything behind the A-pillar lives a much quieter life. Spending equally across both is how a quote doubles without the paint being meaningfully safer.",
      },

      { type: "carousel", ...PPF_COVERAGE },

      { type: "h2", text: "The three levels, and who each is for" },
      { type: "h3", text: "Partial front" },
      {
        type: "p",
        text:
          "Front bumper, part of the bonnet, and the wing mirrors. It covers the panels that collect stone chips first and leaves everything else alone. This is the sensible starting point for a daily-driven hatchback or sedan on a budget.",
      },
      { type: "h3", text: "Full front end" },
      {
        type: "p",
        text:
          "Bumper, the whole bonnet, fenders, headlights and mirrors. The reason people step up to it is the bonnet: a partial wrap leaves a cut line across a panel you look at every day, and a full bonnet has none. It is the most commonly chosen option we fit.",
      },
      { type: "h3", text: "Full body" },
      {
        type: "p",
        text:
          "Every painted panel. It is genuinely the right answer for matte paint — which cannot be polished — and for cars that are kept, shown or driven hard. For a normal city car it is a large amount of money spent on panels that were never at risk.",
      },

      {
        type: "cta",
        text:
          "Bring the car in and we will tell you which panels on YOUR car are actually taking damage, and quote only those. Live prices for hatchback, sedan and SUV are on the PPF page.",
        label: "See PPF prices",
      },

      { type: "h2", text: "Why PPF and ceramic are quoted together" },
      {
        type: "p",
        text:
          "Film and coating solve different problems, so partial coverage leaves an obvious gap: the panels without film still face UV, borewell water and bird droppings. Putting [ceramic coating](/services/ceramic-coating-bangalore) over the rest of the car closes that gap for a fraction of what full-body film costs.",
      },
      {
        type: "p",
        text:
          "Coating over the film matters too — film has its own surface, and an uncoated film holds water spots exactly like paint does. If you want the detail on how the two differ, [we wrote that up separately](/blog/ppf-vs-ceramic-coating-bangalore).",
      },
      {
        type: "p",
        text:
          "P91 fits [STEK](/products/stek) and our own [P91 Premium PPF](/products/p91-premium-ppf) film, and applies [Nasiol](/products/nasiol) ceramic coating.",
      },

      { type: "h2", text: "What to ask before you agree to coverage" },
      {
        type: "ul",
        items: [
          "**Which panels** are included, named individually — not \"front\"",
          "Whether the bonnet is **full or partial**, and where the cut line falls if partial",
          "Whether headlights and mirrors are in the quote or extra",
          "What the **uncovered** panels are getting instead, if anything",
          "The film brand and batch, and the warranty card at handover",
        ],
      },
      {
        type: "p",
        text:
          "Prices at P91 are by body type — hatchback, sedan and SUV — for both partial and full coverage. Pick your body type on the [PPF page](/ppf) and the live price for that combination is shown before you book.",
      },
    ],
  },

  {
    slug: "is-your-ppf-really-made-in-usa",
    title: "Is Your PPF Really Made in the USA? What the Label Doesn't Tell You",
    seoTitle: "Is Your PPF Really Made in the USA? | P91",
    date: "2026-09-08",
    readMinutes: 5,
    category: "Protection",
    excerpt:
      "Country-of-origin on a PPF box is a marketing line more often than a manufacturing fact. Here is what to ask instead.",
    lede:
      "Almost every paint protection film sold in India is described as American. Very few brands make their own film, and fewer still make the raw material it is made from — so the flag on the box is rarely the thing that decides how the film performs.",
    imageServiceSlug: "ppf-suv",
    body: [
      { type: "h2", text: "Why the label is the weakest signal" },
      {
        type: "p",
        text:
          "PPF is a thermoplastic urethane sheet with an adhesive on one side and a topcoat on the other. A brand may formulate it, cast it, coat it, or simply buy it finished and print its own box — and all four are legally describable in ways that sound like manufacturing.",
      },
      {
        type: "p",
        text:
          "So \"made in\" can mean the polymer was synthesised there, or that the roll was slit and boxed there. Those are very different products with the same sticker.",
      },

      { type: "carousel", ...PPF_ORIGIN },

      { type: "h2", text: "The questions that actually separate films" },
      { type: "h3", text: "Who made the raw material?" },
      {
        type: "p",
        text:
          "The polymer grade is where clarity, yellowing resistance and self-healing behaviour are decided. A brand that can tell you which TPU grade its film uses is a brand that knows its own supply chain.",
      },
      { type: "h3", text: "What testing has it been through?" },
      {
        type: "p",
        text:
          "UV and weathering testing is the difference between a film that stays clear for years and one that goes yellow over a bonnet. Ask for the test standard, not the adjective.",
      },
      { type: "h3", text: "Who honours the warranty, and where?" },
      {
        type: "p",
        text:
          "A manufacturer warranty is only worth the process behind it. Ask who you would call, in India, if the film discoloured in year three — and get the answer in writing at handover, not as a verbal assurance at quoting.",
      },

      {
        type: "cta",
        text:
          "We will show you the film we would put on your car, tell you exactly what it is, and give you the warranty terms before you commit to anything.",
        label: "Talk to the studio",
      },

      { type: "h2", text: "Installation is the part nobody advertises" },
      {
        type: "p",
        text:
          "This is the least glamorous point and the most important one. A premium film fitted badly — stretched at the edges, contaminated under the surface, wrapped where it should have been cut — will fail before a mid-tier film fitted properly.",
      },
      {
        type: "p",
        text:
          "Lifted edges, trapped dust and silvering at a corner are installation outcomes, not material defects, and no warranty covers them. When you are comparing two quotes, the film brand is the easy thing to compare and the fitter is the thing that decides the result.",
      },

      { type: "h2", text: "A short buyer's checklist" },
      {
        type: "ul",
        items: [
          "Name of the film, the exact product line — not just the brand",
          "Who supplies the raw polymer, if they will say",
          "Written warranty terms, and who services them in India",
          "Photographs of the fitter's own recent work, edges and corners included",
          "Whether the quote is for [partial or full coverage](/blog/how-much-ppf-does-your-car-need), panel by panel",
        ],
      },
      {
        type: "p",
        text:
          "If a quote is dramatically cheaper than everything around it, the saving is coming from somewhere — usually the film, occasionally the hours. Both show up on the car eventually. Our [paint protection film page](/services/paint-protection-film-bangalore) sets out what we fit and what it costs.",
      },
      {
        type: "p",
        text:
          "P91 fits [STEK](/products/stek) film and our own [P91 Premium PPF](/products/p91-premium-ppf) line — we make no country-of-origin claim on the latter, for exactly the reason this article explains.",
      },
    ],
  },

  {
    slug: "monsoon-damage-car-bangalore",
    title: "5 Things the Monsoon Did to Your Car That You Cannot See Yet",
    seoTitle: "Monsoon Car Damage in Bangalore | P91",
    date: "2026-09-02",
    readMinutes: 4,
    category: "Paint care",
    excerpt:
      "Rain does its damage quietly. Most of what a Bangalore monsoon leaves behind only becomes visible months later.",
    lede:
      "A car that came through the monsoon looking fine has usually still collected four or five problems. None of them announce themselves — they surface as dull paint, a musty cabin and a rust bubble a year later.",
    imageServiceSlug: "exterior-detailing-hard-water-new",
    body: [
      { type: "h2", text: "Why rain is worse than it looks" },
      {
        type: "p",
        text:
          "Rainwater is not clean water. It collects atmospheric pollutants on the way down and picks up road film on the way off the car, then sits on horizontal panels and evaporates — leaving everything it carried behind, concentrated, in the sun.",
      },
      {
        type: "p",
        text:
          "That is the mechanism behind almost everything below. The water leaves; the deposits stay.",
      },

      { type: "carousel", ...MONSOON_DAMAGE },

      { type: "h2", text: "1. Water spots that are already etching" },
      {
        type: "p",
        text:
          "The white rings left on a bonnet after rain dries are mineral deposits. Left in direct sun they stop sitting on the clearcoat and start biting into it. At that point washing will not remove them — the surface itself is now uneven.",
      },
      {
        type: "p",
        text:
          "This is the same failure mode as [borewell hard water](/blog/hard-water-spot-removal-bangalore), and it responds to the same fix: get the deposits off early, and give the surface something they struggle to bond to.",
      },

      { type: "h2", text: "2. Rust starting where you cannot see it" },
      {
        type: "p",
        text:
          "Door bottoms, boot lip seams, wheel arch liners and the underbody hold water long after the paint has dried. Corrosion starts at the edges and in the seams, works outward, and is usually only visible once the paint above it lifts.",
      },

      { type: "h2", text: "3. A cabin that is still damp" },
      {
        type: "p",
        text:
          "Wet floor mats put moisture into the carpet, and the carpet puts it into the underlay, where it does not dry. That is where the smell comes from, and where mould grows. A vacuum does not reach it — the mats have to come out and the carpet has to be extracted and dried.",
      },
      {
        type: "p",
        text:
          "If the car smells musty with the air conditioning on, that is the cue for an [interior detail](/services/interior-detailing-bangalore) rather than an air freshener.",
      },

      {
        type: "cta",
        text:
          "Post-monsoon is the right time to reset the car — decontaminate the paint, dry the cabin properly, and put protection back on before the next season.",
        label: "Book a post-monsoon detail",
      },

      { type: "h2", text: "4. Rubber and trim wearing faster" },
      {
        type: "p",
        text:
          "Wiper blades take the worst of it: grit sits on the windscreen, the blade drags it across the glass, and the edge goes. Door and window seals harden and craze with constant wet-dry cycling, and once a seal stops sealing it starts letting water into exactly the places in point two.",
      },

      { type: "h2", text: "5. Whatever protection the paint had is thinner" },
      {
        type: "p",
        text:
          "Wax and sealants are sacrificial by design, and a monsoon plus the detergent washes that follow it is what they are sacrificed to. The car can look fine and still have nothing left on the surface, which is why paint that survived one monsoon often deteriorates quickly through the next.",
      },
      {
        type: "p",
        text:
          "A [ceramic coating](/ceramic-coating/car) is the durable answer here: it is measured in years rather than washes, and it makes the water spotting in point one far easier to remove before it etches.",
      },
      {
        type: "p",
        text: "P91 applies [Nasiol](/products/nasiol) nano-ceramic coating for this.",
      },

      { type: "h2", text: "What a post-monsoon reset actually involves" },
      {
        type: "ul",
        items: [
          "A **decontamination wash** — not a regular wash — to lift bonded deposits",
          "**Paint correction** where water spots have already etched",
          "Mats out, carpets extracted and **properly dried**, not just vacuumed",
          "Seals, trim and wiper edges checked and treated",
          "Protection reapplied, so the next season starts from a surface that has some",
        ],
      },
      {
        type: "p",
        text:
          "None of this is urgent in the way a warning light is urgent. It is the kind of work that costs a little now and a lot later, which is exactly the kind most people skip.",
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
