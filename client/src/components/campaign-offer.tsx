import { useState } from "react";
import CampaignCountdown from "@/components/campaign-countdown";
import { useCampaign } from "@/hooks/use-campaign";
import { useBookingOffer, formatOfferEnd } from "@/hooks/use-booking-offer";
import { formatINR } from "@/lib/canonical-services";

/**
 * The free-booking offer block: what the offer is, when it ends, and what the service
 * still costs.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE WORDING RULE, ENFORCED BY STRUCTURE.
 *
 * The offer is that BOOKING is free. The ceramic coating, the PPF, the detailing — those
 * are charged as normal at the studio.
 *
 * The price is not an optional prop. This component cannot render a "Booking Is Free"
 * headline without also rendering the real service price beside it, because both come
 * from the same required input. That is deliberate: on a page selling a ₹45,000 service,
 * "FREE" with a countdown under it and no price anywhere is a customer who arrives
 * expecting free PPF. Making the price structurally inseparable from the claim means a
 * future edit cannot quietly drop it.
 *
 * The price itself comes from the live catalogue record the caller resolved — never from
 * a constant here — so what this block shows is what checkout charges.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * FALLBACK ORDER
 *
 *   1. an active campaign for this landing page   -> campaign wording + real countdown
 *   2. no campaign, but legacy free_booking_until -> the existing offer copy, no countdown
 *   3. neither                                    -> renders nothing at all
 *
 * Case 2 is why the legacy hook is still consulted. free_booking_until is what is
 * currently live in production, and it has no end INSTANT — only a date — so it gets the
 * existing "free until 16 September" phrasing rather than a fabricated timer. Inventing a
 * countdown for it would mean choosing an end time the server never agreed to.
 *
 * Case 3 renders null rather than a placeholder. A page with no offer should look like a
 * page with no offer.
 */

interface CampaignOfferProps {
  /** Route this block is on, e.g. "/ceramic-coating/car". Selects the campaign. */
  landingPage: string;
  /** Live catalogue price, in rupees, of the service being advertised. Required. */
  servicePrice: string | number | undefined;
  /** Catalogue title, e.g. "1 Year Ceramic Coating". Used in the price line. */
  serviceTitle?: string;
  /** Rendered as the primary action. The caller owns opening the booking modal. */
  onBook: () => void;
  "data-testid"?: string;
}

export default function CampaignOffer({
  landingPage,
  servicePrice,
  serviceTitle,
  onBook,
  "data-testid": testId = "campaign-offer",
}: CampaignOfferProps) {
  const { campaign, serverOffsetMs, isFreeBooking } = useCampaign(landingPage);
  const legacy = useBookingOffer();

  /**
   * Set when the countdown reaches zero mid-visit.
   *
   * Without this, a customer who had the page open as the campaign ended would keep
   * seeing the offer until they reloaded — and could then submit a booking the server
   * charges for. The client cannot end an offer on its own authority, but it must stop
   * ADVERTISING one the moment its own corrected clock says the deadline has passed.
   */
  const [expiredLive, setExpiredLive] = useState(false);

  const priceLabel = formatINR(servicePrice);
  const showCampaign = campaign !== null && isFreeBooking && !expiredLive;
  const showLegacy = !showCampaign && legacy.free;

  if (!showCampaign && !showLegacy) return null;

  const legacyEnds = formatOfferEnd(legacy.until);

  return (
    <section className="offer" data-testid={testId} aria-labelledby={`${testId}-title`}>
      <p className="offer-eyebrow">Limited-time offer</p>

      <h2 className="offer-title" id={`${testId}-title`} data-testid={`${testId}-title`}>
        {showCampaign ? campaign!.offerTitle : "Booking Is Free"}
      </h2>

      {showCampaign && campaign!.offerDescription && (
        <p className="offer-desc">{campaign!.offerDescription}</p>
      )}

      {showCampaign ? (
        <CampaignCountdown
          endsAt={campaign!.endsAt}
          serverOffsetMs={serverOffsetMs}
          onExpire={() => setExpiredLive(true)}
          data-testid={`${testId}-countdown`}
        />
      ) : (
        // No end instant exists for the legacy setting — only a date — so this states the
        // date instead of inventing a timer the server never agreed to.
        legacyEnds && (
          <p className="offer-until" data-testid={`${testId}-legacy-until`}>
            Free booking until {legacyEnds}
          </p>
        )
      )}

      {/*
        The price line. Structurally inseparable from the claim above it — see the header.
        "Book free" and the real amount, in one sentence, so neither can be read alone.
      */}
      {priceLabel && (
        <p className="offer-price" data-testid={`${testId}-price`}>
          <strong>Book free</strong>
          <span className="offer-price-sep" aria-hidden="true"> · </span>
          <span className="offer-price-amount">{priceLabel} at the studio</span>
        </p>
      )}

      <p className="offer-fine" data-testid={`${testId}-clarifier`}>
        The booking is free — nothing to pay online to reserve your slot.
        {serviceTitle ? ` ${serviceTitle}` : " The service"} is charged as normal at the
        studio after the work.
      </p>

      <button type="button" className="cta-lg offer-cta" onClick={onBook} data-testid={`${testId}-cta`}>
        {showCampaign ? campaign!.ctaText : "Book Free Appointment"}
      </button>
    </section>
  );
}
