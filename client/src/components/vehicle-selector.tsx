import { formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { displayableIncludes, type CategoryOption } from "@/lib/landing-pages";

/**
 * Body-category picker for services priced by vehicle size.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THIS IS A SERVICE PICKER, NOT A PRICE PICKER.
 *
 * Each button selects a catalogue ROW (ppf-hatchback / ppf-sedan / ppf-suv). The package
 * name and the price are then read off that row. There is no category -> price object
 * anywhere in the frontend, which is what makes it impossible for this page to advertise
 * a figure checkout will not charge.
 *
 * A category whose catalogue row is missing or inactive is not rendered. Showing a button
 * that leads to "Service Not Found" is worse than showing three options instead of four,
 * and paid traffic is exactly the wrong audience to discover that with.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Implemented as a radiogroup rather than a row of buttons: it is a single-choice control
 * over a small set, which is what radio semantics describe. Arrow keys move between
 * options for free, and a screen reader announces "2 of 3" rather than reading three
 * unrelated buttons.
 */

interface VehicleSelectorProps {
  categories: CategoryOption[];
  /** Live catalogue rows, keyed by slug. */
  bySlug: Map<string, ServiceRecord>;
  selectedKey: string;
  onSelect: (category: CategoryOption) => void;
  /** Suppress the duration line — see the PPF data note in lib/landing-pages.ts. */
  hideDuration?: boolean;
  /**
   * Render the included-items list. Default true, so existing usage is unchanged.
   *
   * Passed false in the hero: the page already has a dedicated "What the job includes"
   * section reading the same catalogue field, and repeating it in the hero would both
   * duplicate the content and push the CTA below the fold.
   */
  showIncludes?: boolean;
  /** Tighter treatment for use inside the hero. */
  compact?: boolean;
}

export default function VehicleSelector({
  categories,
  bySlug,
  selectedKey,
  onSelect,
  hideDuration,
  showIncludes = true,
  compact = false,
}: VehicleSelectorProps) {
  // Only categories whose catalogue row actually exists and is bookable.
  const available = categories.filter((c) => bySlug.has(c.serviceSlug));
  if (available.length === 0) return null;

  const selected = available.find((c) => c.key === selectedKey) ?? available[0];
  const service = bySlug.get(selected.serviceSlug);

  // Only a genuine discount. Partial PPF rows have price === originalPrice, and rendering
  // a struck-through figure identical to the live one invents a saving that does not exist.
  const price = service ? parseFloat(String(service.price)) : NaN;
  const wasPrice = service?.originalPrice ? parseFloat(String(service.originalPrice)) : NaN;
  const hasRealDiscount =
    Number.isFinite(price) && Number.isFinite(wasPrice) && wasPrice > price;

  return (
    <div className={compact ? "vsel vsel-compact" : "vsel"} data-testid="vehicle-selector">
      <p className="vsel-q" id="vsel-label">
        Choose your car
      </p>

      <div className="vsel-opts" role="radiogroup" aria-labelledby="vsel-label">
        {available.map((category) => {
          const isSelected = category.key === selected.key;
          return (
            <button
              key={category.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`vsel-opt${isSelected ? " is-on" : ""}`}
              onClick={() => onSelect(category)}
              data-testid={`vehicle-option-${category.key}`}
            >
              <span className="vsel-opt-label">{category.label}</span>
              {/* Examples help a customer self-identify. Not exhaustive, and not a promise
                  that only these models qualify. */}
              <span className="vsel-opt-eg">{category.examples}</span>
            </button>
          );
        })}
      </div>

      {service && (
        <div className="vsel-pkg" data-testid="vehicle-package" aria-live="polite">
          {/* The PACKAGE NAME comes from the catalogue row, never from the button label —
              so if the business renames a package, this follows without a code change. */}
          <p className="vsel-pkg-name" data-testid="vehicle-package-name">
            {service.title.trim()}
          </p>

          <p className="vsel-pkg-price">
            <span className="vsel-pkg-now" data-testid="vehicle-package-price">
              {formatINR(service.price)}
            </span>
            {hasRealDiscount && (
              <span className="vsel-pkg-was" data-testid="vehicle-package-was">
                <span className="sr-only">Previous price </span>
                {formatINR(service.originalPrice)}
              </span>
            )}
          </p>

          {/* Duration is suppressed for PPF: the catalogue holds 2/3/4 in a minutes field
              for full PPF, which would render as "2 minutes" beside a ₹45,000 price. */}
          {!hideDuration && Number.isFinite(Number(service.duration)) && Number(service.duration) > 0 && (
            <p className="vsel-pkg-meta">Approx. {Math.round(Number(service.duration) / 60)} hours in the studio</p>
          )}

          {showIncludes && displayableIncludes(service.whatIncluded).length > 0 && (
            <ul className="vsel-pkg-inc" data-testid="vehicle-package-includes">
              {displayableIncludes(service.whatIncluded).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
