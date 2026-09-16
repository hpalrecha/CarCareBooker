/**
 * P91 Protection Challenge — the questions, and the catalogue row each answer set points at.
 *
 * WHAT THIS FILE IS NOT: a price list. It holds catalogue SLUGS and nothing else. The price
 * shown at the end is resolved from GET /api/services through resolveCataloguePrice(), the
 * same resolver /ppf-ceramic-coating uses, so the challenge cannot advertise a figure the
 * booking flow will not charge. There is deliberately no fallback amount anywhere here.
 *
 * WHY A SEPARATE MODULE: the recommendation is the part that can silently go wrong — a
 * customer told "SUV PPF" while the booking carries the hatchback row. Keeping it pure and
 * free of React makes it directly testable (tests/protection-challenge.test.mjs).
 *
 * No runtime dependencies, so the test can load it by stripping type annotations.
 */

export type Vehicle = "car" | "bike";

/** Answer ids. Stored, sent to the server and asserted in tests, so they are stable strings. */
export const VEHICLES = [
  { id: "car", label: "Car" },
  { id: "bike", label: "Bike" },
];

export const CATEGORIES = {
  car: [
    { id: "hatchback", label: "Hatchback", hint: "Swift, i20, Baleno" },
    { id: "sedan", label: "Sedan", hint: "City, Verna, Ciaz" },
    { id: "suv", label: "SUV", hint: "Creta, Seltos, XUV700" },
  ],
  bike: [{ id: "motorcycle", label: "Motorcycle", hint: "Any make" }],
};

export const GOALS = [
  { id: "protect-paint", label: "Protect the paint", hint: "Stone chips and road debris" },
  { id: "scratches", label: "Protect against scratches", hint: "Car parks and daily use" },
  { id: "gloss", label: "Get a glossy finish", hint: "Deeper, sharper reflection" },
  { id: "maintenance", label: "Make maintenance easier", hint: "Faster washes, less effort" },
];

export const FINISHES = [
  { id: "glossy", label: "Deep gloss", hint: "Wet-look shine" },
  { id: "factory", label: "Factory look", hint: "Keep it as it left the showroom" },
];

/**
 * The catalogue rows this challenge can recommend. Slugs only — every one of these is an
 * active service in GET /api/services, checked by the live-catalogue test.
 */
export const CHALLENGE_SLUGS = {
  ppfHatchback: "ppf-hatchback",
  ppfSedan: "ppf-sedan",
  ppfSuv: "ppf-suv",
  ceramicCar: "1-year-ceramic-coating",
  ceramicBike: "1-year-bike-ceramic-coating",
};

export interface Answers {
  vehicle: string;
  category: string;
  goal: string;
  finish: string;
}

export interface Recommendation {
  /** Catalogue slug, or null when no catalogue service covers the answers (bike PPF). */
  slug: string | null;
  /** Lead classification the server accepts: "ppf" | "ceramic" | "both". */
  serviceInterest: string;
  /** Narrow, because BookingModal's vehicleContext accepts exactly these two. */
  vehicleType: Vehicle;
  vehicleCategory: string;
  headline: string;
  /** Plain, supportable reasons. No statistics, no ratings, no invented claims. */
  why: string[];
}

/** Paint protection is what the customer asked for when the goal is physical damage. */
function wantsFilm(goal: string): boolean {
  return goal === "protect-paint" || goal === "scratches";
}

/**
 * The catalogue row for a set of answers.
 *
 * Deterministic on vehicle + category + goal. The finish preference deliberately does NOT
 * change which service is recommended — it is recorded with the lead so the studio knows
 * what the customer is after, but inventing a different recommendation from a styling
 * preference would be advice this catalogue cannot back.
 *
 * Bike + film returns slug null: there is no bike PPF service in the catalogue, and the UI
 * must show "Price on request" rather than borrow a car price.
 */
export function recommend(answers: Answers): Recommendation {
  const vehicle = answers.vehicle === "bike" ? "bike" : "car";
  const film = wantsFilm(answers.goal);

  if (vehicle === "bike") {
    if (film) {
      return {
        slug: null,
        serviceInterest: "ppf",
        vehicleType: "bike",
        vehicleCategory: "motorcycle",
        headline: "Paint protection film for your motorcycle",
        why: [
          "Film is fitted to the panels that take the most damage.",
          "Bike film is quoted per bike, so the studio will confirm the price with you.",
        ],
      };
    }
    return {
      slug: CHALLENGE_SLUGS.ceramicBike,
      serviceInterest: "ceramic",
      vehicleType: "bike",
      vehicleCategory: "motorcycle",
      headline: "1 Year Bike Ceramic Coating",
      why: [
        "A coating over tank and painted panels, applied by hand.",
        "Washing gets easier because dirt has less to hold on to.",
      ],
    };
  }

  const category = ["hatchback", "sedan", "suv"].includes(answers.category)
    ? answers.category
    : "hatchback";

  if (film) {
    const slug =
      category === "suv"
        ? CHALLENGE_SLUGS.ppfSuv
        : category === "sedan"
          ? CHALLENGE_SLUGS.ppfSedan
          : CHALLENGE_SLUGS.ppfHatchback;
    return {
      slug,
      serviceInterest: "ppf",
      vehicleType: "car",
      vehicleCategory: category,
      headline: "Paint protection film for your " + category,
      why: [
        "A physical film over the paint, so chips and scratches hit the film first.",
        "Cut and fitted panel by panel for your body type.",
      ],
    };
  }

  return {
    slug: CHALLENGE_SLUGS.ceramicCar,
    serviceInterest: "ceramic",
    vehicleType: "car",
    vehicleCategory: category,
    headline: "1 Year Ceramic Coating",
    why: [
      "A coating that leaves a harder, slicker surface than bare paint.",
      "Water and dirt release more easily, so washing takes less work.",
    ],
  };
}

/** Exactly ten digits. Matches what the booking form asks for; the server accepts 10-15. */
export function isValidMobile(value: string): boolean {
  return /^\d{10}$/.test(String(value ?? "").replace(/\s|-/g, ""));
}

/**
 * The readable summary stored on the lead.
 *
 * ppf_leads has no column for challenge answers, and adding one would mean a migration on
 * the production database for what is descriptive text. It goes in `message`, which already
 * exists for exactly this, including the recommended slug so staff can look the row up.
 */
export function leadMessage(answers: Answers, rec: Recommendation, serviceTitle: string): string {
  const label = (list: { id: string; label: string }[], id: string) =>
    list.find((o) => o.id === id)?.label ?? id;
  return [
    "P91 Protection Challenge",
    "Vehicle: " + label(VEHICLES, answers.vehicle),
    "Category: " + rec.vehicleCategory,
    "Goal: " + label(GOALS, answers.goal),
    "Finish preference: " + label(FINISHES, answers.finish),
    "Recommended: " + (rec.slug ? serviceTitle + " (" + rec.slug + ")" : "quote required — no catalogue service"),
  ].join("\n");
}
