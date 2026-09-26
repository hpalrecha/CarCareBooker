import { useMemo, useState } from "react";
import { Link } from "wouter";
// `.lp-*` (landing-pages.css) is also used by ppf-ceramic-landing.tsx and
// service-landing.tsx, each importing it themselves. Only this component uses the
// offer/countdown classes from landing.css. Imported here, not in main.tsx, so they ship
// in this lazy chunk instead of blocking every other route.
import "@/styles/landing.css";
import "@/styles/landing-pages.css";
import { Phone, Clock, ShieldCheck, MapPin, CheckCircle, Wrench, Layers, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SlideCarousel from "@/components/redesign/slide-carousel";
import BookingModal from "@/components/booking-modal";
import CampaignOffer from "@/components/campaign-offer";
import VehicleSelector from "@/components/vehicle-selector";
import BlogCarousel from "@/components/blog-carousel";
import HeroOfferStrip from "@/components/hero-offer-strip";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useHeroVideoGate } from "@/hooks/use-hero-video";
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
  const showHeroVideo = useHeroVideoGate();
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  // An unrecognised path is a genuine 404, not an empty version of this template.
  if (!page) return <NotFound />;

  /**
   * Real studio footage for the hero photo box — only two clips exist studio-wide
   * (Exterior Detailing, Interior Detailing). Ceramic coating and PPF are both exterior
   * paint work, so both get the exterior clip; the bike page gets none, because no bike
   * footage exists and showing the car clip there would misrepresent the work.
   */
  const heroVideoSrc = path === "/ceramic-coating/bike" ? null : "/attached_assets/Exterior Detailing_1754031679196.mp4";
  const HERO_VIDEO_LOOP_START = 3.7;
  const HERO_VIDEO_LOOP_END = 7.7;

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
      streetAddress: "49, 13th Cross, Ayappa Garden, Adugodi",
      postalCode: "560030",
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
      {/* The one Book Now on this page: it opens the booking modal, so the in-page buttons are not needed. */}
      <SiteHeader onBookNow={() => setBookingOpen(true)} />

      {/* ---------- 1-3. hero: what, for whom, how much ---------- */}
      <section className="section lp-hero">
        <div className="wrap">
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
                    Adugodi, Bangalore
                  </p>
                )}

              <div className="lp-hero-cta">
                <a className="cta-ghost" href="tel:+917406619191" data-testid="link-hero-call">
                  <Phone className="i" aria-hidden="true" /> 74066 19191
                </a>
              </div>

              {/* Same trust-row pattern as home.tsx and ppf-ceramic-landing.tsx's hero
                  (.hero-facts, redesign.css) — this page never had one. Wording is generic
                  and unnumbered on purpose: it must hold for every category a body-type
                  selector can pick, and the itest guards against invented statistics. */}
              <div className="hero-facts">
                <span>
                  <Clock className="i" aria-hidden="true" />
                  <b>Same-day</b> slots
                </span>
                <span>
                  <ShieldCheck className="i" aria-hidden="true" />
                  Written warranty
                </span>
                <span>
                  <MapPin className="i" aria-hidden="true" />
                  Adugodi, Bangalore
                </span>
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
                  {heroVideoSrc && showHeroVideo && (
                    <video
                      className="lp-hero-video"
                      autoPlay
                      muted
                      loop={false}
                      playsInline
                      preload="auto"
                      poster={heroImage}
                      aria-hidden="true"
                      data-testid="video-landing-hero"
                      onLoadedMetadata={(e) => { e.currentTarget.currentTime = HERO_VIDEO_LOOP_START; }}
                      onTimeUpdate={(e) => {
                        if (e.currentTarget.currentTime >= HERO_VIDEO_LOOP_END) {
                          e.currentTarget.currentTime = HERO_VIDEO_LOOP_START;
                        }
                      }}
                      onPlaying={() => setHeroVideoReady(true)}
                      style={{ opacity: heroVideoReady ? 1 : 0 }}
                    >
                      <source src={heroVideoSrc} type="video/mp4" />
                    </video>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* The body-type selector lives in the HERO (see above), not in its own section —
          the customer must choose before seeing a price, not after scrolling past one. */}

      {/* ---------- 3b. PPF concept block (XPEL layout, by request, /ppf only) ----------
          Trust strip + photo collage + full-bleed CTA banner. Scoped to path === "/ppf"
          because the copy below ("color PPF match", paint-chip damage) is PPF-specific —
          it would misdescribe the ceramic coating pages this same component also
          renders. Every claim here already exists elsewhere on the site (warranty
          issued at handover, in-studio fitting, full/partial coverage) — restated, not
          invented, for this concept block. */}
      {path === "/ppf" && (
        <>
          <section className="strip strip-dark" data-testid="section-ppf-trust-strip">
            <div className="wrap">
              <div className="row cols-3">
                <div className="cell">
                  <Wrench className="i" aria-hidden="true" />
                  <b>In-studio professional install</b>
                  <span>Every panel measured, plotter-cut and fitted by hand in our Adugodi bay.</span>
                </div>
                <div className="cell">
                  <ShieldCheck className="i" aria-hidden="true" />
                  <b>Manufacturer-backed warranty</b>
                  <span>A real written warranty on the film, issued at handover — not a verbal promise.</span>
                </div>
                <div className="cell">
                  <Layers className="i" aria-hidden="true" />
                  <b>Full or partial coverage</b>
                  <span>Protect the whole car, or just the panels that take the most hits.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="section" data-testid="section-ppf-collage">
            <div className="wrap">
              <div className="guide-collage">
                <div className="guide-collage-grid">
                  <ImageWithFallback
                    src="/attached_assets/gallery/p91-lux-range-rover-evoque.webp"
                    alt="A white Range Rover Evoque in the P91 studio, protected with P91 Premium PPF"
                    sizes="(min-width: 860px) 280px, 45vw"
                    loading="lazy"
                  />
                  <ImageWithFallback
                    src="/attached_assets/gallery/p91-ppf-fitting.webp"
                    alt="A P91 technician fitting clear paint protection film on the rear door of a black car"
                    sizes="(min-width: 860px) 280px, 45vw"
                    loading="lazy"
                  />
                  <div className="guide-collage-wide">
                    <ImageWithFallback
                      src="/attached_assets/gallery/p91-lux-nissan-gtr.webp"
                      alt="A white Nissan GT-R with a black bonnet in front of a STEK wall in the P91 studio"
                      sizes="(min-width: 860px) 580px, 90vw"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="guide-collage-copy">
                  <h2>Catch damage before it costs you</h2>
                  <p>
                    A self-healing film absorbs stone chips, kerb scrapes and swirl marks before
                    they ever reach your clearcoat — so the paint underneath stays exactly as it
                    left the factory.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </>
      )}

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
          {/* XPEL-style icon-feature bullets, shared with /service/* (redesign.css). */}
          <div className="feature-grid">
            {page.benefits.map((b) => (
              <div className="feature-item" key={b.title}>
                <CheckCircle className="i" aria-hidden="true" />
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
            <div className="feature-grid" data-testid="landing-includes">
              {displayableIncludes(service?.whatIncluded).map((item, i) => (
                <div className="feature-item" key={i}>
                  <CheckCircle className="i" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- real photos, from the catalogue record's own image(s) ----------
          Not "recent work" — these are the SAME photo(s) already resolved for the hero
          and for this exact record on /services and /service/:slug, just given a proper
          image-led moment of their own rather than staying a single small hero thumbnail.
          Renders 1 photo for most records and up to 3 for the ones that carry more (car
          ceramic coating) — the grid handles either count without looking sparse or
          broken, and nothing here is invented: same source, same alt-text convention as
          the rest of the site. */}
      {service?.images && service.images.length > 0 && (
        <section className="section lp-tight">
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>Real photos from the studio</h2>
            </div>
            <div className="grid lp-gallery" style={{ gridTemplateColumns: `repeat(${Math.min(service.images.length, 3)}, minmax(0, 1fr))` }}>
              {service.images.slice(0, 3).map((src, i) => (
                <div key={src} className="card-img" data-testid={`img-landing-gallery-${i}`}>
                  <ImageWithFallback
                    src={src}
                    alt={`${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
                    width={800}
                    height={600}
                    sizes="(min-width: 900px) 33vw, 100vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- how it works ---------- */}
      <section className="section lp-tight">
        <div className="wrap narrow">
          <div className="section-head">
            <h2>How it works</h2>
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
            {/* Native <details>/<summary>, collapsed by default — same accordion as
                service-landing.tsx and ppf-ceramic-landing.tsx (.lp-faq CSS, incl. the
                summary/+ icon rules). */}
            <div className="lp-faqs" data-testid="landing-faqs">
              {faqs.map((f, i) => (
                <details className="lp-faq" key={i}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- 8. genuine articles ---------- */}
      <BlogCarousel posts={posts} bySlug={bySlug} />

      {/* XPEL-style closing trust row before the final CTA — the same three facts already
          stated in the hero (.hero-facts above), restated larger as reinforcement rather
          than new claims. */}
      <section className="strip">
        <div className="wrap">
          <div className="row cols-3">
            <div className="cell">
              <Clock className="i" aria-hidden="true" />
              <b>Same-day slots</b><span>Most jobs finished the day you book</span>
            </div>
            <div className="cell">
              <ShieldCheck className="i" aria-hidden="true" />
              <b>Written warranty</b><span>Issued at handover, from the film or coating maker</span>
            </div>
            <div className="cell">
              <MapPin className="i" aria-hidden="true" />
              <b>Adugodi studio</b><span>Bangalore — pickup &amp; drop available</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 9. related pages ----------
          The closing "Ready when you are" CTA (heading, price line, Book Now + phone
          button) that used to sit above this was removed by request — the hero CTA and
          the offer-card CTA further up already cover booking on this page, and it was the
          same heading/panel already removed from home.tsx for the same reason. Only the
          related-pages nav is left, and only when there is one. */}
      {page.related.length > 0 && (
        <section className="section lp-tight">
          <div className="wrap narrow">
            <nav className="lp-related" aria-label="Related pages">
              {/* The label sits in a span so the tap target can grow to 44px via padding
                  on the anchor while the underline still hugs the text. */}
              {page.related.map((r) => (
                <Link key={r.href} href={r.href} data-testid={`link-related-${r.href}`}>
                  <span>{r.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

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
