/**
 * Canonical mapping from marketing labels to the ACTIVE service records that back them.
 *
 * The database holds inactive legacy rows whose slugs are still referenced by old
 * marketing copy (`interior-deep-clean`, `glass-coating`, `headlight-restoration`,
 * `premium-wash-detail`). Those rows are excluded from `GET /api/services`, so linking to
 * them lands the customer on "Service Not Found". Several of them also duplicate the
 * TITLE of an active row, so a title lookup would silently resolve to the wrong record.
 *
 * Everything here is keyed by the stable slug of the ACTIVE row. Titles and prices are
 * never hardcoded for display — they are read back from the live service record so the
 * CTA, the service page and the booking/payment call can never disagree.
 */

export interface CanonicalService {
  /** stable id of the active row, asserted at runtime */
  id: string;
  /** stable slug of the active row — this is what the URL uses */
  slug: string;
  /** exact title of the active row, asserted at runtime */
  expectedTitle: string;
  /** legacy slug the old copy pointed at, kept for documentation and tests */
  legacySlug?: string;
  /** marketing label, used only when it differs from the canonical title */
  marketingLabel?: string;
}

/** The four homepage before/after transformation CTAs. */
export const TRANSFORMATION_CTAS = {
  interiorDeepClean: {
    id: '43f050c6-488b-4657-9458-99d23364c72a',
    slug: 'interior-detailing-service',
    expectedTitle: 'Interior Detailing Service',
    legacySlug: 'interior-deep-clean',
    marketingLabel: 'Interior Deep Clean',
  },
  glassCoating: {
    id: 'c2517260-3e7e-4de1-9886-542fb5d7df8f',
    slug: 'windshield-glass-coating-new',
    expectedTitle: 'Windshield Glass Coating',
    legacySlug: 'glass-coating',
    marketingLabel: 'Glass Coating',
  },
  headlightRestoration: {
    id: 'd7fae6bd-fbf4-445f-8faa-e67d8461fbdc',
    slug: 'headlight-restoration-both',
    expectedTitle: 'Headlight Restoration - Both Lights',
    legacySlug: 'headlight-restoration',
    marketingLabel: 'Headlight Restoration',
  },
  exteriorDetailing: {
    id: 'd5e11a48-afe4-4757-9796-a98322ac5bf2',
    slug: 'exterior-detailing-hard-water-new',
    expectedTitle: 'Exterior Detailing with Hard Water Spot Removal',
    legacySlug: 'premium-wash-detail',
    marketingLabel: 'Complete Exterior Detail',
  },
} satisfies Record<string, CanonicalService>;

/**
 * The short curated list shown in the footer. Deliberately not every database row —
 * these are the five most-booked active services. "Premium Car Wash - ₹599" was removed:
 * no such service exists, active or inactive.
 */
export const FOOTER_SERVICES: CanonicalService[] = [
  TRANSFORMATION_CTAS.interiorDeepClean,
  TRANSFORMATION_CTAS.exteriorDetailing,
  TRANSFORMATION_CTAS.glassCoating,
  TRANSFORMATION_CTAS.headlightRestoration,
  {
    id: '2d0a6a5c-e642-4624-97e0-a7e3026d4684',
    slug: 'car-polishing',
    expectedTitle: 'Car Polishing',
  },
];

export interface ServiceRecord {
  id: string;
  title: string;
  slug: string;
  price: string;
  originalPrice?: string;
  images?: string[];
  [k: string]: unknown;
}

/**
 * Resolve a canonical entry against the live `/api/services` payload.
 *
 * Matches on slug AND id and asserts the title, so a renamed or deactivated row returns
 * null instead of quietly linking somewhere wrong. `/api/services` only ever returns
 * active rows, so a hit is proof the target is bookable.
 */
export function resolveCanonical(
  services: ServiceRecord[] | undefined,
  entry: CanonicalService,
): ServiceRecord | null {
  if (!Array.isArray(services)) return null;
  const row = services.find((s) => s.slug === entry.slug && s.id === entry.id);
  if (!row) return null;
  if (row.title.trim() !== entry.expectedTitle) return null;
  return row;
}

/**
 * The single resolver for a service's display image, shared by ServiceCard,
 * BookingModal and the service-detail hero so they can never disagree.
 *
 * Returns undefined when the record has no image; the caller shows the branded
 * placeholder. There is deliberately no remote stand-in: the card and the modal used to
 * fall back to a hardcoded images.unsplash.com URL, which meant a third-party CDN
 * outage broke a card, and the two components could show different pictures for the
 * same service. Every active service now carries its own local image.
 */
export function resolveServiceImage(service: { images?: string[] } | undefined): string | undefined {
  const first = service?.images?.[0];
  return typeof first === 'string' && first.trim() !== '' ? first : undefined;
}

/** Consistent INR formatting for every price rendered outside a service card. */
export function formatINR(amount: string | number | undefined): string {
  if (amount === undefined || amount === null || amount === '') return '';
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return '';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
