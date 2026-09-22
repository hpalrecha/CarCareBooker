import { Link } from "wouter";
import { Clock, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { resolveServiceImage, formatINR } from "@/lib/canonical-services";
import { formatServiceTime } from "@/lib/service-time";
import { deriveCategory } from "@/lib/service-taxonomy";

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
      {/* Same .card/.card-img/.card-body/.card-foot pattern the site already uses for
          home.tsx's teaser cards, so the catalogue grid matches the rest of the site
          instead of carrying its own one-off Tailwind card. */}
      <div className="card" data-testid={`card-service-${service.id}`}>
        <div className="card-img">
          {/* Catalogue cards carry more (title, description, duration, price) than the
              lighter homepage teasers, so they keep their own taller 2:1 crop rather than
              the shared .card-img default of 4:1 — className for the aspect/fit/position
              utilities plus a matching inline style, since the inline style is what
              actually wins over the shared 4:1 rule's higher CSS specificity. */}
          <ImageWithFallback
            src={resolveServiceImage(service)}
            alt={`${service.title} being carried out at P91 Car Care`}
            width={1600}
            height={800}
            className="aspect-[2/1] object-cover object-center"
            style={{ aspectRatio: "2 / 1", objectFit: "cover", objectPosition: "center" }}
            sizes="(min-width: 940px) 380px, (min-width: 600px) 50vw, 100vw"
            data-testid={`img-service-${service.id}`}
          />
          <span className="card-cat">{deriveCategory(service)}</span>
          {discountPercent > 0 && (
            <span className="card-save" data-testid={`text-off-${service.id}`}>{discountPercent}% off</span>
          )}
        </div>
        <div className="card-body">
          <h3 data-testid={`text-service-title-${service.id}`}>{service.title}</h3>
          {time && (
            <p className="card-note" data-testid={`text-duration-${service.id}`} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock className="i" aria-hidden="true" />
              {time}
            </p>
          )}
          <p className="card-note line-clamp-2" data-testid={`text-description-${service.id}`}>
            {service.description}
          </p>
          <div className="card-foot">
            <div className="prices">
              {discountPercent > 0 && (
                <span className="was" data-testid={`text-original-price-${service.id}`}>
                  {formatINR(service.originalPrice)}
                </span>
              )}
              <span className="now" data-testid={`text-price-${service.id}`}>
                {formatINR(service.price)}
              </span>
            </div>
            <span className="go" data-testid={`button-view-service-${service.id}`}>
              View Service
              <ArrowRight className="i" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
