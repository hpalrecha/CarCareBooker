import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";

/**
 * The studio's own social carousels, embedded in the article they belong to.
 *
 * A NOTE ON WHY THIS IS NOT JUST A ROW OF <img>.
 *
 * Every slide is a picture OF TEXT. To a crawler and to a screen reader that is worth
 * exactly nothing, so three things are load-bearing here and none of them are decorative:
 *
 *   alt        carries that slide's real words, supplied per slide by the post.
 *   prose      the surrounding article says the same thing in indexable copy. The
 *              carousel illustrates the article; it is never the only place the claim
 *              lives. This is what keeps the post rankable.
 *   loading    every slide is lazy and none is marked priority. These carousels always
 *              sit mid-article, below the fold, and eleven 4:5 images competing with the
 *              article hero would cost the page its LCP for content nobody has scrolled
 *              to yet.
 *
 * Scrolling is native CSS scroll-snap rather than a transform carousel: it keeps the
 * touch/trackpad gesture the platform already provides, survives zoom and reduced-motion,
 * and needs no measurement on resize. The buttons drive the same scroll container, so
 * mouse, keyboard, touch and screen reader all move one thing.
 */
export default function SlideCarousel({
  dir,
  caption,
  slides,
  testId,
  variant = "article",
  autoAdvanceMs = 0,
}: {
  /** Folder under attached_assets/carousels/. Slides are 01.jpg, 02.jpg, ... in order. */
  dir: string;
  caption: string;
  /** Alt text per slide. Its length is the slide count — there is no second number. */
  slides: string[];
  testId?: string;
  /**
   * "article" peeks the next slide so the row reads as scrollable.
   * "hero" shows one slide at a time, filling the column it is given.
   */
  variant?: "article" | "hero";
  /** Milliseconds between automatic advances. 0 disables it entirely. */
  autoAdvanceMs?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Hero carousels (the ad landing pages) mount a slide's image only once the visitor is within one slide of it.
  // Mounting all six at load made the phone download ~250 KB of slides nobody had seen yet, competing with the
  // first slide (the LCP element) and the scripts. Once a slide has been reached its image stays mounted.
  // Article carousels keep their native lazy loading, unchanged.
  const lazyMount = variant === "hero";
  const [reached, setReached] = useState<Set<number>>(() => new Set([0, 1]));
  useEffect(() => {
    if (!lazyMount) return;
    setReached((prev) => {
      const next = new Set(prev);
      for (const i of [index - 1, index, index + 1]) if (i >= 0 && i < slides.length) next.add(i);
      return next.size === prev.size ? prev : next;
    });
  }, [index, lazyMount, slides.length]);

  /** Derive the current slide from scroll position, so gestures and buttons agree. */
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.scrollWidth / slides.length;
    if (slideWidth <= 0) return;
    const next = Math.round(el.scrollLeft / slideWidth);
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, [slides.length]);

  /** Wraps when the carousel auto-advances, so the arrows agree with the timer. */
  const wraps = autoAdvanceMs > 0;
  const goTo = useCallback(
    (next: number) => {
      const el = trackRef.current;
      if (!el) return;
      const n = slides.length;
      const target = wraps ? ((next % n) + n) % n : Math.max(0, Math.min(n - 1, next));
      el.scrollTo({ left: (el.scrollWidth / n) * target, behavior: "smooth" });
      setIndex(target);
    },
    [slides.length, wraps],
  );

  /** Arrow keys, but only while the track itself has focus — never hijacked page-wide. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  /**
   * Automatic advance, deliberately conservative.
   *
   * It stops for anyone who has asked it to: prefers-reduced-motion turns it off outright,
   * and it pauses on hover, on focus anywhere inside, and while the tab is hidden. It also
   * wraps back to the first slide rather than stopping at the end, because a hero carousel
   * that quietly dies on slide 11 looks broken.
   *
   * Interacting with the arrows does not permanently disable it — the pointer/focus
   * handlers already cover the case where someone is reading, and killing it for the rest
   * of the session on one click surprises people who just wanted to skip ahead.
   */
  useEffect(() => {
    if (!autoAdvanceMs || slides.length < 2 || paused) return;
    if (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        const el = trackRef.current;
        if (el) el.scrollTo({ left: (el.scrollWidth / slides.length) * next, behavior: "smooth" });
        return next;
      });
    }, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [autoAdvanceMs, paused, slides.length]);

  if (!slides.length) return null;

  return (
    <figure
      className={`slide-car slide-car--${variant}`}
      data-testid={testId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="slide-car-track"
        ref={trackRef}
        onScroll={onScroll}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={caption}
      >
        {slides.map((alt, i) => (
          <div className="slide-car-item" key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            {lazyMount && !reached.has(i) ? (
              <div className="slide-car-ph" style={{ aspectRatio: "4 / 5" }} aria-hidden="true" />
            ) : (
            <ImageWithFallback
              src={`/attached_assets/carousels/${dir}/${String(i + 1).padStart(2, "0")}.jpg`}
              alt={alt}
              width={1600}
              height={2000}
              // The first hero slide is the page's LCP element: load it eagerly at high priority (the
              // prerendered <head> preloads the same file, see scripts/prerender.mjs).
              priority={lazyMount && i === 0}
              // The article column is 760px at most, so telling the browser 100vw would
              // make it fetch the 1600w variant on a phone and undo the ladder.
              sizes="(min-width: 800px) 700px, 92vw"
              data-testid={`img-slide-${dir}-${i + 1}`}
            />
            )}
          </div>
        ))}
      </div>

      <div className="slide-car-bar">
        <button
          type="button"
          className="slide-car-btn"
          onClick={() => goTo(index - 1)}
          disabled={!wraps && index === 0}
          aria-label="Previous slide"
          data-testid={`btn-slide-prev-${dir}`}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <figcaption>
          {caption} <span className="slide-car-count">{index + 1} / {slides.length}</span>
        </figcaption>

        <button
          type="button"
          className="slide-car-btn"
          onClick={() => goTo(index + 1)}
          disabled={!wraps && index === slides.length - 1}
          aria-label="Next slide"
          data-testid={`btn-slide-next-${dir}`}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </figure>
  );
}
