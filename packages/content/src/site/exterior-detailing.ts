import type { ServiceContent } from "./types.ts";
import { hubFaq } from "./sources.ts";

/**
 * /services/exterior-detailing. Sources:
 * - /faq hub group "car-detailing" (faq-page.ts:266): the 4 FAQs and the wording of the short answer.
 * - Catalogue row exterior-detailing-hard-water-new: studio time ("{time}") and the includes list, read live.
 * - Before/after: the orange Hyundai i20 pair, caption as on Home (Plan 2a).
 * - The hard-water blog sections that sat here in batch A moved to /services/exterior-detailing/hard-water-spot-removal
 *   (batch B), so the two pages do not repeat each other. The sections below are new (owner, 26 Nov: longer pages):
 *   general detailing knowledge, no figures.
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
    "Exterior detailing cleans and restores the outside of the car more thoroughly than a wash: decontamination, polishing to reduce swirl marks, light scratches and dullness, and hard-water spot removal. At P91 it costs {range}. The car stays {time} in the studio.",
  hero: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 },
  timeSlug: "exterior-detailing-hard-water-new",
  catalogueIncludes: {
    slug: "exterior-detailing-hard-water-new",
    h2: "What the exterior package lists",
    intro: "Read from the studio's catalogue entry for exterior detailing with hard water spot removal:",
  },
  rangeNote: "[NEEDS: what moves the exterior detailing price, for example car size or paint condition]",
  sections: [
    {
      h2: "What exterior detailing can fix, and what it cannot",
      paras: [
        "Detailing works on the surface of the paint and the parts around it. It lifts bonded dirt, tar and fallout, removes water spots, polishes out swirl marks and light scratches, brings dull and oxidised paint back to gloss, and cleans wheels, tyres, chrome and trim.",
        "It cannot put back paint that is gone. A scratch you can catch with a fingernail has usually gone through the clear coat; stone chips go down to primer or metal; peeling clear coat and dents are body-shop work. An inspection before you choose a treatment tells you which is which, so you only pay for what polishing can actually fix.",
      ],
    },
    {
      h2: "Decontamination: what a normal wash leaves behind",
      paras: [
        "Run a clean hand over a washed panel inside a plastic bag and it often feels rough. That roughness is contamination bonded to the paint: tar from the road, tiny iron particles from brake dust, overspray, and dried tree sap.",
        "Shampoo does not lift it. An iron remover dissolves the metal particles, and a clay bar pulls out what is left, so the paint is smooth before any polishing starts. Polishing over contamination only drags it across the surface and adds marks.",
      ],
    },
    {
      h2: "Polish, wax and coating are three different things",
      paras: [
        "**Polishing** is paint correction: a machine and an abrasive polish level the clear coat a tiny amount, so swirl marks, light scratches and water-spot etching disappear. It changes the surface. [Paint correction](/services/paint-correction) covers it in depth.",
        "**Wax** is a thin protective layer that sits on top of the paint and adds shine. It wears off within weeks, which is why the package finishes with it rather than relying on it.",
        "**Ceramic coating** is a harder, longer-lasting layer applied after correction, made to keep the corrected finish. It is a separate service: [ceramic coating](/services/ceramic-coating).",
      ],
    },
    {
      h2: "Common paint problems on Bangalore cars",
      bullets: [
        "**Bird droppings.** They are acidic and etch the clear coat when left to bake in the sun. The i20 below came in with exactly this.",
        "**Tree sap and flowers.** Cars parked under trees collect sticky sap and petals that stain light paint.",
        "**Hard-water spots.** Borewell water leaves mineral deposits when it dries on the paint; see [hard water spot removal](/services/exterior-detailing/hard-water-spot-removal).",
        "**Dust and construction grime.** Fine dust dragged across the paint with a dry cloth is the most common cause of swirl marks.",
        "**Sun fade.** Roofs and bonnets on cars parked outside dull first, because they face the sun all day.",
      ],
      paras: ["Most of what dulls paint here comes from how the car is parked and cleaned, not from driving:"],
    },
    {
      h2: "Wheels, tyres, chrome and trim",
      paras: [
        "Wheels collect the worst dirt on the car: brake dust is hot, metallic and sticky, and it bakes onto alloys if it is left. The package includes a deep clean of the wheels and tyres. At home, use separate brushes and towels for the wheels, so their grit never travels to the paint.",
        "Chrome and black plastic trim fade differently from paint. Chrome spots and dulls; unpainted plastic turns grey in the sun. Both are cleaned and restored as part of the job, so the trim matches the corrected paint instead of making it look older.",
      ],
    },
    {
      h2: "Keeping it that way after the detail",
      bullets: [
        "Park in shade where you can, and away from trees that drop sap.",
        "Remove bird droppings the same day with a soft, wet microfibre cloth; do not scrub them dry.",
        "Never wipe a dusty car with a dry cloth; rinse first.",
        "Wash in the shade, early or late, and dry each panel with a clean microfibre towel.",
        "Use a pH-neutral shampoo; dishwashing liquid strips wax and dries out trim.",
      ],
      paras: ["A corrected finish lasts as long as the wash routine allows:"],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Will the paint be inspected first, and will you tell me what polishing cannot fix?",
        "How much correction is included, and what would a deeper correction add?",
        "What goes on at the end: wax, sealant or a coating?",
        "How long does the car stay in the studio?",
        "Are the wheels, tyres, chrome and trim part of the job, or extra?",
      ],
      paras: [
        "Five questions that make one exterior quote comparable with another. Hazy headlight lenses are a separate job: [headlight restoration](/services/exterior-detailing/headlight-restoration).",
      ],
    },
  ],
  steps: [
    { title: "Inspect", text: "The paint is checked under studio light, so you know what polishing can and cannot fix.", photo: null },
    { title: "Wash and decontaminate", text: "Complete exterior wash, then decontamination to lift bonded tar, iron and grime.", photo: null },
    { title: "Hard water spots", text: "Hard water spot removal treatment where the paint needs it.", photo: null },
    { title: "Correct and polish", text: "Machine paint correction and polishing for swirl marks, light scratches and dullness.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Wheels, chrome and trim", text: "Tyres and wheels deep cleaned; chrome and trim restored.", photo: null },
    { title: "Protect", text: "A protective wax goes on last, for shine and a little protection.", photo: null },
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
    { href: "/services/car-wash", label: "Car wash" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
    { href: "/services/maintenance-plan", label: "Annual maintenance plan" },
    { href: "/guides/hard-water-spot-removal-bangalore", label: "How to protect your car paint from hard water spots in Bangalore" },
  ],
  labels: {
    workH2: "Same car, before and after",
    faqH2: "Exterior detailing questions",
  },
};
