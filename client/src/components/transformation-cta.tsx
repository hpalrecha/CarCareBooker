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
 * `whitespace-normal` and `h-auto` are the load-bearing parts. shadcn's Button base class
 * includes `whitespace-nowrap` and a fixed height, and these labels are built from a LIVE
 * service title — "Get Exterior Detailing with Hard Water Spot Removal - ₹2,999" is 710px
 * on one line. Inside a 358px column on a 390px phone that produced 336px of horizontal
 * page scroll, and because the toast viewport is `fixed w-full`, it then stretched to the
 * same 726px and looked like the culprit.
 *
 * Measured on production before the change: scrollWidth 726 at a 390px viewport, on both
 * the deployed site and this build. So this fixes a pre-existing mobile bug rather than
 * one introduced by the redesign — but the redesign must not ship it either.
 *
 * The padding and text size step down on small screens for the same reason: the label
 * length is data-driven and cannot be assumed short.
 */
const CTA_CLASS =
  "bg-green-400 hover:bg-green-500 text-black font-bold shadow-lg " +
  "text-base sm:text-xl px-6 sm:px-12 py-4 sm:py-6 " +
  "max-w-full whitespace-normal h-auto text-center";

interface Props {
  /** canonical ACTIVE service this offer books */
  service: CanonicalService;
  /** the live /api/services payload */
  services: ServiceRecord[] | undefined;
  /** verb for the button, e.g. "Get" -> "Get Interior Detailing Service - ₹2,499" */
  action?: string;
  testId: string;
}

/**
 * A homepage before/after offer CTA.
 *
 * The label, the price and the destination all come from ONE resolved active service
 * record, so the button can never advertise a price the booking flow won't charge. If
 * the record cannot be resolved — deactivated, renamed, id changed — the CTA renders a
 * safe link to the services list instead of a URL that would dead-end on "Service Not
 * Found", which is exactly what the old hardcoded slugs did.
 */
export default function TransformationCTA({ service, services, action = "Get", testId }: Props) {
  const row = resolveCanonical(services, service);

  if (!row) {
    return (
      <a href="/#services" className="inline-block max-w-full">
        <Button
          size="lg"
          className={CTA_CLASS}
          data-testid={`${testId}-fallback`}
        >
          Browse Our Services
          <ArrowRight className="ml-2 w-6 h-6 shrink-0" />
        </Button>
      </a>
    );
  }

  const original = row.originalPrice ? parseFloat(row.originalPrice) : 0;
  const price = parseFloat(row.price);
  const showOriginal = Number.isFinite(original) && original > price;

  return (
    <div className="space-y-4">
      {showOriginal && (
        <div className="text-gray-400 line-through text-lg" data-testid={`${testId}-original-price`}>
          Original Price: {formatINR(row.originalPrice)}
        </div>
      )}
      <Link href={`/service/${row.slug}`} className="inline-block max-w-full">
        <Button
          size="lg"
          className={CTA_CLASS}
          data-testid={testId}
        >
          {action} {row.title.trim()} - {formatINR(row.price)}
          <ArrowRight className="ml-2 w-6 h-6 shrink-0" />
        </Button>
      </Link>
    </div>
  );
}
