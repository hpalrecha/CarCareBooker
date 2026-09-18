import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import QuoteForm from "@/components/quote-form";
import {
  CALLBACK_DELAY_MS,
  CALLBACK_MAX_WAIT_MS,
  CALLBACK_RETRY_MS,
  callbackAlreadyRequested,
  callbackPopupAlreadyShown,
  markCallbackPopupShown,
  markCallbackRequested,
  mayShowCallbackPopup,
} from "@/lib/callback-popup-state";

/**
 * "Prefer a call?" as a popup on the service pages.
 *
 * It replaced an inline form section that read as an odd one out on the page. The form is
 * the same QuoteForm — same validation, same /api/ppf-leads endpoint, same Meta Lead event
 * on success — so this only changes where it appears, not what it does. The rules for WHEN
 * it may open live in lib/callback-popup-state.ts.
 *
 * A real (Radix) dialog, unlike the non-modal challenge invitation: this one holds a form,
 * so it needs the focus trap and Escape handling a dialog provides.
 */
export default function CallbackPopup({
  serviceTitle,
  serviceSlug,
  isBikeService,
}: {
  serviceTitle: string;
  serviceSlug: string;
  isBikeService: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Cheap exits: already shown this visit, or they already asked for a call.
    if (callbackPopupAlreadyShown() || callbackAlreadyRequested()) return;

    let waited = 0;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      if (!mayShowCallbackPopup()) {
        // Another popup or the booking form is open. Wait for it, within reason.
        waited += CALLBACK_RETRY_MS;
        if (waited >= CALLBACK_MAX_WAIT_MS || callbackPopupAlreadyShown() || callbackAlreadyRequested()) return;
        timer = setTimeout(attempt, CALLBACK_RETRY_MS);
        return;
      }
      markCallbackPopupShown();
      setOpen(true);
    };
    timer = setTimeout(attempt, CALLBACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [serviceSlug]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Solid shell behind the QuoteForm card: the card's own background is 70% opaque (it
          was designed to sit on the page), and on a transparent shell the page text showed
          straight through it. */}
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-xl overflow-hidden rounded-2xl border-0 bg-gray-950 p-0 shadow-2xl"
        data-testid="callback-popup"
      >
        {/* QuoteForm draws the visible "Prefer a call?" heading; these name the dialog for
            screen readers. */}
        <DialogTitle className="sr-only">Prefer a call?</DialogTitle>
        <DialogDescription className="sr-only">
          Leave your number and the studio will call you about {serviceTitle}.
        </DialogDescription>
        <QuoteForm
          serviceTitle={serviceTitle}
          serviceSlug={serviceSlug}
          serviceInterest={serviceSlug.includes("ppf") ? "ppf" : serviceSlug.includes("ceramic") ? "ceramic" : "both"}
          defaultVehicleType={isBikeService ? "bike" : "car"}
          heading="Prefer a call?"
          subheading="No payment now — leave your number and we'll call to fix the slot."
          testId="service-quote"
          lockVehicleType
          columns
          onSubmitted={markCallbackRequested}
        />
      </DialogContent>
    </Dialog>
  );
}
