import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatINR,
  resolveCanonical,
  type CanonicalService,
  type ServiceRecord,
} from "@/lib/canonical-services";

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
      <a href="/#services">
        <Button
          size="lg"
          className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg"
          data-testid={`${testId}-fallback`}
        >
          Browse Our Services
          <ArrowRight className="ml-2 w-6 h-6" />
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
      <Link href={`/service/${row.slug}`}>
        <Button
          size="lg"
          className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg"
          data-testid={testId}
        >
          {action} {row.title.trim()} - {formatINR(row.price)}
          <ArrowRight className="ml-2 w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
