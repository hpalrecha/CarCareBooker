import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { PRODUCT_BRANDS, PRODUCT_FINE_PRINT } from "@/lib/nav-menu";
import { getBrandPage } from "@/lib/brand-pages";
import { PRODUCTS_SEO } from "@/lib/static-seo";

/**
 * /products: the three brands P91 fits, one large row each.
 *
 * Same data as the header's Products menu (nav-menu.ts) and the brand pages (brand-pages.ts), so the
 * three places cannot disagree. Each row takes its photo from the brand page's own hero image and
 * links to that brand page. Nothing here is written about a manufacturer beyond what those two
 * files already state, and no price, count or warranty term is added.
 */

/** What each brand is, in the words a customer would use. Keyed by brand page slug. */
const KIND: Record<string, string> = {
  stek: "Paint protection film and sun-control film",
  nasiol: "Ceramic coating",
  "p91-premium-ppf": "Our own paint protection film",
};

/** Which job each choice answers. Links go to pages that already exist. */
const CHOOSE = [
  { need: "Stone chips and scratches", answer: "Paint protection film. STEK or our own P91 Premium PPF.", href: "/services/paint-protection-film-bangalore", label: "How PPF works" },
  { need: "Easier washing and water beading", answer: "Ceramic coating from Nasiol.", href: "/services/ceramic-coating-bangalore", label: "How ceramic coating works" },
  { need: "A cooler cabin and less glare", answer: "Sun-control film from STEK.", href: "/services/glass-sun-control-film-bangalore", label: "About sun-control film" },
];

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
          <p className="ed-label">Brands we fit</p>
          <h1 className="pd-title">Products</h1>
          <p className="pd-lede">The film and coating brands we fit, and what each one is for.</p>
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
          <h2 id="pd-choose-h" className="ed-title">Which one do you need?</h2>
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
            Not sure? Send a photo of your car on <a href="https://wa.me/917406619191">WhatsApp</a> and we will tell you what it needs.
          </p>
          <p className="mega-fineprint pd-fine">{PRODUCT_FINE_PRINT}</p>
        </div>
      </section>

      </main>

      <SiteFooter />
    </div>
  );
}
