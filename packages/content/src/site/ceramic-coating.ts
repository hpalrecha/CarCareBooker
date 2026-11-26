import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq, hubFaq } from "./sources.ts";

/**
 * /services/ceramic-coating. Sources (reshaped, not rewritten):
 * - SEO_PAGES[0] "ceramic-coating-bangalore" (seo-pages.ts:83): lede, includes, borewell section, 3 FAQs.
 * - LANDING_PAGES[0] "/ceramic-coating/car" (landing-pages.ts:158): eyebrow, lede, 5 benefits, 6 steps (copied
 *   verbatim below; that module cannot be imported by plain Node).
 * - Studio time: CERAMIC_TIMING["1-year-ceramic-coating"] (ceramic-timing.ts:16), confirmed by the studio 11 Nov.
 * - Extra FAQs: /faq hub groups "ceramic-coating" and "warranty-and-maintenance" (faq-page.ts).
 */
const SEO = seoPage("ceramic-coating-bangalore");

export const CERAMIC: ServiceContent = {
  family: "ceramic-car",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
  ],
  eyebrow: "Ceramic coating · Cars · Adugodi",
  h1: "Ceramic coating in Bangalore",
  shortAnswer:
    "Ceramic coating is machine paint correction followed by a nano-ceramic layer that deepens the gloss, repels water and dirt, and makes every wash after it easier. The car stays approx. 36–48+ hours in the studio, depending on the preparation required.",
  hero: { src: "/photos/gle-nasiol-wall.webp", alt: "White Mercedes-Benz GLE in front of the Nasiol wall in the P91 studio", width: 1084, height: 911 },
  sections: [
    {
      h2: "What a ceramic coating actually does",
      paras: [],
      bullets: [
        "**Resists Bangalore's borewell water.** Water here is mineral-heavy, and the minerals stay on the paint when a droplet dries. Coating does not make paint immune, but it gives you more time to wash the water off before it marks the clearcoat.",
        "**Water beads and rolls off.** The coated surface is hydrophobic, so rain and wash water sheet away instead of sitting in flat puddles and evaporating in place. That is why coated cars stay clean longer as well as looking glossier.",
        "**Easier to wash, harder to mark.** Road film and dust have less to grip, so routine cleaning takes less rubbing. Less rubbing is what keeps swirl marks out of the clearcoat over time.",
        "**Gloss with depth, not just shine.** The machine correction stage removes swirls and water-spot etching before anything is applied. The coating then locks in that corrected surface rather than sitting on top of defects.",
        "**UV and environmental resistance.** A sacrificial layer between your clearcoat and sunlight, tree sap, bird lime and road grime, the things that dull and oxidise paint on a car parked outdoors.",
      ],
    },
    {
      h2: SEO.context.heading,
      paras: SEO.context.paragraphs ?? [],
    },
    {
      h2: "What the job includes",
      paras: [],
      bullets: SEO.includes,
    },
    // ── New sections (owner, 26 Nov: longer pages). Sources noted per section. ──
    {
      // Factors: the approved FAQ answer ("vehicle size, the paint condition, the preparation needed and the coating"),
      // expanded with the catalogue's own process steps (iron remover, clay bar, machine polishing).
      h2: "What moves the price of a ceramic coating",
      paras: ["Two cars booked for the same coating can need very different amounts of work before the coating goes on. These are the things that make the difference:"],
      bullets: [
        "**Size of the car.** More painted panels means more surface to decontaminate, polish and coat.",
        "**Paint condition.** Swirl marks, water-spot etching and light scratches have to be machine polished out first, or the coating locks them in. Paint correction is the slow part of the job.",
        "**Preparation.** Tar, iron fallout from brake dust and bonded grime come off with a clay bar and an iron remover before polishing. A neglected car needs more of this than a new one.",
        "**The coating you choose.** Different coatings are made to last different lengths of time, and cost more or less accordingly.",
        "**Coating over film.** Coating a car that already has PPF, or booking the two together, changes the work involved.",
      ],
    },
    {
      // Catalogue row 1-year-ceramic-coating: "engineered to last 12 months with proper care", "degrades gradually",
      // maintenance answer. The causes of wear are general coating knowledge.
      h2: "How long the coating lasts, and what wears it down",
      paras: [
        "The 1-year coating is made to last about 12 months with proper care. It does not stop working on one day: it wears down gradually, and a fresh coat brings back the full gloss and water beading.",
        "What shortens its life is mostly the wash routine. Strong detergents and degreasers, automatic car washes with brushes, and abrasive polishes all take the coating down faster. So does leaving bird droppings and tree sap to bake on in the sun.",
        "A simple test tells you how it is doing: when water stops beading and starts sitting in flat sheets on a clean panel, the coating is near the end of its life.",
      ],
    },
    {
      // FAQ answers: "PPF is generally the better choice when stone chips and physical damage are your main concern";
      // Home FAQ: "Many owners do both".
      h2: "Ceramic coating or PPF?",
      paras: [
        "A ceramic coating is a hard, slick layer for gloss and easy washing. It does not stop stone chips: when chips and scratches are the main worry, [paint protection film](/services/paint-protection-film) is the better choice.",
        "Many owners do both: film on the panels that take hits, coating over everything, including over the film. Booked together, the two are done in the same visit.",
      ],
    },
    {
      // Approved warranty and batch lines (warranty-wording.ts); the rest are plain questions, no claims.
      h2: "What to ask a studio before you book",
      paras: ["Whoever you book with, these answers tell you what you are paying for:"],
      bullets: [
        "Which coating, by brand and product name. At P91 it is [Nasiol](/brands/nasiol) nano-ceramic coating.",
        "How much paint correction is included, and whether your paint needs more than that.",
        "How long the car stays in the studio, so the coating can cure before it goes back on the road.",
        "What the aftercare is: which shampoo, and what to avoid in the first weeks.",
        "The warranty terms, in writing. Ask to see the batch details before work starts.",
      ],
    },
  ],
  steps: [
    { title: "Book", text: "Book on WhatsApp or call", photo: null },
    { title: "Bring the car", text: "Bring the car to our Adugodi studio", photo: null },
    { title: "Decontaminate", text: "Decontamination wash and clay bar treatment", photo: null },
    { title: "Correct the paint", text: "Machine paint correction to remove swirls and water-spot etching", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Coat", text: "Panel wipe, then the coating applied panel by panel", photo: { src: "/photos/ceramic-wipe-bonnet.webp", alt: "Applicator block wiping ceramic coating onto a bonnet", width: 720, height: 1280 } },
    { title: "Cure and inspect", text: "Controlled curing and a final inspection under inspection lighting", photo: null },
  ],
  // Google reviews that name ceramic coating (reviews.ts), word for word.
  reviewNames: ["Pratham Pandit", "Shreyash Gupta", "YATHISH N"],
  faq: [
    {
      q: "How long does the car stay with you?",
      a: "Approx. 36–48+ hours in the studio, depending on the preparation required. Paint correction is the slow part. The coating itself goes on quickly, but it needs to cure properly before the car goes back out.",
    },
    seoFaq("ceramic-coating-bangalore", "Is 9H a meaningful number?"),
    seoFaq("ceramic-coating-bangalore", "Can I wash the car normally afterwards?"),
    hubFaq("ceramic-coating", "Is ceramic coating worth it in Bangalore?"),
    hubFaq("ceramic-coating", "What is the difference between car polishing and ceramic coating?"),
    hubFaq("ceramic-coating", "Can ceramic coating prevent hard water stains?"),
    hubFaq("warranty-and-maintenance", "How should I maintain my car after ceramic coating?"),
  ],
  related: [
    { href: "/services/ceramic-coating/bike", label: "Ceramic coating for bikes" },
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/brands/nasiol", label: "Nasiol nano-ceramic coating" },
    { href: "/guides/hard-water-spot-removal-bangalore", label: "How to protect your car paint from hard water spots in Bangalore" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
    { href: "/gallery", label: "See our work" },
  ],
  labels: {
    stepsH2: "How the job is done, step by step",
    faqH2: "Ceramic coating questions",
  },
};
