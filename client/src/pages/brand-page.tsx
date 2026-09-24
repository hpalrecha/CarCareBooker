import { Link, useParams } from "wouter";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import ParallaxFrame from "@/components/redesign/parallax-frame";
import { ImageWithFallback } from "@/components/image-with-fallback";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useCinematic } from "@/hooks/use-cinematic";
import { getBrandPage } from "@/lib/brand-pages";

/**
 * A brand page: /products/stek, /products/nasiol, /products/p91-premium-ppf.
 *
 * Editorial and typography-led: a large name, one line, one real photograph, a short "what it is",
 * what P91 fits (each row books the service), three benefits, a few real studio photographs, and a
 * link out to the manufacturer for anyone who wants the full product information. Content lives in
 * lib/brand-pages.ts and is limited to verified statements (see the note there).
 */
export default function BrandPage() {
  const { brand } = useParams();
  const page = getBrandPage(brand);

  useSeoMeta({
    title: page?.title ?? "Brand | P91 Car Care",
    description: page?.description ?? "",
    image: page?.images[0]?.src,
    canonicalPath: page ? `/products/${page.slug}` : undefined,
  });
  useCinematic([brand]);

  if (!page) return <NotFound />;
  const [hero, ...rest] = page.images;

  return (
    <div className="p91x br-page min-h-screen">
      <SiteHeader />

      <section className="br-hero" data-testid="section-brand-hero">
        <div className="wrap br-hero-grid">
          <div className="br-hero-copy">
            <p className="ed-label">{page.label}</p>
            <h1 className="br-name" data-testid="text-brand-name">{page.name}</h1>
            <p className="br-line">{page.line}</p>
            <div className="br-actions">
              <Link href={page.book.href} className="ed-link" data-testid="link-brand-book">
                {page.book.label} →
              </Link>
              {page.official && (
                <a
                  href={page.official.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-link ed-link-quiet"
                  data-testid="link-brand-official"
                >
                  {page.official.label} <ArrowUpRight className="br-ext" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
          <div className="br-hero-media">
            <ParallaxFrame className="ed-figure br-figure" strength={0.08} cine="frame">
              <ImageWithFallback src={hero.src} alt={hero.alt} sizes="(min-width: 861px) 46vw, 92vw" priority />
            </ParallaxFrame>
            <p className="ed-caption br-caption">{hero.caption}</p>
          </div>
        </div>
      </section>

      <section className="br-section">
        <div className="wrap br-two">
          <div data-cine="rise">
            <p className="ed-label">01 / What it is</p>
            <h2 className="br-h2">{page.name === "P91 Premium PPF" ? "Our own film." : `About ${page.name}.`}</h2>
          </div>
          <div className="br-prose" data-cine="rise" style={{ "--i": 1 } as React.CSSProperties}>
            {page.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="br-section br-fits">
        <div className="wrap br-two">
          <div data-cine="rise">
            <p className="ed-label">02 / What P91 fits</p>
            <h2 className="br-h2">In our studio.</h2>
          </div>
          <ul className="br-rows">
            {page.fits.map((f, i) => (
              <li key={f.name} data-cine="rise" style={{ "--i": i } as React.CSSProperties}>
                <Link href={f.href} className="br-row" data-testid={`link-brand-fit-${i}`}>
                  <span>
                    <span className="br-row-name">{f.name}</span>
                    <span className="br-row-note">{f.note}</span>
                  </span>
                  <ArrowUpRight className="br-row-arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="br-section">
        <div className="wrap br-two">
          <div data-cine="rise">
            <p className="ed-label">03 / Benefits</p>
            <h2 className="br-h2">Why it matters.</h2>
          </div>
          <ol className="br-benefits">
            {page.benefits.map((b, i) => (
              <li key={b.title} data-cine="rise" style={{ "--i": i } as React.CSSProperties}>
                <span className="pp-idx">{String(i + 1).padStart(2, "0")}</span>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="br-section br-floor">
        <div className="wrap">
          <p className="ed-label" data-cine="rise">04 / On our floor</p>
          <div className="br-gallery">
            {rest.map((img, i) => (
              <figure key={img.src} className="br-shot" data-cine="frame" style={{ "--i": i } as React.CSSProperties}>
                <ImageWithFallback src={img.src} alt={img.alt} sizes="(min-width: 861px) 30vw, 92vw" />
                <figcaption className="ed-work-cap">{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-cta br-cta" data-tone="dark">
        <div className="wrap">
          <h2 className="ed-title" data-cine="rise">
            {page.official ? `Want the full ${page.name} range?` : "Ready to protect your car's paint?"}
          </h2>
          <div className="ed-cta-actions" data-cine="rise" style={{ "--i": 1 } as React.CSSProperties}>
            {page.official && (
              <a className="cta-lg" href={page.official.href} target="_blank" rel="noopener noreferrer" data-testid="link-brand-official-cta">
                {page.official.label} →
              </a>
            )}
            <Link href={page.book.href} className={page.official ? "cta-ghost" : "cta-lg"} data-testid="link-brand-book-cta">
              {page.book.label}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
