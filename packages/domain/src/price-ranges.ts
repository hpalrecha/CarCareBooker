/**
 * Catalogue rows -> the price ranges marketing pages show.
 *
 * Owner rule (25 Nov 2026): never an exact price or "from ₹X" on a marketing page; show the
 * range a car can land in and what moves it. Exact amounts belong to booking and checkout.
 */
export type CatalogueRow = { slug: string; price: string | number; isActive?: boolean };
export type BodyType = "hatchback" | "sedan" | "suv";
export type Range = { low: number; high: number | null };
export type FamilyRanges = { overall: Range; byBody: Partial<Record<BodyType, Range>> };

const bodyFromSuffix = (slug: string): BodyType | null => {
  const m = slug.match(/-(hatchback|sedan|suv)$/);
  return m ? (m[1] as BodyType) : null;
};

export const FAMILIES = {
  ppf: { slugs: /^ppf-(premium-)?(hatchback|sedan|suv)$/, bodyFromSlug: bodyFromSuffix },
  "ceramic-car": { slugs: /^(\d+-year-)?ceramic-coating(-[a-z]+)?$/ },
  "ceramic-bike": { slugs: /bike-ceramic-coating/ },
  "car-wash": { slugs: /car-wash/ },
  "interior-detailing": { slugs: /^interior-detailing/ },
  "exterior-detailing": { slugs: /^exterior-detailing/ },
  "headlight-restoration": { slugs: /^headlight-restoration/ },
  "windshield-glass-coating": { slugs: /^windshield-glass-coating/ },
  "windshield-glass-polishing": { slugs: /^windshield-glass-polishing/ },
  "maintenance-plan": { slugs: /^annual-maintenance/ },
} satisfies Record<string, { slugs: RegExp; bodyFromSlug?: (slug: string) => BodyType | null }>;

export type Family = keyof typeof FAMILIES;

const toRange = (prices: number[]): Range => {
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return { low, high: high > low ? high : null };
};

export function rangesFor(family: Family, rows: CatalogueRow[]): FamilyRanges | null {
  const def = FAMILIES[family] as { slugs: RegExp; bodyFromSlug?: (slug: string) => BodyType | null };
  const hits = rows.filter((r) => r.isActive !== false && def.slugs.test(r.slug));
  if (hits.length === 0) return null;
  const price = (r: CatalogueRow) => Number(r.price);
  const byBody: Partial<Record<BodyType, Range>> = {};
  if (def.bodyFromSlug) {
    for (const body of ["hatchback", "sedan", "suv"] as const) {
      const p = hits.filter((r) => def.bodyFromSlug!(r.slug) === body).map(price);
      if (p.length) byBody[body] = toRange(p);
    }
  }
  return { overall: toRange(hits.map(price)), byBody };
}

const k = (n: number) => {
  if (n < 1000) return String(n);
  const v = n / 1000;
  return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, "")}k`;
};

export function formatRange(r: Range): string {
  return r.high === null ? `₹${k(r.low)}` : `₹${k(r.low)}–${k(r.high)}`;
}
