import type { MetadataRoute } from "next";
import { PAGES } from "@p91/content/site/registry";
import { SITE } from "@web/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: new URL(p.path, SITE.origin).toString(), lastModified: p.lastmod, changeFrequency: p.changefreq ?? "monthly" }));
}
