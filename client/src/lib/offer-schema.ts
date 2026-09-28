/**
 * schema.org markup for the Dussehra & Diwali "De Dhana Dhan" offer, so search results can show the price and
 * the end date. Built here once and used by BOTH the prerender (raw HTML for crawlers) and the offer page
 * (for crawlers that run JavaScript), so the two cannot drift.
 *
 * Every value is on the poster and on the page: nothing here is invented. The Rs 99 is the SLOT price (what is
 * paid online); the free items come with a premium-brand PPF installation, which the description says.
 */
export function festivalOfferSchema(origin: string): Record<string, unknown> {
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
    seller: { "@type": "AutoRepair", "@id": `${origin}/#business`, name: "P91 Car Care" },
  };
}
