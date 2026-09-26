import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackPromotion } from "@/lib/offer-tracking";
import { trackFestivalOffer } from "@/lib/meta-pixel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
        <img src={o.image} alt={o.alt} className="gl-fest-img" width={1080} height={1350} loading="lazy" />
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

/**
 * Opens on every full page load (including a refresh), a couple of seconds after arrival, and not
 * again while the visitor moves between pages in the app. Once closed, a small sticky chip (bottom-left, opposite the WhatsApp button) keeps the offer one tap
 * away and reopens the popup, so closing it never loses the offer.
 */
export function FestivalOfferPopup() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { parts, done } = useOfferCountdown();
  useEffect(() => {
    if (done || !festivalOfferActive()) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      reportOffer("view", "popup");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [done]);
  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setDismissed(true);
  };
  // Both clocks must agree it is still on: the visitor's (cheap, immediate) and the server's (true).
  if (done || !festivalOfferActive()) return null;
  const o = FESTIVAL_OFFER;
  const left = parts[0].value > 0 ? `${parts[0].value}d left` : `${parts[1].value}h left`;
  return (
    <>
    {dismissed && !open && (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          reportOffer("select", "chip", "open");
        }}
        aria-label={`Open the ${o.title}, ends ${o.validTill}`}
        data-testid="festival-offer-chip"
        className="fixed bottom-[18px] left-3 z-[44] flex items-center gap-2 rounded-full border border-[#ffd27a]/50 bg-[#120a26]/95 py-2 pl-2.5 pr-3.5 text-left text-white shadow-lg backdrop-blur transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd27a]"
      >
        <span aria-hidden="true" className="text-lg leading-none">🪔</span>
        <span className="grid leading-tight">
          <span className="text-[13px] font-semibold">Diwali offer</span>
          <span className="text-[11px] text-[#ffd27a]">{left}</span>
        </span>
      </button>
    )}
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-[440px] overflow-hidden rounded-2xl border-0 bg-[#0b0f0d] p-0"
        data-testid="festival-offer-popup"
      >
        <DialogTitle className="sr-only">{o.title}</DialogTitle>
        <DialogDescription className="sr-only">{o.alt}</DialogDescription>
        <img src={o.image} alt={o.alt} className="block max-h-[54vh] w-full object-contain" width={1080} height={1350} />
        <div className="px-3 pt-3">
          <p className="mb-1.5 text-center text-xs font-medium uppercase tracking-widest text-[#ffd27a]">Offer ends in</p>
          <FestivalCountdown className="fest-count-sm" />
        </div>
        <div className="flex gap-2 p-3">
          <a
            href={o.bookHref}
            className="flex min-h-[46px] flex-1 items-center justify-center rounded-full bg-[#4EB848] px-4 text-sm font-semibold text-white"
            onClick={() => {
              reportOffer("select", "popup", "book");
              close(false);
            }}
          >
            Book this offer
          </a>
          <a
            href={o.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[46px] flex-1 items-center justify-center rounded-full border border-white/30 px-4 text-sm font-semibold text-white"
            onClick={() => reportOffer("select", "popup", "whatsapp")}
          >
            WhatsApp us
          </a>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
