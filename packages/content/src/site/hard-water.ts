import type { ServiceContent } from "./types.ts";
import { hubFaq } from "./sources.ts";

/**
 * /services/exterior-detailing/hard-water-spot-removal. Sources:
 * - Blog "hard-water-spot-removal-bangalore" (blog-posts.ts:383): lede and the sections "Why borewell water is the
 *   problem", "The habit that prevents it" and "When it needs correction", copied verbatim (blog-posts.ts cannot be
 *   imported by plain Node), links remapped. These moved here from the exterior page (batch A).
 * - The blog's "Stopping it coming back" said a coating "is what stops it coming back"; the approved FAQ says it
 *   "cannot fully prevent hard water spotting". The FAQ wording is used.
 * - Glass: catalogue row windshield-glass-polishing ("Removes water spots and light scratches").
 * - Studio time: catalogue row exterior-detailing-hard-water-new ("{time}").
 * New sections: where spots collect, home remedies to avoid, glass, what to ask. No photo: none of a hard-water job exists.
 */
export const HARD_WATER: ServiceContent = {
  family: "exterior-detailing",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
  ],
  eyebrow: "Borewell water spots · Decontamination · Polishing · Adugodi",
  h1: "Hard water spot removal in Bangalore",
  shortAnswer:
    "A water spot is a mineral deposit left as the water evaporates, and in direct sun it starts cutting into your clearcoat within days. Fresh deposits come off with a decontamination wash; spots that have etched in need machine polishing. The car stays {time} in the studio.",
  hero: null,
  timeSlug: "exterior-detailing-hard-water-new",
  sections: [
    {
      h2: "Why borewell water is the problem",
      paras: [
        "When borewell water dries on a panel, the water leaves and the calcium and magnesium stay behind. What is left is a concentrated alkaline deposit sitting directly on the clearcoat, and Bangalore's sun bakes it in.",
        "Caught the same day, it wipes off. Left for a few weeks, it becomes a crater you can feel with a fingernail, and no amount of washing will remove it.",
      ],
    },
    {
      h2: "Where the spots collect",
      paras: [
        "Hard-water spots gather wherever water sits and dries slowly: the roof and bonnet, which are flat and face the sun; the boot lid; the tops of doors under the window line; the glass; and around door handles, mirrors and badges, where drips run down and stop.",
        "Water from the building can be the source as much as rain. Cars washed every morning with tank or borewell water, parked under a dripping balcony or beside a garden sprinkler, collect spots fastest.",
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
        "Keep a spare microfibre towel in the car for water that drips from trees, balconies and air-conditioning units",
      ],
    },
    {
      h2: "When it needs correction",
      paras: [
        "**Surface deposits.** If the mark sits on top of the clearcoat, a decontamination wash and clay bar lifts it. This is cleaning, and it is quick.",
        "**Etched spots.** If you can feel the edge of the mark, the mineral has eaten into the clearcoat. That needs machine polishing to level the surface around it, which is exterior detailing with hard water spot removal rather than a wash. See [paint correction](/services/paint-correction) for how polishing works.",
      ],
    },
    {
      h2: "Water spots on PPF and coated cars",
      paras: [
        "Film and coatings get water spots too. Film has its own surface, and an uncoated film holds water spots just like paint does. On film the deposits are treated gently: film is not machine polished the way paint is.",
        "On a ceramic-coated car the minerals dry on top of the coating instead of the clearcoat, so fresh spots lift more easily. Left for weeks they can still mark the coating itself, and a coated car still needs the same drying habit as any other."
      ],
    },
    {
      h2: "Home remedies to avoid",
      paras: ["Spots are tempting to scrub at, and most quick fixes make them worse:"],
      bullets: [
        "**Scrubbing with a dry or dusty cloth** grinds the minerals across the paint and adds swirl marks around each spot.",
        "**Strong acids, toilet cleaners or descalers** dissolve minerals but can stain trim, chrome and glass seals, and some etch paint themselves.",
        "**Abrasive pastes and kitchen scourers** remove the spot along with the gloss around it.",
        "**Leaving it for the next wash** gives the sun more time to bake it into the clearcoat.",
      ],
    },
    {
      h2: "Spots on the glass",
      paras: [
        "Glass collects hard-water spots too, and on a windshield they scatter headlight glare at night. Glass is harder than paint, but etched spots still need polishing to remove: windshield glass polishing removes water spots and light scratches.",
        "Once the glass is clean, a [windshield glass coating](/services/sun-control-film/windshield-glass-coating) makes water bead and run off, so less of it is left to dry on the screen.",
      ],
    },
    {
      h2: "Stopping it coming back",
      paras: [
        "A [ceramic coating](/services/ceramic-coating) can make some mineral deposits easier to clean, but it cannot fully prevent hard water spotting. Drying promptly, washing properly and regular maintenance still matter, especially if your car meets mineral-rich water.",
        "What a coating does give you is time: water beads and rolls off instead of sitting in a flat puddle, so there is less left to dry, and what does dry is easier to lift before it etches.",
      ],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Are the spots on top of the paint, or etched in? Ask to be shown.",
        "Will etched spots be polished, and how many polishing stages are planned?",
        "Is the glass included, or is that glass polishing on its own?",
        "What protection goes on afterwards?",
      ],
      paras: [],
    },
  ],
  steps: [
    { title: "Inspect", text: "Spots checked by touch and under studio light: on top of the paint, or etched in.", photo: null },
    { title: "Wash and decontaminate", text: "Complete exterior wash and decontamination to lift surface deposits.", photo: null },
    { title: "Treat the spots", text: "Hard water spot removal treatment on the affected panels.", photo: null },
    { title: "Polish the etching", text: "Paint correction and polishing where the minerals have eaten into the clearcoat.", photo: { src: "/photos/polish-red-bonnet.webp", alt: "Rotary polisher with a foam pad on the glossy bonnet of a red car", width: 720, height: 1280 } },
    { title: "Protect", text: "Protective wax to finish, or a ceramic coating if booked.", photo: null },
  ],
  faq: [
    hubFaq("ceramic-coating", "Can ceramic coating prevent hard water stains?"),
    { q: "How do I know if a spot has etched?", a: "Run a fingernail over it after washing. If you can feel the edge, or it stays visible on a clean, dry panel, it has etched into the clearcoat and needs polishing." },
    { q: "Can I remove hard water spots myself?", a: "Fresh spots, yes: wash in the shade and dry the car straight away. Etched spots need machine polishing, and scrubbing at them by hand adds swirl marks." },
    { q: "Does a car cover help?", a: "It keeps sprinkler water and drips off, but a cover put on a dusty or wet car can scratch the paint or trap moisture. Use it only on a clean, dry car." },
    { q: "Are spots on a black car worse?", a: "They are more visible, and dark paint gets hotter in the sun, which bakes the minerals in faster. The removal is the same." },
    { q: "Will the spots come back after removal?", a: "They will if the car keeps drying wet in the sun. Removal fixes the damage that is there; drying the car properly, in the shade, is what stops new spots forming." },
    { q: "Is it safe to use vinegar on water spots?", a: "Diluted vinegar can loosen fresh mineral deposits on glass, but it is acidic and can harm trim, seals and some coatings if it is left on or used strong. It does nothing for spots that have etched into the paint." },
  ],
  related: [
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/paint-correction", label: "Paint correction" },
    { href: "/services/car-wash", label: "Car wash" },
    { href: "/guides/hard-water-spot-removal-bangalore", label: "How to protect your car paint from hard water spots in Bangalore" },
  ],
  labels: {
    stepsH2: "How the spots come off",
    faqH2: "Hard water questions",
  },
};
