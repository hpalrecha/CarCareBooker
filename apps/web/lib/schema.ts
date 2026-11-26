import type { Article, AutoRepair, BreadcrumbList, DayOfWeek, FAQPage, Service, WithContext } from "schema-dts";
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

/** Service. No offers and no prices (owner, 26 Nov 2026: the new site shows no prices at all). */
export function serviceSchema(a: { name: string; path: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: a.name,
    description: a.description,
    url: abs(a.path),
    areaServed: { "@type": "City", name: "Bengaluru" },
    provider: { "@id": BUSINESS_ID },
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

/** Article for a guide. An author still marked [NEEDS ...] is not published as a person: the business is the author. */
export function articleSchema(a: { path: string; headline: string; description: string; date: string; updated?: string; author: string; image: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    url: abs(a.path),
    mainEntityOfPage: abs(a.path),
    image: abs(a.image),
    datePublished: a.date,
    dateModified: a.updated ?? a.date,
    author: a.author.startsWith("[NEEDS") ? { "@id": BUSINESS_ID } : { "@type": "Person" as const, name: a.author },
    publisher: { "@id": BUSINESS_ID },
  } satisfies WithContext<Article>;
}
