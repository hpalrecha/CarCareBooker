/**
 * /services lists PPF as two entries, not nine.
 *
 * The catalogue holds nine separate PPF rows (Basic, Premium and Partial, each for hatchback,
 * sedan and SUV). Listing them all made the catalogue one long run of near-identical cards. The
 * /services page now shows ONE "PPF for cars" card, and one "PPF for bikes" card; opening the car
 * card lands on a PPF service page whose tab row already lists all nine packages, so nothing is
 * lost — it is just one click further in.
 *
 * Presentation only. The nine records are untouched and still served, priced, booked and linked
 * (/service/:slug) exactly as before; this only decides what the /services LIST shows. The car
 * card's price is the lowest live price among the nine rows ("from"), computed from the same
 * records, never typed in. There is no bike PPF row in the catalogue, so the bike card carries no
 * price and sends the visitor to the contact page to ask.
 */
export interface GroupableService {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  originalPrice?: string;
  duration: number;
  images?: string[];
  [key: string]: unknown;
}

const PPF_SLUG = /(^|-)ppf(-|$)/;

export interface ListedService extends GroupableService {
  /** Card shows "From ₹X" instead of a bare price. */
  fromPrice?: boolean;
  /** Where the card goes when it is not /service/:slug. */
  href?: string;
  /** Replaces the price when the entry has none. */
  priceNote?: string;
}

export function groupPpf<T extends GroupableService>(services: T[]): (T | ListedService)[] {
  const ppf = services.filter((s) => PPF_SLUG.test(s.slug));
  if (ppf.length < 2) return services;

  const prices = ppf.map((s) => parseFloat(s.price)).filter((n) => Number.isFinite(n) && n > 0);
  const lowest = prices.length ? String(Math.min(...prices)) : "";
  // The car card opens the first PPF row's page; that page's tab row lists every package.
  const lead = ppf[0];

  const car: ListedService = {
    id: "group-ppf-car",
    title: "Paint Protection Film (PPF) for Cars",
    slug: lead.slug,
    description:
      "Full and partial paint protection film for hatchbacks, sedans and SUVs. Open it to pick your body type and package.",
    price: lowest,
    duration: 0,
    images: lead.images,
    fromPrice: true,
  };
  const bike: ListedService = {
    id: "group-ppf-bike",
    title: "Paint Protection Film (PPF) for Bikes",
    slug: "ppf-bike",
    description: "Paint protection film for motorcycles. Ask the studio for a quote.",
    price: "",
    duration: 0,
    images: [],
    href: "/contact",
    priceNote: "Ask for a quote",
  };

  const out: (T | ListedService)[] = [];
  let placed = false;
  for (const s of services) {
    if (PPF_SLUG.test(s.slug)) {
      if (!placed) {
        out.push(car, bike);
        placed = true;
      }
      continue;
    }
    out.push(s);
  }
  return out;
}
