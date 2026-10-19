/**
 * What the De Dhana Dhan offer charges to hold a slot, by service.
 *
 * One rule, shared by the offer page (to show the price) and the order endpoint (to charge it), so the
 * two cannot disagree. The server is the authority: it recomputes the amount from the service it
 * loads itself and never reads a price from the request.
 *
 *   PPF services       Rs 499
 *   every other one    Rs 99
 */
export const OFFER_PRICE_STANDARD = 99;
export const OFFER_PRICE_PPF = 499;

/** PPF by slug (ppf-sedan, partial-ppf-suv, ...): the same rule the booking flow uses (server/lib/booking-amount.ts). */
export function isPpfService(service: { slug?: string | null }): boolean {
  return /(^|-)(ppf|paint-protection)(-|$)/i.test(String(service.slug ?? ""));
}

export function offerPriceFor(service: { slug?: string | null }): number {
  return isPpfService(service) ? OFFER_PRICE_PPF : OFFER_PRICE_STANDARD;
}
