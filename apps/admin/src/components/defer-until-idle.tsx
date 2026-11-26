import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts its children after the first paint instead of with it.
 *
 * The ad landing pages are long (a dozen sections, galleries, FAQs). Rendering all of it in the first React pass
 * delays the first paint of what the visitor actually sees, the hero and its LCP image, by the whole page's render
 * time. This renders only the hero first, then the rest once the browser is idle, or at once if the visitor
 * scrolls or touches the page first. The prerendered HTML snapshot still carries the page's text for crawlers.
 *
 * `minHeight` keeps the page's scroll height from collapsing in the meantime.
 */
export default function DeferUntilIdle({ children, minHeight = 0 }: { children: ReactNode; minHeight?: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const go = () => setReady(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const hasIdle = typeof w.requestIdleCallback === "function";
    const id = hasIdle ? w.requestIdleCallback!(go, { timeout: 1500 }) : window.setTimeout(go, 400);
    const events = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    return () => {
      if (hasIdle) w.cancelIdleCallback?.(id);
      else window.clearTimeout(id);
      events.forEach((e) => window.removeEventListener(e, go));
    };
  }, [ready]);

  if (!ready) return minHeight ? <div aria-hidden="true" style={{ minHeight }} /> : null;
  return <>{children}</>;
}
