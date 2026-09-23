import { useParams, useLocation, Link } from "wouter";
// `.lp-*` (price, includes, steps, FAQ) is defined in landing-pages.css. This is the
// highest-traffic consumer of that stylesheet — the 17 indexed /service/:slug pages — so
// it must import it directly now that main.tsx no longer loads it globally (see main.tsx:
// moved out to stop blocking every route with CSS most routes don't use).
import "@/styles/landing-pages.css";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Star, Clock, Shield, MapPin, Play, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BookingModal from "@/components/booking-modal";
import CallbackPopup from "@/components/callback-popup";
import InstagramReels from "@/components/instagram-reels";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { REELS_BY_SERVICE } from "@/lib/instagram-reels";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { useBookingOffer } from "@/hooks/use-booking-offer";
import { deriveCategory, deriveVehicle } from "@/lib/service-taxonomy";
import { formatServiceTime } from "@/lib/service-time";
import { serviceSeoTitle, serviceSeoDescription, serviceStructuredData } from "@/lib/service-seo";
import { useHeroVideoGate } from "@/hooks/use-hero-video";
import type { BusinessHour } from "@shared/schema";

// Before/after images
import headlightBefore from "@assets/6634a243-60ef-4577-8f2d-0cb377dadc96_1754029992282.webp";
import headlightAfter from "@assets/GVXjDlbWcAAoQD1_1754029992281.jpg";
import glassCoating from "@assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg";
import glassPolishing from "@assets/67437605d9533141c047dea3_1758534676222.avif";
import exteriorDetailingBefore from "@assets/WhatsApp Image 2025-01-03 at 3.39.31 PM_1754032180088.jpeg";
import exteriorDetailingAfter from "@assets/20241227_164016_1754031651194.jpg";
import interiorDetailingComparison from "@assets/ff034468a03ea55ea0924270de1e42bd_1754032817032.jpg";

/**
 * Slugs whose testimonial section is hidden in the UI.
 *
 * TEMPORARY. The bike ceramic-coating record carries testimonials copied from the CAR
 * ceramic service — they talk about "my car" and "my white car", which reads wrong on a
 * motorcycle page. They are attributed quotes from named people, so they are neither
 * rewritten nor deleted: the rows stay untouched in the database and only the section is
 * suppressed, on this one service. Remove the slug from this set once genuine
 * bike-specific testimonials are supplied. No other service is affected.
 */
const TESTIMONIALS_SUPPRESSED = new Set<string>(['1-year-bike-ceramic-coating']);

/**
 * Section ids the sticky sub-nav below the hero can link to. Looked up with
 * `document.getElementById` rather than derived from `subnavItems` (computed after the
 * early loading/not-found returns), so the scroll-spy effect can be declared once, before
 * those returns, like every other hook in this component — a section this service does not
 * render simply is not in the DOM, and `getElementById` returns null for it.
 */
const SUBNAV_IDS = ["overview", "benefits", "packages", "gallery", "faqs"] as const;

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  heroVideo: string;
  whyChoose: string;
  whatIncluded: string[];
  process: Array<{ step: number; title: string; description: string; image?: string }>;
  beforeAfter: Array<{ before: string; after: string; description?: string }>;
  testimonials: Array<{ name: string; rating: number; comment: string; image?: string }>;
  faq: Array<{ question: string; answer: string }>;
  price: string;
  originalPrice: string;
  discountText: string;
  duration: number;
  images: string[];
  gallery: Array<{ url: string; type: 'image' | 'video'; caption?: string }>;
  metaTitle: string;
  metaDescription: string;
  ctaText: string;
  urgencyText: string;
  guaranteeText: string;
}

/**
 * `service.heroVideo` (shared/schema.ts) is "YouTube/Vimeo URL or video file URL" — two
 * different embed mechanisms. A direct file (the studio's own reel, saved under
 * attached_assets/) plays as a real <video>, autoplaying and muted like the homepage hero's
 * footage; a YouTube/Vimeo URL has no direct file to point a <video> element at and stays
 * on the existing <iframe> embed.
 */
function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

/** Drops the "✓ " some records prefix to each item — the list already draws a tick. */
function cleanIncluded(item: string) {
  return item.replace(/^\s*[✓✔]\s*/, '').trim();
}

/**
 * An included item cut to its headline clause, so it fits one line:
 * "Multi-stage clay bar treatment to remove embedded contaminants" -> "Multi-stage clay bar
 * treatment". Only ever shortens the studio's own wording; if no clean break exists the
 * item is left whole (and the list truncates it visually, full text in the title).
 */
function shortIncluded(item: string) {
  const text = cleanIncluded(item);
  // Hyphen, en dash and em dash all introduce an explanation ("6 Hybrid Washes – exterior
  // foam wash…"), so each is a break; a trailing dash or colon left by a cut is stripped.
  const cut = text.search(/\s+[-–—]\s+|,|\s+(to|for|before|with|on|that|which)\s+/i);
  const head = cut > 5 ? text.slice(0, cut).trim() : text;
  return head.replace(/\s*[-–—:]+$/, '');
}

/** The first sentence of a paragraph — "why choose" is a single line, not an essay. */
function firstSentence(text: string) {
  const t = text.trim();
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}

/**
 * The four hand-photographed before/after slugs, plus the generic `service.beforeAfter`
 * array a record may carry. One data-driven renderer replaces what used to be four
 * copy-pasted JSX blocks (~90 lines each) — same images, same captions, same testids,
 * same video URLs, just described once instead of four times.
 */
type Comparison =
  | { layout: "pair"; before: string; beforeAlt: string; beforeLabel: string; beforeCaption: string;
      after: string; afterAlt: string; afterLabel: string; afterCaption: string;
      testId: string; video?: { src: string; title: string }; heading: string; sub: string }
  | { layout: "single"; image: string; alt: string; badge: string; caption: string; testId: string;
      video?: { src: string; title: string }; note?: string; heading: string; sub: string };

function fixedComparisonFor(slug: string, vehicleNoun: string): Comparison | null {
  switch (slug) {
    case 'headlight-restoration-both':
      return {
        layout: "pair",
        before: headlightBefore, beforeAlt: "Foggy headlight before restoration",
        beforeLabel: "BEFORE", beforeCaption: "Foggy & Yellowed",
        after: headlightAfter, afterAlt: "Crystal clear headlight after restoration",
        afterLabel: "AFTER", afterCaption: "Crystal Clear",
        testId: "headlight",
        video: { src: "https://www.youtube.com/embed/XXb4J6cBze0", title: "Headlight Restoration Process - P91 Car Care" },
        heading: "Watch The Complete Process",
        sub: "See how we transform foggy headlights to crystal clear",
      };
    case 'windshield-glass-coating-new':
      return {
        layout: "single",
        image: glassCoating, alt: "Water beading on ceramic coated windshield",
        badge: "COATED GLASS", caption: "Water Beading Effect", testId: "glass-coating",
        video: { src: "https://www.youtube.com/embed/Oak9CKJMz6E", title: "Glass Coating Water Repelling Demo - P91 Car Care" },
        heading: "See The Water Repelling Effect",
        sub: "Watch how water slides off instantly after coating",
      };
    case 'windshield-glass-polishing':
      return {
        layout: "single",
        image: glassPolishing, alt: "Crystal clear polished windshield",
        badge: "POLISHED GLASS", caption: "Crystal Clear Clarity", testId: "glass-polishing",
        video: { src: "https://www.youtube.com/embed/Oak9CKJMz6E", title: "Glass Polishing Process - P91 Car Care" },
        heading: "See The Polishing Process",
        sub: "Watch how we restore crystal-clear visibility by removing water spots and scratches",
      };
    case 'exterior-detailing-hard-water-new':
      return {
        layout: "pair",
        before: exteriorDetailingBefore, beforeAlt: "Car before exterior detailing - dull and dirty",
        beforeLabel: "BEFORE", beforeCaption: "Dull & Dirty",
        after: exteriorDetailingAfter, afterAlt: "Car after exterior detailing - glossy orange finish",
        afterLabel: "AFTER", afterCaption: "Showroom Shine",
        testId: "exterior",
        note: "Our professional exterior detailing transforms your car's appearance with deep cleaning, paint correction, and protective coating. See the mirror-like finish and showroom shine that makes your car look brand new.",
        heading: "Watch The Detailing Process",
        sub: "See how we transform dull cars into showroom perfection",
      } as Comparison;
    case 'interior-detailing-service':
      return {
        layout: "single",
        image: interiorDetailingComparison, alt: "Interior detailing before and after comparison - dirty vs clean car interior",
        badge: "SEE THE DIFFERENCE", caption: "Before vs After", testId: "interior",
        note: `Transform your ${vehicleNoun}'s interior from dirty and stained to fresh and spotless. Our deep cleaning process removes dirt, stains, and odors, leaving your interior looking and smelling like new.`,
        heading: "Interior Detailing Process",
        sub: "See our comprehensive interior cleaning transformation",
      };
    default:
      return null;
  }
}

function ComparisonBlock({ comparison }: { comparison: Comparison }) {
  return (
    <div>
      {comparison.layout === "pair" ? (
        <div className="grid grid-2">
          <div className="card-img" style={{ position: "relative" }}>
            <ImageWithFallback
              src={comparison.before}
              alt={comparison.beforeAlt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
              data-testid={`image-${comparison.testId}-before`}
            />
            <span className="card-cat" style={{ background: "#B4232F", color: "#fff", borderColor: "transparent" }}>{comparison.beforeLabel}</span>
            <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(9,9,11,.86)", color: "var(--txt)", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
              {comparison.beforeCaption}
            </div>
          </div>
          <div className="card-img" style={{ position: "relative" }}>
            <ImageWithFallback
              src={comparison.after}
              alt={comparison.afterAlt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
              data-testid={`image-${comparison.testId}-after`}
            />
            <span className="card-cat" style={{ background: "var(--neon-green)", color: "#04120A", borderColor: "transparent" }}>{comparison.afterLabel}</span>
            <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(9,9,11,.86)", color: "var(--txt)", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
              {comparison.afterCaption}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-img" style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <ImageWithFallback
            src={comparison.image}
            alt={comparison.alt}
            sizes="(min-width: 1024px) 900px, 100vw"
            style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
            data-testid={`image-${comparison.testId}`}
          />
          <span className="card-cat" style={{ borderColor: "var(--neon-line)" }}>{comparison.badge}</span>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(9,9,11,.86)", color: "var(--txt)", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
            {comparison.caption}
          </div>
        </div>
      )}

      {comparison.layout === "single" && comparison.note && (
        <p className="fineprint" style={{ maxWidth: 760, margin: "20px auto 0", textAlign: "center", fontStyle: "normal" }}>
          {comparison.note}
        </p>
      )}
      {comparison.layout === "pair" && (comparison as any).note && (
        <p className="fineprint" style={{ maxWidth: 760, margin: "20px auto 0", textAlign: "center", fontStyle: "normal" }}>
          {(comparison as any).note}
        </p>
      )}

      {comparison.video && (
        <div style={{ marginTop: 34, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
          <div className="section-head" style={{ textAlign: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, fontWeight: 700 }}>{comparison.heading}</h3>
            <p>{comparison.sub}</p>
          </div>
          <div className="card-img" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={comparison.video.src}
              title={comparison.video.title}
              style={{ width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceLanding() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  // Once dismissed the sticky bar stays gone for the rest of the visit.
  const [floatingCtaDismissed, setFloatingCtaDismissed] = useState(false);
  // True from the footer onwards — the floating bar hides then, so it never covers the
  // footer's own contact info. Used to watch the "Ready to Transform" CTA banner, which
  // was removed from every service page; now watches the footer wrapper directly (see
  // the ref below, attached just above <SiteFooter />).
  const [finalCtaVisible, setFinalCtaVisible] = useState(false);
  const finalCtaRef = useRef<HTMLElement | null>(null);

  // Track scroll position for floating CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      // Show floating CTA after scrolling past 30% of viewport
      setShowFloatingCTA(scrollY > viewportHeight * 0.3);
    };

    // Check immediately on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Free-booking offer state, decided server-side. Declared here (before the early
  // returns) because hooks cannot be called conditionally.
  const offer = useBookingOffer();

  // Hero background video gate (see use-hero-video.ts). `allowMobile: true` — these are
  // the studio's own ~5-7MB reels, not the 61MB clip home.tsx/campaign-landing.tsx share,
  // so autoplaying on a phone is not the mobile-data problem it would be there.
  // `immediate: true` — this page is reached by clicking into it from within an already-
  // idle app (services grid, nav, search) far more often than it's the literal first
  // paint, so the idle/1500ms wait just held the static photo on screen while a video
  // that was always going to autoplay sat there unrequested. Declared here, before the
  // early returns below, for the same reason as `offer`.
  const showHeroVideo = useHeroVideoGate({ allowMobile: true, immediate: true });
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services", slug],
    enabled: !!slug,
  });

  // The full catalogue, only to find this service's real PPF tier siblings (Basic /
  // Premium / Partial, same vehicle size) — never to invent variants that don't exist.
  const { data: allServices } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  // Hide the floating CTA once the footer scrolls into view.
  useEffect(() => {
    const el = finalCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      // Hidden from the footer onwards, not only while it is on screen — entry.top < 0
      // covers a footer taller than the viewport, where it can be "on screen" (top edge
      // already scrolled past) without ever satisfying isIntersecting on its own.
      ([entry]) => setFinalCtaVisible(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [service]);

  // Scroll-spy for the sticky sub-nav (Overview / Benefits / Packages / Gallery / FAQs).
  // Watches whichever of SUBNAV_IDS actually rendered for this service; a service missing a
  // section (no FAQ, no PPF tiers) simply has nothing at that id, so it's never observed.
  const [activeSection, setActiveSection] = useState<string>("");
  useEffect(() => {
    const targets = SUBNAV_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        // The topmost of the currently-intersecting sections is the one the reader is
        // actually at, when several are tall enough to overlap the observation band.
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveSection(top.target.id);
      },
      // A band just under the sticky header+sub-nav, ending well above the fold, so the
      // "active" tab changes as a section reaches reading position, not the instant its
      // top pixel appears.
      { rootMargin: "-130px 0px -65% 0px", threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [service]);

  if (isLoading) {
    return (
      <div className="p91x min-h-screen">
        <SiteHeader />
        <section className="section" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            className="animate-spin"
            style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--medium-gray)", borderBottomColor: "var(--neon-green)" }}
          />
        </section>
        <SiteFooter />
      </div>
    );
  }

  // Customer-facing empty state for an unknown or deactivated slug. This used to be a
  // bare "Service Not Found" heading — which is where all four homepage transformation
  // CTAs landed, because they pointed at inactive slugs.
  if (!service) {
    return (
      <div className="p91x min-h-screen">
        <SiteHeader />
        <section className="section">
          <div className="wrap" style={{ textAlign: "center", maxWidth: 640 }}>
            <div className="section-head">
              <h1 style={{ fontSize: "clamp(26px,4.6vw,40px)", fontWeight: 800 }}>We couldn't find that service</h1>
              <p>
                It may have been renamed or is no longer offered. All of our current services
                are listed on the homepage.
              </p>
            </div>
            <div className="hero-cta" style={{ justifyContent: "center" }}>
              <a href="/#services" className="cta-lg" data-testid="button-service-not-found-services">
                Browse All Services
              </a>
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="cta-ghost"
                data-testid="button-service-not-found-home"
              >
                Go Home
              </button>
            </div>
            <p className="fineprint" style={{ marginTop: 28 }}>
              Need help choosing?{" "}
              <a href="/contact">Contact us</a>
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const discountPercent = service.originalPrice
    ? Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)
    : 0;

  const showTestimonials = !TESTIMONIALS_SUPPRESSED.has(service.slug);
  const isAnnualPackage = service.title === 'Annual Maintenance Package';

  // This template is shared by every service, and its fixed copy said "car"
  // throughout — which read wrong on the bike ceramic-coating page ("transform your
  // car"). Derive the noun from the service itself. "P91 Car Care" is the brand name
  // and is deliberately left alone.
  const heroImage = resolveServiceImage(service);
  const isBikeService = /\bbike\b|\bmotorcycle\b/i.test(service.title);
  const vehicleNoun = isBikeService ? "bike" : "car";

  const heroCategory = deriveCategory(service);

  const comparison = fixedComparisonFor(service.slug, vehicleNoun);
  const genericComparisons = service.beforeAfter && service.beforeAfter.length > 0 ? service.beforeAfter : [];
  const hasComparisons = comparison !== null || genericComparisons.length > 0;

  /**
   * Real PPF tier siblings for this exact vehicle size — Basic / Premium / Partial are
   * genuinely separate catalogue records (see lib/service-taxonomy.ts), not variants of
   * one product the way XPEL's FUSION PLUS tabs are. This is a tab-styled row of real
   * links between those real pages, not a switcher pretending one record holds all three.
   * Empty (and hidden) for every category without real tiered siblings — ceramic coating,
   * interior detailing, glass, etc. each have exactly one tier, so nothing here would be
   * genuine for them.
   */
  const tierSiblings = (heroCategory === "PPF" && Array.isArray(allServices))
    ? allServices
        .filter((s) => deriveCategory(s) === "PPF" && deriveVehicle(s) === deriveVehicle(service))
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    : [];

  /**
   * Other active services in the same category AND for the same vehicle — never a bike
   * service on a car page or vice versa. This page had no internal links to any other
   * /service/:slug at all; a visitor who finished reading could only book this one service
   * or leave, and neither Google nor a reader had a path from here to the rest of the
   * catalogue. Excludes PPF, whose real cross-links are tierSiblings above already.
   */
  const relatedServices = (heroCategory !== "PPF" && Array.isArray(allServices))
    ? allServices
        .filter((s) =>
          s.slug !== service.slug &&
          deriveCategory(s) === heroCategory &&
          deriveVehicle(s) === deriveVehicle(service),
        )
        .slice(0, 3)
    : [];

  /**
   * Which of the sticky sub-nav's five tabs this service actually has content for, and —
   * for Packages/Process, which real section stands behind it. Gated on the same
   * conditions each target section already renders on, so a tab never points at an id
   * that isn't on the page.
   */
  const hasOverview = Boolean((service.whatIncluded && service.whatIncluded.length > 0) || service.heroVideo);
  const hasBenefits = Boolean(service.whyChoose) || Boolean(service.guaranteeText);
  const packagesMode: "tiers" | "process" | null =
    tierSiblings.length > 1 ? "tiers" : service.process && service.process.length > 0 ? "process" : null;
  const hasGallery =
    hasComparisons || Boolean(service.gallery && service.gallery.some((item) => item.type === "video"));
  const hasFaqs = Boolean(service.faq && service.faq.length > 0);

  const subnavItems: { id: (typeof SUBNAV_IDS)[number]; label: string }[] = [
    hasOverview ? { id: "overview" as const, label: "Overview" } : null,
    hasBenefits ? { id: "benefits" as const, label: "Benefits" } : null,
    packagesMode ? { id: "packages" as const, label: packagesMode === "tiers" ? "Packages" : "Process" } : null,
    hasGallery ? { id: "gallery" as const, label: "Gallery" } : null,
    hasFaqs ? { id: "faqs" as const, label: "FAQs" } : null,
  ].filter((x): x is { id: (typeof SUBNAV_IDS)[number]; label: string } => x !== null);

  return (
    <>
    <ServiceSeo service={service} />
    <div className="p91x min-h-screen">
      {/*
        The site header, shared with every other page (components/redesign/site-header).
        Book Now opens this service's booking form in place rather than sending the visitor
        away to /services.
      */}
      <SiteHeader onBookNow={() => setBookingModalOpen(true)} />

      {/* Hero: light theme by request — white/black, real photo as the section's own
          full-bleed background (not boxed beside the text) rather than behind it in a
          dark scrim like home.tsx: a white scrim here instead, so the same photo now
          supports black text. The offer card stays the ordinary dark `.card` — a
          deliberate accent panel, needing no colour changes of its own to read clearly
          over a lightened photo. */}
      <section className="hero-light-bg">
        {heroImage && (
          <ImageWithFallback
            className="shot"
            src={heroImage}
            alt={`${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
            sizes="100vw"
            priority
            data-testid="img-hero"
          />
        )}
        {/* Layered directly over the photo above, same treatment as home.tsx's hero video:
            invisible until `onPlaying` actually fires, so the photo is always what's
            visible until there is a real frame to replace it with. Only when the record's
            heroVideo is a real saved file (isDirectVideoFile) — a YouTube/Vimeo URL has no
            file to autoplay here and stays on the iframe embed further down in Overview. */}
        {service.heroVideo && isDirectVideoFile(service.heroVideo) && showHeroVideo && (
          <video
            className="shot"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={heroImage}
            aria-hidden="true"
            data-testid="video-hero"
            onPlaying={() => setHeroVideoReady(true)}
            style={{ opacity: heroVideoReady ? 1 : 0, transition: "opacity .6s ease" }}
          >
            <source src={service.heroVideo} type="video/mp4" />
          </video>
        )}
        {/* Scrim behind the copy column only, on the left where the text sits. The studio
            photos this hero was originally tuned for are shot dark/moody, so text-shadow
            alone was enough; a real reel's footage (autoplaying in the layer above) is
            not guaranteed to be — a bright panel shot under studio lighting can wash the
            white h1/lede out. Left-weighted rather than a flat wash so the video is still
            shown at full brightness everywhere the text isn't. */}
        <div className="hero-light-scrim" aria-hidden="true" />
        <div className="wrap hero-light-copy">
          <div style={{ maxWidth: 620 }}>
            <h1 className="text-3xl">
              {service.title.trim()}
            </h1>

            <p className="hero-light-lede">
              {service.description}
            </p>

            {/*
              Three trust pills, every one a fact: the service's own first included item,
              its duration from the record, and the studio (which opens Google Maps).
            */}
            <ul className="hero-facts hero-light-facts" data-testid="trust-pills">
              {service.whatIncluded?.[0] && (
                <span>
                  <CheckCircle className="i" aria-hidden="true" style={{ color: "var(--neon-green)" }} />
                  {shortIncluded(service.whatIncluded[0])}
                </span>
              )}
              {formatServiceTime(service) && (
                <span>
                  <Clock className="i" aria-hidden="true" style={{ color: "var(--neon-green)" }} />
                  About {formatServiceTime(service)}
                </span>
              )}
              <a
                href="https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-studio-map"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40 }}
              >
                <MapPin className="i" aria-hidden="true" />
                Adugodi studio
              </a>
            </ul>

            {/* Glass coating needs the vehicle overnight. */}
            {service.slug === 'windshield-glass-coating-new' && (
              <div style={{ marginTop: 20, borderRadius: 10, border: "1px solid rgba(233,185,73,.4)", background: "rgba(233,185,73,.08)", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Clock style={{ color: "var(--warn)", flex: "none", marginTop: 2 }} aria-hidden="true" />
                  <div>
                    <div style={{ color: "var(--warn)", fontWeight: 700 }}>Vehicle stays 24 hours</div>
                    <p style={{ color: "#5B5F63", fontSize: 14, marginTop: 4 }}>
                      The coating needs a full 24-hour cure in our controlled environment to bond
                      properly. Please plan for this — an early pickup compromises the finish.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Offer card: unchanged dark `.card`, an accent panel on the light hero. */}
            <div
              className="card"
              data-testid="offer-card"
              style={{ padding: "22px 24px", marginTop: 24 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span className="eyebrow" style={{ marginBottom: 0 }}>
                {isAnnualPackage ? 'Annual package' : 'In-studio offer'}
              </span>
              {discountPercent > 0 && <span className="cta-price-save">{discountPercent}% off</span>}
            </div>

            <p style={{ marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
              <ins className="lp-price-now" data-testid="text-offer-price" style={{ textDecoration: "none" }}>
                {formatINR(service.price)}
              </ins>
              {service.originalPrice && (
                <del className="lp-price-was">{formatINR(service.originalPrice)}</del>
              )}
            </p>
            <p style={{ color: "var(--txt-3)", fontSize: 13, marginTop: 2 }}>
              {isAnnualPackage ? 'Package value' : 'Offer price · paid at the studio after the work'}
            </p>

            <p style={{ marginTop: 16, borderRadius: 8, border: "1px solid var(--neon-line)", background: "var(--neon-soft)", padding: "10px 12px", fontSize: 13.5, color: "var(--neon-green)", fontWeight: 600 }}>
              {offer.free
                ? 'No booking fee — reserve your slot online free.'
                : isAnnualPackage
                  ? `Pay ${formatINR(service.price)} online for the full annual package.`
                  : 'Pay just ₹299 online today to hold your slot.'}
            </p>

            <ul className="lp-includes" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--medium-gray)" }}>
              {/* Items 2–4: the first is already the lead trust pill beside the title. */}
              {Array.from(new Set((service.whatIncluded || []).map(cleanIncluded)))
                .slice(1, 4)
                .map((item, i) => (
                  <li key={i}>{shortIncluded(item)}</li>
                ))}
              <li>₹500 voucher on your 2nd visit</li>
            </ul>

            <button
              type="button"
              onClick={() => setBookingModalOpen(true)}
              className="cta-lg"
              style={{ width: "100%", marginTop: 18, justifyContent: "center" }}
              data-testid="button-book-now-hero"
            >
              {/* Never quote a price the server will not charge: `free` comes from the
                  same server that decides the amount. */}
              {offer.free
                ? 'Reserve your slot — no fee'
                : isAnnualPackage
                  ? `Book the package — ${formatINR(service.price)}`
                  : 'Reserve your slot for ₹299'}
              <ArrowRight className="i" aria-hidden="true" />
            </button>

            <p style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--txt-3)" }}>
              {offer.free
                ? 'Nothing to pay online, so nothing to cancel — just call or message us.'
                : isAnnualPackage
                  // The package is paid in full, so the ₹299-fee refund rule does not apply.
                  ? 'Paid in full online — cancellation terms apply.'
                  : 'Full refund of the booking fee if you cancel 24+ hours ahead.'}{' '}
              <a href="/refund-policy">Refund policy</a>
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* XPEL-style sticky sub-nav: anchor links to the sections further down THIS page,
          not a tab switcher that hides them — every section stays in the DOM regardless of
          which tab is "active" (scroll-spied, see the effect above), so nothing here is
          any less crawlable or find-in-page-able than before this was added. Only a tab
          whose target section actually rendered for this service appears. */}
      {subnavItems.length > 0 && (
        <nav className="service-subnav" aria-label="On this page" data-testid="nav-service-subnav">
          <div className="wrap">
            <div className="service-subnav-row">
              {subnavItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={"subnav-tab" + (activeSection === item.id ? " is-active" : "")}
                  data-testid={`tab-subnav-${item.id}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* PPF tier tabs — XPEL-style, but real pages, not a JS switcher over one record. */}
      {tierSiblings.length > 1 && (
        <nav
          className="tier-tabs"
          aria-label="PPF tiers for this vehicle"
          data-testid="nav-tier-tabs"
          id={packagesMode === "tiers" ? "packages" : undefined}
        >
          <div className="wrap">
            <div className="tier-tabs-row">
              {tierSiblings.map((s) => (
                s.slug === service.slug ? (
                  <span key={s.id} className="tier-tab is-active" data-testid={`tab-tier-${s.slug}`}>
                    {s.title.trim()}
                  </span>
                ) : (
                  <Link key={s.id} href={`/service/${s.slug}`} className="tier-tab" data-testid={`tab-tier-${s.slug}`}>
                    {s.title.trim()}
                  </Link>
                )
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Before & After Section - Moved to 2nd position */}
      {hasComparisons && (
        <section className="section light-band" id="gallery">
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>Dramatic Transformations</h2>
              <p style={{ margin: "10px auto 0" }}>
                See the incredible before and after results of our expert car detailing services.
                These real transformations speak for themselves.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 48, marginTop: 40 }}>
              {comparison && <ComparisonBlock comparison={comparison} />}

              {/* Original beforeAfter data from the record, when present. */}
              {genericComparisons.map((c, index) => (
                <div key={index}>
                  <div className="card-img" style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
                    <ImageWithFallback
                      src={c.before}
                      alt={`${service.title} transformation ${index + 1}`}
                      sizes="(min-width: 1024px) 960px, 100vw"
                      style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
                      data-testid={`image-comparison-${index}`}
                    />
                    <span className="card-cat" style={{ background: "#B4232F", color: "#fff", borderColor: "transparent" }}>BEFORE</span>
                    <span className="card-cat" style={{ right: 10, left: "auto", background: "var(--neon-green)", color: "#04120A", borderColor: "transparent" }}>AFTER</span>
                  </div>
                  {c.description && (
                    <p className="fineprint" style={{ maxWidth: 760, margin: "16px auto 0", textAlign: "center", fontStyle: "normal" }}>
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA at bottom of before/after section */}
            <div className="lp-final" style={{ marginTop: 48 }}>
              <h2>Ready for Your Transformation?</h2>
              <p>Join hundreds of satisfied customers who've experienced the P91 difference</p>
              <button
                type="button"
                onClick={() => setBookingModalOpen(true)}
                className="cta-lg"
                data-testid="button-book-transformation"
              >
                Book Your Transformation
                <ArrowRight className="i" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
      {/*
        ─────────────────────────────────────────────────────────────────────────────────
        What's Included, Why Choose and Our Process — deliberately SHORT.

        The studio asked for these to be one line each. The words still come from the
        service record; nothing is rewritten or invented here. The display trims them:
          - included items keep their headline clause ("UV protection to prevent paint
            fading" -> "UV protection"), one line each;
          - "why choose" shows its first sentence only;
          - the process shows step titles, not the paragraph under each one.
        ─────────────────────────────────────────────────────────────────────────────────
      */}
      {/* XPEL-style Overview: the service's own video (when the record has one) or its hero
          photo, large, beside the "What's Included" list as icon-bullet items — one
          headline clause bold, the item's full sentence as its description, so nothing
          about the record is hidden, only trimmed to a scannable line first. Deliberately
          re-uses heroImage here rather than service.images[1]: the photo-break section
          below is the one place images[1] gets shown, so a two-photo record never shows
          the same picture twice in a row. */}
      {((service.whatIncluded && service.whatIncluded.length > 0) || service.heroVideo) && (
        <section className="section light-band" id="overview">
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>Why Choose P91 {service.title.trim()}?</h2>
            </div>
            <div className="overview-grid">
              {service.heroVideo && isDirectVideoFile(service.heroVideo) ? (
                <div className="card-img overview-media" style={{ aspectRatio: "16 / 9" }}>
                  {/* The studio's own reel, saved as a real file — autoplaying background
                      footage, same treatment as the homepage hero's video (muted,
                      loop, playsInline so mobile Safari doesn't force fullscreen).
                      heroImage as poster: never a blank/black frame before it decodes. */}
                  <video
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={heroImage}
                    data-testid="video-overview"
                  >
                    <source src={service.heroVideo} type="video/mp4" />
                  </video>
                </div>
              ) : service.heroVideo ? (
                <div className="card-img overview-media" style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    style={{ width: "100%", height: "100%", border: 0 }}
                    src={service.heroVideo}
                    title={`${service.title.trim()} — P91 Car Care`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    data-testid="video-overview"
                  />
                </div>
              ) : heroImage ? (
                <ImageWithFallback
                  className="overview-media"
                  src={heroImage}
                  alt={`${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
                  sizes="(min-width: 860px) 480px, 100vw"
                  style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
                  loading="lazy"
                  data-testid="image-overview"
                />
              ) : null}
              {service.whatIncluded && service.whatIncluded.length > 0 && (
                <ul className="overview-benefits">
                  {Array.from(new Set(service.whatIncluded.map(cleanIncluded))).map((item, index) => {
                    const headline = shortIncluded(item);
                    // A short record item ("Front windshield film") has no clause to trim,
                    // so shortIncluded(item) returns it unchanged — printing it again below
                    // as a "description" was the same six words twice, which is what made
                    // this list run so much longer than the photo beside it. Only items
                    // shortIncluded ACTUALLY shortened get that second line.
                    return (
                      <li key={index}>
                        <CheckCircle className="i" aria-hidden="true" />
                        <div>
                          <h3>{headline}</h3>
                          {headline !== item && <p>{item}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
      {/* Full-bleed photo break, XPEL-style: one large real photo as a visual pause between
          content blocks, not a hero and not a gallery. Uses the service's SECOND photo when
          the catalogue record has one (only the first is ever used, as the hero above), so
          this is never a duplicate of what the visitor already scrolled past — and falls
          back to the same hero photo for the (more common) single-image record rather than
          rendering nothing. No new or downloaded images; no new claim in the overlay text,
          just the service name and the studio's real location. */}
      {(service.images?.[1] ?? heroImage) && (
        <section
          className="section"
          style={{
            padding: 0,
            position: "relative",
            minHeight: "clamp(260px, 40vw, 420px)",
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden",
          }}
          data-testid="section-photo-break"
        >
          <ImageWithFallback
            src={service.images?.[1] ?? heroImage}
            alt={`${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
            sizes="100vw"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            data-testid="image-photo-break"
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              // Lightened alongside the hero and the final CTA banner (same request):
              // the photo shows brighter, text leans on its own shadow instead.
              background: "linear-gradient(to top, rgba(9,9,11,.55) 0%, rgba(9,9,11,.2) 45%, transparent 75%)",
            }}
          />
          <div className="wrap" style={{ position: "relative", zIndex: 1, paddingBlock: 24 }}>
            <p style={{ color: "var(--neon-green)", fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6, textShadow: "0 1px 8px rgba(0,0,0,.85)" }}>
              Adugodi, Bangalore
            </p>
            <h2 style={{ fontSize: "clamp(22px,3.6vw,32px)", fontWeight: 800, textShadow: "0 2px 16px rgba(0,0,0,.85), 0 1px 3px rgba(0,0,0,.9)" }}>
              {service.title.trim()}
            </h2>
          </div>
        </section>
      )}
      {/* The studio's own reels of this service, when there are any (lib/instagram-reels.ts).
          Pages without a matching reel render nothing here rather than an unrelated one. */}
      <InstagramReels
        reels={REELS_BY_SERVICE[service.slug] ?? []}
        heading="See it on Instagram"
        intro={`Real ${service.title.trim().toLowerCase()} work from our Adugodi studio.`}
      />
      {/* XPEL-style statement band ("Let It Roll Off"): a full-width mid-tone panel,
          headline and copy side by side instead of stacked and centred. */}
      {service.whyChoose && (
        <section className="statement-band light-band" id="benefits">
          <div className="wrap statement-grid">
            <h2>Why choose P91 in Adugodi?</h2>
            <p>{firstSentence(service.whyChoose)}</p>
          </div>
        </section>
      )}
      {service.process && service.process.length > 0 && (
        <section className="section light-band" id={packagesMode === "process" ? "packages" : undefined}>
          <div className="wrap narrow">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>Our Process</h2>
            </div>
            <ol className="lp-steps">
              {service.process.map((step, index) => (
                <li key={index} title={step.title}>
                  {step.title}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
      {/* Gallery Section — shown only when the service has a VIDEO. A lone image here
          repeated the hero photo (bike ceramic) or was a stock banner (car ceramic); the
          hero now carries the service photo instead. Restore image galleries once the
          studio supplies real work photos or Instagram reels. */}
      {service.gallery && service.gallery.some(item => item.type === 'video') && (
        <section className="section light-band" id={!hasComparisons ? "gallery" : undefined}>
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>Inside the Studio</h2>
              <p style={{ margin: "10px auto 0" }}>
                See our expert technicians in action as they transform your {vehicleNoun} with precision and care.
              </p>
            </div>

            {/* Single Video - Full Width 16:9 */}
            {service.gallery.find(item => item.type === 'video') && (
              <div className="card-img" style={{ aspectRatio: "16 / 9", position: "relative", maxWidth: 1100, margin: "32px auto 0" }}>
                <iframe
                  style={{ width: "100%", height: "100%", border: 0 }}
                  src={service.gallery.find(item => item.type === 'video')?.url}
                  title={service.gallery.find(item => item.type === 'video')?.caption || `${service.title} Process Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  data-testid="video-process"
                />
                <span className="card-cat">
                  <Play className="i" aria-hidden="true" style={{ marginRight: 4 }} />
                  PROCESS VIDEO
                </span>
              </div>
            )}

            {/* Single Image - Full Width */}
            {service.gallery.find(item => item.type === 'image') && (
              <div className="card-img" style={{ position: "relative", maxWidth: 1100, margin: "24px auto 0" }}>
                <ImageWithFallback
                  src={service.gallery.find(item => item.type === 'image')?.url}
                  alt={
                    service.gallery.find(item => item.type === 'image')?.caption ||
                    `${service.title.trim()} being carried out at the P91 Car Care studio in Adugodi, Bangalore`
                  }
                  width={1600}
                  height={1000}
                  sizes="(min-width: 1024px) 1100px, 100vw"
                  loading="lazy"
                  decoding="async"
                  style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
                  data-testid="image-process"
                />
                {service.gallery.find(item => item.type === 'image')?.caption && (
                  <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(9,9,11,.86)", color: "var(--txt)", padding: "8px 14px", borderRadius: 8, fontSize: 13 }}>
                    {service.gallery.find(item => item.type === 'image')?.caption}
                  </div>
                )}
              </div>
            )}

            {/* Optional CTA below gallery */}
            <div className="lp-final" style={{ marginTop: 40 }}>
              <h2>Experience Professional Car Care</h2>
              <p>Book your service today and let our experts give your {vehicleNoun} the attention it deserves</p>
              <button
                type="button"
                onClick={() => setBookingModalOpen(true)}
                className="cta-lg"
                data-testid="button-book-gallery"
              >
                Book Your Service
                <ArrowRight className="i" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
      {/* Testimonials Section */}
      {showTestimonials && service.testimonials && service.testimonials.length > 0 && (
        <section className="section light-band">
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>What Our Customers Say</h2>
            </div>
            <div className="grid">
              {service.testimonials.map((testimonial, index) => (
                <div key={index} className="card">
                  <div className="card-body">
                    <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="i"
                          style={{ color: i < testimonial.rating ? "#E9B949" : "var(--medium-gray)", fill: i < testimonial.rating ? "#E9B949" : "none" }}
                        />
                      ))}
                    </div>
                    <p style={{ color: "var(--txt-2)", fontStyle: "italic", marginBottom: 14 }}>"{testimonial.comment}"</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {testimonial.image && (
                        <ImageWithFallback
                          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                          src={testimonial.image}
                          alt={testimonial.name}
                          sizes="36px"
                        />
                      )}
                      <div>
                        <p style={{ fontWeight: 600 }}>{testimonial.name}</p>
                        <p style={{ color: "var(--txt-3)", fontSize: 12.5 }}>Verified Customer</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* FAQ Section — light card, XPEL-style, scoped to .faq-light only (the rest of the
          page stays the site's usual dark theme; see .hero-light-bg above for the same
          scoping approach). */}
      {service.faq && service.faq.length > 0 && (
        <section className="section faq-light" id="faqs">
          <div className="wrap narrow">
            <div className="section-head" style={{ textAlign: "center" }}>
              <h2>{service.title.trim()} in Adugodi, Bangalore: FAQs</h2>
            </div>
            {/*
              Each answer is a native <details>/<summary> disclosure, not a JS-conditional
              accordion. The distinction matters: this still renders every answer into the
              raw HTML and the prerendered output regardless of open/closed state — only the
              browser's layout hides a closed one, so search engines and AI answer engines
              that read markup rather than executing JS still see every answer, not just the
              questions. A conditionally-rendered accordion would have actually removed the
              closed answers from the DOM, which is the failure mode this avoids.
            */}
            <div className="lp-faqs" data-testid="faq-list">
              {service.faq
                .filter((item) => item?.question?.trim() && item?.answer?.trim())
                .map((item, index) => (
                  <details className="lp-faq" key={index}>
                    <summary>{item.question.trim()}</summary>
                    <p>{item.answer.trim()}</p>
                  </details>
                ))}
            </div>
          </div>
        </section>
      )}
      {/* Related services — see relatedServices above for why this exists at all. */}
      {relatedServices.length > 0 && (
        <section className="section light-band">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>Other {heroCategory.toLowerCase()} services for your {vehicleNoun}</h2>
            </div>
            <div className="mini-grid">
              {relatedServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/service/${s.slug}`}
                  className="mini"
                  data-testid={`link-related-${s.slug}`}
                >
                  <b>{s.title.trim()}</b>
                  <span>{formatINR(s.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* "Prefer a call?" is a popup now (components/callback-popup.tsx): it was an inline
          section, then a card under the price, and both read as out of place on the page. */}
      <CallbackPopup
        serviceTitle={service.title.trim()}
        serviceSlug={service.slug}
        isBikeService={isBikeService}
      />
      {/* Guarantee Section + the trust strip right after it share one light band (see
          .light-band in redesign.css) — same "opposite palette, by request" scoping as
          .hero-light-bg/.faq-light, just spanning these two adjacent sections instead of
          one, so there's no visible seam between them. */}
      {service.guaranteeText && (
        <section className="section light-band" id={!service.whyChoose ? "benefits" : undefined}>
          <div className="wrap narrow" style={{ textAlign: "center" }}>
            <Shield className="i" style={{ width: 40, height: 40, color: "var(--neon-green)", margin: "0 auto 16px" }} aria-hidden="true" />
            <div className="section-head">
              <h2>Our Guarantee</h2>
            </div>
            <p style={{ fontSize: 17 }}>{service.guaranteeText}</p>
          </div>
        </section>
      )}
      {/* Bottom trust strip — same three real claims and icons as home.tsx's, not new ones
          invented for this page: warranty terms, same-day turnaround and pickup/drop are
          true of every service, not just this one. */}
      <section className={"strip light-band" + (service.guaranteeText ? " light-band-joined" : "")}>
        <div className="wrap">
          <div className="row cols-3">
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
          </div>
        </div>
      </section>
      {/* Final CTA banner ("Ready to Transform Your Car?" + price + Book Now + contact
          row) removed by request from every /service/:slug page. finalCtaRef now watches
          the footer wrapper below instead — see its declaration above — so the floating
          sticky CTA bar still hides once the page bottom is reached, same reason it
          always did: without this, the bar would sit on top of the footer's own contacts
          for the rest of the scroll. */}
      <section ref={finalCtaRef}>
        <SiteFooter />
      </section>
      {/*
        Sticky booking bar. Full width along the bottom on phones — price, what paying
        today does, and one Reserve button, reachable however far down the customer has
        scrolled — and a compact card at bottom-right from sm up. Hidden while the page's
        own bottom CTA or the booking modal is on screen. The site-wide WhatsApp button
        lifts above it on /service/* (components/contact-fab.tsx), so the two never touch.
      */}
      {showFloatingCTA && !finalCtaVisible && !bookingModalOpen && !floatingCtaDismissed && (
        <div
          className="card fixed inset-x-0 bottom-0"
          style={{
            zIndex: 45,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            borderRadius: 0, borderLeft: 0, borderRight: 0, borderBottom: 0,
          }}
          data-testid="floating-cta-button"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{formatINR(service.price)}</span>
                {service.originalPrice && (
                  <del style={{ fontSize: 12, color: "var(--txt-3)" }}>{formatINR(service.originalPrice)}</del>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--neon-green)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {offer.free
                  ? 'No booking fee'
                  : isAnnualPackage ? 'Full package, paid online' : 'Pay ₹299 now to hold your slot'}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBookingModalOpen(true);
              }}
              className="cta-lg"
              style={{ flex: "none", minHeight: 44, padding: "0 18px", fontSize: 14 }}
              data-testid="button-floating-book-now"
            >
              Reserve slot
            </button>
            {/* Persistent bar, so it needs a way out. 44x44 touch target. */}
            <button
              type="button"
              onClick={() => setFloatingCtaDismissed(true)}
              aria-label="Dismiss booking bar"
              style={{ flex: "none", width: 36, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--txt-3)", background: "none", border: 0 }}
              data-testid="button-dismiss-floating-cta"
            >
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>×</span>
            </button>
          </div>
        </div>
      )}
      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        service={service}
      />
    </div>
    </>
  );
}

/**
 * Title, description, Open Graph and Service JSON-LD for the current service, all driven
 * by the canonical service record — so a record that says "Bike" produces a tab title,
 * og:title and structured data that say "Bike" too.
 */
function ServiceSeo({ service }: { service: Service }) {
  // Opening hours come from the same live table the homepage schema and footer use.
  const { data: businessHours } = useQuery<BusinessHour[]>({ queryKey: ["/api/business-hours"] });
  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;

  // Built by the same function the server uses for the crawler-facing HTML
  // (client/src/lib/service-seo.ts), so the two heads cannot drift apart again.
  useSeoMeta({
    title: serviceSeoTitle(service),
    description: serviceSeoDescription(service),
    image: resolveServiceImage(service),
    canonicalPath: `/service/${service.slug}`,
    structuredData: serviceStructuredData(service, { origin, businessHours }),
  });
  return null;
}
