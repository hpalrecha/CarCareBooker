export const SITE = {
  name: "P91 Car Care",
  legalName: "Plus Nine One Inc",
  origin: "https://p91carcare.com",
  phone: "+91 74066 19191",
  phoneHref: "tel:+917406619191",
  whatsapp: "https://wa.me/917406619191",
  address: {
    street: "49, 13th Cross, Ayappa Garden, Adugodi",
    locality: "Adugodi",
    city: "Bengaluru",
    postalCode: "560030",
    region: "Karnataka",
    country: "IN",
  },
  // Taken from the live AutoRepair JSON-LD on p91carcare.com (25 Nov 2026). Re-check in Task 3 Step 1.
  geo: { lat: 12.9416, lng: 77.6105 },
} as const;

export const NAV = [
  { href: "/services/paint-protection-film", label: "PPF" },
  { href: "/services/ceramic-coating", label: "Ceramic coating" },
  { href: "/services", label: "All services" },
  { href: "/areas/koramangala", label: "Areas" },
  { href: "/guides", label: "Guides" },
] as const;
