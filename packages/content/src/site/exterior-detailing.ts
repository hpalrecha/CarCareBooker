import type { ServiceContent } from "./types.ts";
import { hubFaq } from "./sources.ts";

/**
 * /services/exterior-detailing. Sources (reshaped, not rewritten):
 * - /faq hub group "car-detailing" (faq-page.ts:266): the 4 FAQs, and the wording of the short answer.
 * - Blog "hard-water-spot-removal-bangalore" (blog-posts.ts:383): sections "Why borewell water is the problem",
 *   "The habit that prevents it" and "When it needs correction", copied verbatim (blog-posts.ts cannot be
 *   imported by plain Node), links remapped to the new paths.
 * - Before/after: the orange Hyundai i20 pair, caption as on Home (Plan 2a).
 */
export const EXTERIOR: ServiceContent = {
  family: "exterior-detailing",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
  ],
  eyebrow: "Polishing · Hard-water spots · Headlights · Adugodi",
  h1: "Exterior detailing in Bangalore",
  shortAnswer:
    "Exterior detailing cleans and restores the outside of the car more thoroughly than a wash: decontamination, polishing to reduce swirl marks, light scratches and dullness, and hard-water spot removal. At P91 it costs {range}. [NEEDS: time in the studio]",
  hero: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 },
  rangeNote: "[NEEDS: what moves the exterior detailing price, for example car size or paint condition]",
  sections: [
    {
      h2: "Why borewell water is the problem",
      paras: [
        "When borewell water dries on a panel, the water leaves and the calcium and magnesium stay behind. What is left is a concentrated alkaline deposit sitting directly on the clearcoat, and Bangalore's sun bakes it in.",
        "Caught the same day, it wipes off. Left for a few weeks, it becomes a crater you can feel with a fingernail, and no amount of washing will remove it.",
      ],
    },
    {
      h2: "The habit that prevents it",
      paras: [
        "The fix is **drying properly**, not washing more often: a clean microfibre towel, straight away, in the shade. Most of the spotting we see comes from cars washed at 11am in an open car park and left to air-dry.",
      ],
      bullets: [
        "Wash early morning or evening, never in direct sun",
        "Work panel by panel and dry each one before moving on",
        "Use a clean, dedicated drying towel, not the one that was on the wheels",
        "If you cannot dry it, do not wash it",
      ],
    },
    {
      h2: "When it needs correction",
      paras: [
        "**Surface deposits.** If the mark sits on top of the clearcoat, a decontamination wash and clay bar lifts it. This is cleaning, and it is quick.",
        "**Etched spots.** If you can feel the edge of the mark, the mineral has eaten into the clearcoat. That needs machine polishing to level the surface around it, which is [exterior detailing with hard water spot removal](/services/exterior-detailing/hard-water-spot-removal) rather than a wash.",
        "Hazy headlight lenses are a separate job: [headlight restoration](/services/exterior-detailing/headlight-restoration).",
      ],
    },
  ],
  beforeAfter: [
    {
      before: { src: "/photos/i20-before-bird-droppings.webp", alt: "Before: orange Hyundai i20 with bird droppings on the bonnet", width: 1400, height: 1867 },
      after: { src: "/photos/i20-after-studio.webp", alt: "After: the same orange Hyundai i20, glossy, in the P91 studio", width: 1400, height: 2488 },
      caption: "Hyundai i20 · bird-dropping marks removed and paint polished",
    },
  ],
  faq: [
    hubFaq("car-detailing", "What is the difference between car washing and car detailing?"),
    hubFaq("car-detailing", "Can detailing restore faded car paint?"),
    hubFaq("car-detailing", "Can I get my car detailed before selling it?"),
    hubFaq("car-detailing", "Where can I get professional paint correction in Bengaluru?"),
  ],
  related: [
    { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
    { href: "/services/exterior-detailing/headlight-restoration", label: "Headlight restoration" },
    { href: "/services/paint-correction", label: "Paint correction" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/guides/hard-water-spot-removal-bangalore", label: "How to protect your car paint from hard water spots in Bangalore" },
  ],
  labels: {
    workH2: "Same car, before and after",
    faqH2: "Exterior detailing questions",
  },
};
