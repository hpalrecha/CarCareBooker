import { localBusinessSchema } from "./local-business";
import { festivalOfferHasEnded } from "./festival-offer-window";

/**
 * schema.org markup for the Dussehra & Diwali "De Dhana Dhan" offer, so search results can show the price and
 * the end date. Built here once and used by BOTH the prerender (raw HTML for crawlers) and the offer page
 * (for crawlers that run JavaScript), so the two cannot drift.
 *
 * Every value is on the poster and on the page: nothing here is invented. The Rs 99 is the SLOT price (what is
 * paid online); the free items come with a premium-brand PPF installation, which the description says.
 *
 * THE SELLER IS THE STUDIO, DESCRIBED ONCE AND COMPLETELY. It used to be an AutoRepair node with only a name, which a
 * validator reports as a local business with no address. The seller is the physical studio, so it is the same entity the
 * home page, /contact and the service pages publish, built by the same function (lib/local-business.ts) from the owner-
 * confirmed address. Nothing about the business is written here. The nested node carries no @context of its own.
 */
export function festivalOfferSchema(origin: string, now: Date = new Date()): Record<string, unknown> | null {
  // An ended promotion is not described as available: after the end date there is no Offer at all (no price, no
  // "InStock", no validThrough in the past). The page keeps its breadcrumb and says the offer has ended.
  if (festivalOfferHasEnded(now)) return null;
  const { "@context": _context, ...seller } = localBusinessSchema(origin);
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "@id": `${origin}/offer/de-dhana-dhan#offer`,
    url: `${origin}/offer/de-dhana-dhan`,
    name: "De Dhana Dhan offer: free dash cam, sun film, sound damping and ceramic coating",
    description:
      "Free dash cam, sun film, sound damping and ceramic coating with any premium brand paint protection film " +
      "installation at P91 Car Care, Adugodi, Bangalore. Book your slot for Rs 99. Valid till 8 November 2026. " +
      "Terms and conditions apply.",
    price: "99",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    validThrough: "2026-11-08T23:59:59+05:30",
    seller,
  };
}
