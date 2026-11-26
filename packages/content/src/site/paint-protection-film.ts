import type { ServiceContent } from "./types.ts";
import { seoPage, hubFaq } from "./sources.ts";

const SEO_PPF = seoPage("paint-protection-film-bangalore");

/**
 * /services/paint-protection-film on the service template (Plan 2b Task 1). Same copy as Plan 2a.
 * Changes: the warranty [NEEDS] markers are gone because the years now come from the catalogue
 * (warrantyYearsOf, owner decision 26 Nov); the FAQ "How long does PPF last?" answers from the
 * same warranty line instead of a [NEEDS] marker.
 * 26 Nov (Plan 2b, owner: 1,200+ words): seven sections and four hub FAQs added; sources beside each.
 */
export const PPF: ServiceContent = {
  family: "ppf",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/paint-protection-film", label: "Paint protection film" },
  ],
  eyebrow: "STEK · P91 Premium PPF · Adugodi",
  h1: "Paint protection film in Bangalore",
  shortAnswer:
    "Paint protection film is a clear, self-healing urethane film fitted over the paint so stone chips and scratches hit the film, not the car. At P91 a full-body job keeps the car about 3 days in the studio; the cost depends on car size, film line and coverage.",
  hero: { src: "/photos/ppf-install-door-handle.webp", alt: "A P91 fitter tucking paint protection film around a door handle in the Adugodi studio", width: 720, height: 1280 },
  showWarrantyYears: true,
  sections: [
    {
      h2: "Why PPF prices in Bangalore vary so much",
      paras: ["Four things explain most of the gap between quotes. [Read the full PPF cost guide](/guides/ppf-cost-bangalore)"],
      bullets: [
        "**Film brand and line.** Genuine film with a traceable batch costs more than unbranded rolls, and premium lines cost more than standard.",
        "**Coverage.** Front only (bonnet, bumper, mirrors) versus every painted panel.",
        "**Car size and shape.** More panels and deeper curves mean more film and more fitting time.",
        "**Paint condition.** Swirls and scratches must be corrected before film goes on.",
      ],
    },
    {
      h2: "Front only or full body?",
      paras: [
        "Front-only film covers the panels that take most stone chips on Bangalore roads: bonnet, front bumper, headlamps and mirrors.",
        "Full body also guards doors and quarters against parking-lot scrapes and keeps the finish even across the car.",
        // 26 Nov: reordered so the hidden gap (gaps.ts) leaves a whole sentence; wording otherwise unchanged.
        "**Aftercare:** once the film has settled, a pH-neutral wash. [NEEDS: days before the first wash] Light swirls in the film fade in the sun. [How much PPF does your car need?](/guides/how-much-ppf-does-your-car-need)",
      ],
      photo: { src: "/photos/ppf-install-door-edge.webp", alt: "P91 installer fitting clear PPF around the rear door of a black SUV", width: 720, height: 1280 },
    },
    // ── Added 26 Nov (Plan 2b, owner: PPF page to 1,200+ words). Sources named per section. ──
    {
      // SEO_PAGES[1] lede and includes list (seo-pages.ts), word for word.
      h2: "What the job includes",
      paras: [SEO_PPF.lede],
      bullets: SEO_PPF.includes,
    },
    {
      // New copy; the limits are the hub FAQ "Is PPF scratch-proof?" (faq-page.ts:166) in plain words.
      h2: "What the film protects against, and what it does not",
      paras: [
        "Film takes the everyday damage that slowly wears paint down: stone chips thrown up by the car in front, light scratches from bags, keys and door edges, the fine swirls a dusty cloth leaves, and stains from bird droppings, sap and insects, which mark the film's surface instead of etching the clear coat.",
        "It is not armour. A hard impact or a deep gouge can cut through film and paint together, and a collision is a body-shop job. Film also does not repair damage that is already there: chips and scratches under the film stay visible unless they are corrected first, which is why the paint is inspected and polished before anything goes on. [What is PPF?](/guides/what-is-ppf) explains the film itself.",
      ],
    },
    {
      // New copy (owner, 26 Nov: self-healing may be stated for PPF), consistent with faq-page.ts:169.
      h2: "Self-healing, explained",
      paras: [
        "The top layer of modern film is self-healing: light swirls and fine marks in the film fade with heat, often just from the sun on a warm day. That is what keeps washing marks from building up in the film the way they do in bare paint.",
        "It works on marks in the top layer only. A cut that goes through the film does not heal, and the panel may need that section of film replaced.",
      ],
    },
    {
      // Hub FAQs "What is the difference between P91 Basic and Premium PPF?" (faq-page.ts:142) and
      // "Does PPF change the colour of my car?" (:178), reshaped; the warranty years are shown by the template from the catalogue.
      h2: "STEK or P91 Premium PPF, gloss or matte",
      paras: [
        "The studio fits two film lines: [STEK](/brands/stek) and its own [P91 Premium PPF](/brands/p91-premium-ppf). Full-body packages come in a standard and a premium line; the premium line uses a higher-grade film and carries the longer written warranty. The right one depends on how long you plan to keep the car and how hard it is driven, and you see the sealed roll before work starts.",
        "Clear gloss film keeps the car's existing colour and appearance. Matte film gives a satin look without repainting, and it is the way to protect factory matte paint, which cannot be polished. See [matte PPF](/services/paint-protection-film/matte).",
      ],
    },
    {
      // Hub FAQs "Should I install PPF straight after buying a new car?" (:154) and "Can PPF be installed on an old car?" (:160), reshaped.
      h2: "New car or older car",
      paras: [
        "Fitting film soon after delivery keeps the factory finish before road damage and washing marks build up. Even a new car is inspected and prepared first: transport and yard washing often leave light marks that would otherwise be sealed in under the film.",
        "An older car can be filmed if the paint is sound. Existing scratches, oxidation, repainted panels or a damaged clear coat are assessed first, and paint correction comes before the film. Repainted panels carry more risk if the film is ever removed.",
      ],
    },
    {
      // New copy, with the hub FAQ "Can I pressure wash a car with PPF?" (:340) in plain words.
      h2: "Living with PPF",
      paras: [
        "Wash with a pH-neutral shampoo and a soft mitt, and dry with a clean microfibre towel. A pressure washer is fine if you keep the jet away from film edges and any lifted area. Lift bird droppings and insects soon, with water and a soft cloth. A ceramic coating over the film makes all of this quicker, and booked together it is done in the same visit.",
        "If an edge lifts or a section is damaged, bring the car back to the studio rather than trimming or pressing it yourself.",
      ],
    },
    {
      // New copy; same questions as the other film and coating pages.
      h2: "What to ask before you book",
      paras: [],
      bullets: [
        "Which brand and which exact film line is quoted, in writing?",
        "Which panels are covered, one by one, and is the bonnet full or partial?",
        "Is paint correction included, and how much?",
        "How long will the car stay in the studio?",
        "What do the written warranty terms cover, and how is a claim handled?",
      ],
    },
  ],
  steps: [
    { title: "Inspect and quote", text: "Paint checked under studio light. You see the film roll and the panels the quote covers.", photo: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio beside the STEK wall", width: 3420, height: 1925 } },
    { title: "Wash and decontaminate", text: "Tar, iron and hard-water deposits come off so nothing is trapped under the film.", photo: null },
    { title: "Correct the paint", text: "Swirls and light scratches are polished out first, or they stay visible under the film.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Fit the film", text: "Panel by panel, edges wrapped where the panel allows.", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
    { title: "Cure and hand over", text: "Final inspection, care sheet and the written warranty card with the batch number.", photo: { src: "/photos/vellfire-stek-wall.webp", alt: "Toyota Vellfire beside the STEK wall after PPF", width: 958, height: 732 } },
  ],
  work: [
    { src: "/photos/vellfire-stek-wall.webp", alt: "Toyota Vellfire beside the STEK wall", width: 958, height: 732, caption: "Toyota Vellfire · STEK PPF" },
    { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio", width: 3420, height: 1925, caption: "Hyundai Creta · STEK PPF" },
  ],
  // Google reviews that name PPF (reviews.ts), word for word.
  reviewNames: ["Nilesh Parson", "suresh kumar", "Rahul Manikanavar"],
  faq: [
    { q: "How long does PPF last?", a: "It depends on the film line you choose: {warranty}" },
    { q: "Will PPF change how my paint looks?", a: "Gloss film is close to invisible and adds depth. Matte film turns gloss paint satin; see matte PPF." },
    { q: "Can PPF be removed later?", a: "Yes. Genuine film peels off without lifting factory paint when a studio removes it." },
    { q: "Can I get ceramic coating over PPF?", a: "Yes. Coating on top makes the film easier to wash, and booked together it is done in the same visit." },
    { q: "Do you do front-only PPF?", a: "Yes. Front-only covers the bonnet, bumper, headlamps and mirrors, the panels that take most stone chips." },
    { q: "Is it really STEK?", a: "You see the sealed roll and its batch number before work starts, and the warranty card at handover carries the same batch." },
    hubFaq("paint-protection-film", "Is PPF scratch-proof?"),
    hubFaq("paint-protection-film", "What is the difference between P91 Basic and Premium PPF?"),
    hubFaq("paint-protection-film", "Should I install PPF straight after buying a new car?"),
    hubFaq("paint-protection-film", "Is partial PPF enough for Bangalore driving conditions?"),
  ],
  related: [
    { href: "/services/ceramic-coating", label: "Ceramic coating over PPF" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/brands/stek", label: "STEK paint protection film" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
    { href: "/services/paint-protection-film/front", label: "Front PPF" },
  ],
  labels: {
    stepsH2: "Three days, five steps",
    workH2: "PPF jobs from the studio",
    faqH2: "PPF questions",
    relatedH2: "Often booked with PPF",
    cta: { title: "See the film before you book", body: "Visit the studio in Adugodi, near Koramangala. Open daily." },
  },
};
