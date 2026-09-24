import { Link } from "wouter";
import { Clock, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { resolveServiceImage, formatINR } from "@/lib/canonical-services";
import { formatServiceTime } from "@/lib/service-time";
import { deriveCategory } from "@/lib/service-taxonomy";
import { CARD_IMAGE_HIDDEN, ILLUSTRATIVE_SLUGS } from "@/lib/real-service-images";
import ParallaxFrame from "@/components/redesign/parallax-frame";

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
    /** Set on the grouped PPF entries on /services (lib/ppf-groups.ts). */
    fromPrice?: boolean;
    href?: string;
    priceNote?: string;
  };
}

/**
 * A service in the /services catalogue.
 *
 * Presentation only. The data (title, description, live price, was-price, duration), the link
 * (/service/:slug) and every test id are exactly what they were; what changed is that it is no
 * longer a bordered, shadowed e-commerce card. It is an image, a small mono category label, a
 * title, two lines of description and one hairline-topped price row — laid out by `.sv-*` in
 * styles/redesign.css.
 *
 * Kept from earlier passes (each is pinned by a test):
 *   - No free-text `discountText` badge. Only the "% off" computed from the real prices.
 *   - Prices are formatted (formatINR), never printed raw.
 *   - Duration goes through formatServiceTime, which omits an implausible value.
 *   - The image is the canonical resolved one, 2:1, cover, centred, lazy, alt from the title.
 *   - No <button> inside the card link.
 */
export default function ServiceCard({ service }: ServiceCardProps) {
  const cardImage = CARD_IMAGE_HIDDEN.has(service.slug) ? undefined : resolveServiceImage(service);
  const time = formatServiceTime(service);
  const price = parseFloat(service.price);
  const original = service.originalPrice ? parseFloat(service.originalPrice) : NaN;
  const discountPercent =
    Number.isFinite(original) && original > price ? Math.round(((original - price) / original) * 100) : 0;

  return (
    <Link href={service.href ?? `/service/${service.slug}`} className="sv-link">
      <div className="sv-card" data-testid={`card-service-${service.id}`}>
        {/* No real photograph for this service yet -> no picture at all (a typographic card),
            never a stand-in. See lib/real-service-images.ts. */}
        {!cardImage && (
          // No photograph for this service: a depth panel instead. The bubbles, glow and big category
          // word sit at different depths and drift at different speeds as the card scrolls past
          // (components/redesign/parallax-frame.tsx sets --px; the layers multiply it). Purely
          // decorative, and deliberately not a picture of anything.
          <ParallaxFrame className="sv-media sv-depth" strength={0.24}>
            <span className="sv-depth-glow" aria-hidden="true" />
            <span className="sv-bubble b1" aria-hidden="true" />
            <span className="sv-bubble b2" aria-hidden="true" />
            <span className="sv-bubble b3" aria-hidden="true" />
            <span className="sv-bubble b4" aria-hidden="true" />
            <span className="sv-bubble b5" aria-hidden="true" />
            <span className="sv-depth-word" aria-hidden="true">{deriveCategory(service)}</span>
          </ParallaxFrame>
        )}
        {cardImage && (
        <div className="sv-media">
          <ImageWithFallback
            src={cardImage}
            alt={`${service.title} ${ILLUSTRATIVE_SLUGS.has(service.slug) ? "(illustrative image)" : "being carried out at P91 Car Care"}`}
            width={1600}
            height={800}
            className="aspect-[2/1] object-cover object-center"
            style={{ aspectRatio: "2 / 1", objectFit: "cover", objectPosition: "center" }}
            sizes="(min-width: 940px) 520px, 100vw"
            data-testid={`img-service-${service.id}`}
          />
        </div>
        )}
        <div className="sv-body">
          <p className="sv-cat">{deriveCategory(service)}</p>
          <h3 data-testid={`text-service-title-${service.id}`}>{service.title}</h3>
          {time && (
            <p className="sv-meta" data-testid={`text-duration-${service.id}`}>
              <Clock className="i" aria-hidden="true" />
              {time}
            </p>
          )}
          <p className="sv-desc line-clamp-2" data-testid={`text-description-${service.id}`}>
            {service.description}
          </p>
          <div className="sv-foot">
            <div className="sv-prices">
              {service.fromPrice && <span className="sv-from">From</span>}
              <span className="sv-now" data-testid={`text-price-${service.id}`}>
                {service.priceNote && !service.price ? service.priceNote : formatINR(service.price)}
              </span>
              {discountPercent > 0 && (
                <span className="sv-was" data-testid={`text-original-price-${service.id}`}>
                  {formatINR(service.originalPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="sv-off" data-testid={`text-off-${service.id}`}>{discountPercent}% off</span>
              )}
            </div>
            <span className="sv-go" data-testid={`button-view-service-${service.id}`}>
              View service
              <ArrowRight className="i" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
