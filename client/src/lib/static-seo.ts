/**
 * SEO copy for the hand-written pages, in ONE place.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS. scripts/prerender.mjs used to keep its own copy of each page's title
 * and description (STATIC_ROUTES), with a test that compared TITLES only. Descriptions
 * drifted unnoticed: on /services the HTML crawlers received said one thing and the page
 * set another, and /ppf-ceramic-coating still told crawlers "get a quote" after the page
 * had changed to "book an appointment". Both the components and the prerenderer now import
 * these constants, so there is nothing left to drift.
 *
 * `h1` and `lede` are the words the page actually renders — they feed the crawlable
 * content baked into the initial HTML (lib/crawlable-content.ts). tests/seo-foundation
 * asserts each still appears in its component, so an edit to the page that is not made
 * here fails the build rather than shipping crawlers a heading the page no longer has.
 *
 * Limits enforced by the tests: title ≤ 60 characters, description 70–160.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export interface StaticSeoPage {
  path: string;
  title: string;
  description: string;
  /** The page's rendered <h1>, as plain text. */
  h1: string;
  /** The paragraph under the h1, when the page has one. */
  lede?: string;
}

export const HOME_SEO: StaticSeoPage = {
  path: "/",
  // Was 77 characters ("P91 Car Care — Car Detailing, PPF & Ceramic Coating in Indiranagar,
  // Bangalore") and was cut off in results. Same words, shortened.
  title: "Car Detailing, PPF & Ceramic Coating in Indiranagar | P91",
  description:
    "Ceramic coating, paint protection film and full interior detailing in Indiranagar, " +
    "Bangalore — warranty-backed and bookable online in under a minute.",
  h1: "Car Detailing, PPF & Ceramic Coating Studio in Indiranagar, Bangalore",
  lede:
    "Ceramic coating, paint protection film and full interior work — done properly, " +
    "warranty-backed, and bookable online in under a minute.",
};

export const SERVICES_SEO: StaticSeoPage = {
  path: "/services",
  title: "All Car Detailing Services in Bangalore | P91 Car Care",
  // Was 228 characters on the page and a different 164-character text in the prerender.
  description:
    "Every P91 Car Care service with live prices: ceramic coating, PPF, interior and " +
    "exterior detailing, glass film and headlight restoration in Indiranagar.",
  h1: "All Services",
  lede:
    "Filter by what your vehicle is and what it needs. Prices, offers and availability are " +
    "live — the same ones you will see at checkout.",
};

export const CONTACT_SEO: StaticSeoPage = {
  path: "/contact",
  title: "Contact P91 Car Care | Indiranagar, Bangalore",
  description:
    "Call, WhatsApp or visit the P91 Car Care detailing studio in Indiranagar, Bangalore. " +
    "Opening hours, directions and enquiry form.",
  h1: "Contact us",
  lede:
    "Come to the studio, call, or send a photo of your car on WhatsApp and we'll tell you " +
    "what it needs.",
};

export const PPF_CERAMIC_SEO: StaticSeoPage = {
  path: "/ppf-ceramic-coating",
  // Was 67 characters.
  title: "PPF & Ceramic Coating in Bangalore | P91 Car Care",
  description:
    "PPF and 9H ceramic coating for cars and bikes in Bangalore. See real before-and-after " +
    "work, compare packages, and book an appointment with P91 Car Care.",
  h1: "PPF & Ceramic Coating for Cars & Bikes",
};

export const PRIVACY_SEO: StaticSeoPage = {
  path: "/privacy-policy",
  title: "Privacy Policy — P91 Car Care",
  description:
    "How P91 Car Care collects, uses and stores customer information for bookings, " +
    "payments and service reminders, and the cookies used on this site.",
  h1: "Privacy Policy",
};

export const TERMS_SEO: StaticSeoPage = {
  path: "/terms-conditions",
  title: "Terms & Conditions — P91 Car Care",
  description:
    "The terms that apply to booking and paying for detailing, ceramic coating and " +
    "paint protection film services at P91 Car Care in Indiranagar, Bangalore.",
  h1: "Terms and Conditions",
};

export const REFUND_SEO: StaticSeoPage = {
  path: "/refund-policy",
  title: "Refund Policy — P91 Car Care",
  description:
    "When booking fees are refundable, how cancellations and reschedules are handled, " +
    "and how to request a refund from P91 Car Care.",
  h1: "Refund & Cancellation Policy",
};

/** Every hand-written page the prerenderer emits, in sitemap order. */
export const STATIC_SEO_PAGES: StaticSeoPage[] = [
  HOME_SEO,
  SERVICES_SEO,
  PRIVACY_SEO,
  TERMS_SEO,
  REFUND_SEO,
  PPF_CERAMIC_SEO,
  CONTACT_SEO,
];
