import { useEffect, useState } from "react";

export interface HeroVideoGateOptions {
  /**
   * Autoplay on viewports under 769px too. Default false: the shared exterior-detailing
   * clip (home.tsx, campaign-landing.tsx) is a 61MB produced promo edit, unfit for mobile
   * data. The per-service reels (service-landing.tsx) are ~5-7MB — small enough, and the
   * studio's own reels play on mobile Instagram anyway — so those pages opt in.
   */
  allowMobile?: boolean;
  /**
   * Skip the idle/timeout wait and start loading as soon as this mounts. Default false,
   * for genuine first-paint/LCP entries (home, and any page a customer can land on
   * directly from search or ads) where the video must not compete with first paint.
   * `true` suits a page reached mostly by an already-idle app's internal navigation,
   * where that wait only holds the static photo on screen for no reason before a video
   * that was always going to autoplay anyway.
   */
  immediate?: boolean;
}

/**
 * Gate for autoplaying a hero background video, shared by the homepage hero and the
 * service-page hero image panel.
 *
 * Starts `false` (server/prerendered HTML renders the photo only — no video in what a
 * crawler or first paint sees). Flips to `true` client-side, and only when ALL hold:
 *   - viewport is >= 769px, unless `allowMobile` is set.
 *   - prefers-reduced-motion is not set.
 *   - the page has reached load and gone idle (requestIdleCallback, or a timeout on
 *     browsers without it) — unless `immediate` is set, which skips this wait entirely.
 * The photo underneath is unaffected either way: if any condition is false, if
 * autoplay is blocked, or the file is still downloading, the visitor sees the photo.
 */
export function useHeroVideoGate(options: HeroVideoGateOptions = {}): boolean {
  const { allowMobile = false, immediate = false } = options;
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!allowMobile && window.innerWidth < 769) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const enable = () => setShow(true);
    if (immediate) {
      enable();
      return;
    }
    const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    const id = ric ? ric(enable) : window.setTimeout(enable, 1500);
    return () => {
      const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (ric && cic) cic(id);
      else window.clearTimeout(id);
    };
  }, [allowMobile, immediate]);
  return show;
}
