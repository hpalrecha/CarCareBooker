import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description?: string;
  /** absolute or root-relative image path for og:image */
  image?: string;
  /**
   * JSON-LD rendered into script[type="application/ld+json"].
   *
   * Accepts an array as well as a single object, because a service page legitimately
   * describes more than one thing — a Service, and the FAQPage its accordion represents.
   * Each entry becomes its own script tag, which is what Google's documentation
   * recommends over cramming unrelated types into one graph.
   */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  /**
   * Root-relative path for <link rel="canonical">, e.g. "/service/car-polishing".
   *
   * Without one, every query-string variant of a URL (utm_source from an ad, fbclid from
   * a Facebook click) is a separate URL to a crawler, splitting ranking signals across
   * duplicates of the same page. Passed as a path rather than a full URL so it cannot
   * accidentally point a staging host's canonical at production.
   */
  canonicalPath?: string;
}

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Sets the document title, description, Open Graph tags and JSON-LD for a route.
 *
 * service-landing.tsx previously rendered `<title>` and `<meta>` as JSX inside the page
 * body. React 18 does not hoist those into <head> (that is a React 19 feature), so they
 * were inert elements in the document body and the tab kept whatever title was already
 * set. Everything here is written into <head> imperatively and cleaned up on unmount.
 */
export function useSeoMeta({ title, description, image, structuredData, canonicalPath }: SeoMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const created: HTMLElement[] = [];
    const track = (el: HTMLElement, wasNew: boolean) => {
      if (wasNew) created.push(el);
      return el;
    };

    const setMeta = (attr: "name" | "property", key: string, value?: string) => {
      if (!value) return;
      const selector = `meta[${attr}="${key}"]`;
      const existing = document.head.querySelector<HTMLMetaElement>(selector);
      const el = upsert(selector, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, key);
        return m;
      }) as HTMLMetaElement;
      track(el, !existing);
      el.setAttribute("content", value);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    if (image) {
      const absolute = image.startsWith("http") ? image : `${window.location.origin}${image}`;
      setMeta("property", "og:image", absolute);
      setMeta("name", "twitter:image", absolute);
    }
    setMeta("property", "og:url", window.location.href);

    // Canonical. Replaced rather than duplicated: two canonical tags on one page make
    // the signal ambiguous and Google may ignore both.
    let canonicalEl: HTMLLinkElement | null = null;
    let canonicalPrevious: string | null = null;
    if (canonicalPath) {
      const href = canonicalPath.startsWith("http")
        ? canonicalPath
        : `${window.location.origin}${canonicalPath}`;
      const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (existing) {
        canonicalPrevious = existing.getAttribute("href");
        existing.setAttribute("href", href);
      } else {
        canonicalEl = document.createElement("link");
        canonicalEl.rel = "canonical";
        canonicalEl.href = href;
        document.head.appendChild(canonicalEl);
      }
    }

    const blocks = structuredData
      ? Array.isArray(structuredData)
        ? structuredData
        : [structuredData]
      : [];
    const ldNodes = blocks.map((block) => {
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.dataset.seo = "route";
      ld.textContent = JSON.stringify(block);
      document.head.appendChild(ld);
      return ld;
    });

    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      ldNodes.forEach((el) => el.remove());
      canonicalEl?.remove();
      if (canonicalPrevious !== null) {
        document.head
          .querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.setAttribute("href", canonicalPrevious);
      }
    };
  }, [title, description, image, canonicalPath, JSON.stringify(structuredData ?? null)]);
}
