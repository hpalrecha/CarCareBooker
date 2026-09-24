import { useParams, useLocation, Link } from "wouter";
// `.lp-*` (price, includes, steps, FAQ) is defined in landing-pages.css. This is the
// highest-traffic consumer of that stylesheet — the 17 indexed /service/:slug pages — so
// it must import it directly now that main.tsx no longer loads it globally (see main.tsx:
// moved out to stop blocking every route with CSS most routes don't use).
import "@/styles/landing-pages.css";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Star, Clock, Shield, MapPin, Play, ArrowRight, Maximize2, Droplet, Eye, Leaf } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BookingModal from "@/components/booking-modal";
import CallbackPopup from "@/components/callback-popup";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, formatINR, type ServiceRecord } from "@/lib/canonical-services";
import { useBookingOffer } from "@/hooks/use-booking-offer";
import { deriveCategory, deriveVehicle } from "@/lib/service-taxonomy";
import { formatServiceTime } from "@/lib/service-time";
import { serviceSeoTitle, serviceSeoDescription, serviceStructuredData } from "@/lib/service-seo";
import { useHeroVideoGate } from "@/hooks/use-hero-video";
import { ILLUSTRATIVE_SLUGS } from "@/lib/real-service-images";
import ParallaxFrame from "@/components/redesign/parallax-frame";
import { useCinematic } from "@/hooks/use-cinematic";
import type { BusinessHour } from "@shared/schema";

// The one before/after pair that is verifiably P91's own: the studio's photographs of a customer's
// orange Hyundai, before (WhatsApp image, 2025-01-03) and after (camera original 20241227_164016).
// Both are saved upright here; the camera original's rotation flag was lost by the responsive
// variants, which showed the car sideways. Every other pair that used to live in this file was
// a third-party or unverifiable image and was removed — see fixedComparisonFor below.
const exteriorDetailingBefore = "/attached_assets/gallery/p91-exterior-before-orange-hyundai.webp";
const exteriorDetailingAfter = "/attached_assets/about/p91-studio-nasiol-floor-orange-hyundai.webp";

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
  let head = cut > 5 ? text.slice(0, cut).trim() : text;
  // A cut that lands inside brackets ("Long-lasting protection (up" from "... (up to 12 months)")
  // drops the unclosed bracket instead of leaving a dangling headline; the full item still shows
  // as the line beneath it.
  const open = head.lastIndexOf('(');
  if (open > 5 && head.indexOf(')', open) === -1) head = head.slice(0, open).trim();
  return head.replace(/\s*[-–—:]+$/, '');
}

/**
 * The PPF tier tabs' own label, cut to "tier – car type" — the two real titles this
 * runs on are "P91 PPF Basic - Hatchback" and "Partial PPF (Hatchback)"; both reduce
 * to "Basic – Hatchback" / "Partial – Hatchback" here. Still the record's own words,
 * just the repeated "P91 PPF" brand prefix and the inconsistent dash/parenthesis
 * punctuation between the two formats normalized, so nine tabs in one row read as one
 * family instead of two differently-punctuated ones.
 */
function tierTabLabel(title: string): string {
  return title
    .trim()
    .replace(/^P91\s+PPF\s+/i, '')
    .replace(/^Partial\s+PPF\s+\(([^)]+)\)$/i, 'Partial – $1')
    .replace(/\s+-\s+/, ' – ');
}

/**
 * A varied icon per Overview feature row (XPEL's own version uses a different icon for
 * warranty/water-repel/clarity/environmental rather than one checkmark repeated four
 * times) — picked from the item's own wording, never invented. Falls back to the plain
 * check for anything that doesn't match one of these, so it's never wrong, only plainer.
 */
function iconForIncluded(item: string) {
  const t = item.toLowerCase();
  if (/warrant|guarant/.test(t)) return Shield;
  if (/water|hydrophobic|repel|beading/.test(t)) return Droplet;
  if (/gloss|shine|clarity|clear|depth/.test(t)) return Eye;
  if (/uv|oxidation|environmental|contaminant|protect/.test(t)) return Leaf;
  return CheckCircle;
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
    // headlight-restoration-both, windshield-glass-coating-new, windshield-glass-polishing and
    // interior-detailing-service had before/after images that are NOT P91's: a Twitter-hosted photo,
    // a web article image, a stock/web comparison, a web collage — and YouTube embeds captioned
    // "- P91 Car Care" that are Nasiol's own manufacturer videos. All removed until the studio
    // supplies its own. Those pages simply have no "Dramatic Transformations" section.
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
          <div className="section-head" data-cine="rise" style={{ textAlign: "center", marginBottom: 20 }}>
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
  // Which of the record's own photos the hero's main frame shows — the thumbnail rail
  // (XPEL product-page layout, by request) switches this; index 0 until clicked. Reset
  // per service via the `service.slug` key on the thumb buttons' onClick closures below,
  // not a effect: a slug with fewer photos than the current index just falls back to 0
  // via the `?? 0` in the image lookup, so there is nothing to reset.
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
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

  const { data: fetched, isLoading: fetching } = useQuery<Service>({
    queryKey: ["/api/services", slug],
    enabled: !!slug,
  });

  // The full catalogue, only to find this service's real PPF tier siblings (Basic /
  // Premium / Partial, same vehicle size) — never to invent variants that don't exist.
  const { data: allServices } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  // Switching package (a tab in the PPF row) changes `slug`. The catalogue list is already in
  // the cache and carries the full record, so the page shows the chosen package's title, price,
  // includes and photos immediately, and the single-record GET quietly refreshes it. Without
  // this, each tab click showed a full-page spinner while that GET ran. The record is the same
  // data either way — same price, same booking — only the wait is gone.
  const listed = allServices?.find((s) => s.slug === slug) as unknown as Service | undefined;
  const service = fetched ?? listed;
  const isLoading = !service && fetching;

  // A new package starts on its own first photo.
  useEffect(() => {
    setActiveThumbIndex(0);
  }, [slug]);

  // Cinematic scroll motion for the whole page (hero push-in, unmasked overview picture, content
  // rising into place). Marked in the JSX with data-cine; see hooks/use-cinematic.ts.
  useCinematic([service?.slug, isLoading]);

  // Hero slideshow: the service's photos, one at a time on the big frame, advancing by itself
  // (paused while the pointer or keyboard focus is on it, and never under reduced motion).
  const [slidePaused, setSlidePaused] = useState(false);
  const slideCount = Math.min(service?.images?.length ?? 0, 6);
  useEffect(() => {
    if (slideCount < 2 || slidePaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActiveThumbIndex((i) => (i + 1) % slideCount), 4800);
    return () => window.clearInterval(id);
  }, [slideCount, slidePaused]);

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
            <div className="section-head" data-cine="rise">
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
  // A service with no real photograph and no real video gets a text-led hero (see .is-text-only)
  // rather than an empty picture frame.
  const hasHeroMedia = Boolean(heroImage) || Boolean(service.heroVideo && isDirectVideoFile(service.heroVideo));
  const isBikeService = /\bbike\b|\bmotorcycle\b/i.test(service.title);
  const vehicleNoun = isBikeService ? "bike" : "car";

  const heroCategory = deriveCategory(service);

  // Overview media: a third photo, or a non-file video embed. Never the hero's own photo/video.
  const overviewEmbed = Boolean(service.heroVideo && !isDirectVideoFile(service.heroVideo));
  const overviewImage = service.images?.[2];
  const hasOverviewMedia = overviewEmbed || Boolean(overviewImage);

  const comparison = fixedComparisonFor(service.slug, vehicleNoun);
  const genericComparisons = service.beforeAfter && service.beforeAfter.length > 0 ? service.beforeAfter : [];
  const hasComparisons = comparison !== null || genericComparisons.length > 0;

  /**
   * Every real PPF catalogue record — car types AND packages together (by request,
   * 2026-09-23): Basic/Premium/Partial across hatchback/sedan/suv are nine genuinely
   * separate catalogue records (see lib/service-taxonomy.ts), not variants of one
   * product the way XPEL's own tier tabs are. This is a tab-styled row of real links
   * between those real pages, not a switcher pretending one record holds all nine.
   * Used to be scoped to the current page's own vehicle size only (three tabs: this
   * car's Basic/Premium/Partial); widened so the row also shows the other car types,
   * matching the "one clean row lists everything" reference the request pointed at.
   * Empty (and hidden) for every category without real tiered siblings — ceramic
   * coating, interior detailing, glass, etc. each have exactly one tier, so nothing
   * here would be genuine for them.
   */
  const tierSiblings = (heroCategory === "PPF" && Array.isArray(allServices))
    ? allServices
        .filter((s) => deriveCategory(s) === "PPF")
        // Grouped by vehicle size first, then by price within each group — reads as
        // "every hatchback option, then every sedan option, then every SUV option"
        // rather than a price-sorted jumble mixing car types together.
        .sort((a, b) => {
          const vehicleOrder = ["hatchback", "sedan", "suv"];
          const va = vehicleOrder.indexOf(deriveVehicle(a));
          const vb = vehicleOrder.indexOf(deriveVehicle(b));
          return va !== vb ? va - vb : parseFloat(a.price) - parseFloat(b.price);
        })
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
  // Four, not every item — XPEL's own version of this panel (FUSION PLUS Classic) never
  // lists more than about four features either, and this page never showed the FULL list
  // anywhere: the hero's offer card already only ever shows the first four (trust pill +
  // 3 in .lp-includes). Same first four items, same real words, just a second placement.
  const overviewFeatureItems = (service.whatIncluded && service.whatIncluded.length > 0)
    ? Array.from(new Set(service.whatIncluded.map(cleanIncluded))).slice(0, 4)
    : [];
  const hasBenefits = Boolean(service.whyChoose) || Boolean(service.guaranteeText);
  // "Process" removed by request — Packages now only ever means the real PPF tier
  // switcher, never a fallback to the process steps (that section is gone).
  const packagesMode: "tiers" | null = tierSiblings.length > 1 ? "tiers" : null;
  const hasGallery =
    hasComparisons || Boolean(service.gallery && service.gallery.some((item) => item.type === "video"));
  const hasFaqs = Boolean(service.faq && service.faq.length > 0);

  const subnavItems: { id: (typeof SUBNAV_IDS)[number]; label: string }[] = [
    hasOverview ? { id: "overview" as const, label: "Overview" } : null,
    hasBenefits ? { id: "benefits" as const, label: "Benefits" } : null,
    packagesMode ? { id: "packages" as const, label: "Packages" } : null,
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

      {/* Hero: XPEL product-page layout by request — thumbnail rail + boxed main photo
          on the left, a dark info panel on the right, both bounded on the page's white
          ground rather than a full-bleed photo behind the text. Content is unchanged
          (same trust facts, same offer card fields, same video/photo logic); only the
          container changed shape. */}
      <section className="pdp-hero" data-cine="zoom">
        <div className={"wrap pdp-hero-grid" + (hasHeroMedia ? "" : " is-text-only")}>
          {hasHeroMedia && (
          <div className="pdp-media">
            <div
              className="pdp-main-image"
              data-testid="hero-slides"
              onMouseEnter={() => setSlidePaused(true)}
              onMouseLeave={() => setSlidePaused(false)}
              onFocus={(e) => {
                // Only keyboard focus pauses. A mouse click on an arrow also leaves focus on the
                // button, which used to freeze the slideshow until you clicked elsewhere.
                if ((e.target as HTMLElement).matches(":focus-visible")) setSlidePaused(true);
              }}
              onBlur={() => setSlidePaused(false)}
            >
              {heroImage && (() => {
                const photos = (service.images ?? []).slice(0, 6);
                const alt = ILLUSTRATIVE_SLUGS.has(service.slug)
                  ? `${service.title.trim()} (illustrative image)`
                  : `${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`;
                if (photos.length < 2) {
                  return (
                    <ImageWithFallback
                      className="shot"
                      src={heroImage}
                      alt={alt}
                      sizes="(min-width: 900px) 640px, 100vw"
                      priority
                      data-testid="img-hero"
                    />
                  );
                }
                const current = activeThumbIndex % photos.length;
                return (
                  <>
                    {photos.map((img, i) => (
                      <ImageWithFallback
                        key={img}
                        className={"shot pdp-slide" + (i === current ? " is-active" : "")}
                        src={img}
                        alt={i === current ? alt : ""}
                        aria-hidden={i !== current}
                        sizes="(min-width: 900px) 640px, 100vw"
                        priority={i === 0}
                        data-testid={i === 0 ? "img-hero" : undefined}
                      />
                    ))}
                    <div className="pdp-slide-ui">
                      <span className="pdp-slide-count" aria-hidden="true">
                        <b>{String(current + 1).padStart(2, "0")}</b> / {String(photos.length).padStart(2, "0")}
                      </span>
                      <span className="pdp-slide-dots" role="group" aria-label="Choose photo">
                        {photos.map((img, i) => (
                          <button
                            key={img}
                            type="button"
                            onClick={() => setActiveThumbIndex(i)}
                            className={"pdp-slide-dot" + (i === current ? " is-active" : "")}
                            aria-label={`Photo ${i + 1} of ${photos.length}`}
                            aria-pressed={i === current}
                            data-testid={`button-slide-${i}`}
                          />
                        ))}
                      </span>
                      <span className="pdp-slide-arrows">
                        <button type="button" className="pdp-slide-btn" onClick={() => setActiveThumbIndex(current - 1 + photos.length)} aria-label="Previous photo" data-testid="button-slide-prev">‹</button>
                        <button type="button" className="pdp-slide-btn" onClick={() => setActiveThumbIndex(current + 1)} aria-label="Next photo" data-testid="button-slide-next">›</button>
                      </span>
                    </div>
                  </>
                );
              })()}
              {/* Layered directly over the photo above: invisible until `onPlaying`
                  actually fires, so the photo is always what's visible until there is a
                  real frame to replace it with. Only when the record's heroVideo is a
                  real saved file (isDirectVideoFile) — a YouTube/Vimeo URL has no file
                  to autoplay here and stays on the iframe embed further down in
                  Overview. */}
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
              {/* Decorative only — XPEL's own hero has the same corner mark on its main
                  photo. No lightbox: not asked for, and the thumbnail rail already lets
                  a visitor switch the photo shown here. */}
              <span className="pdp-expand" aria-hidden="true">
                <Maximize2 size={16} />
              </span>
            </div>
          </div>
          )}

          <div className="pdp-panel" key={service.slug}>
            <a href="/services" className="pdp-crumb" data-testid="link-hero-crumb">
              ← {heroCategory}
            </a>
            <h1>{service.title.trim()}</h1>
            <hr className="pdp-rule" />
            <p className="pdp-lede">{service.description}</p>

            {/*
              Three trust pills, every one a fact: the service's own first included item,
              its duration from the record, and the studio (which opens Google Maps).
            */}
            <ul className="hero-facts" data-testid="trust-pills" style={{ marginTop: 18 }}>
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
              <div style={{ marginTop: 20, borderRadius: 10, border: "1px solid rgba(233,185,73,.35)", background: "rgba(233,185,73,.1)", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Clock style={{ color: "#E9B949", flex: "none", marginTop: 2 }} aria-hidden="true" />
                  <div>
                    <div style={{ color: "#E9B949", fontWeight: 700 }}>Vehicle stays 24 hours</div>
                    <p style={{ color: "rgba(241,244,241,.7)", fontSize: 14, marginTop: 4 }}>
                      The coating needs a full 24-hour cure in our controlled environment to bond
                      properly. Please plan for this — an early pickup compromises the finish.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div data-testid="offer-card" style={{ marginTop: 24, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.14)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span className="eyebrow" style={{ marginBottom: 0, color: "rgba(241,244,241,.6)" }}>
                  {isAnnualPackage ? 'Annual package' : 'In-studio offer'}
                </span>
                {discountPercent > 0 && <span className="cta-price-save">{discountPercent}% off</span>}
              </div>

              <p style={{ marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
                <ins data-testid="text-offer-price" style={{ textDecoration: "none", fontSize: 30, fontWeight: 800, color: "#fff" }}>
                  {formatINR(service.price)}
                </ins>
                {service.originalPrice && (
                  <del style={{ color: "rgba(241,244,241,.5)", fontSize: 16 }}>{formatINR(service.originalPrice)}</del>
                )}
              </p>
              <p style={{ color: "rgba(241,244,241,.6)", fontSize: 13, marginTop: 2 }}>
                {isAnnualPackage ? 'Package value' : 'Offer price · paid at the studio after the work'}
              </p>

              <p style={{ marginTop: 16, borderRadius: 8, border: "1px solid var(--neon-line)", background: "rgba(78,184,72,.14)", padding: "10px 12px", fontSize: 13.5, color: "var(--neon-green)", fontWeight: 600 }}>
                {offer.free
                  ? 'No booking fee — reserve your slot online free.'
                  : isAnnualPackage
                    ? `Pay ${formatINR(service.price)} online for the full annual package.`
                    : 'Pay just ₹299 online today to hold your slot.'}
              </p>

              <ul className="lp-includes" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.14)", color: "rgba(241,244,241,.82)" }}>
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

              <p style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "rgba(241,244,241,.55)" }}>
                {offer.free
                  ? 'Nothing to pay online, so nothing to cancel — just call or message us.'
                  : isAnnualPackage
                    // The package is paid in full, so the ₹299-fee refund rule does not apply.
                    ? 'Paid in full online — cancellation terms apply.'
                    : 'Full refund of the booking fee if you cancel 24+ hours ahead.'}{' '}
                <a href="/refund-policy" style={{ color: "rgba(241,244,241,.8)", textDecoration: "underline" }}>Refund policy</a>
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

      {/* PPF car type + package tabs — XPEL-style, but real pages, not a JS switcher
          over one record. */}
      {tierSiblings.length > 1 && (
        <nav
          className="tier-tabs"
          aria-label="PPF car types and packages"
          data-testid="nav-tier-tabs"
          id={packagesMode === "tiers" ? "packages" : undefined}
        >
          <div className="wrap">
            <div className="tier-tabs-row">
              {tierSiblings.map((s) => (
                s.slug === service.slug ? (
                  <span key={s.id} className="tier-tab is-active" data-testid={`tab-tier-${s.slug}`}>
                    {tierTabLabel(s.title)}
                  </span>
                ) : (
                  <Link key={s.id} href={`/service/${s.slug}`} className="tier-tab" data-testid={`tab-tier-${s.slug}`}>
                    {tierTabLabel(s.title)}
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
            <div className="section-head" data-cine="rise" style={{ textAlign: "center" }}>
              <h2>Dramatic Transformations</h2>
              <p style={{ margin: "10px auto 0" }}>
                See the incredible before and after results of our expert car detailing services.
                These real transformations speak for themselves.
              </p>
            </div>

            {/* One comparison, not a stack of them: the hand-photographed pair when this
                service has one, else the record's own first before/after entry. Showing
                both (up to 4 images total between the two sources) was the "too many
                images" problem — one real transformation makes the point. */}
            <div style={{ marginTop: 40 }}>
              {comparison ? (
                <ComparisonBlock comparison={comparison} />
              ) : genericComparisons[0] ? (
                <div>
                  <div className="card-img" style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
                    <ImageWithFallback
                      src={genericComparisons[0].before}
                      alt={`${service.title} transformation`}
                      sizes="(min-width: 1024px) 960px, 100vw"
                      style={{ aspectRatio: "4 / 3", objectPosition: "center" }}
                      data-testid="image-comparison-0"
                    />
                    <span className="card-cat" style={{ background: "#B4232F", color: "#fff", borderColor: "transparent" }}>BEFORE</span>
                    <span className="card-cat" style={{ right: 10, left: "auto", background: "var(--neon-green)", color: "#04120A", borderColor: "transparent" }}>AFTER</span>
                  </div>
                  {genericComparisons[0].description && (
                    <p className="fineprint" style={{ maxWidth: 760, margin: "16px auto 0", textAlign: "center", fontStyle: "normal" }}>
                      {genericComparisons[0].description}
                    </p>
                  )}
                </div>
              ) : null}
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
            {/* XPEL's own "FUSION PLUS Classic" panel: product name, one short line, one
                button, then a short (four-item) feature list — text and CTA on one side,
                one large photo/video on the other. Replaces the earlier centred heading +
                full-width checklist. */}
            <div className={"overview-grid overview-grid-xpel" + (hasOverviewMedia ? "" : " is-text-only")}>
              <div className="overview-copy" key={service.slug} data-cine="rise">
                <h2>{service.title.trim()}</h2>
                {service.description && <p className="overview-copy-lede">{firstSentence(service.description)}</p>}
                {overviewFeatureItems.length > 0 && (
                  <ul className="overview-features">
                    {overviewFeatureItems.map((item, index) => {
                      const headline = shortIncluded(item);
                      const FeatureIcon = iconForIncluded(item);
                      return (
                        <li key={index}>
                          <span className="overview-feature-icon">
                            <FeatureIcon className="i" aria-hidden="true" />
                          </span>
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
              {/* The hero above already shows this service's first photo and its video, so this
                  shows a DIFFERENT photo (the third), or nothing — never the same picture twice
                  on one page. A non-file video URL (an embed) is the only video shown here. */}
              {hasOverviewMedia && (
                <ParallaxFrame className="overview-media-wrap" strength={0.09} cine="frame">
                  {overviewEmbed ? (
                    <div className="card-img overview-media">
                      <iframe
                        style={{ width: "100%", height: "100%", border: 0 }}
                        src={service.heroVideo}
                        title={`${service.title.trim()} — P91 Car Care`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        data-testid="video-overview"
                      />
                    </div>
                  ) : (
                    <ImageWithFallback
                      className="overview-media"
                      src={overviewImage}
                      alt={`${service.title.trim()} at the P91 Car Care studio in Adugodi, Bangalore`}
                      sizes="(min-width: 860px) 560px, 100vw"
                      style={{ objectPosition: "center" }}
                      loading="lazy"
                      data-testid="image-overview"
                    />
                  )}
                </ParallaxFrame>
              )}
            </div>
          </div>
        </section>
      )}
      {/* Removed by request (2026-09-24), from every service page: the "See it on Instagram" reel
          cards and the full-width photo band with the service title over it. */}
      {/* XPEL-style statement band ("Let It Roll Off"): a full-width mid-tone panel,
          headline and copy side by side instead of stacked and centred. */}
      {service.whyChoose && (
        <section className="statement-band light-band" id="benefits">
          <div className="wrap statement-grid" data-cine="rise">
            <h2>Why choose P91 in Adugodi?</h2>
            <p>{firstSentence(service.whyChoose)}</p>
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
            <div className="section-head" data-cine="rise" style={{ textAlign: "center" }}>
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

          </div>
        </section>
      )}
      {/* Testimonials Section */}
      {showTestimonials && service.testimonials && service.testimonials.length > 0 && (
        <section className="section light-band">
          <div className="wrap">
            <div className="section-head" data-cine="rise" style={{ textAlign: "center" }}>
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
          page stays the site's usual palette). */}
      {service.faq && service.faq.length > 0 && (
        <section className="section faq-light" id="faqs">
          <div className="wrap narrow">
            <div className="section-head" data-cine="rise">
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
              Collapsed by default now (by request, to match the XPEL accordion look — a
              "+" that rotates to "×" on open, same .lp-faq CSS every other page's FAQ
              uses): still a real, native <details>, so this changes only what a visitor
              sees on first paint, not what a crawler reads.
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
            <div className="section-head" data-cine="rise">
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
          .faq-light above, just spanning these two adjacent sections instead of one, so
          there's no visible seam between them. */}
      {service.guaranteeText && (
        <section className="section light-band" id={!service.whyChoose ? "benefits" : undefined}>
          <div className="wrap narrow" style={{ textAlign: "center" }}>
            <Shield className="i" style={{ width: 40, height: 40, color: "var(--neon-green)", margin: "0 auto 16px" }} aria-hidden="true" />
            <div className="section-head" data-cine="rise">
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
      {/* (The closing video banner was removed: it played the hero's video a third time, with
          no button of its own. One video per page.) */}
      {/* Hidden from the footer onwards (finalCtaRef, declared above) — the floating
          sticky CTA bar hides once the page bottom is reached, so it never sits on top of
          the footer's own contact links for the rest of the scroll. */}
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
