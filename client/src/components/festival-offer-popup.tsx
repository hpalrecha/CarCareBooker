import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { FESTIVAL_OFFER, FestivalCountdown, festivalOfferActive, reportOffer, useOfferCountdown } from "@/components/festival-offer";

/**
 * Opens on every full page load (including a refresh), a couple of seconds after arrival, and not
 * again while the visitor moves between pages in the app. The offer also stays in the hero strip.
 */
export function FestivalOfferPopup() {
  const [open, setOpen] = useState(false);
  const { done } = useOfferCountdown();
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
  };
  // Both clocks must agree it is still on: the visitor's (cheap, immediate) and the server's (true).
  if (done || !festivalOfferActive()) return null;
  const o = FESTIVAL_OFFER;
  return (
    <>
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="left-3 right-3 top-1/2 mx-auto w-auto max-w-[440px] translate-x-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border-0 bg-[#0b0f0d] p-0 [&_picture]:block"
        data-testid="festival-offer-popup"
      >
        <DialogTitle className="sr-only">{o.title}</DialogTitle>
        <DialogDescription className="sr-only">{o.alt}</DialogDescription>
        <div className="w-full min-w-0">
          <ImageWithFallback src={o.image} alt={o.alt} className="block max-h-[54vh] w-full object-contain" width={1080} height={1350} sizes="(max-width: 480px) 90vw, 440px" />
        </div>
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
