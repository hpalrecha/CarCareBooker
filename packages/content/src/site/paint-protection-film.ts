import type { ServiceContent } from "./types.ts";

/**
 * /services/paint-protection-film on the service template (Plan 2b Task 1). Same copy as Plan 2a.
 * Changes: the warranty [NEEDS] markers are gone because the years now come from the catalogue
 * (warrantyYearsOf, owner decision 26 Nov); the FAQ "How long does PPF last?" answers from the
 * same warranty line instead of a [NEEDS] marker.
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
        "**Aftercare:** [NEEDS: days before the first wash]. After that, a pH-neutral wash. Light swirls in the film fade in the sun. [How much PPF does your car need?](/guides/how-much-ppf-does-your-car-need)",
      ],
      photo: { src: "/photos/ppf-install-door-edge.webp", alt: "P91 installer fitting clear PPF around the rear door of a black SUV", width: 720, height: 1280 },
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
  ],
  related: [
    { href: "/services/ceramic-coating", label: "Ceramic coating over PPF" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/brands/stek", label: "STEK paint protection film" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
  ],
  labels: {
    stepsH2: "Three days, five steps",
    workH2: "PPF jobs from the studio",
    faqH2: "PPF questions",
    relatedH2: "Often booked with PPF",
    cta: { title: "See the film before you book", body: "Visit the studio in Adugodi, near Koramangala. Open daily." },
  },
};
