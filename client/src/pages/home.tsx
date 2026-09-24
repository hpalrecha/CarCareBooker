import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { localBusinessSchema } from "@/lib/local-business";
import { HOME_SEO } from "@/lib/static-seo";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { useBookingOffer } from "@/hooks/use-booking-offer";
import { PRODUCT_BRANDS } from "@/lib/nav-menu";
import type { BusinessHour } from "@shared/schema";

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

/**
 * The one visual for the Protection & Care screen: P91's own polishing reel
 * (attached_assets/reels/car-polishing-hero.mp4, 720x1280, 6.5 MB).
 *
 * Nothing is fetched until the screen is actually on view: preload="none" plus a poster
 * (a 58 KB still of the finished car), then play() when it is at least 35% visible and
 * pause() when it leaves, so it costs the critical path nothing and does not run off-screen.
 * With reduced motion, or Save-Data on, it stays a poster and never downloads the video.
 */
function CareVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as any).connection?.saveData) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster="/attached_assets/reels/car-polishing-poster.webp"
      aria-hidden="true"
      data-testid="video-care"
    >
      <source src="/attached_assets/reels/car-polishing-hero.mp4" type="video/mp4" />
    </video>
  );
}

export default function Home() {
  const { data: services } = useQuery<ServiceRecord[]>({
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
   * BOTH of these hold:
   *   - prefers-reduced-motion is not set.
   *   - the page has already reached load and gone idle, via requestIdleCallback (or a
   *     timeout on browsers without it) — so the fetch competes with nothing on the
   *     critical path and cannot delay first paint or interactivity.
   * No viewport check: this used to also require >= 769px, back when the only footage was
   * a 63.6MB unprocessed source with nothing in this project able to transcode it. It has
   * since been ffmpeg-compressed to ~9.8MB — the same size class as the per-service reels
   * service-landing.tsx already autoplays on mobile — so the mobile-specific block no
   * longer has a reason to exist.
   * The photo stays mounted underneath regardless (see the hero JSX): if either of the
   * above is false, if the browser blocks autoplay, or if the file is still downloading,
   * the visitor simply sees the photo hero exactly as it renders today.
   */
  const [showHeroVideo, setShowHeroVideo] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const HERO_VIDEO_LOOP_START = 3.7;
  const HERO_VIDEO_LOOP_END = 7.7;
  useEffect(() => {
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

  /**
   * Parallax. Elements opt in with data-parallax="<speed>"; nothing here touches layout.
   *   data-parallax-mode="scroll": moves by scrollY * speed (hero only, where the section
   *     starts at the top of the page).
   *   default: moves by its section's distance from viewport centre * -speed, so a positive
   *     speed drifts slower than the page (backgrounds) and a negative one faster (copy).
   * One passive scroll listener, one rAF per frame, transform only. Skipped entirely under
   * prefers-reduced-motion, in which case every element simply sits still.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    if (!els.length) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      for (const el of els) {
        const speed = parseFloat(el.dataset.parallax ?? "0");
        let y: number;
        if (el.dataset.parallaxMode === "scroll") {
          y = sy * speed;
        } else {
          const box = (el.closest("section, .screen-fill") ?? el.parentElement)!.getBoundingClientRect();
          if (box.bottom < -200 || box.top > vh + 200) continue;
          y = -(box.top + box.height / 2 - vh / 2) * speed;
        }
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      els.forEach((el) => { el.style.transform = ""; });
    };
  }, []);

  /**
   * Reveal on view: elements marked data-reveal fade up once as they enter the viewport.
   * The hidden starting state is applied by CSS only under html.has-reveal, which this effect
   * adds — so with no JS, an old browser or reduced motion, nothing is ever hidden.
   */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("has-reveal");
      els.forEach((el) => el.classList.remove("is-in"));
    };
  }, []);

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));

  const heroService = bySlug.get(HERO_IMAGE_SLUG) ?? list[0];
  // Fixed to the static fallback on purpose. This is the same file the exterior-detailing row
  // points at in the database, so the hero looks exactly as before; it no longer follows that
  // row's images, which lib/real-service-images.ts now maps for the service pages.
  void heroService;
  const heroImage = HERO_FALLBACK_IMAGE;

  return (
    <div className="p91x min-h-screen home-page">
      <SiteHeader overHero />

      {/* ---------- hero ---------- */}
      <section className="hero-bg">
        {/* Wrapper exists only so the photo and the video move together under parallax; the
            <img> inside is still the same unconditional, eager, fetchpriority=high LCP element. */}
        <div className="hero-media" data-parallax="0.2" data-parallax-mode="scroll">
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
        </div>
        {/* Two problems, one fix: the h1/lede's text-shadow alone couldn't hold up against
            a bright moment in the photo/video passing directly behind it (the words
            actually disappeared), and the video's own burned-in P91 watermark (top-left of
            the clip) was reading as a second, oversized logo sitting right under the real
            header logo. This covers the top strip (both the header and the watermark) and
            fades behind the copy column — see .hero-bg-scrim for why it's two gradients. */}
        <div className="hero-bg-scrim" aria-hidden="true" />
        <div className="wrap copy">
          <span className="eyebrow">Detailing Studio · Adugodi</span>
          <h1 className="hero-solid">
            Car Detailing, PPF &amp; Ceramic Coating Studio in Adugodi, Bangalore
          </h1>
          <p className="lede">
            Ceramic coating, paint protection film and full interior work — done properly,
            warranty-backed, and bookable online in under a minute.
          </p>
          <div className="hero-cta">
            <a href="#results" className="cta-ghost" data-testid="link-hero-see-work">See our work</a>
          </div>
          <ul className="hero-trust" aria-label="Why book with P91">
            <li>Same-day slots</li>
            <li>Warranty on coatings</li>
            <li>Adugodi, Bangalore</li>
          </ul>
        </div>
      </section>

      {/* ---------- 01 about ----------
          Editorial two-column: a short label, a large headline, two lines of copy, a
          four-row spec list and one text link on the left; one tall real photograph on the
          right. Every fact here is already stated elsewhere on the site (studio location,
          STEK / Nasiol / P91 Premium PPF, written manufacturer warranty at handover) — no
          founding year, counts or awards, because nothing in this codebase states one and
          tests/regression.test.mjs holds the homepage to that. The photo is a real studio
          photograph (attached_assets/about/, an upright, resized copy of the camera original
          20241227_164016 jpg); the alt text describes only what is visible in it. */}
      <section className="ed-about" id="about" data-testid="section-about">
        <div className="wrap">
          <div className="ed-about-grid">
            <div className="ed-about-copy">
              <p className="ed-label" data-reveal>01 / About P91</p>
              <h2 className="ed-title" data-reveal>Protection, done properly.</h2>
              <p className="ed-lede" data-reveal>
                P91 Car Care is a car detailing, ceramic coating and paint protection film
                studio in Adugodi, Bangalore. Every coating and PPF job is backed by a written
                warranty from the film or coating manufacturer, issued at handover.
              </p>
              <dl className="ed-specs" data-reveal>
                <div><dt>Studio</dt><dd>Adugodi, Bangalore</dd></div>
                <div><dt>Films</dt><dd>STEK · P91 Premium PPF</dd></div>
                <div><dt>Coatings</dt><dd>Nasiol</dd></div>
                <div><dt>Warranty</dt><dd>Written, issued at handover</dd></div>
              </dl>
              <Link href="/contact" className="ed-link" data-reveal data-testid="link-about-us">
                Find the studio →
              </Link>
            </div>
            <figure className="ed-figure" data-reveal>
              <ImageWithFallback
                src="/attached_assets/about/p91-studio-nasiol-floor-orange-hyundai.webp"
                alt="A finished orange Hyundai hatchback on the polished studio floor, under linear lighting, in front of a Nasiol India wall logo"
                sizes="(min-width: 861px) 46vw, 92vw"
                data-parallax="0.06"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- 02 what we do ----------
          ONE screen for PPF, ceramic coating and detailing: a single real P91 video and three
          typographic rows, instead of a photo section per service. The section that stood here
          before it (a black-BMW "Done properly, every time" photo break) used
          services/annual-maintenance-package.webp, an AI-style render captioned as a P91
          technician — removed, and nothing replaces it: the hero already carries the cinematic
          visual.

          id="services" lives here because this is where the old services grid sat.
          tests/regression.test.mjs pins the anchor and external ad links point at /#services.

          The rows link to the destinations the homepage category tiles already used: /ppf and
          /ceramic-coating/car (the campaign pages) and /services for detailing. The video shows
          polishing and its caption says exactly that. */}
      <section className="ed-care" id="services" data-tone="dark" data-testid="section-care">
        <div className="wrap">
          <div className="ed-care-grid">
            <div className="ed-care-copy">
              <p className="ed-label" data-reveal>02 / What we do</p>
              <h2 className="ed-title" data-reveal>Protection. Finish. Care.</h2>
              <ul className="ed-services" data-reveal>
                {[
                  { href: "/ppf", idx: "01", name: "PPF", id: "ppf" },
                  { href: "/ceramic-coating/car", idx: "02", name: "Ceramic", id: "ceramic" },
                  { href: "/services", idx: "03", name: "Detailing", id: "detailing" },
                ].map((s) => (
                  <li key={s.id}>
                    <Link href={s.href} className="ed-service" data-testid={`link-care-${s.id}`}>
                      <span className="ed-service-idx">{s.idx}</span>
                      <span className="ed-service-name">{s.name}</span>
                      <ArrowUpRight className="ed-service-arrow" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="ed-care-sub" data-reveal>
                Film, coating and care, all done in-studio in Adugodi.
              </p>
              <Link href="/services" className="ed-link" data-reveal data-testid="link-explore-services">
                Explore services →
              </Link>
            </div>
            <div className="ed-care-media" data-reveal>
              <figure className="ed-figure ed-figure-video">
                <CareVideo />
              </figure>
              <p className="ed-caption">Polishing at the P91 studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 03 real work ----------
          A small curated set of real P91 work in place of the priced service cards: no prices,
          no SAVE badges, no buttons — those live on /services and the booking pages. Every image
          is P91's own: two studio delivery photos (unnamed_*.webp), a still from the studio's
          PPF-fitting reel and one from its polishing reel (attached_assets/gallery/, extracted
          with ffmpeg). The interior-detailing film is deliberately NOT used: its ownership is
          unconfirmed (see lib/real-service-images.ts). id="results" is the target of the hero's "See our work". */}
      <section className="ed-work" id="results" data-testid="section-work">
        <div className="wrap">
          <p className="ed-label" data-reveal>03 / Real work</p>
          <h2 className="ed-title ed-title-wide" data-reveal>Real work, from our studio.</h2>
          <div className="ed-work-grid">
            <figure className="ed-work-fig ed-work-tall" data-reveal>
              <ImageWithFallback
                src="/attached_assets/gallery/p91-ppf-fitting.webp"
                alt="A P91 technician fitting clear paint protection film on the rear door of a black car"
                sizes="(min-width: 861px) 30vw, 92vw"
              />
              <figcaption className="ed-work-cap">PPF fitting</figcaption>
            </figure>
            <figure className="ed-work-fig ed-work-wide" data-reveal>
              <ImageWithFallback
                src="/attached_assets/unnamed_1765537193657.webp"
                alt="A black Hyundai SUV on the studio floor in front of a STEK wall"
                sizes="(min-width: 861px) 62vw, 92vw"
              />
              <figcaption className="ed-work-cap">Delivery</figcaption>
            </figure>
            <figure className="ed-work-fig ed-work-half" data-reveal>
              <ImageWithFallback
                src="/attached_assets/gallery/p91-polish-bonnet-pass.webp"
                alt="A polishing pad working the bonnet of a red car in the studio"
                sizes="(min-width: 861px) 30vw, 92vw"
              />
              <figcaption className="ed-work-cap">Polishing</figcaption>
            </figure>
            <figure className="ed-work-fig ed-work-half" data-reveal>
              <ImageWithFallback
                src="/attached_assets/unnamed_(1)_1765537193655.webp"
                alt="A dark blue hatchback on the studio floor in front of a green hexagon wall"
                sizes="(min-width: 861px) 30vw, 92vw"
              />
              <figcaption className="ed-work-cap">Delivery</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- 04 why p91 + brands ----------
          The former trust strip (four facts) and the brands strip, merged into one compact
          block. Facts and the booking-fee line are unchanged, including the live
          offer.free / bookingFee wording, so this can never advertise a price the booking flow
          will not charge. */}
      <section className="ed-why" data-testid="section-why">
        <div className="wrap">
          <p className="ed-label" data-reveal>04 / Why P91</p>
          <dl className="ed-why-grid" data-reveal>
            <div><dt>Warranty-backed</dt><dd>Written warranty on every coating and PPF job</dd></div>
            <div><dt>Same-day service</dt><dd>Most detailing finished the day you book</dd></div>
            <div><dt>Pickup &amp; drop</dt><dd>Available across Bangalore at cost</dd></div>
            <div>
              {offer.free ? (
                <>
                  <dt>Free to book</dt>
                  <dd>No payment to reserve — settle at the store, no hidden charges</dd>
                </>
              ) : (
                <>
                  <dt>Pay {formatINR(bookingFee)} to book</dt>
                  <dd>Balance settled at the store, no hidden charges</dd>
                </>
              )}
            </div>
          </dl>
          {/* Same data as the navbar's Products dropdown (lib/nav-menu.ts), so the two cannot disagree. */}
          <div className="ed-brands" data-reveal>
            <p className="ed-brands-label">Films and coatings we fit</p>
            <div className="ed-brand-grid">
              {PRODUCT_BRANDS.map((b) => (
                <div className="ed-brand" key={b.name} data-testid={`brand-${b.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <h3>{b.name}</h3>
                  <p>{b.line}</p>
                  <ul>
                    {b.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <p className="ed-fine" data-reveal>
            Warranty on any job is the film or coating manufacturer's, issued in writing at
            handover. Ask to see the batch details before work starts.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
