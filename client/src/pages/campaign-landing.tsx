import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Phone } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SlideCarousel from "@/components/redesign/slide-carousel";
import BookingModal from "@/components/booking-modal";
import CampaignOffer from "@/components/campaign-offer";
import VehicleSelector from "@/components/vehicle-selector";
import BlogCarousel from "@/components/blog-carousel";
import HeroOfferStrip from "@/components/hero-offer-strip";
import ProtectionChallenge from "@/components/protection-challenge";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useQuery } from "@tanstack/react-query";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import {
  getLandingPage,
  relevantPosts,
  displayableIncludes,
  type CategoryOption,
} from "@/lib/landing-pages";

/**
 * One component serving all three Meta Ads landing pages.
 *
 *   /ceramic-coating/car   /ceramic-coating/bike   /ppf
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE ORDER OF THE PAGE IS THE ORDER OF THE CUSTOMER'S QUESTIONS.
 *
 *   1. what is this?            hero: h1 + one-line lede + the real photograph
 *   2. is it for my vehicle?    the ad already decided car vs bike; PPF asks body type
 *   3. what does it cost?       live catalogue price, ABOVE the fold, never hidden
 *   4. is the booking free?     the offer block, with the price restated beside it
 *   5. why you?                 what the treatment actually does
 *   6. what do I get?           what's included, from the catalogue row
 *   7. common questions         FAQs from the catalogue, or nothing at all
 *   8. learn more               genuine blog articles
 *   9. book                     final CTA
 *
 * Someone arriving from an advertisement should not have to hunt for the price or the
 * button. Both appear in the first screen on every viewport.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * PRICE AUTHORITY. Every figure on this page is read from GET /api/services at render
 * time and keyed by the catalogue slug the content module names. Nothing is hardcoded,
 * there is no category-to-price map, and the record shown is the same record handed to
 * BookingModal — so the page cannot advertise a price checkout will not charge.
 */

interface CampaignLandingProps {
  /** The route this instance serves. Passed by App.tsx so one component covers three paths. */
  path: string;
}

export default function CampaignLanding({ path }: CampaignLandingProps) {
  const page = getLandingPage(path);

  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  const bySlug = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    return new Map(list.map((s) => [s.slug, s]));
  }, [services]);

  // Explicit default from the content module, never categories[0] — see defaultCategoryKey.
  // Falls back to the first option only if the config omits one, so the page can never
  // open with nothing selected and therefore no price.
  const [categoryKey, setCategoryKey] = useState<string>(
    () => page?.defaultCategoryKey ?? page?.categories?.[0]?.key ?? "",
  );
  const [bookingOpen, setBookingOpen] = useState(false);

  // An unrecognised path is a genuine 404, not an empty version of this template.
  if (!page) return <NotFound />;

  const selectedCategory: CategoryOption | undefined = page.categories?.find(
    (c) => c.key === categoryKey,
  ) ?? page.categories?.[0];

  /**
   * THE service record this page is selling right now.
   *
   * For a single-package page that is the one named slug. For PPF it follows the selected
   * body type. Either way it is one live catalogue row, and it is what the price, the
   * package name, the includes list, the FAQs and the booking all read from — so those
   * five things cannot disagree with each other.
   */
  const service: ServiceRecord | undefined = page.categories
    ? bySlug.get(selectedCategory?.serviceSlug ?? "")
    : bySlug.get(page.primaryServiceSlug ?? "");

  const heroImage = resolveServiceImage(service);
  const posts = useMemo(() => relevantPosts(page), [page]);

  const price = service ? parseFloat(String(service.price)) : NaN;
  const wasPrice = service?.originalPrice ? parseFloat(String(service.originalPrice)) : NaN;
  // Only a genuine reduction. Partial PPF rows carry price === originalPrice, and a
  // struck-through figure identical to the live one invents a saving.
  const hasRealDiscount = Number.isFinite(price) && Number.isFinite(wasPrice) && wasPrice > price;

  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;

  const provider = {
    "@type": "AutoRepair",
    "@id": `${origin}/#business`,
    name: "P91 Car Care",
    telephone: "+91-7406619191",
    areaServed: { "@type": "City", name: "Bengaluru" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "100 Feet Road, HAL 2nd Stage, Indiranagar",
      postalCode: "560038",
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
      ...(heroImage ? { image: heroImage.startsWith("http") ? heroImage : `${origin}${heroImage}` } : {}),
      provider,
      areaServed: { "@type": "City", name: "Bengaluru" },
      // Priced from the live record only. No literal fallback: a schema price that
      // disagrees with checkout is worse than emitting no offer block at all.
      ...(service
        ? {
            offers: {
              "@type": "Offer",
              price: service.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: `${origin}${page.path}`,
            },
          }
        : {}),
    },
    // NO BreadcrumbList here, deliberately.
    //
    // scripts/prerender.mjs already bakes one into the static HTML for each of these
    // routes. useSeoMeta APPENDS its blocks without removing prerendered ones, so
    // emitting a second copy here left every hydrated page carrying two BreadcrumbLists —
    // visible only in the rendered DOM, not in either source on its own.
    //
    // The prerendered copy is the right survivor: it is what a crawler that does not
    // execute JavaScript receives, and it is present from the first byte. Adding it again
    // at hydration gains nothing and duplicates it for everyone else.
    //
    // Service and FAQPage are NOT prerendered — they depend on the live catalogue record,
    // which the build has no access to — so those stay here.
  ];

  /**
   * FAQPage schema ONLY when the catalogue row genuinely carries FAQs.
   *
   * Ceramic car and ceramic bike do. Full PPF does not, so the PPF page emits no FAQ
   * markup and renders no FAQ section — rather than authoring questions to fill the
   * layout, which would be inventing business content.
   */
  const faqs = Array.isArray(service?.faq) ? service!.faq!.filter((f) => f?.question && f?.answer) : [];
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
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
    canonicalPath: page.path,
    structuredData: schemas,
  });

  return (
    <div className="p91x lp min-h-screen">
      <SiteHeader />

      {/* ---------- 1-3. hero: what, for whom, how much ---------- */}
      <section className="section lp-hero">
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span>
            <Link href="/services">Services</Link> <span>/</span>
            <span>{page.eyebrow}</span>
          </nav>

          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="eyebrow">{page.eyebrow}</p>
              <h1 data-testid="text-landing-h1">{page.h1}</h1>
              <p className="lp-lede">{page.lede}</p>

              {/*
                PAGES WITH BODY-TYPE PRICING PUT THE SELECTOR HERE, ABOVE ANY PRICE.

                Showing one category's figure before the customer has chosen means an SUV
                owner's first impression is a price that is ₹20,000 wrong, with nothing
                indicating it is changeable — the selector used to sit ~960px down. The
                order is now: what it is -> which vehicle -> that package -> its price,
                which is the order the customer actually decides in.

                The includes list is suppressed here because the page already has a
                dedicated section for it; repeating it would push the CTA below the fold.
              */}
              {page.categories ? (
                <VehicleSelector
                  categories={page.categories}
                  bySlug={bySlug}
                  selectedKey={selectedCategory?.key ?? ""}
                  onSelect={(c) => setCategoryKey(c.key)}
                  hideDuration={page.hideDuration}
                  showIncludes={false}
                  compact
                />
              ) : service ? (
                <div className="lp-price" data-testid="landing-price">
                  <span className="lp-price-now">{formatINR(service.price)}</span>
                  {hasRealDiscount && (
                    <span className="lp-price-was" data-testid="landing-price-was">
                      <span className="sr-only">Previous price </span>
                      {formatINR(service.originalPrice)}
                    </span>
                  )}
                  <span className="lp-price-name">{service.title.trim()}</span>
                </div>
              ) : (
                // The catalogue has not loaded, or the slug is missing. Say so plainly
                // rather than rendering an empty price slot or a placeholder number.
                <p className="lp-price-pending" data-testid="landing-price-pending">
                  Call the studio for current pricing on this work.
                </p>
              )}

              {/*
                One line reconciling "free" with the price directly above it. The FULL
                offer block and countdown stay further down — this is not a replacement
                for them, it exists so the first viewport is self-consistent.
              */}
              <HeroOfferStrip landingPage={page.path} servicePrice={service?.price} />

              {/* Duration, but never for PPF — see the data note in lib/landing-pages.ts. */}
              {!page.hideDuration &&
                service &&
                Number.isFinite(Number(service.duration)) &&
                Number(service.duration) > 0 && (
                  <p className="lp-meta" data-testid="landing-duration">
                    Approx. {Math.round(Number(service.duration) / 60)} hours in the studio ·
                    Indiranagar, Bangalore
                  </p>
                )}

              <div className="lp-hero-cta">
                <button
                  type="button"
                  className="cta-lg"
                  onClick={() => setBookingOpen(true)}
                  data-testid="button-hero-book"
                >
                  Book Free Appointment
                </button>
                <a className="cta-ghost" href="tel:+917406619191" data-testid="link-hero-call">
                  <Phone className="i" aria-hidden="true" /> 74066 19191
                </a>
              </div>
            </div>

            {/*
              Wrapped in a plain div ON PURPOSE, and it is load-bearing.

              index.css sets `picture { display: contents }` globally so ImageWithFallback
              stays a drop-in replacement for a bare <img>. The side effect is that when
              the component emits a <picture>, its children — the <source> elements AND the
              <img> — all become direct children of whatever laid the picture out. In a
              two-column grid that means four grid items instead of two, and the image lands
              in row 2: measured at top 610px against copy at 123px, leaving a large empty
              gap on desktop.

              This div gives the grid exactly one item no matter what the component expands
              to. Fixed here rather than by changing the global rule, which the card grids,
              article headers and homepage all depend on.
            */}
            {page.heroCarousel ? (
              <div className="lp-hero-media">
                <SlideCarousel
                  variant="hero"
                  // Slow enough to read a slide of body copy, not a slideshow that
                  // snatches the page away mid-sentence. It pauses on hover and focus.
                  autoAdvanceMs={5200}
                  dir={page.heroCarousel.dir}
                  caption={page.heroCarousel.caption}
                  slides={page.heroCarousel.slides}
                  testId="carousel-landing-hero"
                />
                {page.heroBrand && (
                  <p className="lp-hero-brand" data-testid="landing-hero-brand">
                    <span>{page.heroBrand.label}</span>
                    <ImageWithFallback
                      src={page.heroBrand.src}
                      alt={page.heroBrand.alt}
                      width={543}
                      height={82}
                      sizes="128px"
                    />
                  </p>
                )}
              </div>
            ) : (
              heroImage && (
                <div className="lp-hero-media">
                  <ImageWithFallback
                    className="lp-hero-img"
                    src={heroImage}
                    alt={page.heroAlt}
                    width={720}
                    height={480}
                    sizes="(min-width: 900px) 520px, 100vw"
                    data-testid="img-landing-hero"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* The body-type selector lives in the HERO (see above), not in its own section —
          the customer must choose before seeing a price, not after scrolling past one. */}

      {/* ---------- 4. the offer ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <CampaignOffer
            landingPage={page.path}
            servicePrice={service?.price}
            serviceTitle={service?.title?.trim()}
            onBook={() => setBookingOpen(true)}
          />
        </div>
      </section>

      {/* ---------- 5. what the treatment does ---------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>{page.benefitsHeading}</h2>
          </div>
          <div className="lp-benefits">
            {page.benefits.map((b) => (
              <div className="lp-benefit" key={b.title}>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 6. what's included, from the catalogue row ---------- */}
      {displayableIncludes(service?.whatIncluded).length > 0 && (
        <section className="section lp-tight">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>What the job includes</h2>
            </div>
            <ul className="lp-includes" data-testid="landing-includes">
              {displayableIncludes(service?.whatIncluded).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- how it works ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <div className="section-head">
            <h2>How to Get Started</h2>
          </div>
          {/* An ordered list because the order is real, not decorative — numbered markers
              here encode an actual sequence the customer moves through. */}
          <ol className="lp-steps" data-testid="landing-steps">
            {page.howItWorks.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- interactive P91 Protection Challenge ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <ProtectionChallenge onBookOverride={() => setBookingOpen(true)} />
        </div>
      </section>

      {/* ---------- warranty: existing approved wording, carried over verbatim ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <p className="lp-warranty" data-testid="landing-warranty">
            Warranty on any job is the film or coating manufacturer's, issued in writing at
            handover. Ask to see the batch details before work starts.
          </p>
        </div>
      </section>

      {/* ---------- 7. FAQs — only when the catalogue actually has them ---------- */}
      {faqs.length > 0 && (
        <section className="section">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>Common questions</h2>
            </div>
            <div className="lp-faqs" data-testid="landing-faqs">
              {faqs.map((f, i) => (
                <div className="lp-faq" key={i}>
                  <h3>{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- 8. genuine articles ---------- */}
      <BlogCarousel posts={posts} bySlug={bySlug} />

      {/* ---------- 9. final CTA ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <div className="lp-final">
            <h2>Ready when you are</h2>
            <p>
              Booking takes under a minute and costs nothing during the current offer.
              {service ? ` ${service.title.trim()} is ${formatINR(service.price)}, settled at the studio after the work.` : ""}
            </p>
            <div className="lp-hero-cta">
              <button
                type="button"
                className="cta-lg"
                onClick={() => setBookingOpen(true)}
                data-testid="button-final-book"
              >
                Book Free Appointment
              </button>
              <a className="cta-ghost" href="tel:+917406619191">
                <Phone className="i" aria-hidden="true" /> 74066 19191
              </a>
            </div>
          </div>

          {page.related.length > 0 && (
            <nav className="lp-related" aria-label="Related pages">
              {/* The label sits in a span so the tap target can grow to 44px via padding
                  on the anchor while the underline still hugs the text. */}
              {page.related.map((r) => (
                <Link key={r.href} href={r.href} data-testid={`link-related-${r.href}`}>
                  <span>{r.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <SiteFooter />

      {/*
        The EXISTING booking modal, handed the same live record this page priced from.
        `vehicleContext` rides alongside so the booking records what the customer actually
        chose — "PPF, car, SUV" rather than just "PPF" — without this page knowing anything
        about how a booking is submitted.
      */}
      {service && (
        <BookingModal
          service={service as any}
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          vehicleContext={{
            vehicleType: page.vehicle,
            vehicleCategory: page.categories ? selectedCategory?.key : undefined,
          }}
        />
      )}
    </div>
  );
}
