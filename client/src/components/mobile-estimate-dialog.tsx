import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import QuoteForm from "@/components/quote-form";

/**
 * The quote dialog behind the mobile estimate bar. Loaded only on first tap (see
 * mobile-estimate-bar.tsx), so the bar itself costs the first paint almost nothing.
 */
export default function MobileEstimateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onSubmitted={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
