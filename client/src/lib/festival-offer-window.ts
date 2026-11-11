/**
 * When the "De Dhana Dhan" (Dussehra & Diwali) offer ends: the end of 8 November 2026, India time.
 *
 * The page, its search metadata and its structured data must stop presenting the offer as available once this instant
 * has passed. The same instant also lives in server/lib/diwali-offer.ts (the server refuses orders after it) and in
 * components/festival-offer.tsx (the countdown); tests/offer-expiry.test.mjs fails if the three ever disagree.
 *
 * No imports, so the prerenderer, the page and the structured-data builder can all use it.
 */
export const FESTIVAL_OFFER_ENDS_AT = new Date("2026-11-08T23:59:59+05:30");

export function festivalOfferHasEnded(now: Date = new Date()): boolean {
  return now.getTime() > FESTIVAL_OFFER_ENDS_AT.getTime();
}
