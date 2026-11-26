import { BOOKING_FAMILIES, BOOKING_LINKS } from "../../../packages/content/src/site/booking-links.ts";

/**
 * Analytics for the new site (Plan 3 Task 4). Pure functions only: the client component
 * (components/analytics.tsx) wires them to one delegated click listener; tests import them
 * with plain Node, so relative imports carry `.ts` and no path aliases are used here.
 */

/**
 * The tags the live site loads (apps/admin/index.html): the Google Ads tag and the Clarity
 * project, plus P91's own GA4 property. The Just Signs GA4 stream is deliberately absent:
 * the old site only reached it through Google-side destinations of the Ads tag, and the new
 * site configures P91's property alone.
 */
export const TAG_IDS = {
  googleAds: "AW-11467752288",
  ga4: "G-D3QRLWNCY5",
  clarity: "yezkqr1rwm",
} as const;

export type PageContext = { page_type: string; service_family: string | null; area: string | null };

const PAGE_TYPES: Array<[RegExp, string]> = [
  [/^\/$/, "home"],
  [/^\/services$/, "services_hub"],
  [/^\/services\//, "service"],
  [/^\/areas\//, "area"],
  [/^\/brands(\/|$)/, "brand"],
  [/^\/guides(\/|$)/, "guide"],
];

/** Where a click happened: page type, the service family of a service page, the area of an area page. */
export function pageContext(pathname: string): PageContext {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page_type = PAGE_TYPES.find(([re]) => re.test(path))?.[1] ?? (path.split("/")[1] || "other");
  let service_family: string | null = null;
  if (page_type === "service") service_family = BOOKING_LINKS[path] ?? path.split("/").pop() ?? null;
  const area = page_type === "area" ? path.split("/")[2] ?? null : null;
  return { page_type, service_family, area };
}

const FAMILY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(BOOKING_FAMILIES).map(([family, slug]) => [slug, family]),
);

/** The gtag event for a clicked link, or null when the link is not tracked. */
export function classifyClick(href: string, pathname: string): { event: string; params: PageContext } | null {
  const ctx = pageContext(pathname);
  if (href.startsWith("tel:")) return { event: "click_call", params: ctx };
  let url: URL;
  try { url = new URL(href, "https://p91carcare.com"); } catch { return null; }
  if (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com") return { event: "click_whatsapp", params: ctx };
  const m = /^\/service\/([a-z0-9-]+)\/?$/.exec(url.pathname);
  if (m && url.hostname === "p91carcare.com") {
    return { event: "begin_booking", params: { ...ctx, service_family: FAMILY_BY_SLUG[m[1]] ?? ctx.service_family } };
  }
  return null;
}
