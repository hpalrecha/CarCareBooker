import { displayableIncludes } from "./withheld-claims";
import { formatINR } from "./canonical-services";
import { formatServiceTime } from "./service-time";

/**
 * The Basic and Premium PPF packages on /ppf, built from the live catalogue rows.
 *
 * ─────────────────────────────────────────────────
 * THE CATALOGUE IS THE ONLY SOURCE OF TRUTH.
 *
 * Six active rows exist (ppf-hatchback / -sedan / -suv and ppf-premium-hatchback / -sedan / -suv).
 * Everything this module returns is read from those rows: the title, the price, the studio
 * time, the warranty and the includes list. The only text it adds is the tier name and the
 * body-type label, which are structure, not claims. There is no price, warranty term, film
 * name or specification written in code, so a catalogue edit changes the page and a missing
 * row removes its card instead of leaving a stale figure behind.
 *
 * ONE BUILDER, TWO CALLERS, like service-seo.ts. The server writes it into the HTML that
 * crawlers fetch (server/vite.ts via crawlable-content.ts) and the page renders it again
 * (components/ppf-packages.tsx), so the two cannot disagree.
 *
 * CLAIMS ALREADY WITHHELD STAY WITHHELD. The includes list goes through displayableIncludes,
 * the same filter the rest of /ppf uses, so a line the business has not confirmed for these
 * pages (self-healing) is dropped here exactly as it is in "What the job includes".
 *
 * NO PREVIOUS PRICE AND NO DISCOUNT LABEL. The records carry a "was" price on Basic only and a
 * "50% OFF" label that does not match the stored prices. Neither is shown here.
 * ─────────────────────────────────────────────────
 *
 * Relative imports only: server/vite.ts is bundled by esbuild and imports this through
 * crawlable-content.ts.
 */

export type PpfTierKey = "basic" | "premium";
export type PpfBodyKey = "hatchback" | "sedan" | "suv";

/** Structure only: which catalogue row belongs to which tier and body type. */
export const PPF_TIERS: ReadonlyArray<{
  key: PpfTierKey;
  label: string;
  slugs: Readonly<Record<PpfBodyKey, string>>;
}> = [
  {
    key: "basic",
    label: "Basic PPF",
    slugs: { hatchback: "ppf-hatchback", sedan: "ppf-sedan", suv: "ppf-suv" },
  },
  {
    key: "premium",
    label: "Premium PPF",
    slugs: {
      hatchback: "ppf-premium-hatchback",
      sedan: "ppf-premium-sedan",
      suv: "ppf-premium-suv",
    },
  },
];

/** Same labels and examples as the /ppf vehicle selector (landing-pages.ts). */
export const PPF_BODY_TYPES: ReadonlyArray<{ key: PpfBodyKey; label: string; examples: string }> = [
  { key: "hatchback", label: "Hatchback", examples: "Swift, i20, Baleno, Altroz" },
  { key: "sedan", label: "Sedan", examples: "City, Verna, Ciaz, Virtus" },
  { key: "suv", label: "SUV", examples: "Creta, Seltos, XUV700, Fortuner" },
];

/** The fields read from a catalogue row. A superset is fine (ServiceRecord is loose). */
export interface PpfCatalogueRow {
  id?: string;
  slug: string;
  title: string;
  price: string | number;
  isActive?: boolean | null;
  duration?: number | string;
  durationText?: string | null;
  whatIncluded?: unknown;
}

export interface PpfPackageCard {
  slug: string;
  bodyKey: PpfBodyKey;
  bodyLabel: string;
  examples: string;
  title: string;
  price: number;
  priceLabel: string;
  /** The studio's own turnaround text for this row, e.g. "2-3 days"; null when the row has none. */
  studioTime: string | null;
}

export interface PpfTier {
  key: PpfTierKey;
  label: string;
  cards: PpfPackageCard[];
  /** Warranty in years when every card in the tier states the same one; otherwise null. */
  warrantyYears: number | null;
  /** The includes list of the tier's first card (the lists are identical across a tier's rows in the catalogue). */
  includes: string[];
  /** Includes that do not appear, word for word, in the other tier. Used only to highlight differences. */
  differsFromOther: string[];
  /** The studio time when every card shares one; otherwise null (each card then shows its own). */
  sharedStudioTime: string | null;
}

/** "7-year warranty" -> 7. Null when the row's list states no such item. */
export function warrantyYearsOf(items: unknown): number | null {
  for (const item of Array.isArray(items) ? items : []) {
    const m = typeof item === "string" ? /(\d+)\s*-?\s*year\s+warranty/i.exec(item) : null;
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function toNumber(v: string | number | undefined | null): number {
  return typeof v === "number" ? v : parseFloat(String(v ?? ""));
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Build the two tiers from the live rows.
 *
 * A row that is missing, inactive or has an unreadable price produces no card (never a card with
 * a blank or invented figure). A tier with no cards is dropped, and `null` is returned when
 * neither tier has any, so callers render nothing rather than an empty section.
 */
export function buildPpfPackages(rows: ReadonlyArray<PpfCatalogueRow> | null | undefined): PpfTier[] | null {
  const bySlug = new Map((Array.isArray(rows) ? rows : []).map((r) => [r.slug, r]));

  const tiers: PpfTier[] = [];
  for (const tier of PPF_TIERS) {
    const cards: PpfPackageCard[] = [];
    const rowsInTier: PpfCatalogueRow[] = [];
    for (const body of PPF_BODY_TYPES) {
      const row = bySlug.get(tier.slugs[body.key]);
      if (!row || row.isActive === false) continue;
      const price = toNumber(row.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      rowsInTier.push(row);
      cards.push({
        slug: row.slug,
        bodyKey: body.key,
        bodyLabel: body.label,
        examples: body.examples,
        title: String(row.title ?? "").trim(),
        price,
        priceLabel: formatINR(price),
        studioTime: formatServiceTime(row),
      });
    }
    if (cards.length === 0) continue;

    const years = rowsInTier.map((r) => warrantyYearsOf(r.whatIncluded));
    const warrantyYears = years.every((y) => y !== null && y === years[0]) ? years[0] : null;
    const times = new Set(cards.map((c) => c.studioTime));
    tiers.push({
      key: tier.key,
      label: tier.label,
      cards,
      warrantyYears,
      includes: displayableIncludes(rowsInTier[0].whatIncluded),
      differsFromOther: [],
      sharedStudioTime: times.size === 1 ? cards[0].studioTime : null,
    });
  }
  if (tiers.length === 0) return null;

  // Highlight, never rewrite: an include that the other tier does not list word for word.
  if (tiers.length === 2) {
    const [a, b] = tiers;
    const inA = new Set(a.includes.map(norm));
    const inB = new Set(b.includes.map(norm));
    a.differsFromOther = a.includes.filter((i) => !inB.has(norm(i)));
    b.differsFromOther = b.includes.filter((i) => !inA.has(norm(i)));
  }
  return tiers;
}

/** The studio-time line for a card or a tier, in the words the catalogue uses. */
export function studioTimeLine(time: string | null): string | null {
  return time ? `Approx. ${time} in the studio` : null;
}

/**
 * Service.offers for /ppf: the lowest and highest price across the packages that exist, plus one
 * Offer per package. Prices only, taken from the rows. No availability, no discount, no priceValidUntil.
 */
export function ppfAggregateOffer(tiers: PpfTier[] | null, origin: string): Record<string, unknown> | null {
  if (!tiers) return null;
  const cards = tiers.flatMap((t) => t.cards);
  if (cards.length === 0) return null;
  const prices = cards.map((c) => c.price);
  return {
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    lowPrice: String(Math.min(...prices)),
    highPrice: String(Math.max(...prices)),
    offerCount: cards.length,
    offers: cards.map((c) => ({
      "@type": "Offer",
      name: c.title,
      price: String(c.price),
      priceCurrency: "INR",
      url: `${origin}/ppf`,
    })),
  };
}
