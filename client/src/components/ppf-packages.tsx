import { Check, ShieldCheck } from "lucide-react";
import type { ServiceRecord } from "@/lib/canonical-services";
import { buildPpfPackages, studioTimeLine, type PpfBodyKey, type PpfCatalogueRow } from "@/lib/ppf-packages";
import { WARRANTY_HANDOVER_LINE } from "@/lib/warranty-wording";

/**
 * Basic and Premium PPF side by side on /ppf: two clearly separated sections, three vehicle-specific
 * prices in each, every price visible without a click.
 *
 * Everything shown is read from the six live catalogue rows by lib/ppf-packages.ts (the same builder
 * the server uses for the first-response HTML). This component writes no price, warranty term, film
 * name or specification of its own. It shows no previous price and no discount label.
 *
 * Installation time and booking are kept apart on purpose. The studio time is the catalogue's own words
 * for how long the car is in the studio; the button only opens the booking modal, where the customer
 * picks a date and time. Nothing here says when a car is ready.
 */
interface PpfPackagesProps {
  rows: ServiceRecord[] | undefined;
  /** Open the booking modal for this catalogue row. The page keeps the existing modal and its tracking. */
  onBook: (pkg: { slug: string; bodyKey: PpfBodyKey }) => void;
}

export default function PpfPackages({ rows, onBook }: PpfPackagesProps) {
  const tiers = buildPpfPackages(rows as unknown as PpfCatalogueRow[] | undefined);
  if (!tiers) return null;

  return (
    <section className="section lp-packages" data-testid="section-ppf-packages" aria-labelledby="ppf-packages-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="ppf-packages-h">Choose your PPF package</h2>
          {tiers.length === 2 && (
            <p className="lp-packages-lede">
              Two packages, each priced for hatchbacks, sedans and SUVs. Highlighted lines are where the two differ.
            </p>
          )}
        </div>

        {tiers.map((tier) => {
          const headingId = `ppf-tier-${tier.key}-h`;
          const shared = studioTimeLine(tier.sharedStudioTime);
          return (
            <section
              key={tier.key}
              className={`lp-tier lp-tier--${tier.key}`}
              aria-labelledby={headingId}
              data-testid={`ppf-tier-${tier.key}`}
            >
              <header className="lp-tier-head">
                <h3 id={headingId}>{tier.label}</h3>
                {tier.warrantyYears && (
                  <span className="lp-tier-warranty" data-testid={`ppf-tier-warranty-${tier.key}`}>
                    <ShieldCheck className="i" aria-hidden="true" />
                    {tier.warrantyYears}-year warranty
                  </span>
                )}
              </header>

              {tier.includes.length > 0 && (
                <ul className="lp-tier-inc" data-testid={`ppf-tier-includes-${tier.key}`}>
                  {tier.includes.map((item) => (
                    <li key={item} className={tier.differsFromOther.includes(item) ? "is-diff" : undefined}>
                      <Check className="i" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="lp-pkg-grid">
                {tier.cards.map((card) => {
                  const time = tier.sharedStudioTime ? null : studioTimeLine(card.studioTime);
                  return (
                    <article className="lp-pkg" key={card.slug} data-testid={`ppf-package-${card.slug}`}>
                      <h4>{card.bodyLabel}</h4>
                      <p className="lp-pkg-eg">{card.examples}</p>
                      <p className="lp-pkg-price" data-testid={`ppf-package-price-${card.slug}`}>
                        {card.priceLabel}
                      </p>
                      {time && <p className="lp-pkg-time">{time}</p>}
                      <button
                        type="button"
                        className="lp-pkg-book"
                        onClick={() => onBook({ slug: card.slug, bodyKey: card.bodyKey })}
                        aria-label={`Book ${tier.label} for a ${card.bodyLabel.toLowerCase()}`}
                        data-testid={`ppf-book-${card.slug}`}
                      >
                        Book a slot
                      </button>
                    </article>
                  );
                })}
              </div>

              {shared && (
                <p className="lp-tier-time" data-testid={`ppf-tier-time-${tier.key}`}>
                  <b>Installation:</b> {shared}
                </p>
              )}
            </section>
          );
        })}

        <p className="lp-packages-note">
          {WARRANTY_HANDOVER_LINE}
        </p>
      </div>
    </section>
  );
}
