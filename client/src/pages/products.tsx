import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { PRODUCT_BRANDS, PRODUCT_FINE_PRINT } from "@/lib/nav-menu";
import { PRODUCTS_SEO } from "@/lib/static-seo";

/**
 * Dedicated page for the brands the Products header dropdown already links to — until
 * now that content only existed inside the hover panel, with no page a visitor could
 * land on directly or share a link to. Same data source (`nav-menu.ts`) as the
 * dropdown, so the two stay in sync — except:
 *
 *   - "P91 Premium PPF" is filtered out HERE ONLY (2026-09-23, by request). It's P91's
 *     own product line, not a third-party brand the rest of this page is about, so it
 *     stays in the header dropdown (still a real, bookable destination there) but is
 *     dropped from this specific listing.
 *   - STEK and Nasiol are `external: true` (see nav-menu.ts): a real `<a>` to the
 *     manufacturer's own site in a new tab, not a wouter `<Link>` — a client-side Link
 *     expects an internal path and cannot navigate to an external URL.
 */
export default function Products() {
  useSeoMeta({
    title: PRODUCTS_SEO.title,
    description: PRODUCTS_SEO.description,
    image: "/Car Care (4)_1753951564515.png",
  });

  const brands = PRODUCT_BRANDS.filter((b) => b.name !== "P91 Premium PPF");

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h1>Products</h1>
            <p>The film and coating brands we fit, and what each one is for.</p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {brands.map((b) =>
              b.external ? (
                <a
                  key={b.name}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mega-brand"
                  data-testid={`link-product-${b.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <b>{b.name}</b>
                  <span>{b.tagline}</span>
                </a>
              ) : (
                <Link key={b.name} href={b.href} className="mega-brand" data-testid={`link-product-${b.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <b>{b.name}</b>
                  <span>{b.tagline}</span>
                </Link>
              ),
            )}
          </div>

          <p className="mega-fineprint" style={{ marginTop: 24 }}>{PRODUCT_FINE_PRINT}</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
