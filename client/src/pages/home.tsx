import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import TransformationCTA from "@/components/transformation-cta";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { localBusinessSchema } from "@/lib/local-business";
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
    title: "P91 Car Care — Car Detailing, PPF & Ceramic Coating in Indiranagar, Bangalore",
    description:
      "Ceramic coating, paint protection film and full interior detailing in Indiranagar, " +
      "Bangalore — warranty-backed and bookable online in under a minute.",
    image: "/Car Care (4)_1753951564515.png",
    canonicalPath: "/",
    structuredData: localBusinessSchema({
      origin: typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin,
      businessHours,
    }),
  });

  // The hero is full-height minus the sticky header, so the header's real height is
  // measured rather than assumed — a wrapped nav on a narrow screen would otherwise push
  // the next section into view. The CSS fallback covers the frame before this runs.
  useEffect(() => {
    const setChrome = () => {
      const header = document.querySelector(".p91x header.site") as HTMLElement | null;
      if (header) {
        document.documentElement.style.setProperty("--chrome", `${header.offsetHeight}px`);
      }
    };
    setChrome();
    window.addEventListener("resize", setChrome);
    return () => window.removeEventListener("resize", setChrome);
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
  const heroImage = resolveServiceImage(heroService);

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      {/* ---------- hero ---------- */}
      <section className="hero-bg">
        {heroImage && (
          <ImageWithFallback
            className="shot"
            src={heroImage}
            alt="Exterior detailing and hard water spot removal at the P91 Car Care studio in Indiranagar, Bangalore"
            width={1600}
            height={900}
            /* The LCP element. Eager + fetchpriority=high so it is not queued behind
               lazy card thumbnails, and 100vw because it really is full-bleed. */
            sizes="100vw"
            priority
            data-testid="img-hero"
          />
        )}
        <div className="wrap copy">
          <span className="eyebrow">● Detailing studio · Indiranagar</span>
          <h1>
            Car Detailing, PPF &amp; Ceramic Coating Studio in{" "}
            <span className="gradient-text">Indiranagar, Bangalore</span>
          </h1>
          <p className="lede">
            Ceramic coating, paint protection film and full interior work — done properly,
            warranty-backed, and bookable online in under a minute.
          </p>
          <div className="hero-cta">
            <Link href="/services" className="cta-lg" data-testid="button-hero-book">Book Now →</Link>
            <a className="cta-ghost" href="https://wa.me/917406619191" data-testid="link-hero-whatsapp">WhatsApp us</a>
          </div>
          <div className="hero-facts">
            <span>
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
              <b>Same-day</b> slots
            </span>
            <span>
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5z" /><path d="M9 12l2 2 4-4" />
              </svg>
              <b>Warranty</b> on coatings
            </span>
            <span>
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
              </svg>
              <b>Indiranagar</b>, Bangalore
            </span>
          </div>
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
              <h2>Most booked this month</h2>
              <p>
                A few of the {list.length || 17} services in the studio. Filter the full list on the
                booking page.
              </p>
            </div>
            <Link href="/services" className="teaser-more" data-testid="link-see-all-services">
              See all {list.length || 17} services →
            </Link>
          </div>

          <div className="grid">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card-skel" data-testid="skeleton-teaser">
                    <div className="img" />
                    <div style={{ padding: 20 }}>
                      <div className="bar" style={{ height: 16, width: "70%", marginBottom: 12 }} />
                      <div className="bar" style={{ height: 12, width: "50%", marginBottom: 22 }} />
                      <div className="bar" style={{ height: 22, width: "40%" }} />
                    </div>
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
                      className="card is-teaser"
                      data-testid={`card-teaser-${s.id}`}
                    >
                      <div className="card-img">
                        <ImageWithFallback
                          src={resolveServiceImage(s)}
                          alt={`${s.title.trim()} at P91 Car Care studio, Indiranagar, Bangalore`}
                          width={1200}
                          height={300}
                          /* Matches .grid: 3-up above 940px, 2-up above 600px, else full
                             width. Without an honest `sizes` the browser assumes 100vw and
                             picks the 1600w variant for a ~380px slot. */
                          sizes="(min-width: 940px) 380px, (min-width: 600px) 50vw, 100vw"
                          loading="lazy"
                          data-testid={`img-teaser-${s.id}`}
                        />
                        <span className="card-cat">{deriveCategory(s)}</span>
                        {off > 0 && <span className="card-save" data-testid={`text-teaser-off-${s.id}`}>{off}% off</span>}
                      </div>
                      <div className="card-body">
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
          </div>
        </div>
      </section>

      {/* ---------- before / after ----------
          RESTORED. The first pass of this redesign dropped these four sections because
          the prototype's homepage has no equivalent. That was wrong: they are real
          before-and-after photography of the studio's own work, and their CTAs resolve
          through TRANSFORMATION_CTAS — a deliberate earlier fix, because the buttons used
          to link to deactivated slugs and landed customers on "Service Not Found".
          Deleting marketing content is not a design change, so the content is kept and
          re-dressed in the prototype's card idiom instead.

          tests/regression.test.mjs asserts all four keys are present here. */}
      <section className="section" id="results">
        <div className="wrap">
          <div className="section-head">
            <h2>Before and after, in our studio</h2>
            <p>
              Real jobs photographed on the day. Prices come straight from the live
              catalogue, so what a button says is what checkout charges.
            </p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-img">
                <ImageWithFallback
                  src={interiorDetailingComparison}
                  alt="Interior detailing before and after — dirty versus deep-cleaned car interior"
                  width={1200}
                  height={300}
                  sizes="(min-width: 600px) 50vw, 100vw"
                  loading="lazy"
                />
                <span className="card-cat">Interior</span>
              </div>
              <div className="card-body">
                <h3>Interior Deep Clean</h3>
                <p className="card-note">Seat shampoo, dashboard and vents, odour removal.</p>
                <div className="card-foot">
                  <TransformationCTA
                    service={TRANSFORMATION_CTAS.interiorDeepClean}
                    services={services}
                    action="Get"
                    testId="cta-interior-deep-clean"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-img">
                <ImageWithFallback
                  src={glassCoating}
                  alt="Glass coating water beading demonstration on a treated windscreen"
                  width={1200}
                  height={300}
                  sizes="(min-width: 600px) 50vw, 100vw"
                  loading="lazy"
                />
                <span className="card-cat">Glass</span>
              </div>
              <div className="card-body">
                <h3>Glass Coating</h3>
                <p className="card-note">Rain repellent, clearer night driving.</p>
                <div className="card-foot">
                  <TransformationCTA
                    service={TRANSFORMATION_CTAS.glassCoating}
                    services={services}
                    action="Get"
                    testId="cta-glass-coating"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-img">
                <ImageWithFallback
                  src={headlightAfter}
                  alt="Headlight after restoration — clear lens with yellowing removed"
                  width={1200}
                  height={300}
                  sizes="(min-width: 600px) 50vw, 100vw"
                  loading="lazy"
                />
                <span className="card-cat">Restoration</span>
              </div>
              <div className="card-body">
                <h3>Headlight Restoration</h3>
                <p className="card-note">De-yellowing and a UV top coat, both lamps.</p>
                <div className="card-foot">
                  <TransformationCTA
                    service={TRANSFORMATION_CTAS.headlightRestoration}
                    services={services}
                    action="Get"
                    testId="cta-headlight-restoration"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-img">
                <ImageWithFallback
                  src={exteriorDetailingAfter}
                  alt="Exterior detailing after hard water spot removal and paint correction"
                  width={1200}
                  height={300}
                  sizes="(min-width: 600px) 50vw, 100vw"
                  loading="lazy"
                />
                <span className="card-cat">Exterior</span>
              </div>
              <div className="card-body">
                <h3>Complete Exterior Detail</h3>
                <p className="card-note">Hard water spot removal, clay bar, paint sealant.</p>
                <div className="card-foot">
                  <TransformationCTA
                    service={TRANSFORMATION_CTAS.exteriorDetailing}
                    services={services}
                    action="Get"
                    testId="cta-exterior-detailing"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- brands ---------- */}
      <section className="brands">
        <div className="wrap">
          <h2 className="brands-h">Films and coatings we fit</h2>
          <ul className="brand-row">
            <li>STEK</li>
            <li>Llumar</li>
            <li>3M</li>
            <li>Nasiol</li>
            <li>P91 Premium PPF</li>
          </ul>
          <p className="brands-note">
            Warranty on any job is the film or coating manufacturer's, issued in writing at handover.
            Ask to see the batch details before work starts.
          </p>
        </div>
      </section>

      {/* ---------- trust strip ---------- */}
      <section className="strip">
        <div className="wrap">
          <div className="row">
            <div className="cell"><b>Warranty-backed</b><span>Written warranty on every coating and PPF job</span></div>
            <div className="cell"><b>Same-day service</b><span>Most detailing finished the day you book</span></div>
            <div className="cell"><b>Pickup &amp; drop</b><span>Available across Bangalore at cost</span></div>
            <div className="cell">{offer.free
              ? <><b>Free to book</b><span>No payment to reserve — settle at the store, no hidden charges</span></>
              : <><b>Pay {formatINR(bookingFee)} to book</b><span>Balance settled at the store, no hidden charges</span></>}</div>
          </div>
        </div>
      </section>

      {/* ---------- guides ---------- */}
      <section className="section" id="blog">
        <div className="wrap">
          <div className="teaser-head">
            <div className="section-head">
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
                      width={800}
                      height={200}
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

      {/* ---------- closing CTA ----------
          Also restored. The previous homepage ended with a "Book Your Service Now" button
          that scrolled to the catalogue, and tests/regression.test.mjs pins both the
          button and the scroll target. It is a conversion element at the natural end of
          the page, so it stays — dressed as the prototype's hero CTA rather than the old
          gradient block. */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div
            className="rounded-[14px] border border-[var(--medium-gray)] bg-[var(--dark-gray)] px-6 py-10 text-center sm:px-10"
          >
            <h2 style={{ fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 800, marginBottom: 10 }}>
              Ready when you are
            </h2>
            <p style={{ color: "var(--txt-2)", margin: "0 auto 22px", maxWidth: "52ch" }}>
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
