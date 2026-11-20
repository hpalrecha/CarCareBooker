import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { PRODUCT_BRANDS, PRODUCT_FINE_PRINT } from "@/lib/nav-menu";
import { getBrandPage } from "@/lib/brand-pages";
import { PRODUCTS_SEO } from "@/lib/static-seo";
import { VisitStudio } from "@/components/redesign/studio-sections";
import { PRODUCTS_HERO, PRODUCT_KIND, PRODUCT_CHOOSE, PRODUCTS_CHOOSE_HEADING, PRODUCTS_HELP_BEFORE, PRODUCTS_HELP_LINK, PRODUCTS_HELP_AFTER, PRODUCTS_HELP_HREF } from "@/lib/products-page-data";

/**
 * /products: the three brands P91 fits, one large row each.
 *
 * Same data as the header's Products menu (nav-menu.ts) and the brand pages (brand-pages.ts), so the
 * three places cannot disagree. Each row takes its photo from the brand page's own hero image and
 * links to that brand page. Nothing here is written about a manufacturer beyond what those two
 * files already state, and no price, count or warranty term is added.
 */

const KIND = PRODUCT_KIND;
const CHOOSE = PRODUCT_CHOOSE;

export default function Products() {
  useSeoMeta({
    title: PRODUCTS_SEO.title,
    description: PRODUCTS_SEO.description,
    image: "/Car Care (4)_1753951564515.png",
  });

  return (
    <div className="p91x pd-page min-h-screen">
      <SiteHeader />
      <main id="main">

      <section className="pd-hero">
        <div className="wrap">
          <p className="ed-label">{PRODUCTS_HERO.label}</p>
          <h1 className="pd-title">Products</h1>
          <p className="pd-lede">{PRODUCTS_HERO.lede}</p>
        </div>
      </section>

      <section className="pd-list" aria-label="Brands">
        <div className="wrap">
          {PRODUCT_BRANDS.map((b) => {
            const slug = b.href.split("/").pop() ?? "";
            const page = getBrandPage(slug);
            const hero = page?.images[0];
            const testId = `link-product-${b.name.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <article className="pd-row" key={b.name} id={slug}>
                {hero && (
                  <Link href={b.href} className="pd-media" tabIndex={-1} aria-hidden="true">
                    <ImageWithFallback src={hero.src} alt="" sizes="(min-width: 861px) 48vw, 92vw" loading="lazy" />
                  </Link>
                )}
                <div className="pd-copy">
                  <p className="pd-kind">{KIND[slug] ?? b.tagline}</p>
                  <h2 className="pd-name">
                    <Link href={b.href} data-testid={testId}>{b.name}</Link>
                  </h2>
                  <p className="pd-tagline">{b.line}</p>
                  <ul className="pd-points">
                    {b.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <Link href={b.href} className="ed-link">
                    About {b.name} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pd-choose" data-tone="dark" aria-labelledby="pd-choose-h">
        <div className="wrap">
          <h2 id="pd-choose-h" className="ed-title">{PRODUCTS_CHOOSE_HEADING}</h2>
          <ul className="pd-choose-list">
            {CHOOSE.map((c) => (
              <li key={c.need}>
                <p className="pd-need">{c.need}</p>
                <p className="pd-answer">{c.answer}</p>
                <Link href={c.href} className="ed-link">{c.label} →</Link>
              </li>
            ))}
          </ul>
          <p className="pd-help">
            {PRODUCTS_HELP_BEFORE}<a href={PRODUCTS_HELP_HREF}>{PRODUCTS_HELP_LINK}</a>{PRODUCTS_HELP_AFTER}
          </p>
          <p className="mega-fineprint pd-fine">{PRODUCT_FINE_PRINT}</p>
        </div>
      </section>
      <VisitStudio id={"visit"} />


      </main>

      <SiteFooter />
    </div>
  );
}
