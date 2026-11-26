import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE } from "@web/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  // Only the production host may be crawled; staging and previews are closed.
  if (host !== new URL(SITE.origin).host) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/book/", "/admin/", "/api/admin/", "/booking-confirmation/"] }],
    sitemap: `${SITE.origin}/sitemap.xml`,
  };
}
