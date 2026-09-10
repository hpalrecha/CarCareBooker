import { useCampaign } from "@/hooks/use-campaign";
import { useBookingOffer } from "@/hooks/use-booking-offer";
import { formatINR } from "@/lib/canonical-services";

/**
 * One line in the hero that reconciles "free" with the price beside it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE PROBLEM THIS SOLVES.
 *
 * At 390px the first screen showed a large price and a button reading "Book Free
 * Appointment", and nothing else. The block explaining that the BOOKING is free while the
 * service is paid at the studio sat ~990px down, well below the fold.
 *
 * So an ad visitor's first impression was a number and a contradiction. Either they
 * distrust the page, or they arrive at the studio expecting free work. Both are worse
 * than the offer not existing.
 *
 * This is deliberately ONE LINE. It is not a second offer block and must not become one —
 * the full block, with the countdown and the campaign's own wording, stays lower on the
 * page where there is room for it. This exists only to make the first viewport
 * self-consistent.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * `servicePrice` is required, for the same structural reason as CampaignOffer: this
 * component cannot render the words "Booking is free" without also rendering the real
 * amount, because both come from the same input. A future edit cannot quietly drop half
 * of the sentence.
 *
 * Renders nothing when no offer is running — a page with no offer should not carry a
 * strip explaining one. Fails closed while loading, like every other offer surface.
 */

interface HeroOfferStripProps {
  /** Route, used to resolve the campaign for this page. */
  landingPage: string;
  /** Live catalogue price of the service currently selected. Required. */
  servicePrice: string | number | undefined;
  "data-testid"?: string;
}

export default function HeroOfferStrip({
  landingPage,
  servicePrice,
  "data-testid": testId = "hero-offer-strip",
}: HeroOfferStripProps) {
  const { campaign, isFreeBooking } = useCampaign(landingPage);
  const legacy = useBookingOffer();

  // Same precedence as CampaignOffer: an active free_booking campaign, else the legacy
  // free_booking_until setting, else nothing. One authority, consulted twice.
  const offerRunning = (campaign !== null && isFreeBooking) || legacy.free;

  const price = formatINR(servicePrice);
  if (!offerRunning || !price) return null;

  return (
    <p className="lp-offer-strip" data-testid={testId}>
      <span className="lp-offer-strip-free">Booking is free</span>
      <span className="lp-offer-strip-sep" aria-hidden="true"> · </span>
      <span className="lp-offer-strip-paid">{price} paid at the studio</span>
    </p>
  );
}
