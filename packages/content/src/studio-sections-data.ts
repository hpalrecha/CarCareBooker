/**
 * The wording of the three shared sections (How it works, Visit the studio, Reviews), in ONE place.
 *
 * components/redesign/studio-sections.tsx renders them for people, and lib/crawlable-content.ts bakes them into the first
 * HTML response for crawlers. Before this file the page held the text and the snapshot did not, so the first response of
 * the home page, /services, the guides and the service pages was missing "From estimate to handover", the reviews and the
 * studio block (Search Console: pages crawled but not indexed; the parity check on 2026-11-20 found 20 of 36 visible
 * blocks missing from the home page's first response). One source means the two can no longer drift.
 *
 * Wording is exactly what the live page showed on 2026-11-20. No price or fee appears here: the booking flow owns those.
 * No imports from React; relative imports only, because apps/api/src/vite.ts bundles this through esbuild.
 */
import { WARRANTY_HANDOVER_LINE } from "./warranty-wording";

export const HOW_IT_WORKS = {
  label: "How it works",
  title: "From estimate to handover.",
  steps: [
    { n: "Step 1", title: "Get an estimate", body: "Tell us your car and what you want done. We quote a price for your body type before you book." },
    { n: "Step 2", title: "Book a slot", body: "Pick a day online. You reserve the slot now and settle the balance at the studio." },
    { n: "Step 3", title: "Prep and fit", body: "We wash, decontaminate and prep the paint, then fit the film or coating in the bay." },
    { n: "Step 4", title: "Handover", body: `Walk round the car with us. ${WARRANTY_HANDOVER_LINE}` },
  ],
} as const;

export const VISIT_STUDIO = {
  label: "Visit us",
  title: "Visit the studio in Adugodi.",
  addressLines: ["P91 Car Care", "49, 13th Cross, Ayappa Garden, Adugodi", "Bengaluru, Karnataka 560030"],
  callLabel: "Call +91 74066 19191",
  callHref: "tel:+917406619191",
  whatsappLabel: "WhatsApp us",
  whatsappHref: "https://wa.me/917406619191",
  directionsLabel: "Get directions",
  directionsHref: "https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru",
  hoursLabel: "See opening hours →",
  hoursHref: "/contact",
} as const;

export const REVIEWS_SECTION = {
  label: "Reviews",
  title: "What owners say after pickup.",
  moreLabel: "Read reviews on Google →",
} as const;
