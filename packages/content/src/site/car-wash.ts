import type { ServiceContent } from "./types.ts";

/**
 * /services/car-wash. New copy (Plan 2b batch B), framed as a hand wash and detailing prep. Facts from the catalogue
 * row premium-car-wash-special: studio time ("{time}") and the includes list, read live. Its description and
 * "why choose" texts carry an exact price and "best value" claims; neither is used. Review: sundeep paruchuru
 * (reviews.ts), word for word. The rest is general washing knowledge, no figures.
 * Photos: attached_assets/gallery/p91-wash-foam-hand and p91-wash-foam-vellfire (real P91 wash bay, photo catalogue).
 */
export const CAR_WASH: ServiceContent = {
  family: "car-wash",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/car-wash", label: "Car wash" },
  ],
  eyebrow: "Foam pre-wash · Hand wash · Adugodi",
  h1: "Car wash in Bangalore",
  shortAnswer:
    "A hand wash done the way detailers wash before they polish or coat: foam first to loosen grit, then a hand wash, wheels, glass inside and out, and a careful dry so no water spots are left behind. It takes {time}.",
  hero: { src: "/photos/wash-foam-macan.webp", alt: "Foam-covered Porsche Macan being hand washed with a mitt in the P91 wash bay", width: 800, height: 882 },
  timeSlug: "premium-car-wash-special",
  catalogueIncludes: {
    slug: "premium-car-wash-special",
    h2: "What the wash includes",
    intro: "Read from the studio's catalogue entry for the car wash:",
  },
  sections: [
    {
      h2: "Why foam comes first",
      paras: [
        "Most scratches from washing happen in the first minute, when a mitt or cloth is pushed across a dusty car and drags the grit with it. A thick foam pre-wash sits on the paint, softens the dirt and carries much of it off when it is rinsed, before anything touches the surface.",
        "Only then does the hand wash start, with the paint already mostly clean. That is the difference between a wash that keeps the paint glossy and one that slowly fills it with swirl marks.",
      ],
    },
    {
      h2: "Hand wash or automatic wash",
      paras: [
        "Automatic washes with spinning brushes are quick, but the brushes carry grit from car to car and leave fine scratches in the clear coat, which show as swirls on dark paint in the sun. Brush washes also wear down ceramic coatings and can catch the edges of PPF.",
        "A hand wash reaches the places a machine misses: door shuts, under the mirrors, around badges and grilles, and the wheels. It costs more time, and it is gentler on the finish.",
      ],
    },
    {
      h2: "Drying is half the job",
      paras: [
        "In Bangalore, how a car is dried matters as much as how it is washed. Borewell water is mineral-heavy, and when it dries on the paint the minerals stay behind as spots that etch the clear coat in the sun.",
        "The car is dried by hand straight after rinsing, so no water is left to evaporate on the panels or glass. If you wash at home, dry each panel as you go, in the shade, with a clean towel.",
      ],
    },
    {
      h2: "After the monsoon, under the car too",
      paras: [
        "Monsoon spray throws mud, grit and standing water at the underside of the car, the wheel arches and the lower edges of doors, where it sits long after the rain stops. The wash includes an undercarriage rinse to clear the loose dirt from underneath.",
        "If the car has been through deep water, a rinse underneath is worth doing soon, not at the next routine wash.",
      ],
    },
    {
      h2: "Between washes",
      paras: [
        "Most damage between washes comes from a few things left too long. Bird droppings and tree sap etch the paint in the sun within a day or two; lift them the same day with water and a soft microfibre cloth.",
        "Dust is the other one. A dusty car wiped with a dry cloth or a feather duster gets fine scratches every time. If the car is dusty and there is no time for a wash, a rinse with plain water does less harm than a wipe."
      ],
    },
    {
      h2: "A wash before detailing",
      paras: [
        "Every detailing job at the studio starts with a wash like this one: paint cannot be decontaminated, polished, coated or filmed until it is clean. Booked on its own, the wash is the regular upkeep between those bigger jobs.",
        "It is a wash, not a detail. It does not remove bonded tar, iron fallout, etched water spots or swirl marks; that is [exterior detailing](/services/exterior-detailing). It does not deep-clean seats and carpets; that is [interior detailing](/services/interior-detailing).",
      ],
    },
    {
      h2: "Washing a coated or filmed car",
      paras: [
        "A car with a ceramic coating or PPF needs exactly this kind of wash: foam first, a soft mitt, a pH-neutral shampoo and a careful dry. Harsh detergents and brush washes are what wear coatings down and lift film edges.",
        "Coated paint also makes the wash quicker, because dirt and water have less to hold on to.",
      ],
    },
    {
      h2: "Washing at home without scratching",
      paras: [
        "If you wash the car yourself between studio washes, these habits keep it scratch-free:"
      ],
      bullets: [
        "Rinse the whole car first to float off loose grit.",
        "Use two buckets: one with shampoo, one with clean water to rinse the mitt between panels.",
        "Wash from the roof down, and do the dirty lower panels and wheels last, with separate tools.",
        "Use a microfibre wash mitt, not a sponge or an old cloth.",
        "Wash in the shade and dry each panel straight away with a clean microfibre towel.",
        "Use a pH-neutral car shampoo, not dishwashing liquid or detergent."
      ],
    },
    {
      h2: "How often to wash",
      paras: [
        "There is no single right number. A car parked outside near a main road, under trees or near construction needs washing more often than one kept in a covered garage. A simple rule: wash before dirt has time to set, and always lift bird droppings and sap the same day, between washes.",
        "If you want washes on a schedule, the [annual maintenance plan](/services/maintenance-plan) spreads them across the year with interior and exterior sessions.",
      ],
    },
  ],
  steps: [
    { title: "Foam pre-wash", text: "Foam applied over the whole car to loosen dirt before anything touches the paint.", photo: { src: "/photos/wash-foam-vellfire.webp", alt: "Foam sprayed along the side of a white Toyota Vellfire in the P91 wash bay", width: 800, height: 1422 } },
    { title: "Hand wash", text: "The car hand washed with a mitt, top to bottom.", photo: { src: "/photos/wash-foam-macan.webp", alt: "Foam-covered Porsche Macan being hand washed with a mitt", width: 800, height: 882 } },
    { title: "Wheels and underside", text: "Wheels and tyres cleaned, and an undercarriage rinse.", photo: null },
    { title: "Dry", text: "Dried by hand so no water spots are left.", photo: null },
    { title: "Glass and finish", text: "Windows cleaned inside and out, and the finishing touches from the package list.", photo: null },
  ],
  reviewNames: ["sundeep paruchuru"],
  faq: [
    { q: "How is this different from a roadside wash?", a: "Foam goes on first to loosen grit, the car is washed by hand with a mitt rather than a cloth, and it is dried by hand so water spots do not form." },
    { q: "Is it safe for a ceramic-coated or PPF car?", a: "Yes. A gentle hand wash with a pH-neutral shampoo is the wash coatings and film are meant to get." },
    { q: "Does it clean the inside?", a: "The windows are cleaned inside and out. Seats, carpets and the dashboard are interior detailing." },
    { q: "Will it remove water spots or swirl marks?", a: "Fresh, loose deposits wash off. Etched water spots and swirl marks need polishing, which is exterior detailing." },
    { q: "Should I wash the car after rain?", a: "Rain itself is fairly clean, but road spray and dust turn into a muddy film as it dries, and dried rain leaves spots. A rinse and a careful dry soon after a wet spell keeps that film from setting." },
    { q: "Is the wash safe for matte paint or matte film?", a: "Ask before you book. Matte finishes must not be waxed, so tell us if the car is matte, so the wash can be planned without wax." },
  ],
  related: [
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
    { href: "/services/paint-correction", label: "Paint correction" },
    { href: "/gallery", label: "See our work" },
  ],
  labels: {
    stepsH2: "How the car is washed",
    workH2: "In the wash bay",
    faqH2: "Car wash questions",
  },
};
