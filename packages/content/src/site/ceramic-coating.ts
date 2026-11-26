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
    "Ceramic coating is machine paint correction followed by a nano-ceramic layer that deepens the gloss, repels water and dirt, and makes every wash after it easier. At P91 the car coating costs {range}. The car stays approx. 36–48+ hours in the studio, depending on the preparation required.",
  hero: { src: "/photos/gle-nasiol-wall.webp", alt: "White Mercedes-Benz GLE in front of the Nasiol wall in the P91 studio", width: 1084, height: 911 },
  rangeNote: "The final price depends on the vehicle size, the paint condition, the preparation needed and the coating you choose.",
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
  ],
  steps: [
    { title: "Book", text: "Book your appointment online", photo: null },
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
    rangeLabel: "1-year coating for cars",
    stepsH2: "How the job is done, step by step",
    faqH2: "Ceramic coating questions",
  },
};
