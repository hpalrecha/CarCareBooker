import type { AutoRepair, BreadcrumbList, DayOfWeek, FAQPage, Service, WithContext } from "schema-dts";
import type { Range } from "@p91/domain/price-ranges";
import type { BusinessHour } from "./api.ts";
import { SITE } from "./site.ts";

export const BUSINESS_ID = `${SITE.origin}/#business`;
const abs = (path: string) => new URL(path, SITE.origin).toString().replace(/\/$/, path === "/" ? "/" : "");

export function businessSchema(hours: BusinessHour[]) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": BUSINESS_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.origin,
    telephone: SITE.phoneHref.replace("tel:", ""),
    image: `${SITE.origin}/og/home.png`,
    priceRange: "₹₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      postalCode: SITE.address.postalCode,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    areaServed: ["Koramangala", "HSR Layout", "Indiranagar", "Bengaluru"].map((name) => ({ "@type": "Place" as const, name })),
    openingHoursSpecification: hours.filter((h) => h.isOpen).map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: `https://schema.org/${h.dayName}` as DayOfWeek,
      opens: h.openTime,
      closes: h.cutoffTime,
    })),
  } satisfies WithContext<AutoRepair>;
}

export function serviceSchema(a: { name: string; path: string; description: string; range: Range | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: a.name,
    description: a.description,
    url: abs(a.path),
    areaServed: { "@type": "City", name: "Bengaluru" },
    provider: { "@id": BUSINESS_ID },
    ...(a.range
      ? { offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: a.range.low, highPrice: a.range.high ?? a.range.low } }
      : {}),
  } satisfies WithContext<Service>;
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question" as const, name: i.q, acceptedAnswer: { "@type": "Answer" as const, text: i.a } })),
  } satisfies WithContext<FAQPage>;
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem" as const, position: i + 1, name: it.name, item: abs(it.path) })),
  } satisfies WithContext<BreadcrumbList>;
}
