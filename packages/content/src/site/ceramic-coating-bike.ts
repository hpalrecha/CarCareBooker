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
  ],
  steps: [
    { title: "Book", text: "Book your appointment online", photo: null },
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
