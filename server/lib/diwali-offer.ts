/**
 * The Dussehra & Diwali "De Dhana Dhan" offer, as the SERVER sees it.
 *
 * The amount and the end date live here, on the server, out of the browser's reach: the order
 * endpoint charges DIWALI_OFFER.amountRupees whatever the request says, and refuses once the offer
 * has ended. Deliberately independent of site_settings.booking_amount and of resolveBookingAmount():
 * the Rs 299 booking fee, the free-booking window and campaigns are a different mechanism, and must
 * not be able to change (or be changed by) this Rs 99 slot payment.
 */
export const DIWALI_OFFER = {
  /** Stored on the lead (ppf_leads.offer_name). */
  name: "de-dhana-dhan-2026",
  /** Lead source, and the value the admin Leads tab keys its "Diwali Offer" badge on. */
  source: "diwali_offer",
  /**
   * Default slot booking amount in rupees (every service except PPF). The amount actually charged
   * depends on the chosen service: see shared/offer-pricing.ts. Not read from the request or settings.
   */
  amountRupees: 99,
  /** End of 8 Nov 2026, India time: the date printed on the poster. */
  endsAt: new Date("2026-11-08T23:59:59+05:30"),
} as const;

export function isDiwaliOfferOpen(now: Date = new Date()): boolean {
  return now.getTime() <= DIWALI_OFFER.endsAt.getTime();
}

/** The note stored with the lead so the studio knows what was bought without opening anything else. */
export const DIWALI_LEAD_MESSAGE =
  "De Dhana Dhan (Dussehra & Diwali) offer: free dash cam, sun film, sound damping and ceramic coating " +
  "with premium brand PPF. Slot booking: ₹499 for PPF services, ₹99 for all other services. Valid till 8 Nov 2026.";
