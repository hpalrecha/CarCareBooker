import type { BusinessHour } from "@shared/schema";
import { localBusinessSchema } from "./local-business";

/**
 * Metadata and structured data for a /service/:slug page.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * ONE BUILDER, TWO CALLERS. The server writes this into the HTML that crawlers fetch
 * (server/vite.ts), and the page sets it again after hydrating (ServiceSeo in
 * service-landing.tsx). They used to be two hand-kept copies, and they had drifted: the
 * server omitted FAQPage entirely — so a crawler that does not run JavaScript never saw
 * the FAQ markup — and both described the business with no street address or hours.
 *
 * The business itself comes from localBusinessSchema, the same confirmed address, phone
 * and live opening hours the homepage publishes. The Service points at it by @id, so
 * Google sees one business offering many services rather than seventeen near-identical
 * businesses.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Relative imports only: server/vite.ts is bundled by esbuild and imports this directly.
 */

export interface ServiceSeoInput {
  title?: string | null;
  slug: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  price?: string | number | null;
  images?: unknown;
  faq?: Array<{ question?: string | null; answer?: string | null }> | null;
}

export const TITLE_MAX = 60;

/**
 * Search results cut titles at about 60 characters. The admin-set metaTitle is used when it
 * fits; when it does not, the generated form is used instead. On production seven records'
 * metaTitles ran 62–82 characters ("1 Year Bike Ceramic Coating - Motorcycle Paint
 * Protection | P91 Car Care Bangalore") and were being truncated mid-phrase. The database
 * rows are not modified.
 */
export function serviceSeoTitle(service: ServiceSeoInput): string {
  const name = String(service.title || "").trim();
  const custom = String(service.metaTitle || "").trim();
  if (custom && custom.length <= TITLE_MAX) return custom;
  const generated = `${name} in Bangalore | P91 Car Care`;
  return generated.length <= TITLE_MAX ? generated : `${name} | P91 Car Care`;
}

/**
 * ItemList for /services: every active service, in catalogue order, each pointing at its
 * own page. Names and URLs only — prices live on each page's own Offer schema.
 */
export function servicesItemListSchema(
  services: Array<Pick<ServiceSeoInput, "title" | "slug">>,
  origin: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "P91 Car Care services",
    itemListElement: services
      .filter((s) => s.slug && String(s.title || "").trim())
      .map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: String(s.title).trim(),
        url: `${origin}/service/${s.slug}`,
      })),
  };
}

const SNIPPET_MAX = 160;
const PLACE = " Studio in Indiranagar, Bangalore.";

/**
 * A meta description that fits the ~160 characters a search snippet shows and names the
 * studio's neighbourhood — "Indiranagar" is the local term this page should match.
 *
 * Built only from the record's own wording: the whole meta description when it fits, else
 * its first sentence, else it is cut at a word boundary. The stored records run 200–234
 * characters, so without this Google truncated every one mid-sentence and the location
 * never appeared.
 */
export function serviceSeoDescription(service: ServiceSeoInput): string {
  const base = String(service.metaDescription || service.description || "").trim();
  if (!base) return base;
  const named = /indiranagar/i.test(base);
  const room = named ? SNIPPET_MAX : SNIPPET_MAX - PLACE.length;

  let text = base;
  if (text.length > room) {
    const first = text.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0]?.trim();
    if (first && first.length <= room) text = first;
    else {
      // Prefer ending at a clause break ("…removes stubborn hard water spots, restores
      // paint shine") over a dangling word ("…and provides").
      const cut = text.slice(0, room);
      const comma = cut.lastIndexOf(",");
      text = comma > room * 0.5
        ? cut.slice(0, comma)
        : cut.replace(/\s+\S*$/, "").replace(/\s+(and|or|the|a|an|of|to|with|your|such as|that)$/i, "");
    }
  }
  if (named) return text;
  return `${text.replace(/[\s.!…]+$/, "")}.${PLACE}`;
}

export function serviceStructuredData(
  service: ServiceSeoInput,
  { origin, businessHours }: { origin: string; businessHours?: BusinessHour[] },
): Record<string, unknown>[] {
  const business = localBusinessSchema({ origin, businessHours });
  const images = Array.isArray(service.images) ? service.images : [];
  const raw = typeof images[0] === "string" && images[0].trim() ? (images[0] as string) : null;
  const image = raw ? (raw.startsWith("http") ? raw : origin + raw) : undefined;

  const schemas: Record<string, unknown>[] = [
    business,
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: String(service.title || "").trim(),
      description: serviceSeoDescription(service),
      ...(image ? { image } : {}),
      areaServed: { "@type": "City", name: "Bengaluru" },
      provider: { "@id": business["@id"] },
      offers: {
        "@type": "Offer",
        // Live price from the record. Never a literal — a schema price that disagrees with
        // the page is a Merchant-listing violation as well as a lie to the customer.
        price: service.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${origin}/service/${service.slug}`,
      },
    },
  ];

  // FAQPage only when the record really has questions: an empty FAQPage is a
  // structured-data error, and inventing questions to fill it would be worse.
  const faqs = (service.faq || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: String(f.question).trim(),
        acceptedAnswer: { "@type": "Answer", text: String(f.answer).trim() },
      })),
    });
  }
  return schemas;
}
