import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatINR,
  resolveCanonical,
  type CanonicalService,
  type ServiceRecord,
} from "@/lib/canonical-services";

/**
 * Shared CTA button styling.
 *
 * This used to be a wrapping, data-driven label — "Get Exterior Detailing with Hard Water
 * Spot Removal - ₹2,999" — which needed `whitespace-normal` and `h-auto` because at 710px
 * it caused 336px of horizontal page scroll on a 390px phone. That fixed the overflow but
 * left the button rendering as three ragged lines, with the real price buried inside it
 * while the struck-through original sat orphaned above.
 *
 * The label is now a fixed, short string, so the price moves out of the button and into a
 * proper price row. `whitespace-nowrap` is safe again precisely BECAUSE the label is no
 * longer built from live service data — if that ever changes back, the overflow returns.
 * The full service name is kept on aria-label so the control is still self-describing for
 * screen readers and for anything that indexes accessible names.
 */
const CTA_CLASS =
  "bg-green-400 hover:bg-green-500 text-black font-bold rounded-lg shadow-md " +
  "text-sm px-5 py-2.5 h-auto whitespace-nowrap shrink-0";

interface Props {
  /** canonical ACTIVE service this offer books */
  service: CanonicalService;
  /** the live /api/services payload */
  services: ServiceRecord[] | undefined;
  /** verb used in the accessible name, e.g. "Get" -> "Get Interior Detailing Service" */
  action?: string;
  testId: string;
}

/**
 * A homepage before/after offer CTA.
 *
 * The label, the price and the destination all come from ONE resolved active service
 * record, so the card can never advertise a price the booking flow won't charge. If the
 * record cannot be resolved — deactivated, renamed, id changed — it renders a safe link to
 * the services list instead of a URL that would dead-end on "Service Not Found", which is
 * exactly what the old hardcoded slugs did.
 *
 * Renders as a fragment so the price and the button become two children of `.card-foot`,
 * whose `justify-content: space-between` then reads as a real price/action row.
 */
export default function TransformationCTA({ service, services, action = "Get", testId }: Props) {
  const row = resolveCanonical(services, service);

  if (!row) {
    return (
      <a href="/#services" className="inline-block max-w-full">
        <Button size="lg" className={CTA_CLASS} data-testid={`${testId}-fallback`}>
          Browse Services
          <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
        </Button>
      </a>
    );
  }

  const original = row.originalPrice ? parseFloat(row.originalPrice) : 0;
  const price = parseFloat(row.price);
  const showOriginal = Number.isFinite(original) && original > price;
  const savePct = showOriginal ? Math.round(((original - price) / original) * 100) : 0;

  return (
    <>
      <div className="cta-price">
        <span className="cta-price-now">{formatINR(row.price)}</span>
        {showOriginal && (
          <span className="cta-price-was" data-testid={`${testId}-original-price`}>
            {formatINR(row.originalPrice)}
          </span>
        )}
        {showOriginal && savePct >= 5 && (
          <span className="cta-price-save">Save {savePct}%</span>
        )}
      </div>
      <Link href={`/service/${row.slug}`} className="shrink-0">
        <Button
          size="lg"
          className={CTA_CLASS}
          aria-label={`${action} ${row.title.trim()} — ${formatINR(row.price)}`}
          data-testid={testId}
        >
          Book Now
          <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
        </Button>
      </Link>
    </>
  );
}
