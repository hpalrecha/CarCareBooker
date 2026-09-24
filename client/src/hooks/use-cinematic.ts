import { useLayoutEffect } from "react";

/**
 * Scroll-linked, cinematic motion for a page: elements marked data-cine="…" get a progress
 * value --cp (0 → 1) that follows the scroll position, and CSS (styles/redesign.css, "Cinematic
 * scroll") turns that into a mask reveal, a slow zoom, or a rise-and-fade. The idea is
 * scroll-driven storytelling — the page is revealed as you move through it — not any particular
 * design.
 *
 * Modes (set on the element):
 *   data-cine="rise"   0 → 1 as the element travels up from the bottom of the viewport; the
 *                      content fades up into place. --i (an integer style) staggers siblings.
 *   data-cine="frame"  same progress, slower range; a picture is unmasked (clip-path opens up) while
 *                      it settles from a slight zoom.
 *   data-cine="zoom"   0 → 1 as the element (the hero) scrolls OUT; the photo slowly pushes in.
 *
 * How it stays calm: the value chases its target with easing (about 14% of the gap per frame), so
 * fast flicks are smoothed into slow movement; only transform, opacity and clip-path change; one
 * passive scroll listener and one requestAnimationFrame loop that stops when everything has
 * settled. Elements already on screen start in their final state, so nothing flickers on load.
 *
 * Reduced motion: no listeners at all. Every element is set to its resting state (fully revealed,
 * no zoom), so the page reads exactly as a static one. With no JavaScript, the CSS fallback
 * (var(--cp, 1)) also leaves everything visible.
 *
 * `deps` re-scan the page, for when its content changes without remounting (a package tab).
 */
type Mode = "rise" | "frame" | "zoom";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function targetFor(el: HTMLElement, mode: Mode, vh: number): number {
  const r = el.getBoundingClientRect();
  if (mode === "zoom") return clamp01(-r.top / Math.max(r.height, 1));
  if (mode === "frame") return clamp01((vh * 0.96 - r.top) / (vh * 0.62));
  return clamp01((vh * 0.94 - r.top) / (vh * 0.42));
}

export function useCinematic(deps: unknown[] = []) {
  useLayoutEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-cine]"));
    if (!els.length) return;
    const modeOf = (el: HTMLElement) => (el.dataset.cine as Mode) || "rise";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.style.setProperty("--cp", modeOf(el) === "zoom" ? "0" : "1"));
      return () => els.forEach((el) => el.style.removeProperty("--cp"));
    }

    const cur = new Map<HTMLElement, number>();
    let raf = 0;
    const vh0 = window.innerHeight;
    // Start settled: what is on screen now is shown as it should be, with no entrance on load.
    els.forEach((el) => {
      const t = targetFor(el, modeOf(el), vh0);
      cur.set(el, t);
      el.style.setProperty("--cp", t.toFixed(3));
    });

    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      let busy = false;
      for (const el of els) {
        const t = targetFor(el, modeOf(el), vh);
        let c = cur.get(el) ?? t;
        c += (t - c) * 0.14;
        if (Math.abs(t - c) < 0.002) c = t;
        else busy = true;
        cur.set(el, c);
        el.style.setProperty("--cp", c.toFixed(3));
      }
      if (busy) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      els.forEach((el) => el.style.removeProperty("--cp"));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
