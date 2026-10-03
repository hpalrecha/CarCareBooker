import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import QuoteForm from "@/components/quote-form";

/**
 * "Get free estimate" pinned to the bottom of the screen on phones only (md and up hide it).
 * Almost all traffic is mobile, and the lead form is otherwise a scroll away. The button opens
 * the same QuoteForm the callback popup uses, so validation, the /api/ppf-leads endpoint and
 * the Meta Lead event are shared, not duplicated.
 */
export default function MobileEstimateBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0f0d]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-full bg-[#4ade80] py-3 text-base font-semibold text-black"
          data-testid="mobile-estimate-open"
        >
          Get free estimate
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Get free estimate</DialogTitle>
          <DialogDescription className="sr-only">
            Leave your name, WhatsApp number and car model. We reply with an estimate.
          </DialogDescription>
          <QuoteForm
            serviceInterest="both"
            heading="Get free estimate"
            subheading="Leave your WhatsApp number. We reply with a price."
            testId="mobile-estimate"
            onSubmitted={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
