// Global broken-image safety net.
//
// Any <img> on any page whose source fails to load is swapped once to a branded
// P91 Car Care placeholder, so a missing/dead image never shows the browser's
// broken-image icon or leaves a black gap. The one-shot guard prevents an infinite
// error->reload loop if the placeholder itself ever failed.
//
// This complements <ImageWithFallback> (used where a component manages its own
// fallback) and covers every raw <img> tag — service cards, hero, gallery,
// before/after, process steps and the booking modal — without editing each one.

import { IMAGE_PLACEHOLDER } from "@/components/image-with-fallback";

export function installGlobalImageFallback() {
  if (typeof document === "undefined") return;
  document.addEventListener(
    "error",
    (e) => {
      const el = e.target as HTMLImageElement | null;
      if (!el || el.tagName !== "IMG") return;
      if (el.dataset.fallbackApplied === "1") return;
      el.dataset.fallbackApplied = "1";
      if (!el.alt) el.alt = "P91 Car Care";
      el.src = IMAGE_PLACEHOLDER;
    },
    true, // capture phase — image load errors do not bubble
  );
}
