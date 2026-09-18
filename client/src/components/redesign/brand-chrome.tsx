import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";

/**
 * The site's header and footer for pages that are not themselves inside `.p91x`.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * The approved header/footer styles live in styles/redesign.css, all scoped under `.p91x`.
 * Pages built with Tailwind (service pages, /services, /ppf-ceramic-coating, policies)
 * cannot wrap themselves in `.p91x` — it also styles generic classes like .grid and would
 * rewrite their layouts. So each piece of chrome gets its OWN `.p91x` scope here.
 *
 * `display: contents` matters: the wrapper generates no box, so the header's
 * `position: sticky` is measured against the page rather than against a wrapper exactly
 * as tall as the header (which would stop it sticking at all), while inherited properties
 * — the brand font and colour — still pass through to the header and footer.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export function BrandHeader({ onBookNow }: { onBookNow?: () => void }) {
  return (
    <div className="p91x" style={{ display: "contents" }}>
      <SiteHeader onBookNow={onBookNow} />
    </div>
  );
}

export function BrandFooter() {
  return (
    <div className="p91x" style={{ display: "contents" }}>
      <SiteFooter />
    </div>
  );
}
