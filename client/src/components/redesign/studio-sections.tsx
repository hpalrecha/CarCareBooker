import { Link } from "wouter";
import { WARRANTY_HANDOVER_LINE } from "@/lib/warranty-wording";
import { VERIFIED_REVIEWS, GOOGLE_REVIEWS_URL, HOME_REVIEW_COUNT } from "@/lib/reviews";

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
        <p className="ed-label" data-reveal>How it works</p>
        <h2 className="ed-title ed-title-wide" data-reveal>From estimate to handover.</h2>
        <ol className="ed-steps-list" data-reveal>
          <li>
            <span className="ed-step-n">Step 1</span>
            <h3>Get an estimate</h3>
            <p>Tell us your car and what you want done. We quote a price for your body type before you book.</p>
          </li>
          <li>
            <span className="ed-step-n">Step 2</span>
            <h3>Book a slot</h3>
            <p>Pick a day online. You reserve the slot now and settle the balance at the studio.</p>
          </li>
          <li>
            <span className="ed-step-n">Step 3</span>
            <h3>Prep and fit</h3>
            <p>We wash, decontaminate and prep the paint, then fit the film or coating in the bay.</p>
          </li>
          <li>
            <span className="ed-step-n">Step 4</span>
            <h3>Handover</h3>
            <p>Walk round the car with us. {WARRANTY_HANDOVER_LINE}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}

export function VisitStudio({ id = "visit" }: { id?: string }) {
  return (
    <section className="ed-visit" id={id} data-testid="section-visit">
      <div className="wrap ed-visit-inner">
        <div>
          <p className="ed-label" data-reveal>Visit us</p>
          <h2 className="ed-title" data-reveal>Visit the studio in Adugodi.</h2>
          <address data-reveal>
            P91 Car Care<br />
            49, 13th Cross, Ayappa Garden, Adugodi<br />
            Bengaluru, Karnataka 560030
          </address>
        </div>
        <div className="ed-visit-actions" data-reveal>
          <a className="ed-visit-btn is-solid" href="tel:+917406619191">Call +91 74066 19191</a>
          <a className="ed-visit-btn" href="https://wa.me/917406619191">WhatsApp us</a>
          <a className="ed-visit-btn" href="https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru">Get directions</a>
          <Link href="/contact" className="ed-visit-link">See opening hours →</Link>
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
        <p className="ed-label" data-reveal>Reviews</p>
        <h2 className="ed-title ed-title-wide" data-reveal>What owners say after pickup.</h2>
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
        <a className="ed-link" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">Read reviews on Google →</a>
      </div>
    </section>
  );
}
