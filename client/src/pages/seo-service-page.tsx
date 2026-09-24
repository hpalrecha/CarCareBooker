import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, type CSSProperties } from "react";
import { Shield, Droplet, Eye, Leaf, CheckCircle, ChevronRight } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { GUIDE_IMAGES } from "@/lib/real-service-images";
import ParallaxFrame from "@/components/redesign/parallax-frame";
import { useCinematic } from "@/hooks/use-cinematic";
import { getSeoPage } from "@/lib/seo-pages";

/** Drops the "✓ " some records prefix to each item — the list already draws a tick. */
function cleanIncluded(item: string) {
  return item.replace(/^\s*[✓✔]\s*/, '').trim();
}

/**
 * An included item cut to its headline clause — same trimming service-landing.tsx's
 * Overview panel uses, so a real service's own "what's included" list reads as one short
 * line per feature here too, not the full sentence stored in the record.
 */
function shortIncluded(item: string) {
  const text = cleanIncluded(item);
  const cut = text.search(/\s+[-–—]\s+|,|\s+(to|for|before|with|on|that|which)\s+/i);
  const head = cut > 5 ? text.slice(0, cut).trim() : text;
  return head.replace(/\s*[-–—:]+$/, '');
}

/** The first sentence of a paragraph — a variant's description shows as one line, not an essay. */
function firstSentence(text: string) {
  const t = text.trim();
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}

/**
 * A varied icon per feature row, same as service-landing.tsx's Overview panel — picked
 * from the item's own wording, never invented. Falls back to a plain check.
 */
function iconForIncluded(item: string) {
  const t = item.toLowerCase();
  if (/warrant|guarant/.test(t)) return Shield;
  if (/water|hydrophobic|repel|beading/.test(t)) return Droplet;
  if (/gloss|shine|clarity|clear|depth/.test(t)) return Eye;
  if (/uv|oxidation|environmental|contaminant|protect/.test(t)) return Leaf;
  return CheckCircle;
}

/**
 * One component serving all four local-intent SEO pages at /services/:seoSlug.
 *
 * Content comes from lib/seo-pages.ts; every PRICE comes from GET /api/services at render
 * time. A page names the catalogue slugs it covers and this resolves them, so a price
 * change in the admin appears here with no code edit and the figures can never drift
 * from the booking flow.
 *
 * ADDITIVE AND SAFE:
 *   - /service/:slug (the 17 indexed catalogue pages) is untouched and not redirected
 *   - no payment, booking, admin or API code is involved — the CTA links to /services
 *   - an unknown :seoSlug renders the existing 404 page rather than an empty shell
 *
 * Heading hierarchy is strict: one <h1>, <h2> per section, <h3> per FAQ question. The
 * FAQPage schema is emitted only because these pages genuinely carry FAQs.
 */
export default function SeoServicePage() {
  const { seoSlug } = useParams();
  const page = seoSlug ? getSeoPage(seoSlug) : undefined;

  const { data: services } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  // Which real catalogue variant the "Explore" tab row below is showing. Declared before
  // the early 404 return, like every other hook in this component.
  const [activeVariant, setActiveVariant] = useState(0);

  // Cinematic scroll motion (hooks/use-cinematic.ts); re-scans when the catalogue arrives.
  useCinematic([seoSlug, services?.length ?? 0]);

  // An unrecognised slug is a genuine 404, not a blank version of this template.
  if (!page) return <NotFound />;

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));

  const primary = bySlug.get(page.primaryServiceSlug);
  // Sharp pictures chosen per guide (lib/real-service-images.ts), falling back to the linked
  // service's own image only for a guide that has none listed.
  const guideImages = GUIDE_IMAGES[page.slug];
  const heroImage = guideImages?.hero ?? resolveServiceImage(primary);
  const heroAlt = guideImages?.illustrative
    ? `${page.crumb} (illustrative image)`
    : `${page.crumb} at the P91 Car Care studio in Adugodi, Bangalore`;

  // Only rows that exist in the live catalogue. A slug removed in the admin drops out of
  // the table rather than rendering an empty price.
  const priceRows = page.priceServiceSlugs
    .map((slug) => bySlug.get(slug))
    .filter((s): s is ServiceRecord => Boolean(s));

  // Up to three real, distinct photos for the collage below (primary service first, then
  // its price-table siblings) — never a stock or invented image. A guide whose catalogue
  // rows share one photo, or has fewer than three rows (Interior Detailing has exactly
  // one), simply gets fewer collage tiles; the layout (guide-collage-grid) reflows for
  // however many are actually real.
  const collageImages = guideImages
    ? guideImages.collage
    : Array.from(
        new Set(
          [primary, ...priceRows]
            .map((s) => s && resolveServiceImage(s))
            .filter((src): src is string => Boolean(src)),
        ),
      ).slice(0, 3);

  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;

  const provider = {
    "@type": "AutoRepair",
    name: "P91 Car Care",
    telephone: "+91-7406619191",
    areaServed: "Bangalore",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
  };

  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.h1,
      description: page.description,
      ...(heroImage ? { image: heroImage } : {}),
      provider,
      areaServed: { "@type": "City", name: "Bengaluru" },
      // Priced from the live record when one is resolved. No literal fallback: a schema
      // price that disagrees with checkout is worse than no offer block at all.
      ...(primary
        ? {
            offers: {
              "@type": "Offer",
              price: primary.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: `${origin}/service/${primary.slug}`,
            },
          }
        : {}),
    },
  ];

  if (page.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  useSeoMeta({
    title: page.title,
    description: page.description,
    image: heroImage,
    canonicalPath: `/services/${page.slug}`,
    structuredData: schemas,
  });

  return (
    <div className="p91x min-h-screen">
      <SiteHeader overHero />

      {/* Hero: XPEL guide-page layout by request — full-bleed photo, header floating
          over it, a breadcrumb pill, one bold uppercase title. The lede moves to its
          own plain section right below (next), same as XPEL's guide pages putting the
          headline photo and the supporting paragraph in two visually separate bands
          rather than stacking both onto the photo. Distinct classes from blog-post.tsx's
          .article-h1/.article-lede/.article-hero — those stay exactly as they are, this
          hero only applies to the four /services/:seoSlug guides. */}
      <ParallaxFrame as="section" className="seo-hero" strength={0.1} cine="zoom">
        {heroImage && (
          <ImageWithFallback
            className="shot"
            src={heroImage}
            alt={heroAlt}
            sizes="100vw"
            priority
            data-testid="img-seo-hero"
          />
        )}
        <div className="seo-hero-scrim" aria-hidden="true" />
        <div className="wrap seo-hero-copy">
          <span className="seo-crumb" data-testid="crumb-seo-hero">
            Services <ChevronRight className="i" aria-hidden="true" /> {page.crumb}
          </span>
          <h1 className="seo-hero-h1" data-testid="text-seo-h1">{page.h1}</h1>
        </div>
      </ParallaxFrame>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap narrow">
          <p className="article-lede" style={{ marginBottom: 0 }}>{page.lede}</p>
        </div>
      </section>

      {/* ---------- explore [category] ----------
          XPEL's own "Explore Paint Protection Film" tab row (COLOR PPF / ULTIMATE PLUS /
          ...): real catalogue variants (the same rows the Prices table below lists), each
          tab swapping the photo + description + feature list below it — client-side, no
          navigation, no new page. Only when there's more than one real variant to switch
          between (Interior Detailing has exactly one row, so this never renders there). */}
      {priceRows.length > 1 && (() => {
        const variant = priceRows[activeVariant] ?? priceRows[0];
        const variantImage = resolveServiceImage(variant);
        const variantDescription = typeof (variant as { description?: unknown }).description === 'string'
          ? (variant as { description?: string }).description
          : undefined;
        const variantIncluded = Array.isArray((variant as { whatIncluded?: unknown }).whatIncluded)
          ? (variant as { whatIncluded?: string[] }).whatIncluded ?? []
          : [];
        const variantFeatures = Array.from(new Set(variantIncluded.map(cleanIncluded))).slice(0, 4);
        return (
          <section className="section" id="explore">
            <div className="wrap">
              <div className="section-head" data-cine="rise">
                <h2>Explore {page.crumb}</h2>
              </div>
              <div className="explore-tabs" role="tablist" aria-label={`${page.crumb} variants`}>
                {priceRows.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeVariant}
                    className={"explore-tab" + (i === activeVariant ? " is-active" : "")}
                    onClick={() => setActiveVariant(i)}
                    data-testid={`tab-explore-${s.slug}`}
                  >
                    {s.title.trim()}
                  </button>
                ))}
              </div>
              <div className="overview-grid overview-grid-xpel">
                <div className="overview-media-wrap">
                  {variantImage && (
                    <ImageWithFallback
                      className="overview-media"
                      src={variantImage}
                      alt={`${variant.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
                      sizes="(min-width: 860px) 560px, 100vw"
                      loading="lazy"
                      data-testid="image-explore-variant"
                    />
                  )}
                </div>
                <div className="overview-copy">
                  <h3>{variant.title.trim()}</h3>
                  {variantDescription && (
                    <p className="overview-copy-lede">{firstSentence(variantDescription)}</p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 26 }}>
                    <Link href={`/service/${variant.slug}`} className="cta-ghost" data-testid="link-explore-learn-more">
                      {formatINR(variant.price)} · Learn More
                    </Link>
                  </div>
                  {variantFeatures.length > 0 && (
                    <ul className="overview-features">
                      {variantFeatures.map((item, index) => {
                        const headline = shortIncluded(item);
                        const FeatureIcon = iconForIncluded(item);
                        return (
                          <li key={index}>
                            <span className="overview-feature-icon">
                              <FeatureIcon className="i" aria-hidden="true" />
                            </span>
                            <div>
                              <h4>{headline}</h4>
                              {headline !== item && <p>{item}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Trust strip + photo collage — XPEL layout, by request, replacing the old plain
          "What the service includes" bullet list and the context article below. Real
          content either way: the strip's three items are the page's own page.includes
          (just the first three, styled as icon cells instead of a bullet list), and the
          collage's heading/paragraphs are page.context — the exact same words the
          article used to show, only in the punchier photo+heading format. Nothing here
          is invented; the full page.includes list still lives on each service's own
          /service/:slug page for anyone who wants it. */}
      <section className="strip strip-dark" data-testid="section-seo-trust-strip">
        <div className="wrap">
          <div className="row cols-3">
            {page.includes.slice(0, 3).map((item) => {
              const headline = shortIncluded(item);
              const FeatureIcon = iconForIncluded(item);
              return (
                <div className="cell" key={item} data-cine="rise" style={{ "--i": page.includes.indexOf(item) } as CSSProperties}>
                  <FeatureIcon className="i" aria-hidden="true" />
                  <b>{headline}</b>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section seo-collage-section" data-testid="section-seo-collage">
        <div className="wrap">
          <div className={"guide-collage" + (collageImages.length === 0 ? " is-text-only" : "")}>
            {collageImages.length > 0 && (
              <div className="guide-collage-grid">
                {collageImages.slice(0, 2).map((src) => (
                  <ParallaxFrame key={src} className="guide-collage-tile" strength={0.07} cine="frame">
                    <ImageWithFallback
                      src={src}
                      alt={`${page.crumb} work at the P91 Car Care studio in Adugodi, Bangalore`}
                      sizes="(min-width: 860px) 280px, 45vw"
                      loading="lazy"
                    />
                  </ParallaxFrame>
                ))}
                {collageImages[2] && (
                  <div className="guide-collage-wide">
                    <ImageWithFallback
                      src={collageImages[2]}
                      alt={`${page.crumb} work at the P91 Car Care studio in Adugodi, Bangalore`}
                      sizes="(min-width: 860px) 580px, 90vw"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="guide-collage-copy" data-cine="rise">
              <h2>{page.context.heading}</h2>
              {(page.context.paragraphs || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="prose">
            <h2>Frequently asked</h2>
            {/* Native <details>/<summary>, collapsed by default — same accordion as
                service-landing.tsx and ppf-ceramic-landing.tsx (.lp-faq CSS, incl. the
                summary/+ icon rules). Collapsed is still fully crawlable: unlike a
                JS-conditional accordion, a closed <details> keeps its content in the raw
                HTML/DOM, only the browser's default rendering hides it until toggled. */}
            <div className="lp-faqs" data-testid="faq-list">
              {page.faqs.map((f) => (
                <details className="lp-faq" key={f.question}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
