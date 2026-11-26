import { HOME_ABOUT_H2 } from "../home-faq.ts";
import { FAQ_INTRO } from "../faq-page.ts";
import { WARRANTY_HANDOVER_LINE } from "../warranty-wording.ts";

/**
 * /contact (Plan 2b Task 5). Sources: CONTACT_SEO (static-seo.ts:78: h1 and lede, copied because static-seo.ts
 * cannot be imported by plain Node), VISIT_STUDIO (studio-sections-data.ts:26) and apps/admin/src/pages/contact.tsx
 * lines 113-221: the NAP block, the GSTIN line, the email and the map. Hours are read live from /api/business-hours
 * by the page. The old enquiry form is not carried over: the new site only reads the API (GET), never posts to it.
 */
export const CONTACT = {
  h1: "Contact us",
  lede: "Come to the studio, call, or send a photo of your car on WhatsApp and we'll tell you what it needs.",
  name: "P91 Car Care",
  addressLines: ["49, 13th Cross, Ayappa Garden", "Adugodi", "Bengaluru, Karnataka 560030", "India"],
  phone: "+91 74066 19191",
  phoneHref: "tel:+917406619191",
  whatsapp: "https://wa.me/917406619191",
  email: "info@p91carcare.com",
  gst: "Trading as Plus Nine One Inc · GSTIN 29AMIPP3288M1Z6",
  directionsHref: "https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru",
  mapEmbed: "https://www.google.com/maps?q=Adugodi,Bangalore&output=embed",
  hoursNote: "Hours are read live from the booking system.",
  hoursFallback: "Call the studio for today's hours.",
  pickup: "Pickup and drop is on request: call or WhatsApp us and we confirm it for your area on the call.",
  areas: [
    { href: "/areas/koramangala", label: "Coming from Koramangala" },
    { href: "/areas/hsr-layout", label: "Coming from HSR Layout" },
    { href: "/areas/indiranagar", label: "Coming from Indiranagar" },
  ],
};

/**
 * /about (Plan 2b Task 5). New copy from HOME_ABOUT_H2 (home-faq.ts:19), the Home about paragraph
 * (apps/admin/src/pages/home.tsx:434-446) and FAQ_INTRO[1] (faq-page.ts). Team and founding facts are [NEEDS]:
 * nothing in the codebase states them (home.tsx keeps "no founding year, counts or awards" on purpose).
 */
export const ABOUT = {
  h1: "About P91 Car Care",
  h2: HOME_ABOUT_H2,
  lede: `P91 Car Care is a car detailing, ceramic coating and paint protection film studio in Adugodi, Bangalore. Every coating and PPF job comes with written warranty terms provided at handover.`,
  intro: FAQ_INTRO[1],
  specs: [
    { k: "Studio", v: "Adugodi, Bangalore" },
    { k: "Films", v: "STEK · P91 Premium PPF" },
    { k: "Coatings", v: "Nasiol" },
    { k: "Warranty", v: "Written, issued at handover" },
  ],
  how: {
    h2: "How we work",
    items: [
      "**You see the product first.** The film roll or the coating, with its brand label and batch details, before work starts.",
      "**Paint is prepared before anything goes on it.** Wash, decontamination and correction come first, so film and coating lock in a good finish.",
      "**Work is done in the studio.** Film and coating are fitted in a controlled bay under strong light, not on the roadside.",
      `**Terms in writing.** ${WARRANTY_HANDOVER_LINE}`,
      "**No teaser prices.** Each service page explains what moves the cost; a photo on WhatsApp gets you a quote for your car.",
    ],
  },
  team: {
    h2: "The team",
    paras: ["[NEEDS: who runs the studio, the team and their roles, and since when, in the owner's words]"],
  },
  studio: {
    h2: "The studio",
    paras: [
      "The studio is at 49, 13th Cross, Ayappa Garden, Adugodi, next to Koramangala. Cars start in the wash bay for a foam pre-wash and decontamination, then move to the fitting bay, where paint is inspected and polished and film and coating go on.",
      "You are welcome to visit before you book: see the film rolls, the coating, and cars in progress.",
    ],
  },
};
