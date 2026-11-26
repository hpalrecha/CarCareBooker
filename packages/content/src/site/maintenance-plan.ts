import type { ServiceContent } from "./types.ts";

/**
 * /services/maintenance-plan. New copy around the catalogue row annual-maintenance-package: what the plan includes
 * (visits, schedule, validity) is read live from its whatIncluded list and never typed here, per the plan.
 * The rest is general car-care knowledge and links to the service pages for each visit type. P91-specific terms not
 * on record (how visits are booked, transfer, what happens to unused visits) are [NEEDS].
 */
export const MAINTENANCE_PLAN: ServiceContent = {
  family: "maintenance-plan",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/maintenance-plan", label: "Annual maintenance plan" },
  ],
  eyebrow: "Washes · Interior · Exterior · One year · Adugodi",
  h1: "Annual car maintenance plan in Bangalore",
  shortAnswer:
    "The annual maintenance plan is one booking for a year of care: car washes, interior rejuvenation and exterior restoration, spread across the year. The exact visits and schedule are listed below, from the studio's catalogue.",
  hero: { src: "/photos/wash-foam-vellfire.webp", alt: "Foam sprayed along the side of a white Toyota Vellfire in the P91 wash bay", width: 800, height: 1422 },
  catalogueIncludes: {
    slug: "annual-maintenance-package",
    h2: "What the plan includes",
    intro: "Read from the studio's catalogue entry for the annual maintenance package:",
  },
  sections: [
    {
      h2: "Who the plan suits",
      paras: [
        "Owners who want the car kept clean and cared for without remembering to book each visit. It suits a car that is used every day and parked in the open, where dust, rain and hard water build up week after week, and a car with a ceramic coating or PPF, where regular, gentle washing is what keeps the protection working.",
        "It is also a simple way to keep a car presentable through a year of ownership before it is sold, with the interior and exterior looked after on a schedule instead of all at once at the end.",
      ],
    },
    {
      h2: "Why regular care beats one big clean",
      paras: [
        "Dirt does most of its damage while it sits. Dust ground in by dry wiping turns into swirl marks; bird droppings and tree sap etch the clear coat in the sun; borewell water spots bake in within days. Inside, spills soak into foam and damp mats start to smell.",
        "Washed and cleaned on a schedule, none of it gets the time to set. Each visit is quicker, the paint needs less polishing over the years, and the cabin never reaches the point where it needs a deep rescue.",
      ],
    },
    {
      h2: "What each kind of visit is",
      paras: [
        "**Car washes.** A hand wash with foam pre-wash, wheels, glass and drying, as described on the [car wash](/services/car-wash) page.",
        "**Interior rejuvenation.** Vacuum, fabric and upholstery cleaning, leather care, dashboard and vents, as on the [interior detailing](/services/interior-detailing) page.",
        "**Exterior restoration.** Decontamination, hard-water spot removal, polishing and protection, as on the [exterior detailing](/services/exterior-detailing) page.",
        "[NEEDS: confirm each plan visit is the same job as the service page it links to]",
      ],
    },
    {
      h2: "Through the year in Bangalore",
      paras: [
        "The seasons change what the car needs. In the dry months, dust settles on the paint every day and the sun is hardest on the dashboard and on water spots. Through the monsoon, road spray coats the lower panels and wheels, and damp gets into carpets and mats. After the monsoon is the right time for an interior session and an exterior session to clear what the rain left behind.",
        "Spreading the visits across the year means each season is dealt with as it happens. [NEEDS: does P91 schedule the visits, or does the owner choose the dates?]",
      ],
    },
    {
      h2: "A plan or a visit at a time",
      paras: [
        "Booking each visit when you remember gives you flexibility, but in practice washes slip, the interior waits until it smells and the exterior waits until the paint is already marked.",
        "The plan turns the same care into a schedule booked once. It suits owners who would rather not track it, and cars that are used hard enough to need the care on time."
      ],
    },
    {
      h2: "Between visits",
      bullets: [
        "Never wipe dust off the paint with a dry cloth; rinse first.",
        "Lift bird droppings the same day with a wet microfibre cloth.",
        "Dry the car in the shade after rain or a wash, so hard-water spots cannot form.",
        "Take wet floor mats out to dry.",
        "Use a windscreen sunshade when parked in the open.",
      ],
      paras: ["Small habits make every visit go further:"],
    },
    {
      h2: "For coated and PPF cars",
      paras: [
        "Ceramic coatings and paint protection film last longest on cars that are washed gently and regularly. The two things that shorten their life most are harsh washes and dirt left to sit: brush washes wear coatings down and catch film edges, and bird droppings, sap and hard-water spots baked on in the sun mark the surface.",
        "A plan of hand washes with interior and exterior sessions keeps both in check, so the protection you paid for keeps doing its job through the year."
      ],
    },
    {
      h2: "What the plan does not include",
      paras: [
        "The plan covers the visits listed above. Protection work such as [ceramic coating](/services/ceramic-coating), [paint protection film](/services/paint-protection-film), sun control film and headlight restoration are separate services, booked and priced on their own. A coated or filmed car is a good fit for the plan, because regular gentle washing is what keeps the protection performing.",
      ],
    },
    {
      h2: "What to tell us when you sign up",
      paras: [
        "A few details help plan the year around your car:"
      ],
      bullets: [
        "The make and model, and whether it has a ceramic coating or PPF.",
        "Where it is parked: covered, open, under trees, near a main road.",
        "How it is used: daily commute, highway trips, school runs, pets in the cabin.",
        "Anything already bothering you: water spots, a smell in the cabin, cloudy headlights."
      ],
    },
    {
      h2: "Questions to settle before you buy",
      bullets: [
        "How are the visits booked? [NEEDS: booking process for plan visits]",
        "What happens to a visit that is not used before the year ends? [NEEDS: policy on unused visits]",
        "Can the plan move to another car or a new owner? [NEEDS: transfer policy]",
        "Is pickup and drop available for the visits? Pickup and drop is on request, confirmed on a call.",
      ],
      paras: [],
    },
  ],
  faq: [
    { q: "What does the plan include?", a: "The visits and schedule listed on this page, read from the studio's catalogue: car washes, interior rejuvenation and exterior restoration." },
    { q: "Is it worth it for a new car?", a: "Yes, if the car is used daily and parked outside. Regular, gentle care from the start keeps the factory finish and the cabin in good shape, instead of correcting damage later." },
    { q: "Can I add a ceramic coating or PPF?", a: "Yes, as separate services. A coated or filmed car is easier to wash, and the plan's regular washes help the protection last." },
    { q: "Do you offer pickup and drop?", a: "On request. Call or WhatsApp us and we confirm pickup and drop for your area on the call." },
    { q: "What if the car needs more than the plan covers?", a: "Extra work, such as paint correction, a coating or headlight restoration, is booked and priced on its own. The plan's visits are a good moment to spot it early." },
    { q: "Does the plan help when I sell the car?", a: "A car cared for on a schedule through the year is cleaner inside and out, with fewer marks to explain, which makes it more presentable to buyers. It does not guarantee a selling price." },
    { q: "Can the plan start any time of year?", a: "The plan is a year from when it starts. Starting before or after the monsoon only changes which visit comes first. [NEEDS: confirm the plan can start in any month]" },
  ],
  related: [
    { href: "/services/exterior-detailing/headlight-restoration", label: "Headlight restoration" },
    { href: "/services/sun-control-film", label: "Sun control film" },
    { href: "/gallery", label: "See our work" },
    { href: "/services", label: "All services" },
  ],
  labels: {
    faqH2: "Maintenance plan questions",
    cta: { title: "Sign up on WhatsApp", body: "Send us your car's make and model and we set up the plan. The studio is in Adugodi, near Koramangala." },
  },
};
