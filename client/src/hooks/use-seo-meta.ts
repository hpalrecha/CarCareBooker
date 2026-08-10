import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description?: string;
  /** absolute or root-relative image path for og:image */
  image?: string;
  /** JSON-LD object rendered into a script[type="application/ld+json"] */
  structuredData?: Record<string, unknown>;
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
export function useSeoMeta({ title, description, image, structuredData }: SeoMeta) {
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

    let ld: HTMLScriptElement | null = null;
    if (structuredData) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.dataset.seo = "route";
      ld.textContent = JSON.stringify(structuredData);
      document.head.appendChild(ld);
    }

    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      ld?.remove();
    };
  }, [title, description, image, JSON.stringify(structuredData ?? null)]);
}
