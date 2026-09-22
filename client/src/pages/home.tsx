import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import ScrollRow from "@/components/redesign/scroll-row";
import { ImageWithFallback } from "@/components/image-with-fallback";
import TransformationCTA from "@/components/transformation-cta";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { localBusinessSchema } from "@/lib/local-business";
import { HOME_SEO } from "@/lib/static-seo";
import { resolveServiceImage, formatINR, TRANSFORMATION_CTAS, type ServiceRecord } from "@/lib/canonical-services";
import { deriveCategory } from "@/lib/service-taxonomy";
import { useBookingOffer } from "@/hooks/use-booking-offer";
import { BLOG_POSTS, formatPostDate } from "@/lib/blog-posts";
import type { BusinessHour } from "@shared/schema";

// Before/after photography for the results section.
import headlightAfter from "@assets/GVXjDlbWcAAoQD1_1754029992281.jpg";
import glassCoating from "@assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg";
import exteriorDetailingAfter from "@assets/20241227_164016_1754031651194.jpg";
import interiorDetailingComparison from "@assets/ff034468a03ea55ea0924270de1e42bd_1754032817032.jpg";

/**
 * Homepage in the senior-approved redesign (p91-cc-audit.web.app/preview).
 *
 * Layout, typography, spacing and section order are the prototype's. Every number is
 * this application's live data:
 *
 *   - the three teaser cards read price, originalPrice and image from GET /api/services
 *   - the "% off" badge is computed from those two live values, never typed in
 *   - the booking fee in "Pay ₹299 now" comes from GET /api/settings/booking_amount
 *   - the footer's opening hours come from GET /api/business-hours
 *
 * The prototype hardcoded a service array whose prices were wrong against production —
 * PPF at ₹74,999 where the real price is ₹45,000, ceramic coating at ₹14,999 where it is
 * ₹5,999. None of that is carried over. If a price here ever disagrees with the booking
 * flow, it is a bug in this file, because both must read the same record.
 *
 * `.p91x` on the wrapper scopes styles/redesign.css to this page. Removing it would leave
 * the markup unstyled rather than leaking the prototype's generic class names — .card,
 * .section, .grid — into the admin screens.
 */

/**
 * The three services shown on the homepage, by stable slug.
 *
 * A curated selection is a design decision; the DATA behind each one is live. Slugs are
 * used rather than array positions so re-ordering the catalogue in the admin cannot
 * silently change what the homepage promotes. Any slug that no longer exists is skipped
 * and backfilled from the catalogue, so a renamed service degrades to a different card
 * rather than an empty grid.
 */
const TEASER_SLUGS = [
  "interior-detailing-service",
  "exterior-detailing-hard-water-new",
  "1-year-ceramic-coating",
];

/** Slug whose photograph is the hero background. */
const HERO_IMAGE_SLUG = "exterior-detailing-hard-water-new";

/**
 * Static, build-time-known path to today's hero photo — same file the live
 * `exterior-detailing-hard-water-new` record points at (see
 * scripts/set-service-card-images.mjs). Used only so the hero `<img>` can render on the
 * very first paint, before `/api/services` has answered.
 *
 * This is the LCP element. Gating its existence on an API response (as it used to be:
 * `{heroImage && <img .../>}`) meant the browser could not even discover, let alone
 * fetch, the image until React mounted, the query resolved, and the element appeared —
 * a fully serial chain on top of whatever the image itself costs. Rendering it
 * unconditionally with this fallback, then letting `heroImage` below swap in the live
 * DB value once it arrives (normally the same file), removes that entire wait from the
 * LCP and CLS-causing "box appears from nothing" path.
 */
const HERO_FALLBACK_IMAGE = "/attached_assets/services/exterior-detailing-hard-water-spot-removal.webp";

function discountPercent(service: ServiceRecord): number {
  const original = service.originalPrice ? parseFloat(service.originalPrice) : 0;
  const price = parseFloat(service.price);
  if (!Number.isFinite(original) || !Number.isFinite(price) || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export default function Home() {
  const { data: services, isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  // Feeds the AutoRepair schema its real opening hours. Same query key as the footer,
  // so react-query dedupes it to a single request.
  const { data: businessHours = [] } = useQuery<BusinessHour[]>({
    queryKey: ["/api/business-hours"],
    retry: 1,
  });

  // The booking fee is a setting, not a constant. The booking modal reads the same key,
  // so the figure quoted on the homepage and the figure charged can never diverge.
  const { data: bookingAmountSetting } = useQuery<{ value?: string }>({
    queryKey: ["/api/settings/booking_amount"],
    retry: false,
  });
  const bookingFee = (() => {
    const raw = bookingAmountSetting?.value;
    const n = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 299;
  })();

  // Free-booking offer, decided server-side by the same authority that sets the amount,
  // so this page can never advertise a price the booking flow will not charge.
  const offer = useBookingOffer();

  useSeoMeta({
    // Shared with scripts/prerender.mjs so the crawler HTML and the page cannot disagree.
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    image: "/Car Care (4)_1753951564515.png",
    canonicalPath: "/",
    structuredData: localBusinessSchema({
      origin: typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin,
      businessHours,
    }),
  });

  /**
   * Hero background video — gated so it can never be what makes the page slow.
   *
   * Starts `false` (server/prerendered HTML renders the photo only, unchanged — no video
   * in what a crawler or a first paint sees). Flips to `true` client-side, and only when
   * ALL of these hold:
   *   - viewport is >= 769px. The only existing approved footage is a large source file —
   *     nothing in this project can transcode video, so there is no compressed variant to
   *     serve. Autoplaying that over mobile data is not "mobile-friendly" by any reading of
   *     the word, so mobile gets the same photo hero it has today, not a broken promise of
   *     a lighter file that does not exist.
   *   - prefers-reduced-motion is not set.
   *   - the page has already reached load and gone idle, via requestIdleCallback (or a
   *     timeout on browsers without it) — so the fetch competes with nothing on the
   *     critical path and cannot delay first paint or interactivity.
   * The photo stays mounted underneath regardless (see the hero JSX): if any of the above
   * is false, if the browser blocks autoplay, or if the file is still downloading, the
   * visitor simply sees the photo hero exactly as it renders today.
   */
  const [showHeroVideo, setShowHeroVideo] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const HERO_VIDEO_LOOP_START = 3.7;
  const HERO_VIDEO_LOOP_END = 7.7;
  useEffect(() => {
    if (window.innerWidth < 769) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const enable = () => setShowHeroVideo(true);
    const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    const id = ric ? ric(enable) : window.setTimeout(enable, 1500);
    return () => {
      const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (ric && cic) cic(id);
      else window.clearTimeout(id);
    };
  }, []);

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));

  // Curated first, then backfilled from the catalogue so the grid is always full.
  const teasers: ServiceRecord[] = [];
  for (const slug of TEASER_SLUGS) {
    const found = bySlug.get(slug);
    if (found) teasers.push(found);
  }
  for (const s of list) {
    if (teasers.length >= 3) break;
    if (!teasers.some((t) => t.id === s.id)) teasers.push(s);
  }

  const heroService = bySlug.get(HERO_IMAGE_SLUG) ?? list[0];
  const heroImage = resolveServiceImage(heroService) ?? HERO_FALLBACK_IMAGE;

  return (
    <div className="p91x min-h-screen">
      <SiteHeader overHero />

      {/* ---------- hero ---------- */}
      <section className="hero-bg">
        <ImageWithFallback
          className="shot"
          src={heroImage}
          alt="Exterior detailing and hard water spot removal at the P91 Car Care studio in Adugodi, Bangalore"
          width={1600}
          height={900}
          /* The LCP element. Rendered unconditionally (heroImage always resolves — to the
             live DB image once loaded, to HERO_FALLBACK_IMAGE before that) so it exists in
             the tree from the first paint instead of appearing only after /api/services
             answers. Eager + fetchpriority=high so it is not queued behind lazy card
             thumbnails, and 100vw because it really is full-bleed. */
          sizes="100vw"
          priority
          data-testid="img-hero"
        />
        {/* Layered directly over the photo above, not swapped in for it — and invisible
            (opacity 0) until `onPlaying` actually fires. Relying on the `poster` attribute
            alone left a brief black frame in testing: the instant this element mounts it
            already owns the same stacking position as the photo, but a video element paints
            black until it has decoded something, and that can beat the poster/first-frame
            paint by a beat. Opacity keyed to a real "playing" event means the photo is
            always what's visible until there is an actual frame to replace it with — never
            a blank flash, on any connection speed. */}
        {showHeroVideo && (
          <video
            className="shot"
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={heroImage}
            aria-hidden="true"
            data-testid="video-hero"
            /* The full clip is a produced promo edit: title cards, a motion-blur scene
               transition, a multi-panel collage, and a noticeably darker graded stretch.
               Looping the whole thing would cycle back through all of that. This source
               range (in the same file, nothing new fetched) is the one continuous, bright,
               single-frame, in-focus stretch — a daylight rinse — so playback is confined
               to it instead of the full timeline. */
            onLoadedMetadata={(e) => { e.currentTarget.currentTime = HERO_VIDEO_LOOP_START; }}
            onTimeUpdate={(e) => {
              if (e.currentTarget.currentTime >= HERO_VIDEO_LOOP_END) {
                e.currentTarget.currentTime = HERO_VIDEO_LOOP_START;
              }
            }}
            onPlaying={() => setHeroVideoReady(true)}
            /* This stretch still reads a touch flat next to the photo hero — a brightness/
               contrast/saturation lift brings it up to match without touching the photo,
               which this same .shot class also styles. */
            style={{ opacity: heroVideoReady ? 1 : 0, transition: "opacity .6s ease, filter .6s ease", filter: "brightness(1.25) contrast(1.1) saturate(1.25)" }}
          >
            <source src="/attached_assets/Exterior Detailing_1754031679196.mp4" type="video/mp4" />
          </video>
        )}
        <div className="wrap copy">
          <span className="eyebrow">Detailing Studio · Adugodi</span>
          <h1 className="hero-solid">
            Car Detailing, PPF &amp; Ceramic Coating Studio in Adugodi, Bangalore
          </h1>
          <p className="lede">
            Ceramic coating, paint protection film and full interior work — done properly,
            warranty-backed, and bookable online in under a minute.
          </p>
          <p className="hero-caption">
            Same-day slots · Warranty on coatings · Adugodi, Bangalore
          </p>
          <div className="hero-cta">
            <Link href="/services" className="cta-lg" data-testid="button-hero-book">Book Now →</Link>
          </div>
        </div>
      </section>

      {/* ---------- categories ----------
          XPEL-style visual category grid, directly under the hero — a step this page did
          not have: it went straight from the hero to specific service teasers with no
          broader "what do you need" grid first. The four destinations are the same ones
          /services already forks out to (or /services itself for detailing), so this adds
          no new page and no new content, only a bigger, image-led entry point to what
          already exists. Real P91 work photos, one per category, none of them the hero
          photo or the before/after photos used lower on this page. */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Services</span>
            <h2>Full protection, done properly</h2>
          </div>
          <ScrollRow testId="scroll-categories">
            {[
              { href: "/ceramic-coating/car", label: "Ceramic Coating", sub: "For your car", img: "/attached_assets/services/car-ceramic-coating-1-year.webp" },
              { href: "/ppf", label: "Paint Protection Film", sub: "Hatchback, sedan or SUV", img: "/attached_assets/services/p91-full-ppf-suv.webp" },
              { href: "/services", label: "Interior Detailing", sub: "Full interior clean", img: "/attached_assets/services/interior-detailing-service.webp" },
              { href: "/ceramic-coating/bike", label: "Ceramic Coating", sub: "For your motorcycle", img: "/attached_assets/services/bike-ceramic-coating-1-year.webp" },
            ].map((cat) => (
              <Link key={cat.href + cat.label} href={cat.href} className="tile" data-testid={`link-category-${cat.label.toLowerCase().replace(/\s+/g, "-")}-${cat.sub.toLowerCase().replace(/\s+/g, "-")}`}>
                <ImageWithFallback
                  src={cat.img}
                  alt={`${cat.label} ${cat.sub} at P91 Car Care`}
                  sizes="(min-width: 640px) 300px, 72vw"
                />
                <div className="tile-label">
                  <h3>{cat.label}</h3>
                  <span>{cat.sub}</span>
                </div>
              </Link>
            ))}
          </ScrollRow>
        </div>
      </section>

      {/* ---------- most booked ----------
          id="services" is kept deliberately. The header CTA, the footer and — more
          importantly — any external link or ad creative pointing at
          p91carcare.com/#services all rely on this anchor existing. Dropping it during the
          redesign would silently break every one of them, which is why
          tests/regression.test.mjs asserts on it. */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="teaser-head">
            <div className="section-head">
              <span className="eyebrow">Catalogue</span>
              <h2>Most booked this month</h2>
            </div>
            <Link href="/services" className="teaser-more" data-testid="link-see-all-services">
              See all {list.length || 17} services →
            </Link>
          </div>

          <ScrollRow testId="scroll-featured">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card-skel" data-testid="skeleton-teaser" style={{ flex: "0 0 min(80%, 340px)", aspectRatio: "3 / 4" }}>
                    <div className="img" style={{ height: "100%" }} />
                  </div>
                ))
              : teasers.map((s) => {
                  const off = discountPercent(s);
                  const price = parseFloat(s.price);
                  const atStore = Number.isFinite(price) ? price - bookingFee : NaN;
                  return (
                    <Link
                      key={s.id}
                      href={`/service/${s.slug}`}
                      className="promo-card card is-teaser"
                      data-testid={`card-teaser-${s.id}`}
                    >
                      <ImageWithFallback
                        src={resolveServiceImage(s)}
                        alt={`${s.title.trim()} at P91 Car Care studio, Adugodi, Bangalore`}
                        sizes="(min-width: 640px) 340px, 80vw"
                        loading="lazy"
                        data-testid={`img-teaser-${s.id}`}
                      />
                      <span className="card-cat">{deriveCategory(s)}</span>
                      {off > 0 && <span className="card-save" data-testid={`text-teaser-off-${s.id}`}>{off}% off</span>}
                      <div className="promo-body">
                        <h3 data-testid={`text-service-title-${s.id}`}>{s.title.trim()}</h3>
                        <p className="card-note">
                          {offer.free ? (
                            <>
                              <b>Book free</b>
                              {Number.isFinite(price) && price > 0 && <> · {formatINR(String(price))} at the store</>}
                            </>
                          ) : (
                            <>
                              Pay <b>{formatINR(bookingFee)}</b> now
                              {Number.isFinite(atStore) && atStore > 0 && <> · {formatINR(atStore)} at the store</>}
                            </>
                          )}
                        </p>
                        <div className="card-foot">
                          <div className="prices">
                            {s.originalPrice && (
                              <span className="was" data-testid={`text-original-price-${s.id}`}>
                                ₹{s.originalPrice}
                              </span>
                            )}
                            <span className="now" data-testid={`text-price-${s.id}`}>₹{s.price}</span>
                          </div>
                          <span className="go">Book</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </ScrollRow>
        </div>
      </section>

      {/* ---------- statement break ----------
          XPEL-style: one large real photo as a visual pause right after the featured
          services grid, before the showcase carousel — not a hero and not another
          gallery. A different real P91 photo from the hero and the showcase photos below,
          so nothing on this page repeats itself. */}
      <section
        className="section"
        style={{ padding: 0, position: "relative", minHeight: "clamp(260px, 40vw, 420px)", display: "flex", alignItems: "flex-end", overflow: "hidden" }}
        data-testid="section-photo-break"
      >
        <ImageWithFallback
          src="/attached_assets/services/annual-maintenance-package.webp"
          alt="A P91 Car Care technician detailing a car at the studio in Adugodi, Bangalore"
          sizes="100vw"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          data-testid="image-photo-break"
        />
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(9,9,11,.88) 0%, rgba(9,9,11,.35) 45%, transparent 75%)" }}
        />
        <div className="wrap" style={{ position: "relative", zIndex: 1, paddingBlock: 32 }}>
          <p style={{ color: "var(--neon-green)", fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
            Adugodi, Bangalore
          </p>
          <h2 style={{ fontSize: "clamp(26px,4.6vw,44px)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-.01em", lineHeight: 1.08, textShadow: "0 2px 16px rgba(0,0,0,.6)", maxWidth: "14ch" }}>
            Done properly, every time
          </h2>
          <Link href="/services" className="cta-lg" style={{ marginTop: 22 }} data-testid="link-photo-break-cta">
            Book Now →
          </Link>
        </div>
      </section>

      {/* ---------- showcase ----------
          XPEL-style large visual cards in a horizontal scroll, not a grid. Same real
          before/after photography and the same TRANSFORMATION_CTAS this section always
          used — a deliberate earlier fix, because the buttons used to link to deactivated
          slugs and landed customers on "Service Not Found". Only the card shape changed.

          tests/regression.test.mjs asserts all four TRANSFORMATION_CTAS keys are present
          here, so the resolver keeps them wired to live services rather than dead slugs. */}
      <section className="section" id="results">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Real results</span>
            <h2>Real work from the studio</h2>
          </div>

          <ScrollRow testId="scroll-showcase">
            <div className="showcase-card">
              <ImageWithFallback
                src={interiorDetailingComparison}
                alt="Interior detailing before and after — dirty versus deep-cleaned car interior"
                sizes="(min-width: 640px) 400px, 82vw"
                loading="lazy"
              />
              <span className="card-cat">Interior</span>
              <div className="card-body">
                <h3>Interior Deep Clean</h3>
                <TransformationCTA
                  service={TRANSFORMATION_CTAS.interiorDeepClean}
                  services={services}
                  action="Get"
                  testId="cta-interior-deep-clean"
                />
              </div>
            </div>

            <div className="showcase-card">
              <ImageWithFallback
                src={glassCoating}
                alt="Glass coating water beading demonstration on a treated windscreen"
                sizes="(min-width: 640px) 400px, 82vw"
                loading="lazy"
              />
              <span className="card-cat">Glass</span>
              <div className="card-body">
                <h3>Glass Coating</h3>
                <TransformationCTA
                  service={TRANSFORMATION_CTAS.glassCoating}
                  services={services}
                  action="Get"
                  testId="cta-glass-coating"
                />
              </div>
            </div>

            <div className="showcase-card">
              <ImageWithFallback
                src={headlightAfter}
                alt="Headlight after restoration — clear lens with yellowing removed"
                sizes="(min-width: 640px) 400px, 82vw"
                loading="lazy"
              />
              <span className="card-cat">Restoration</span>
              <div className="card-body">
                <h3>Headlight Restoration</h3>
                <TransformationCTA
                  service={TRANSFORMATION_CTAS.headlightRestoration}
                  services={services}
                  action="Get"
                  testId="cta-headlight-restoration"
                />
              </div>
            </div>

            <div className="showcase-card">
              <ImageWithFallback
                src={exteriorDetailingAfter}
                alt="Exterior detailing after hard water spot removal and paint correction"
                sizes="(min-width: 640px) 400px, 82vw"
                loading="lazy"
              />
              <span className="card-cat">Exterior</span>
              <div className="card-body">
                <h3>Complete Exterior Detail</h3>
                <TransformationCTA
                  service={TRANSFORMATION_CTAS.exteriorDetailing}
                  services={services}
                  action="Get"
                  testId="cta-exterior-detailing"
                />
              </div>
            </div>
          </ScrollRow>
        </div>
      </section>

      {/* ---------- guides ---------- */}
      <section className="section" id="blog">
        <div className="wrap">
          <div className="teaser-head">
            <div className="section-head">
              <span className="eyebrow">Resources</span>
              <h2>Guides from the studio</h2>
              <p>Straight answers to what customers ask us most.</p>
            </div>
            <Link href="/blog" className="teaser-more" data-testid="link-see-all-guides">See all guides →</Link>
          </div>

          <div className="blog-grid">
            {BLOG_POSTS.map((post) => {
              const img = resolveServiceImage(bySlug.get(post.imageServiceSlug));
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="post"
                  data-testid={`card-post-${post.slug}`}
                >
                  {img && (
                    <ImageWithFallback
                      src={img}
                      alt={post.title}
                      sizes="(min-width: 640px) 50vw, 100vw"
                      width={800}
                      height={500}
                      loading="lazy"
                    />
                  )}
                  <div className="post-body">
                    <div className="post-meta">
                      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                      <i className="dot" />
                      <span>{post.readMinutes} min read</span>
                      <i className="dot" />
                      <span>{post.category}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className="read">Read Guide →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- brands ---------- */}
      <section className="brands">
        <div className="wrap">
          <h2 className="brands-h">Films and coatings we fit</h2>
          <ul className="brand-row">
            <li>STEK</li>
            <li>Nasiol</li>
            <li>P91 Premium PPF</li>
          </ul>
          <p className="brands-note">
            Warranty on any job is the film or coating manufacturer's, issued in writing at handover.
            Ask to see the batch details before work starts.
          </p>
        </div>
      </section>

      <section className="strip">
        <div className="wrap">
          <div className="row">
            <div className="cell">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5z" /><path d="M9 12l2 2 4-4" />
              </svg>
              <b>Warranty-backed</b><span>Written warranty on every coating and PPF job</span>
            </div>
            <div className="cell">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
              <b>Same-day service</b><span>Most detailing finished the day you book</span>
            </div>
            <div className="cell">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
              </svg>
              <b>Pickup &amp; drop</b><span>Available across Bangalore at cost</span>
            </div>
            <div className="cell">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2.2" /><path d="M2.5 10h19" />
              </svg>
              {offer.free
                ? <><b>Free to book</b><span>No payment to reserve — settle at the store, no hidden charges</span></>
                : <><b>Pay {formatINR(bookingFee)} to book</b><span>Balance settled at the store, no hidden charges</span></>}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- trust / cta ----------
          XPEL-style closing block, with strong whitespace. Also restored: the previous
          homepage ended with a "Book Your Service Now" button that scrolled to the
          catalogue, and tests/regression.test.mjs pins both the button and the scroll
          target. */}
      <section className="section">
        <div className="wrap">
          <div
            className="rounded-[14px] border border-[var(--medium-gray)] bg-[var(--dark-gray)] px-6 py-10 text-center sm:px-10"
          >
            <div className="section-head" style={{ marginBottom: 22 }}>
              <h2>Ready when you are</h2>
              <p style={{ marginLeft: "auto", marginRight: "auto" }}>
                {offer.free ? (
                  <>
                    Pick a service and choose a slot — booking is free right now, with no payment
                    to reserve. You settle at the studio after the work.
                  </>
                ) : (
                  <>
                    Pick a service, choose a slot, and pay {formatINR(bookingFee)} to reserve it. The
                    balance is settled at the studio.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="cta-lg"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-final-cta"
            >
              Book Your Service Now →
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
