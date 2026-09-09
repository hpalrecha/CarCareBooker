import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { getSeoPage, SEO_PAGES } from "@/lib/seo-pages";

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

  // An unrecognised slug is a genuine 404, not a blank version of this template.
  if (!page) return <NotFound />;

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));

  const primary = bySlug.get(page.primaryServiceSlug);
  const heroImage = resolveServiceImage(primary);

  // Only rows that exist in the live catalogue. A slug removed in the admin drops out of
  // the table rather than rendering an empty price.
  const priceRows = page.priceServiceSlugs
    .map((slug) => bySlug.get(slug))
    .filter((s): s is ServiceRecord => Boolean(s));

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

  const related = page.related
    .map((slug) => SEO_PAGES.find((p) => p.slug === slug))
    .filter((p): p is (typeof SEO_PAGES)[number] => Boolean(p));

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <section className="section">
        <div className="wrap narrow">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span>
            <Link href="/services">Services</Link> <span>/</span>
            <span>{page.crumb}</span>
          </nav>

          <h1 className="article-h1" data-testid="text-seo-h1">{page.h1}</h1>
          <p className="article-lede">{page.lede}</p>

          {heroImage && (
            <ImageWithFallback
              className="article-hero"
              src={heroImage}
              alt={`${page.crumb} at the P91 Car Care studio in Indiranagar, Bangalore`}
              width={1200}
              height={300}
              data-testid="img-seo-hero"
            />
          )}

          <div className="prose">
            <h2>What the service includes</h2>
            <ul>
              {page.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>{page.context.heading}</h2>
            {(page.context.paragraphs || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            <h2>Prices</h2>
            {priceRows.length > 0 ? (
              <>
                <div className="pkg-table">
                  <table data-testid="table-seo-prices">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Was</th>
                        <th>From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceRows.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <Link href={`/service/${s.slug}`} data-testid={`link-price-${s.slug}`}>
                              {s.title.trim()}
                            </Link>
                          </td>
                          <td>{s.originalPrice ? formatINR(s.originalPrice) : "—"}</td>
                          <td className="price" data-testid={`text-seo-price-${s.slug}`}>
                            {formatINR(s.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="fineprint">
                  Prices are read live from the booking system, so what you see here is what
                  checkout charges.
                </p>
              </>
            ) : (
              <p>Call the studio for current pricing on this work.</p>
            )}

            <h2>Frequently asked</h2>
            {page.faqs.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>

          <div className="article-cta">
            <div>
              <h3>Book {page.crumb.toLowerCase()}</h3>
              <p>Hold your slot online. The balance is settled at the studio in Indiranagar.</p>
            </div>
            <div className="article-cta-btns">
              <Link href="/services" className="cta-lg" data-testid="link-seo-book">Book a service</Link>
              <a className="cta-ghost" href="tel:+917406619191">
                <Phone className="i" aria-hidden="true" /> 74066 19191
              </a>
            </div>
          </div>

          {related.length > 0 && (
            <>
              <h2 className="more-h">Other services</h2>
              <div className="mini-grid">
                {related.map((r) => (
                  <Link key={r.slug} href={`/services/${r.slug}`} className="mini" data-testid={`link-related-${r.slug}`}>
                    <b>{r.crumb}</b>
                    <span>{r.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
