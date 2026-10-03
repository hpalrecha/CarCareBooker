import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { trackPromotion } from "@/lib/offer-tracking";
import { trackFestivalOffer } from "@/lib/meta-pixel";
import { ImageWithFallback } from "@/components/image-with-fallback";

/**
 * The Dussehra & Diwali "De Dhana Dhan" offer, exactly as the studio posted it on Instagram and
 * Facebook: free dash cam, sun film, sound damping and ceramic coating with a premium-brand PPF
 * installation, slot booking at ₹99, valid till 8 Nov 2026. Everything below is that post's
 * wording. The block and the pop-up both stop rendering once the end date has passed, so the site
 * never advertises an expired offer.
 */
export const FESTIVAL_OFFER = {
  image: "/attached_assets/offers/de-dhana-dhan-diwali-2026.webp",
  alt: "Happy Dussehra and Diwali, De Dhana Dhan offer from P91 Car Care: free dash cam, sun film, sound damping and ceramic coating on premium brand paint protection film installation. Book your slot at just ₹99. Valid till 8th November 2026. Terms and conditions apply.",
  title: "De Dhana Dhan offer",
  kicker: "Dussehra & Diwali",
  freebies: ["Dash cam", "Sun film", "Sound damping", "Ceramic coating"],
  condition: "Free with any premium brand paint protection film installation.",
  slot: "Book your slot for just ₹99.",
  validTill: "8 November 2026",
  /** End of 8 Nov 2026, India time. */
  endsAt: new Date("2026-11-08T23:59:59+05:30"),
  bookHref: "/offer/de-dhana-dhan",
  whatsappHref:
    "https://wa.me/917406619191?text=" +
    encodeURIComponent("Hi P91, I saw the Dussehra & Diwali De Dhana Dhan offer and want to book a slot."),
  callHref: "tel:+917406619191",
};

const OFFER_ID = "de-dhana-dhan-2026";
type Slot = "popup" | "banner" | "chip" | "page";

/** One call reports the same moment to Google (GA4/Ads) and Meta. Never throws. */
export function reportOffer(kind: "view" | "select", slot: Slot, cta?: string): void {
  try {
    trackPromotion({ kind, promotionId: OFFER_ID, promotionName: FESTIVAL_OFFER.title, slot, cta });
    trackFestivalOffer({ kind: kind === "view" ? "view" : "click", slot, cta, offer: OFFER_ID });
  } catch {
    // Measurement must never get in the way of the offer.
  }
}

export const festivalOfferActive = (now = new Date()) => now.getTime() <= FESTIVAL_OFFER.endsAt.getTime();

/**
 * Time left until the offer ends. The clock is the server's, not the visitor's: /api/campaigns/active
 * reports serverNow, and the gap to the browser clock is applied, so a phone with a wrong date still
 * shows the true time left. If that request fails the browser clock is used.
 */
export function useOfferCountdown() {
  const { data } = useQuery<{ serverNow?: string }>({
    queryKey: ["/api/campaigns/active?landingPage=/gallery"],
    staleTime: Infinity,
    retry: false,
  });
  const [skew, setSkew] = useState(0);
  useEffect(() => {
    const server = data?.serverNow ? Date.parse(data.serverNow) : NaN;
    if (!Number.isNaN(server)) setSkew(server - Date.now());
  }, [data]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, FESTIVAL_OFFER.endsAt.getTime() - (now + skew));
  const secs = Math.floor(left / 1000);
  return {
    done: left <= 0,
    parts: [
      { label: "Days", value: Math.floor(secs / 86400) },
      { label: "Hours", value: Math.floor((secs % 86400) / 3600) },
      { label: "Mins", value: Math.floor((secs % 3600) / 60) },
      { label: "Secs", value: secs % 60 },
    ],
  };
}

export function FestivalCountdown({ className = "" }: { className?: string }) {
  const { parts } = useOfferCountdown();
  return (
    <div className={"fest-count " + className} role="timer" aria-label={"Offer ends " + FESTIVAL_OFFER.validTill} data-testid="festival-countdown">
      {parts.map((p) => (
        <div key={p.label} className="fest-count-cell">
          <b>{String(p.value).padStart(2, "0")}</b>
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A single-line pill for the top of a page (homepage hero): what the offer is and the price, linking to the
 * offer page. Shares the banner's rules: it renders nothing once the offer has ended (server clock and
 * visitor clock), so the site never advertises an expired offer.
 */
export function FestivalOfferStrip() {
  const { done } = useOfferCountdown();
  const [, navigate] = useLocation();
  if (done || !festivalOfferActive()) return null;
  const o = FESTIVAL_OFFER;
  return (
    <a
      href={o.bookHref}
      className="hero-offer-pill"
      data-testid="hero-offer-pill"
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        reportOffer("select", "banner", "hero_pill");
        navigate(o.bookHref);
      }}
    >
      <span aria-hidden="true">🪔</span>
      <span>
        <strong>Dussehra &amp; Diwali offer:</strong> free dash cam, sun film, sound damping &amp; ceramic coating with PPF. Book your slot for ₹99
      </span>
      <span aria-hidden="true" className="hero-offer-arrow">→</span>
    </a>
  );
}

/** The offer as a page section: poster beside the details. */
export function FestivalOfferBanner() {
  const { done } = useOfferCountdown();
  useEffect(() => {
    if (!done && festivalOfferActive()) reportOffer("view", "banner");
  }, [done]);
  if (done || !festivalOfferActive()) return null;
  const o = FESTIVAL_OFFER;
  return (
    <section id="festival-offer" className="gl-fest" data-testid="festival-offer">
      <div className="wrap gl-fest-row">
        <ImageWithFallback src={o.image} alt={o.alt} className="gl-fest-img" width={1080} height={1350} loading="lazy" sizes="(min-width: 940px) 50vw, 100vw" />
        <div className="gl-fest-copy">
          <p className="gl-fest-kicker">{o.kicker} · Limited time</p>
          <h2>{o.title}</h2>
          <p className="gl-fest-lead">{o.condition}</p>
          <p className="gl-fest-ends">Offer ends in</p>
          <FestivalCountdown />
          <ul className="gl-fest-list">
            {o.freebies.map((f) => (
              <li key={f}>
                <span>Free</span> {f}
              </li>
            ))}
          </ul>
          <p className="gl-fest-slot">
            {o.slot} <small>Valid till {o.validTill}. Terms and conditions apply.</small>
          </p>
          <div className="gl-cta-row gl-fest-actions">
            <a href={o.bookHref} className="gl-btn gl-btn-solid" onClick={() => reportOffer("select", "banner", "book")}>Book this offer</a>
            <a href={o.whatsappHref} target="_blank" rel="noopener noreferrer" className="gl-btn gl-btn-light" onClick={() => reportOffer("select", "banner", "whatsapp")}>WhatsApp us</a>
            <a href={o.callHref} className="gl-btn gl-btn-light" onClick={() => reportOffer("select", "banner", "call")}>Call 74066 19191</a>
          </div>
        </div>
      </div>
    </section>
  );
}

