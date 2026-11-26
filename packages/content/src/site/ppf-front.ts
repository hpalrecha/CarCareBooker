import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq, hubFaq } from "./sources.ts";

/**
 * /services/paint-protection-film/front. Sources (reshaped):
 * - Carousel PPF_COVERAGE slides "Partial front" and "Full front end" (carousels.ts:53-54).
 * - Blog "how-much-ppf-does-your-car-need" (blog-posts.ts:551+): coverage levels, PPF + ceramic, what to ask
 *   (copied verbatim; blog-posts.ts cannot be imported by plain Node), links remapped.
 * - SEO_PAGES[1] "paint-protection-film-bangalore" (seo-pages.ts:133): the Bangalore traffic section and FAQ.
 * - /faq hub "Is partial PPF enough for Bangalore driving conditions?".
 * New sections: what moves the price, caring for front film (general PPF care; hub FAQ on pressure washing).
 * No price line: the catalogue has no active front/partial package and the full-body range does not apply
 * (deviation from the plan's "ppf", recorded in 2b-review-B.md).
 */
const SEO_PPF = seoPage("paint-protection-film-bangalore");

export const PPF_FRONT: ServiceContent = {
  family: null,
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/services/paint-protection-film/front", label: "Front PPF" },
  ],
  eyebrow: "Partial front · Full front end · Adugodi",
  h1: "Front PPF in Bangalore",
  shortAnswer:
    "Front PPF puts clear film on the panels that take most stone chips: the front bumper, the bonnet, and the mirrors, plus the fenders and headlights on a full front end. It covers where damage actually lands, for much less than full-body film. [NEEDS: studio time for partial front and full front end]",
  hero: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio beside the STEK wall", width: 3420, height: 1925 },
  sections: [
    {
      h2: SEO_PPF.context.heading,
      paras: SEO_PPF.context.paragraphs ?? [],
    },
    {
      h2: "Coverage is a decision, not an upsell",
      paras: [
        "What decides the bill is **how much of the car needs it**, and that depends on where stones, grit and door edges land, not on how much film will fit.",
        "The front of the car takes most of the road damage. Everything behind the A-pillar lives a much quieter life. Spend equally on both and the quote doubles without the paint being meaningfully safer.",
      ],
    },
    {
      h2: "Partial front",
      paras: [
        "Front bumper, part of the bonnet, and the wing mirrors. It covers the panels that collect stone chips first and leaves the rest alone. A sensible starting point for a daily-driven hatchback or sedan on a budget.",
        "The trade-off is the bonnet: partial coverage ends in a cut line across it. On light colours the line is hard to see; on dark paint it can catch the eye in the right light.",
      ],
    },
    {
      h2: "Full front end",
      paras: [
        "Bumper, the whole bonnet, fenders, headlights and mirrors. People step up to it for the bonnet: a partial wrap leaves a cut line across a panel you look at every day, and a full bonnet has none.",
        "It balances looks, protection and resale value, and the headlights are covered too, so the lenses do not pit and haze from the same grit that chips the bumper.",
      ],
    },
    {
      h2: "Front only or full body?",
      paras: [
        "Full body is the right answer for matte paint, which cannot be polished, and for cars that are kept, shown or driven hard. For a normal city car it is a lot of money spent on panels that were never at risk.",
        "Full body also guards doors and quarters against parking-lot scrapes and keeps the finish even across the car. If that matters to you, see [full-body PPF](/services/paint-protection-film).",
      ],
    },
    {
      h2: "Why PPF and ceramic are quoted together",
      paras: [
        "Film and coating solve different problems, so partial coverage leaves a gap: the panels without film still face UV, borewell water and bird droppings. [Ceramic coating](/services/ceramic-coating) over the rest of the car closes that gap for a fraction of what full-body film costs.",
        "Coating over the film matters too. Film has its own surface, and an uncoated film holds water spots just like paint does.",
      ],
    },
    {
      h2: "What moves the price",
      bullets: [
        "**Which panels.** Partial front, full front end, or extra panels such as the A-pillars and the area behind the wheel arches.",
        "**Full or partial bonnet.** A full bonnet uses more film and takes longer to fit, with no cut line.",
        "**Headlights and mirrors.** Small panels, but fiddly ones; check whether they are in the quote.",
        "**Car size and shape.** A deep, sculpted bumper takes more film and more fitting time than a flat one.",
        "**Paint condition.** Chips and swirls already in the paint stay visible under the film, so they are corrected or touched up first.",
      ],
      paras: ["Front jobs vary more than full-body jobs, because the panel list changes:"],
    },
    {
      h2: "Caring for front film",
      bullets: [
        "Wash bug splatter, tar and bird droppings off the film soon, with water and a pH-neutral shampoo.",
        "Keep high-pressure water away from film edges, damaged sections and any lifted areas.",
        "Do not pick at an edge that lifts; bring the car back so it can be checked.",
        "Light swirls in the film fade in the sun.",
        "Dry the front with a soft microfibre towel; hard-water spots can dry on film just as they do on paint.",
      ],
      paras: ["Front film takes the most dirt on the car, so it gets washed most often:"],
    },
    {
      h2: "What to ask before you agree to coverage",
      bullets: [
        "**Which panels** are included, named one by one, not just \"front\"",
        "Whether the bonnet is **full or partial**, and where the cut line falls if partial",
        "Whether headlights and mirrors are in the quote or extra",
        "What the **uncovered** panels are getting instead, if anything",
        "The film brand and batch, and the warranty card at handover",
        "How long the car stays in the studio, and when it can first be washed",
        "Whether more panels can be added later, and where the new film would meet the old",
      ],
      paras: [],
    },
  ],
  steps: [
    { title: "Agree the panels", text: "The exact panels the quote covers, marked on your car.", photo: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio beside the STEK wall", width: 3420, height: 1925 } },
    { title: "Wash and decontaminate", text: "Tar, iron and hard-water deposits come off so nothing is trapped under the film.", photo: null },
    { title: "Correct the paint", text: "Swirls and light scratches are polished out first, or they stay visible under the film.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Fit the film", text: "Panel by panel, edges wrapped where the panel allows.", photo: { src: "/photos/ppf-install-door-handle.webp", alt: "A P91 fitter tucking paint protection film around a door handle in the Adugodi studio", width: 720, height: 1280 } },
    { title: "Hand over", text: "Final inspection, care sheet and the written warranty card with the batch number.", photo: null },
  ],
  faq: [
    hubFaq("paint-protection-film", "Is partial PPF enough for Bangalore driving conditions?"),
    seoFaq("paint-protection-film-bangalore", "Full body or just the front?"),
    { q: "Will there be a visible line where the film ends?", a: "On a partial bonnet, yes: the film ends in a cut line across the panel. A full front end covers the whole bonnet, so there is no line on it." },
    { q: "Can I add more panels later?", a: "Yes. Film can be added to other panels at a later visit. The new film meets the old at a panel edge, so plan the first job with that in mind." },
    hubFaq("warranty-and-maintenance", "Can I pressure wash a car with PPF?"),
    { q: "Do headlights need film?", a: "On a full front end they are included, because the same grit that chips the bumper slowly pits and hazes the lenses. On a partial front, ask whether they are in the quote." },
  ],
  related: [
    { href: "/services/paint-protection-film", label: "Full-body PPF" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/brands/p91-premium-ppf", label: "P91 Premium PPF" },
    { href: "/guides/how-much-ppf-does-your-car-need", label: "How much PPF does your car need?" },
  ],
  labels: {
    faqH2: "Front PPF questions",
    cta: { title: "Bring the car in for a coverage check", body: "We tell you which panels on your car are taking damage, and quote only those." },
  },
};
