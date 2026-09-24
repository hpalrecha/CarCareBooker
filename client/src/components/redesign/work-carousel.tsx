import { useCallback, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";

/**
 * Portfolio carousel for the service pages: one large visual at a time, a slide counter,
 * previous / next, and a title that changes with the slide.
 *
 * The interaction concept is a portfolio carousel (big image, minimal type, "01 / 03",
 * arrows) — not a copy of any particular design. It is deliberately quiet: slides cross-fade,
 * the title fades up, and nothing moves on its own (no auto-advance), so it never takes the
 * page away from someone who is reading.
 *
 * Accessibility: the region is a labelled carousel, the arrows are real buttons, left/right
 * arrow keys work anywhere inside it, off-screen slides are aria-hidden, and the title block
 * is aria-live="polite" so a screen reader announces the change. Under prefers-reduced-motion
 * the transitions are removed (see redesign.css), not the navigation.
 *
 * Every slide is REAL P91 work — the caller passes them in, and each `alt` and `note` must
 * describe only what is visible in that image.
 */
export interface WorkSlide {
  src: string;
  alt: string;
  title: string;
  note: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function WorkCarousel({
  label,
  heading,
  slides,
  testId,
}: {
  label: string;
  heading: string;
  slides: WorkSlide[];
  testId?: string;
}) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);
  const startX = useRef<number | null>(null);

  if (n === 0) return null;
  const s = slides[i];

  return (
    <section
      className="wc"
      data-tone="dark"
      aria-roledescription="carousel"
      aria-label={heading}
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
    >
      <div className="wrap wc-grid">
        <div className="wc-copy" data-cine="rise">
          <p className="ed-label">{label}</p>
          <h2 className="ed-title wc-heading">{heading}</h2>

          {/* Re-mounted by key so the fade-up plays on every change. */}
          <div className="wc-slide-copy" key={i} aria-live="polite">
            <h3 className="wc-title">{s.title}</h3>
            <p className="wc-note">{s.note}</p>
          </div>

          <div className="wc-controls">
            <span className="wc-count" aria-hidden="true">
              <b>{pad(i + 1)}</b> / {pad(n)}
            </span>
            <span className="wc-bar" aria-hidden="true">
              <i style={{ width: `${((i + 1) / n) * 100}%` }} />
            </span>
            <button type="button" className="wc-btn" onClick={() => go(i - 1)} aria-label="Previous slide" data-testid="button-work-prev">
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" className="wc-btn" onClick={() => go(i + 1)} aria-label="Next slide" data-testid="button-work-next">
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
          <span className="sr-only">
            Slide {i + 1} of {n}
          </span>
        </div>

        <div
          className="wc-stage"
          data-cine="frame"
          onPointerDown={(e) => { startX.current = e.clientX; }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
          }}
        >
          {slides.map((sl, k) => (
            <figure
              key={sl.src}
              className={"wc-slide" + (k === i ? " is-active" : "")}
              aria-hidden={k !== i}
            >
              <ImageWithFallback src={sl.src} alt={sl.alt} sizes="(min-width: 861px) 46vw, 92vw" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
