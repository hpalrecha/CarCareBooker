import type { ServiceContent } from "./types.ts";

/**
 * /services/exterior-detailing/headlight-restoration. New copy (Plan 2b batch B). Facts from the catalogue row
 * headlight-restoration-both: studio time ("{time}") and the includes list, read live (its "6-month warranty" line is
 * dropped by the template: non-PPF pages use the handover warranty line). The rest is general headlight knowledge,
 * no figures. Photos: attached_assets/gallery/p91-headlight-polish-detail and p91-headlight-restored (real P91,
 * photo catalogue), copied to apps/web/public/photos.
 */
export const HEADLIGHT: ServiceContent = {
  family: "headlight-restoration",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/exterior-detailing/headlight-restoration", label: "Headlight restoration" },
  ],
  eyebrow: "Both headlights · Deoxidation · UV coat · Adugodi",
  h1: "Headlight restoration in Bangalore",
  shortAnswer:
    "Headlight restoration removes the yellow, cloudy, oxidised layer from both headlight lenses and seals them with a UV protection coating, so they are clear again and throw more light onto the road at night. The job takes {time} in the studio.",
  hero: { src: "/photos/headlight-restored-jetta.webp", alt: "Clear, restored headlight and glossy bonnet of a champagne Volkswagen Jetta in the P91 studio", width: 800, height: 1422 },
  timeSlug: "headlight-restoration-both",
  catalogueIncludes: {
    slug: "headlight-restoration-both",
    h2: "What the job includes",
    intro: "Read from the studio's catalogue entry for headlight restoration, both lights:",
  },
  sections: [
    {
      h2: "Why headlights turn yellow and cloudy",
      paras: [
        "Modern headlight lenses are polycarbonate plastic, not glass. They are light and hard to break, but polycarbonate breaks down in sunlight, so it leaves the factory with a thin protective coating on the outside.",
        "Sun, heat, road grit and harsh cleaning wear that coating away over the years. Once it is gone, the plastic itself starts to oxidise: first a faint haze, then a yellow, chalky surface that scatters light instead of letting it through. Cars parked in the open, facing the sun, go cloudy first.",
      ],
    },
    {
      h2: "Why it is worth fixing",
      paras: [
        "Cloudy lenses cut how much light reaches the road, and scatter what does get through into glare for oncoming drivers. At night on poorly lit roads, or in monsoon rain, that difference is easy to feel.",
        "They also age the whole car. A clean, polished car with yellow headlights looks older than it is, and headlights are one of the first things a buyer notices when you sell.",
      ],
    },
    {
      h2: "What restoration does",
      paras: [
        "The oxidised layer is taken off, not covered up. The lens is cleaned and masked so the paint around it is protected, then the damaged surface is removed in progressively finer steps until the plastic underneath is clear, and polished back to full clarity.",
        "Because the factory coating is gone by then, the lens is not left bare: a UV protection coating goes on last, to slow the yellowing down. Without that step a restored lens turns cloudy again quickly.",
      ],
    },
    {
      h2: "Signs your headlights need it",
      paras: [
        "Yellowing creeps in slowly, so it is easy to miss. Look for:"
      ],
      bullets: [
        "A yellow or brown tint across the lens, often worst on the top half, which faces the sun.",
        "A chalky, rough feel when you run a finger over the clean lens.",
        "A beam that looks weaker or more scattered on a wall than the lights of other cars.",
        "One headlight clearer than the other, after a lens has been replaced on one side."
      ],
    },
    {
      h2: "What it cannot fix",
      paras: ["Restoration works on the outside surface of the lens. It does not help with:"],
      bullets: [
        "Condensation or fogging **inside** the headlight, which means a seal has failed and water is getting in.",
        "Burnt, peeling or discoloured reflectors inside the unit.",
        "Cracks, chips that go deep into the lens, or a broken housing.",
        "Weak bulbs or misaligned beams, which are a workshop job.",
      ],
    },
    {
      h2: "Why toothpaste and quick fixes do not last",
      paras: [
        "Home remedies such as toothpaste, or a quick rub with polish, can make a lens look clearer for a short while by removing a little of the haze. They do not remove the full oxidised layer, and they leave the plastic bare with no UV protection, so the yellowing comes back fast, often worse than before.",
        "Aggressive sanding by hand without the right steps can also leave scratches that make the lens look worse than when you started. Once a lens has been sanded badly, it takes more work, not less, to bring it back.",
      ],
    },
    {
      h2: "Keeping restored headlights clear",
      bullets: [
        "Park in shade, or nose-away from the afternoon sun, where you can.",
        "Wash the lenses with car shampoo and a soft mitt; no abrasive cleaners or rough sponges.",
        "Do not scrape off dried bugs or bird droppings; soak them and wipe gently.",
        "Ask about [PPF over the headlights](/services/paint-protection-film/front) if you drive a lot of highway kilometres: film takes the stone pitting that slowly frosts a lens.",
      ],
      paras: ["The UV coating slows yellowing; these habits help it last:"],
    },
    {
      h2: "Fog lamps and tail lamps",
      paras: [
        "Fog lamp lenses are often polycarbonate too and can haze the same way. Tail lamps are usually a different, more UV-resistant plastic and rarely yellow, though they can scratch and dull. [NEEDS: does P91 restore fog lamp and tail lamp lenses?]",
        "Headlight restoration also pairs well with an [exterior detail](/services/exterior-detailing): clear lenses on a freshly polished car finish the job, rather than leaving the front looking older than the rest."
      ],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Are both headlights included?",
        "Is a UV protection coating applied at the end, not just polish?",
        "Is there any moisture inside the units that restoration will not fix?",
        "How long does the car need to stay?",
      ],
      paras: [],
    },
  ],
  steps: [
    { title: "Clean and mask", text: "Both lenses cleaned, and the paint around them masked.", photo: null },
    { title: "Remove the oxidation", text: "The yellow, oxidised layer taken off with professional grade restoration compounds.", photo: { src: "/photos/headlight-polish-lens.webp", alt: "Gloved hand polishing a hazy headlight lens", width: 800, height: 1422 } },
    { title: "Polish to clear", text: "The lens polished back to clarity.", photo: null },
    { title: "UV coat", text: "A UV protection coating applied to slow future yellowing.", photo: null },
    { title: "Check", text: "Both lights checked side by side before handover.", photo: { src: "/photos/headlight-restored-jetta.webp", alt: "Clear, restored headlight of a champagne Volkswagen Jetta", width: 800, height: 1422 } },
  ],
  faq: [
    { q: "How long do restored headlights stay clear?", a: "It depends on sun exposure and how the car is parked and washed. The UV protection coating slows the yellowing down; a car parked in the open will need it again sooner than one kept in shade. [NEEDS: how long P91's UV coat is expected to last]" },
    { q: "Should I restore or replace the headlights?", a: "Restore when the outside of the lens is cloudy and the inside of the unit is clean and dry. Replace when the reflectors inside are damaged, the lens is cracked, or water keeps getting in." },
    { q: "Will it fix condensation inside the lamp?", a: "No. Moisture inside means a seal has failed, and that is a repair for the headlamp unit, not the lens surface." },
    { q: "Can you do just one headlight?", a: "The package covers both lights, so they match. [NEEDS: is a single headlight offered?]" },
    { q: "Does it help with the vehicle fitness test or police checks?", a: "Clear lenses help the lights do their job, but restoration does not change bulbs or beam alignment. If the lights fail a check for those reasons, they need a workshop." },
    { q: "Is the UV coating the same as a ceramic coating?", a: "No. It is a protective coat for the lens plastic, put on to replace the factory UV layer that wore away. It slows the yellowing; it is not a paint coating." },
    { q: "Can film go over restored headlights?", a: "Yes. Clear PPF over the lenses takes the stone pitting that slowly frosts them, and is often fitted as part of a front PPF job." },
    { q: "Can I drive the car straight after?", a: "Ask at handover how long the UV coating needs before the car is washed or driven in rain, so it can set properly." },
  ],
  related: [
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/paint-correction", label: "Paint correction" },
    { href: "/services/sun-control-film/windshield-glass-coating", label: "Windshield glass coating" },
    { href: "/services/car-wash", label: "Car wash" },
  ],
  labels: {
    workH2: "Restored at the studio",
    faqH2: "Headlight restoration questions",
  },
};
