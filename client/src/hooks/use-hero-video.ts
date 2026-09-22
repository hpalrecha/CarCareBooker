import { useEffect, useState } from "react";

/**
 * Gate for autoplaying a hero background video, shared by the homepage hero and the
 * service-page hero image panel.
 *
 * Starts `false` (server/prerendered HTML renders the photo only — no video in what a
 * crawler or first paint sees). Flips to `true` client-side, and only when ALL hold:
 *   - viewport is >= 769px. The studio's only approved footage is large source files
 *     with no compressed variant, so autoplaying over mobile data is not offered —
 *     mobile keeps the same photo it renders today.
 *   - prefers-reduced-motion is not set.
 *   - the page has reached load and gone idle (requestIdleCallback, or a timeout on
 *     browsers without it), so the fetch competes with nothing on the critical path.
 * The photo underneath is unaffected either way: if any condition is false, if
 * autoplay is blocked, or the file is still downloading, the visitor sees the photo.
 */
export function useHeroVideoGate(): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 769) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const enable = () => setShow(true);
    const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    const id = ric ? ric(enable) : window.setTimeout(enable, 1500);
    return () => {
      const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (ric && cic) cic(id);
      else window.clearTimeout(id);
    };
  }, []);
  return show;
}
