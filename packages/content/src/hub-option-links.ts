/**
 * The plain "All <service> options" link list on the /services/:slug hub pages, pointed at CANONICAL URLs.
 *
 * Several catalogue records are consolidated near-duplicates whose /service/:slug page names another URL as canonical
 * (lib/canonical-overrides.ts): the six PPF size variants -> /ppf, the two ceramic records -> /ceramic-coating/car and
 * /ceramic-coating/bike. The hubs used to link to those /service/:slug pages, which sent internal links to URLs that tell Google
 * to index something else. This links to the canonical page instead:
 *   - one link per distinct canonical target (six PPF rows -> one link to /ppf);
 *   - a target that stands for one record keeps that record's own title as its anchor (the car and the bike ceramic pages);
 *   - a target shared by several records uses `sharedLabel` (the page's own approved landing label), falling back to the first title.
 * Records that are not consolidated (e.g. windshield glass coating) keep their own /service/:slug link and title.
 *
 * Used by the hub page (pages/seo-service-page.tsx) and its crawlable HTML (lib/crawlable-content.ts), so both list the same links.
 * Relative imports only: apps/api/src/vite.ts and the prerender bundle import this.
 */
import { consolidatedTargetPath } from "./canonical-overrides";

export interface HubOptionLink {
  /** The first record behind this link; used for stable test ids. */
  slug: string;
  href: string;
  label: string;
}

export function hubOptionLinks(
  options: ReadonlyArray<{ slug: string; title: string }>,
  sharedLabel?: string | null,
): HubOptionLink[] {
  const count = new Map<string, number>();
  for (const o of options) {
    const href = consolidatedTargetPath(o.slug);
    count.set(href, (count.get(href) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const out: HubOptionLink[] = [];
  for (const o of options) {
    const href = consolidatedTargetPath(o.slug);
    if (seen.has(href)) continue;
    seen.add(href);
    const shared = (count.get(href) ?? 0) > 1;
    out.push({ slug: o.slug, href, label: shared && sharedLabel ? sharedLabel : o.title });
  }
  return out;
}
