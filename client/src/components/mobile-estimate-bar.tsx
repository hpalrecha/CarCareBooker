import { lazy, Suspense, useState } from "react";

/**
 * "Get free estimate" pinned to the bottom of the screen on phones only (md and up hide it).
 * Almost all traffic is mobile, and the lead form is otherwise a scroll away. The button opens
 * the same QuoteForm the callback popup uses, so validation, the /api/ppf-leads endpoint and
 * the Meta Lead event are shared, not duplicated. The dialog code loads on first tap.
 */
const EstimateDialog = lazy(() => import("@/components/mobile-estimate-dialog"));

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
          Get Free Estimate
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <EstimateDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
