import { Link } from "wouter";
import { VERIFIED_REVIEWS, GOOGLE_REVIEWS_URL, HOME_REVIEW_COUNT } from "@p91/content/reviews";
import { HOW_IT_WORKS, VISIT_STUDIO, REVIEWS_SECTION } from "@p91/content/studio-sections-data";

/**
 * Two sections shared by every page that should read like the home page: the four-step "How it
 * works" and the dark "Visit the studio" band. They were inline in home.tsx; they live here so the
 * services, products and guides pages carry the same blocks with the same wording and cannot drift.
 *
 * No price or fee is quoted in either (the booking flow owns those figures). The address and phone
 * match the footer and the Google Business Profile; opening hours live on /contact (read from the
 * booking system), so they are linked, not repeated.
 */

export function HowItWorks({ id = "how-it-works" }: { id?: string }) {
  return (
    <section className="ed-steps" id={id} data-testid="section-steps">
      <div className="wrap">
        <p className="ed-label" data-reveal>{HOW_IT_WORKS.label}</p>
        <h2 className="ed-title ed-title-wide" data-reveal>{HOW_IT_WORKS.title}</h2>
        <ol className="ed-steps-list" data-reveal>
          {HOW_IT_WORKS.steps.map((st) => (
            <li key={st.n}>
              <span className="ed-step-n">{st.n}</span>
              <h3>{st.title}</h3>
              <p>{st.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function VisitStudio({ id = "visit" }: { id?: string }) {
  const v = VISIT_STUDIO;
  return (
    <section className="ed-visit" id={id} data-testid="section-visit">
      <div className="wrap ed-visit-inner">
        <div>
          <p className="ed-label" data-reveal>{v.label}</p>
          <h2 className="ed-title" data-reveal>{v.title}</h2>
          <address data-reveal>
            {v.addressLines.map((line, i) => (
              <span key={line}>
                {line}
                {i < v.addressLines.length - 1 && <br />}
              </span>
            ))}
          </address>
        </div>
        <div className="ed-visit-actions" data-reveal>
          <a className="ed-visit-btn is-solid" href={v.callHref}>{v.callLabel}</a>
          <a className="ed-visit-btn" href={v.whatsappHref}>{v.whatsappLabel}</a>
          <a className="ed-visit-btn" href={v.directionsHref}>{v.directionsLabel}</a>
          <Link href={v.hoursHref} className="ed-visit-link">{v.hoursLabel}</Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Verified Google reviews, copied word for word into lib/reviews.ts. Renders nothing while that list is
 * empty, so no placeholder or invented review can ever reach the page. No star rating, count or
 * Review/AggregateRating markup is drawn here (see the note in lib/reviews.ts).
 */
export function Reviews() {
  if (VERIFIED_REVIEWS.length === 0) return null;
  return (
    <section className="ed-reviews" id="reviews" data-testid="section-reviews">
      <div className="wrap">
        <p className="ed-label" data-reveal>{REVIEWS_SECTION.label}</p>
        <h2 className="ed-title ed-title-wide" data-reveal>{REVIEWS_SECTION.title}</h2>
        <ul className="ed-reviews-list" data-reveal>
          {VERIFIED_REVIEWS.slice(0, HOME_REVIEW_COUNT).map((r) => (
            <li key={r.name + r.text.slice(0, 24)}>
              <blockquote>
                <p>{"\u201C"}{r.text}{"\u201D"}</p>
                <footer>
                  <strong>{r.name}</strong>
                  {(r.vehicle || r.service) && <span>{[r.vehicle, r.service].filter(Boolean).join(" · ")}</span>}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
        <a className="ed-link" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">{REVIEWS_SECTION.moreLabel}</a>
      </div>
    </section>
  );
}
