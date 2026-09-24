/**
 * /services lists PPF as one entry, not nine.
 *
 * The catalogue holds nine separate PPF rows (Basic, Premium and Partial, each for hatchback,
 * sedan and SUV). Listing them all made the catalogue one long run of near-identical cards. The
 * /services page now shows ONE "PPF for cars" card; opening it lands on a PPF service page whose
 * tab row already lists all nine packages, so nothing is lost — it is just one click further in.
 *
 * Presentation only. The nine records are untouched and still served, priced, booked and linked
 * (/service/:slug) exactly as before; this only decides what the /services LIST shows. The card's
 * price is the lowest live price among the nine rows ("from"), computed from the same records.
 *
 * A "PPF for bikes" card used to sit beside it (no price, linking to /contact). It was removed
 * 2026-09-24 by request until a bike PPF service exists; the studio's bike PPF reel is shown on
 * the bike ceramic page in the meantime (lib/instagram-reels.ts).
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
  const out: (T | ListedService)[] = [];
  let placed = false;
  for (const s of services) {
    if (PPF_SLUG.test(s.slug)) {
      if (!placed) {
        out.push(car);
        placed = true;
      }
      continue;
    }
    out.push(s);
  }
  return out;
}
