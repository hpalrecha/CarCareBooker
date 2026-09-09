import type { BusinessHour } from "@shared/schema";

/**
 * AutoRepair / LocalBusiness structured data.
 *
 * This is the highest-value SEO artefact for a business serving one city: it is what lets
 * Google place P91 on a map and return it for "car detailing near me". Without it the
 * site can rank for informational searches but is invisible in the local pack.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO CORRECTIONS MADE HERE, both worth understanding before editing.
 *
 * 1. The schema used to be gated OFF ENTIRELY. `ADDRESS_CONFIRMED` was false, so
 *    localBusinessSchema() returned undefined and no JSON-LD was emitted anywhere —
 *    including the homepage, which appeared to pass one in. The gate existed for a good
 *    reason (a placeholder street address is worse than none, because Google ingests it
 *    and a wrong listing is hard to correct), but it threw away the truthful fields too.
 *    Now the schema is always emitted with the fields we can stand behind, and only the
 *    `address` block waits on real data.
 *
 * 2. Opening hours were hardcoded as "Mon–Sat 10:00–19:00". Production disagrees: the
 *    business_hours table has all seven days open, Mon–Sat 10:30–16:30 and Sunday
 *    10:30–15:00. Publishing hours a customer can be turned away on is worse than
 *    publishing none, so hours are now derived from that table and omitted when it has
 *    not loaded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * True once STREET_ADDRESS and POSTAL_CODE below hold the real shop address, matching the
 * Google Business Profile character for character.
 *
 * Confirmed by the business on 2026-09-09. If it is ever set back to false the schema
 * still emits — it simply drops to locality and region only. A schema without a street
 * address forfeits the local-pack listing; a schema with a WRONG one actively suppresses
 * it and poisons the profile, so omission stays the safe failure mode.
 *
 * IF THE GOOGLE BUSINESS PROFILE IS EDITED, EDIT THIS TO MATCH. A mismatch between the
 * two is worse than either being slightly imperfect on its own.
 */
export const ADDRESS_CONFIRMED = true;

const STREET_ADDRESS = "100 Feet Road, HAL 2nd Stage, Indiranagar";
const POSTAL_CODE = "560038";

const PHONE = "+917406619191";

/** schema.org day names, indexed by JS getDay(). */
const SCHEMA_DAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Groups the live business_hours rows into OpeningHoursSpecification entries, collapsing
 * days that share the same window so seven rows become two.
 *
 * Closed days are omitted rather than emitted with equal open/close times — schema.org
 * treats an absent day as closed, which is both correct and unambiguous.
 */
export function openingHoursSpecification(
  hours: BusinessHour[] | undefined,
): Record<string, unknown>[] | undefined {
  if (!hours || hours.length === 0) return undefined;

  const byWindow = new Map<string, string[]>();
  for (const h of hours) {
    if (!h.isOpen || !h.openTime || !h.cutoffTime) continue;
    const key = `${h.openTime}-${h.cutoffTime}`;
    const day = SCHEMA_DAY[h.dayOfWeek];
    if (!day) continue;
    const list = byWindow.get(key) ?? [];
    list.push(day);
    byWindow.set(key, list);
  }
  if (byWindow.size === 0) return undefined;

  // Array.from rather than spread: the tsconfig target predates downlevelIteration, so
  // spreading a Map iterator does not compile here.
  return Array.from(byWindow.entries()).map(([window, days]) => {
    const [opens, closes] = window.split("-");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens,
      closes,
    };
  });
}

interface LocalBusinessInput {
  origin: string;
  /** Live rows from GET /api/business-hours. Omitted from the schema when absent. */
  businessHours?: BusinessHour[];
}

export function localBusinessSchema(
  originOrInput: string | LocalBusinessInput,
): Record<string, unknown> {
  const { origin, businessHours } =
    typeof originOrInput === "string" ? { origin: originOrInput, businessHours: undefined } : originOrInput;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": `${origin}/#business`,
    name: "P91 Car Care",
    legalName: "Plus Nine One Inc",
    url: origin,
    telephone: PHONE,
    priceRange: "₹₹",
    image: `${origin}/Car Care (4)_1753951564515.png`,
    description:
      "Professional car detailing in Bangalore: ceramic coating, paint protection film, " +
      "interior and exterior detailing, glass coating and headlight restoration.",
    areaServed: { "@type": "City", name: "Bengaluru" },
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: `${origin}/services` },
    },
  };

  // Locality and region are safe to state without the street line — they are not in
  // dispute and they help disambiguate the business.
  schema.address = ADDRESS_CONFIRMED
    ? {
        "@type": "PostalAddress",
        streetAddress: STREET_ADDRESS,
        postalCode: POSTAL_CODE,
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      }
    : {
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      };

  const hours = openingHoursSpecification(businessHours);
  if (hours) schema.openingHoursSpecification = hours;

  return schema;
}
