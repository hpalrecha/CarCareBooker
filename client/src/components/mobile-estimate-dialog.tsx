import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import QuoteForm from "@/components/quote-form";

/**
 * The quote dialog behind the mobile estimate bar. Loaded only on first tap (see
 * mobile-estimate-bar.tsx), so the bar itself costs the first paint almost nothing.
 */
export default function MobileEstimateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* QuoteForm draws its own card, so the shell is a plain solid fill with no border of its own (the card was translucent and let the page show through). */}
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-[#0b0f0d] p-0 shadow-none [&>button[data-testid=button-close-modal]]:text-white [&>button[data-testid=button-close-modal]]:opacity-100">
        <DialogTitle className="sr-only">Get Free Estimate</DialogTitle>
        <DialogDescription className="sr-only">
          Leave your name, WhatsApp number and car model. We reply with an estimate.
        </DialogDescription>
        <QuoteForm
          serviceInterest="both"
          heading="Get Free Estimate"
          subheading="Leave your WhatsApp number. We reply with a price."
          submitLabel="Get Free Estimate"
          testId="mobile-estimate"
          onSubmitted={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
