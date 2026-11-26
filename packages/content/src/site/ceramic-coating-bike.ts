import type { ServiceContent } from "./types.ts";

/**
 * /services/ceramic-coating/bike. Sources (copied verbatim; neither module can be imported by plain Node):
 * - LANDING_PAGES[1] "/ceramic-coating/bike" (landing-pages.ts:235): eyebrow, lede, 5 benefits, 6 steps, related.
 * - bikeLandingFaq() (bike-landing-copy.ts:28): all 7 FAQs. The timing answer is CERAMIC_TIMING's bike entry
 *   (ceramic-timing.ts:21). The catalogue row's own FAQ ("100% safe", "permanent bond") is not used.
 * No real motorcycle photo exists (photo catalogue: the bike promo image is an AI render), so there is no hero photo.
 */
export const CERAMIC_BIKE: ServiceContent = {
  family: "ceramic-bike",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/services/ceramic-coating/bike", label: "Bike ceramic coating" },
  ],
  eyebrow: "Ceramic coating · Motorcycles · Adugodi",
  h1: "Bike ceramic coating in Bangalore",
  shortAnswer:
    "A nano-ceramic layer over the tank, fairings and painted panels, so fuel splashes, road grime and chain fling wipe off instead of settling in. At P91 the 1-year bike coating costs {range}. The bike stays approx. 36–48 hours in the studio.",
  hero: null,
  rangeNote: "The final price depends on the vehicle size, the paint condition, the preparation needed and the coating you choose.",
  sections: [
    {
      h2: "Why coating a motorcycle is a different job",
      paras: [],
      bullets: [
        "**The tank takes fuel, not just weather.** Petrol runs down the tank flank at almost every fill. On an uncoated finish that means repeated wiping exactly where your knees and the filler cap already sit. A coated tank sheds a splash instead of holding it against the paint.",
        "**Chain fling and road grime release more easily.** Lube thrown off the chain lands on the swingarm, rear panels and wheel. It comes off a coated surface with far less scrubbing, and scrubbing is what puts marks into paint.",
        "**Most bikes live outdoors.** A motorcycle rarely gets a garage. That means more sun on the tank, more dew, and more of the mineral-heavy water this city runs on drying on the surface between rides.",
        "**Complex surfaces, coated by hand.** Fairings, mudguards, tank flanks and side panels are curved, vented and interrupted by fasteners. There is no large flat area to work across, so the whole job is done panel by panel by hand.",
        "**Gloss that survives the wash routine.** Bikes get cleaned more often than cars and usually with less equipment. Making each of those washes gentler is most of what protects the finish over a year.",
      ],
    },
    // ── New sections (owner, 26 Nov: longer pages). ──
    {
      // Factors from the approved ceramic FAQ answer and the bike FAQ ("matte or satin paint, a wrap or a repaint").
      h2: "What moves the price for a motorcycle",
      paras: ["Motorcycles vary far more than cars in how much painted surface they carry. What changes the work:"],
      bullets: [
        "**How much bodywork the bike has.** A fully faired bike has far more painted panel than a naked bike or a scooter-style body.",
        "**Paint condition.** Swirl marks and light scratches on the tank are polished out before coating, and a tank that has been wiped with a dusty cloth for years needs more of it.",
        "**The finish.** Matte or satin paint, a wrap or a repaint changes the answer, so ask before you book.",
      ],
    },
    {
      // Bike FAQ and catalogue maintenance answer (pH-neutral bike shampoo, microfibre, no harsh brushes, wipe off petrol
      // and chain lube). Keeping pressure jets off bearings and electrics is general motorcycle care.
      h2: "Washing a coated bike, step by step",
      paras: ["A coated bike is easier to clean, but the coating lasts longest when the washes are gentle:"],
      bullets: [
        "Rinse loose dust and grit off first, so you are not rubbing it into the paint.",
        "Wash with a pH-neutral bike shampoo and a clean microfibre mitt, top to bottom.",
        "Keep a pressure washer well away from wheel bearings, the chain, switches and electrical connectors.",
        "Dry with a clean microfibre towel instead of leaving water to dry on the tank.",
        "Wipe off petrol splashes and chain lube when you see them, not at the next wash.",
        "Skip automatic washes with harsh brushes, and do not use a household degreaser on painted panels.",
      ],
    },
    {
      // Bike FAQ: the coating "will not stop deep scratches, stone chips or damage from a fall ... not armour".
      h2: "Coating or paint protection film for a bike?",
      paras: [
        "The coating is a gloss and easy-cleaning layer. It will not stop deep scratches, stone chips or damage from a fall.",
        "If the worry is the tank getting scuffed by jackets, bags and knees, or chips on the front fairing, that is a job for [paint protection film for bikes](/services/paint-protection-film/bike). Film can go on the parts that take contact, with the coating over the rest.",
      ],
    },
    {
      // Catalogue bike row: "made to last 12 months with proper care", "degrades gradually", reapplication after 12 months.
      h2: "How long it lasts",
      paras: [
        "The 1-year coating is made to last about 12 months with proper care. It wears down gradually rather than stopping on one day, so the change is slow: water beads less tightly, and dirt starts to cling to the tank again.",
        "When water sits in flat sheets on a clean tank instead of beading, it is time for a fresh coat. A new coat brings back full protection and gloss, and the paint underneath is in the condition the coating kept it in.",
      ],
    },
    {
      h2: "What to ask before you book",
      paras: ["Five questions that make the job clear on both sides:"],
      bullets: [
        "Which parts of the bike are coated: tank, fairings and painted panels, or more.",
        "Whether your paint finish (gloss, matte, wrapped or repainted) suits the coating.",
        "How long the bike stays in the studio, so you can plan without it.",
        "What comes with it: the package lists a care kit and a maintenance guide.",
        "The warranty terms, in writing at handover.",
      ],
    },
  ],
  catalogueIncludes: {
    slug: "1-year-bike-ceramic-coating",
    h2: "What the 1-year bike package lists",
    intro: "Read from the studio's catalogue entry for the bike coating:",
  },
  steps: [
    { title: "Book", text: "Book on WhatsApp or call", photo: null },
    { title: "Bring the bike", text: "Bring the bike to our Adugodi studio", photo: null },
    { title: "Decontaminate", text: "Full decontamination wash, including the areas behind the fairings", photo: null },
    { title: "Correct", text: "Paint correction where the finish needs it", photo: null },
    { title: "Coat", text: "Coating applied by hand across tank, fairings and painted panels", photo: null },
    { title: "Cure and inspect", text: "Controlled curing and a final inspection before handover", photo: null },
  ],
  faq: [
    { q: "Which parts of my motorcycle are coated?", a: "The fuel tank, the fairings and the painted body panels. For anything else, such as alloy wheels or plastics, please ask us before you book: call +91 74066 19191." },
    { q: "Can any motorcycle be coated?", a: "This service is for painted bikes. If your bike has matte or satin paint, a wrap or a repaint, please ask us before you book, because the answer can depend on the finish: call or WhatsApp +91 74066 19191." },
    { q: "How long does the application process take?", a: "Approx. 36–48 hours in the studio." },
    { q: "How do I wash a coated bike?", a: "Use a pH-neutral bike shampoo and a clean microfibre towel, and avoid automatic washes with harsh brushes. Wipe off petrol splashes and chain lube when you see them instead of leaving them on the paint." },
    { q: "Will the coating stop scratches and chips?", a: "It makes washing gentler and reduces fine wash marks, but it will not stop deep scratches, stone chips or damage from a fall. It is a gloss and easy-cleaning layer, not armour." },
    { q: "How is this different from waxing my bike?", a: "Wax sits on top of the paint and wears off within weeks, so it has to be redone often. This is a 1-year coating: it is made to last about 12 months with proper care." },
    { q: "What happens after 12 months?", a: "You can book a fresh coat. The coating wears down gradually rather than stopping on one day, but a new coat brings back full protection and gloss." },
  ],
  related: [
    { href: "/services/ceramic-coating", label: "Ceramic coating for cars" },
    { href: "/brands/nasiol", label: "Nasiol nano-ceramic coating" },
    { href: "/gallery", label: "See our work" },
    { href: "/contact", label: "Visit the studio in Adugodi" },
    { href: "/faq", label: "PPF and ceramic coating FAQs" },
  ],
  labels: {
    rangeLabel: "1-year coating for motorcycles",
    stepsH2: "How the job is done, step by step",
    faqH2: "Bike ceramic coating questions",
    cta: { title: "Bring the bike to the studio", body: "Visit the studio in Adugodi, near Koramangala. Open daily." },
  },
};
