import { Link } from "wouter";
import { Clock, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { resolveServiceImage, formatINR } from "@/lib/canonical-services";
import { formatServiceTime } from "@/lib/service-time";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: string;
    originalPrice?: string;
    duration: number;
    images?: string[];
    discountText?: string;
  };
}

/**
 * A service in the /services catalogue grid.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED (Phase 2, same data and link):
 *   - The red photo badge showed the record's free-text `discountText` ("Limited Time -
 *     50% OFF!", "🔥 MEGA SAVINGS: ₹9,000 OFF!"). It repeated the discount already shown
 *     beside the price, and "limited time" named no end date. Removed; the quiet "% off"
 *     tag beside the price, computed from the real prices, stays.
 *   - `text-neon-green`, `hover:border-neon-green`, `text-deep-black` generate NO CSS in
 *     this project (see tailwind.config.ts). The price rendered white instead of green, and
 *     the "View Service" label rendered near-white on the green button — unreadable. Colours
 *     now read the CSS variable directly.
 *   - Prices were printed raw ("₹6000.00"); now formatted ("₹6,000").
 *   - Duration assumed minutes, so the full-body PPF records (which hold 2, 3, 4) showed
 *     "2 minutes". It now uses the shared formatter, which omits an implausible value.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function ServiceCard({ service }: ServiceCardProps) {
  const time = formatServiceTime(service);
  const price = parseFloat(service.price);
  const original = service.originalPrice ? parseFloat(service.originalPrice) : NaN;
  const discountPercent =
    Number.isFinite(original) && original > price ? Math.round(((original - price) / original) * 100) : 0;

  return (
    <Link href={`/service/${service.slug}`}>
      <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 transition-colors duration-300 hover:border-[var(--neon-green)]">
        {/* One 2:1 image band on every card. aspect-ratio (not a fixed height) reserves
            the box from the card's width alone, so the row height is known before the
            image loads and the grid never shifts. */}
        <ImageWithFallback
          src={resolveServiceImage(service)}
          alt={`${service.title} being carried out at P91 Car Care`}
          width={1600}
          height={800}
          className="block w-full aspect-[2/1] object-cover object-center bg-[#1a1a1a] transition-transform duration-300 group-hover:scale-105"
          data-testid={`img-service-${service.id}`}
        />
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3
              className="text-xl font-semibold transition-colors group-hover:text-[var(--neon-green)]"
              data-testid={`text-service-title-${service.id}`}
            >
              {service.title}
            </h3>
            <div className="shrink-0 text-right">
              {discountPercent > 0 && (
                <div className="mb-1 flex items-center justify-end gap-2">
                  <span className="text-sm text-gray-500 line-through" data-testid={`text-original-price-${service.id}`}>
                    {formatINR(service.originalPrice)}
                  </span>
                  <span className="rounded border border-white/15 px-1.5 py-0.5 text-xs font-semibold text-[var(--neon-green)]">
                    {discountPercent}% off
                  </span>
                </div>
              )}
              <span className="block text-lg font-bold text-[var(--neon-green)]" data-testid={`text-price-${service.id}`}>
                {formatINR(service.price)}
              </span>
            </div>
          </div>
          <p className="mb-4 line-clamp-2 text-gray-300" data-testid={`text-description-${service.id}`}>
            {service.description}
          </p>
          <div className="flex items-center justify-between gap-3">
            {time ? (
              <span className="flex items-center text-sm text-gray-400" data-testid={`text-duration-${service.id}`}>
                <Clock className="mr-1 h-4 w-4" aria-hidden="true" />
                {time}
              </span>
            ) : (
              <span />
            )}
            <span
              className="inline-flex min-h-[40px] items-center rounded-[10px] bg-[var(--neon-green)] px-4 text-sm font-bold text-black transition group-hover:brightness-95"
              data-testid={`button-view-service-${service.id}`}
            >
              View Service
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
