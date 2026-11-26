import type { ServiceContent } from "./types.ts";
import { hubFaq } from "./sources.ts";

/**
 * /services/paint-protection-film/matte. Mostly new copy (Plan 2b batch B). Approved scraps:
 * - faq-page.ts:178 "Does PPF change the colour of my car?" (used whole) and :96 (STEK gloss and matte films).
 * - seo-pages.ts:179 "Matte film changes the finish on purpose, so that is your choice, not a side effect."
 * - brand-pages.ts:66 "Film that keeps the paint as it is, or changes the finish, without touching the original paint."
 * - blog how-much-ppf (blog-posts.ts:551+): full body "is the right answer for matte paint, which cannot be polished".
 * Everything else is general PPF knowledge, written plainly; P91-specific facts not on record are [NEEDS].
 * No price line: the catalogue has no matte package, and the full-body gloss range does not apply (deviation
 * from the plan's "ppf (overall only)", recorded in 2b-review-B.md).
 */
export const PPF_MATTE: ServiceContent = {
  family: null,
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
  ],
  eyebrow: "Satin finish · STEK matte film · Adugodi",
  h1: "Matte PPF in Bangalore",
  shortAnswer:
    "Matte paint protection film is a clear urethane film with a satin surface. It does two jobs: it turns gloss paint matte without repainting, and it protects factory matte paint, which cannot be polished if it is scratched. It peels off later without touching the original paint. [NEEDS: studio time for a full-body matte job]",
  hero: null,
  sections: [
    {
      h2: "Two reasons owners choose matte film",
      paras: [
        "**To change the look.** On a gloss car, matte film gives a satin or matte finish without repainting. Matte film changes the finish on purpose, so that is your choice, not a side effect. Because the film sits over the paint, the change is reversible: peel the film and the original gloss is still there underneath.",
        "**To protect matte paint.** Some cars leave the factory with matte or frozen paint. That paint cannot be polished: a scratch, a stain or a bird-dropping etch on it is close to permanent, because polishing would leave a shiny patch. Matte film takes that damage instead, and keeps the factory finish as it was delivered.",
      ],
    },
    {
      h2: "What matte film looks like on a car",
      paras: [
        "The colour you see is still your own paint; only the way light comes off it changes. Reflections soften, highlights spread out, and the surface reads as one even sheen instead of a mirror.",
        "Dark colours show the effect most strongly: black and deep blue turn soft and even, and body lines look sharper because there are no reflections across them. White and silver change less and look more like brushed metal. If you are unsure, look at a matte car in daylight, not only under studio light, before deciding. [NEEDS: can P91 show a matte film sample or a finished matte car at the studio?]",
      ],
    },
    {
      h2: "Full body, or only some panels?",
      paras: [
        "On a factory matte car, full body is the right answer: every panel is equally impossible to polish, so every panel needs the film.",
        "On a gloss car, the choice is about looks. Matte film on every painted panel changes the whole car evenly. Matte on only the bonnet or roof gives a deliberate two-tone contrast. What does not work well is matte film on a few random panels for protection alone: the finish will not match the gloss around it. For protection without a change in look, [front PPF](/services/paint-protection-film/front) in gloss film is the better fit.",
      ],
    },
    {
      h2: "What moves the price",
      paras: ["Matte jobs are priced on the same things as any PPF job, with one addition:"],
      bullets: [
        "**Coverage.** Full body, or chosen panels such as bonnet and roof.",
        "**Car size and shape.** More panels and deeper curves mean more film and more fitting time.",
        "**Paint condition.** On gloss paint being turned matte, swirls and scratches should be corrected first: matte film hides gloss but not dents or deep marks.",
        "**The film line.** Matte film is a separate product from gloss film, with its own price. STEK offers gloss and matte films.",
      ],
    },
    {
      h2: "Caring for matte film",
      paras: ["Matte film is cared for differently from gloss, because anything that adds shine ruins the satin look:"],
      bullets: [
        "No wax, polish, glaze or quick detailer made for gloss paint. They fill the texture and leave shiny, blotchy patches.",
        "No machine polishing, ever. Polishing matte film makes it gloss in patches.",
        "Wash with a pH-neutral shampoo, ideally one made for matte finishes, and a soft mitt.",
        "Lift bird droppings, sap and bug splatter quickly with water and a soft cloth; do not scrub.",
        "Keep a pressure washer away from film edges and any lifted areas.",
        "Skip automatic washes with brushes.",
      ],
    },
    {
      h2: "Living with a matte car",
      paras: [
        "Matte finishes hide light swirl marks better than gloss, because there are no sharp reflections to show them. They show other things instead: greasy fingerprints around door handles, water marks left to dry, and shiny patches wherever someone has rubbed too hard or used the wrong product.",
        "None of that is hard to manage. It means washing gently and often, drying properly, keeping a matte-safe cleaner in the car for bird droppings, and telling anyone who washes the car that it must never be waxed or polished. Under the film, the paint itself stays exactly as it was."
      ],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Which matte film, by brand and line, and whether you can see a sample first.",
        "Exactly which panels are covered, named one by one.",
        "How edges are finished, and where the film stops on each panel.",
        "Whether paint correction is needed before the film goes on.",
        "How long the car stays in the studio, and the aftercare before the first wash.",
        "The warranty terms for the matte film, in writing at handover.",
      ],
      paras: ["Matte work is less common than gloss, so it is worth asking more:"],
    },
  ],
  steps: [
    { title: "Inspect and decide", text: "Paint checked under studio light, and the panels and finish agreed.", photo: null },
    { title: "Wash and decontaminate", text: "Tar, iron and hard-water deposits come off so nothing is trapped under the film.", photo: null },
    { title: "Correct where needed", text: "On gloss paint, swirls and light scratches are polished out first.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Fit the film", text: "Panel by panel, edges wrapped where the panel allows.", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
    { title: "Inspect and hand over", text: "Final inspection, care sheet and the written warranty terms.", photo: null },
  ],
  faq: [
    hubFaq("paint-protection-film", "Does PPF change the colour of my car?"),
    { q: "Can matte film be polished?", a: "No. Polishing makes matte film shiny in patches. Light marks are washed off gently; a damaged section of film is replaced rather than polished." },
    { q: "Can I put matte film on only the bonnet?", a: "Yes. On a gloss car that gives a deliberate contrast between the bonnet and the rest of the car, so choose it for the look, not only for protection." },
    hubFaq("paint-protection-film", "Can PPF be removed without damaging the original paint?"),
    { q: "Can ceramic coating go over matte film?", a: "Only a coating made for matte finishes. A gloss coating would add shine and change the look. Ask before booking the two together." },
    { q: "Is matte film harder to keep clean?", a: "It needs different care, not more. Grease and fingerprints show more on matte, and it must never be waxed or polished, but a gentle wash with a matte-safe shampoo keeps it even." },
    { q: "Will matte film hide scratches already in the paint?", a: "Light swirls become harder to see under a matte finish, but dents, chips and deep scratches still show. Correct the paint first if the car is gloss and the marks bother you." },
  ],
  related: [
    { href: "/services/paint-protection-film", label: "Full-body PPF" },
    { href: "/services/paint-protection-film/front", label: "Front PPF" },
    { href: "/brands/stek", label: "STEK paint protection film" },
    { href: "/guides/how-much-ppf-does-your-car-need", label: "How much PPF does your car need?" },
  ],
  labels: {
    faqH2: "Matte PPF questions",
    cta: { title: "See matte film before you book", body: "Visit the studio in Adugodi, near Koramangala. Open daily." },
  },
};
