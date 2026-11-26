import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * XPEL-style horizontal showcase row: a scroll-snap track with a progress bar and
 * arrow buttons above it, instead of a fixed grid. Used for the homepage's category
 * tiles, featured services and results showcase.
 *
 * Native scroll (not a transform carousel) so touch/trackpad gestures, zoom and
 * reduced-motion all keep working for free — the bar and arrows are a thin layer on
 * top of a scroll container that works with no JS at all.
 */
export default function ScrollRow({ children, testId }: { children: ReactNode; testId?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  // Re-measure once real content (images, cards) has laid out, and again on resize —
  // scrollWidth at mount is unreliable before images report their intrinsic size.
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="scroll-row" data-testid={testId}>
      <div className="scroll-row-controls">
        <div className="scroll-row-bar" aria-hidden="true">
          <div className="scroll-row-fill" style={{ width: `${Math.max(6, progress * 100)}%` }} />
        </div>
        <div className="scroll-row-arrows">
          <button type="button" onClick={() => scrollBy(-1)} disabled={!canPrev} aria-label="Scroll back">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} aria-label="Scroll forward">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="scroll-row-track" ref={trackRef} onScroll={update} onLoad={update}>
        {children}
      </div>
    </div>
  );
}
