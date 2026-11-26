import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * A frame whose picture drifts a little slower than the page as it scrolls past: depth, not
 * motion for its own sake. The frame clips (overflow hidden) and CSS makes its <img> 16% taller
 * than the box, so the drift never shows an edge. Only transform is animated; layout is untouched.
 *
 * It sets one CSS variable (--px) on the frame from the frame's position in the viewport, once per
 * animation frame, while the frame is on screen. Nothing runs when it is off screen, and nothing
 * runs at all under prefers-reduced-motion (the picture just sits still, correctly cropped).
 *
 * `strength` is the drift as a fraction of the frame's height at its extremes: 0.08 moves the
 * picture at most 8% of the frame's height either way. Keep it small.
 */
export default function ParallaxFrame({
  as: Tag = "div",
  className = "",
  strength = 0.08,
  cine,
  children,
}: {
  as?: ElementType;
  className?: string;
  strength?: number;
  /** Also take part in the page's cinematic scroll motion (hooks/use-cinematic.ts). */
  cine?: "rise" | "frame" | "zoom";
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 as the frame enters from below, 0 when centred, +1 as it leaves at the top.
      const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      el.style.setProperty("--px", `${(-t * strength * r.height).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.removeProperty("--px");
    };
  }, [strength]);

  return (
    <Tag ref={ref} className={"px-frame " + className} data-cine={cine}>
      {children}
    </Tag>
  );
}
