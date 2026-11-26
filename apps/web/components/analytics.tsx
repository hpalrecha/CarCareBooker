"use client";

import Script from "next/script";
import { useEffect } from "react";
import { TAG_IDS, classifyClick } from "@web/lib/track";
import { captureAttribution } from "@web/lib/attribution";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Ads tag, P91's GA4 property and Microsoft Clarity, loaded the way the live site loads them
 * (apps/admin/index.html): gtag() and clarity() are defined at once as queueing stubs, so nothing fired
 * early is lost, and the two third-party scripts are injected only after the page has loaded and gone
 * quiet (4 s after the load event) or on the first touch, key press or scroll, whichever comes first.
 * The tiny bootstrap below runs after hydration (next/script "afterInteractive"); it downloads nothing
 * itself, so this is lazier than next/script "lazyOnload" and keeps the live site's timing exactly.
 */
const BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${TAG_IDS.googleAds}');
gtag('config', '${TAG_IDS.ga4}');
(function (c, a) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; })(window, 'clarity');
(function () {
  var loaded = false;
  function add(src) { var t = document.createElement('script'); t.async = true; t.src = src; document.head.appendChild(t); }
  function loadTags() {
    if (loaded) return;
    loaded = true;
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (e) { window.removeEventListener(e, loadTags, true); });
    add('https://www.googletagmanager.com/gtag/js?id=${TAG_IDS.googleAds}');
    add('https://www.clarity.ms/tag/${TAG_IDS.clarity}');
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (e) {
    window.addEventListener(e, loadTags, { capture: true, passive: true, once: true });
  });
  function afterLoad() { setTimeout(loadTags, 4000); }
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad);
})();
`;

/** gtag event, queued through the stub; never throws (analytics must never cost a booking). */
function send(event: string, params: Record<string, unknown>) {
  try {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    }
    window.gtag("event", event, params);
  } catch {
    /* blocked or absent tag */
  }
}

export function Analytics() {
  useEffect(() => {
    // First-touch attribution, same localStorage key as the old booking pages (lib/attribution.ts).
    captureAttribution();
    // One delegated listener: click_call (tel:), click_whatsapp (wa.me), begin_booking (Book online -> /service/<slug>).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href");
      if (!href) return;
      const hit = classifyClick(href, window.location.pathname);
      if (hit) send(hit.event, hit.params);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <Script id="p91-tags" strategy="afterInteractive">{BOOTSTRAP}</Script>;
}
