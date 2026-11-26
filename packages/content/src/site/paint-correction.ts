import type { ServiceContent } from "./types.ts";
import { hubFaq } from "./sources.ts";

/**
 * /services/paint-correction. Sources: /faq hub "Where can I get professional paint correction in Bengaluru?"
 * (faq-page.ts:288) and the polishing lines in the ceramic FAQ ("Polishing is paint correction ..."), plus the
 * catalogue's ceramic process ("Paint Correction & Polishing"). The rest is new copy: general paint-correction
 * knowledge, no figures; P91-specific facts not on record are [NEEDS].
 * Family "exterior-detailing" per the plan: one catalogue price, so no figure is shown (owner, 26 Nov).
 * Photos: the red-bonnet rotary polishing frames (attached_assets/gallery/p91-polish-bonnet-*, real P91 footage per
 * the photo catalogue) and the Porsche polishing frame.
 */
export const PAINT_CORRECTION: ServiceContent = {
  family: "exterior-detailing",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/paint-correction", label: "Paint correction" },
  ],
  eyebrow: "Machine polishing · Swirls · Light scratches · Adugodi",
  h1: "Paint correction in Bangalore",
  shortAnswer:
    "Paint correction is machine polishing that levels the clear coat a tiny amount, so swirl marks, light scratches, water-spot etching and dullness disappear instead of being filled or hidden. It is chosen by paint condition, and it is the step that comes before a ceramic coating or PPF. [NEEDS: studio time for paint correction on its own]",
  hero: { src: "/photos/polish-red-bonnet.webp", alt: "Rotary polisher with a foam pad on the glossy bonnet of a red car", width: 720, height: 1280 },
  sections: [
    {
      h2: "What correction actually removes",
      paras: [
        "Most of what makes paint look tired sits in the top layer of the clear coat: fine circular swirl marks from washing and drying, light scratches from bags and fingernails around door handles, hazy dullness from sun and grime, and the rings that hard-water spots etch into the surface.",
        "Polishing cuts that layer down until the damage is gone and the surface is flat again. Light then reflects off it evenly, which is what reads as gloss and depth. Nothing is painted on and nothing is filled, so the result does not wash away.",
      ],
    },
    {
      h2: "Where swirl marks come from",
      paras: [
        "Swirl marks are thousands of tiny scratches, and nearly all of them come from cleaning. A dusty car wiped with a dry cloth, a dirty wash mitt, a towel dropped on the ground and used anyway, automatic washes with brushes: each one drags grit across the paint.",
        "They show most on dark paint in direct sun or under a single bright light, as a web of circles around the light's reflection. That is why correction is judged under strong studio light, not in the shade.",
      ],
    },
    {
      h2: "One stage or more",
      paras: [
        "Correction is done in stages. A cutting stage uses a firmer pad and a more abrasive polish to remove the deeper marks. A finishing stage uses a softer pad and a finer polish to take out the haze the cut leaves behind and bring the gloss up. Lightly marked paint may need only a single polishing stage; neglected paint needs both.",
        "The clear coat is thin, so the aim is always to remove as little as possible to get the result. A good correction stops when the defects are gone, not when the paint is as thin as it can go. [NEEDS: does P91 measure paint thickness before correcting?]",
      ],
    },
    {
      h2: "What correction cannot fix",
      paras: [
        "A scratch that has gone through the clear coat into the colour layer cannot be polished out; polishing can only soften its edges. Stone chips are holes in the paint and need touch-up paint. Peeling or cracked clear coat, rust bubbles and repaint defects such as orange peel or runs are body-shop work.",
        "Heavily damaged paint, peeling clear coat or deep scratches may need repainting instead, which is why an inspection comes before any quote.",
      ],
    },
    {
      h2: "New cars need it too",
      paras: [
        "A new car is not always a perfect car. Cars are washed in dealer yards, moved on transporters and handled through delivery, and the paint can pick up light wash marks and scratches before you ever drive it. They are easiest to see on dark paint under strong light.",
        "If a new car is going to get a ceramic coating or PPF, it is worth having the paint inspected first. A light polish before the protection goes on means the finish you lock in is the best version of it.",
        "Paint is not all the same either. Some factory paints are soft and mark easily but polish quickly; others are hard and take longer to correct. The inspection decides the pads and polishes, not a fixed recipe."
      ],
    },
    {
      h2: "Correction before coating or film",
      paras: [
        "A [ceramic coating](/services/ceramic-coating) or [paint protection film](/services/paint-protection-film) locks in whatever is underneath it. Swirls and light scratches stay visible under film, and a coating over swirled paint makes the swirls shine. Correcting first means the protection keeps a finish worth keeping.",
        "Polishing improves the surface you have, and the coating helps you keep it.",
      ],
    },
    {
      h2: "Keeping corrected paint swirl-free",
      bullets: [
        "Rinse before you touch the paint, so grit is not dragged across it.",
        "Use a clean microfibre mitt and a second bucket of clean water to rinse it.",
        "Dry with a soft microfibre towel, in the shade, panel by panel.",
        "Never wipe dust off with a dry cloth or a duster.",
        "Avoid automatic car washes with brushes.",
      ],
      paras: ["New swirls come back from the same habits that caused the old ones:"],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Will the paint be inspected under strong light first, with the problem areas shown to you?",
        "How many polishing stages are planned, and why?",
        "Which marks will come out completely, and which will only be reduced?",
        "What protection goes on afterwards: wax, a coating or film?",
        "How long does the car stay in the studio?",
      ],
      paras: [],
    },
  ],
  steps: [
    { title: "Inspect", text: "Paint checked under studio light, defects marked, and what can and cannot be removed explained.", photo: null },
    { title: "Wash and decontaminate", text: "Foam wash, then clay bar and iron remover, so no grit is dragged around by the polisher.", photo: null },
    { title: "Cut", text: "A firmer pad and a cutting polish take out the deeper swirls and scratches.", photo: { src: "/photos/polish-red-bonnet-wool.webp", alt: "Rotary polisher with a wool pad on the bonnet of a red car", width: 720, height: 1280 } },
    { title: "Refine", text: "A softer pad and a finer polish remove the haze and bring the gloss up.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { title: "Wipe and protect", text: "Polish residue wiped off, then the agreed protection goes on.", photo: null },
  ],
  beforeAfter: [
    {
      before: { src: "/photos/i20-before-bird-droppings.webp", alt: "Before: orange Hyundai i20 with bird droppings on the bonnet", width: 1400, height: 1867 },
      after: { src: "/photos/i20-after-studio.webp", alt: "After: the same orange Hyundai i20, glossy, in the P91 studio", width: 1400, height: 2488 },
      caption: "Hyundai i20 · bird-dropping marks removed and paint polished",
    },
  ],
  faq: [
    hubFaq("car-detailing", "Where can I get professional paint correction in Bengaluru?"),
    { q: "Is paint correction the same as a polish at a car wash?", a: "No. A quick polish at a wash often uses fillers and glazes that hide swirls for a few washes. Correction removes the marks by levelling the clear coat, so they do not come back when the filler washes off." },
    { q: "Does correction thin the paint?", a: "It removes a very small amount of clear coat, which is why it is done in as few stages as the paint needs. It is not something to repeat every few months." },
    { q: "Will it remove every scratch?", a: "Swirls and light scratches, yes. A scratch that has gone through the clear coat can only be reduced, and stone chips need touch-up paint." },
    { q: "How long does corrected paint stay that way?", a: "As long as the wash routine allows. Gentle washing keeps it; dry-wiping and brush washes put swirls back. A coating or film over it makes it easier to keep." },
    { q: "Can one panel be corrected on its own?", a: "Yes, for example a bonnet with water-spot etching or a door with scratches around the handle. The corrected panel is finished to match the gloss of the panels around it." },
    { q: "Is correction needed before a ceramic coating?", a: "Almost always. A coating locks in the surface under it, so swirls left in the paint stay visible, and shine more, once it is coated." },
  ],
  related: [
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
    { href: "/services/exterior-detailing/headlight-restoration", label: "Headlight restoration" },
    { href: "/gallery", label: "See our work" },
  ],
  labels: {
    stepsH2: "How correction is done",
    workH2: "Same car, before and after",
    faqH2: "Paint correction questions",
  },
};
