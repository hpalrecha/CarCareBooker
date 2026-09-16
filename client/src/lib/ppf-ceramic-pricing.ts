/**
 * Prices shown on /ppf-ceramic-coating, resolved from the live catalogue.
 *
 * That page used to carry its own table of rupee figures, typed in when it was built. The
 * catalogue moved on and the page did not: it advertised PPF at a "was" price of ₹65,000
 * against a real ₹85,000, and car ceramic at ₹6,000 against a real ₹5,999 — while the booking
 * flow, the campaign landing pages and every service card read GET /api/services.
 *
 * So this module holds catalogue SLUGS, never amounts. Every figure the page renders comes
 * from the row the slug selects, the same row BookingModal is given, and the "% off" badge
 * is computed from that row's two values.
 *
 * No runtime dependencies, so tests/ppf-ceramic-pricing.test.mjs can load it directly.
 */

/** Catalogue slug behind each price the page shows. */
export const PPF_CERAMIC_PRICE_SLUGS = {
  ppfHatchback: "ppf-hatchback",
  ppfSedan: "ppf-sedan",
  ppfSuv: "ppf-suv",
  ceramicCar: "1-year-ceramic-coating",
  ceramicBike: "1-year-bike-ceramic-coating",
};

export interface CataloguePrice {
  price: number;
  /** The struck-through figure, or null when the row carries no genuine reduction. */
  originalPrice: number | null;
  /** Whole-number saving, 0 when there is none. */
  discountPercent: number;
}

/**
 * The live price for one catalogue slug, or null when the catalogue has not loaded, the
 * slug is not an active service, or its price is unusable. Callers must render null as
 * "no price" — there is deliberately no fallback figure to fall back to.
 */
export function resolveCataloguePrice(services: unknown, slug: string): CataloguePrice | null {
  if (!Array.isArray(services)) return null;
  const row = services.find((s) => s && s.slug === slug);
  if (!row) return null;

  const price = parseFloat(String(row.price));
  if (!Number.isFinite(price) || price <= 0) return null;

  const was = row.originalPrice == null ? NaN : parseFloat(String(row.originalPrice));
  // Only a genuine reduction. A struck-through figure equal to the live one invents a saving.
  if (!Number.isFinite(was) || was <= price) {
    return { price, originalPrice: null, discountPercent: 0 };
  }
  return { price, originalPrice: was, discountPercent: Math.round(((was - price) / was) * 100) };
}

/** The largest saving among the resolved prices, for the "Up to N% OFF" banner. 0 if none. */
export function maxDiscountPercent(prices: (CataloguePrice | null)[]): number {
  return prices.reduce((max, p) => (p && p.discountPercent > max ? p.discountPercent : max), 0);
}
