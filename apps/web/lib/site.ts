export const SITE = {
  name: "P91 Car Care",
  legalName: "Plus Nine One Inc",
  origin: "https://p91carcare.com",
  phone: "+91 74066 19191",
  phoneHref: "tel:+917406619191",
  whatsapp: "https://wa.me/917406619191",
  // Book CTA for pages with no online booking record. Service pages use bookingFor() (content/site/booking-links.ts),
  // which opens the old /service/<slug> booking page until Plan 2c (owner, 26 Nov 2026).
  book: { href: "https://wa.me/917406619191", label: "Book on WhatsApp" },
  address: {
    street: "49, 13th Cross, Ayappa Garden, Adugodi",
    locality: "Adugodi",
    city: "Bengaluru",
    postalCode: "560030",
    region: "Karnataka",
    country: "IN",
  },
  // The live AutoRepair JSON-LD on p91carcare.com has no geo (checked 26 Nov 2026), so these are
  // unconfirmed Adugodi coordinates. Confirm against the Google Business Profile pin before cutover.
  geo: { lat: 12.9416, lng: 77.6105 },
} as const;

export const NAV = [
  { href: "/services/paint-protection-film", label: "PPF" },
  { href: "/services/ceramic-coating", label: "Ceramic coating" },
  { href: "/services", label: "All services" },
  { href: "/areas/koramangala", label: "Areas" },
  { href: "/guides", label: "Guides" },
] as const;
