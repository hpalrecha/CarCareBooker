import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Star, Clock, Shield, Phone, Mail, MapPin, Play, ArrowRight, Zap, Timer } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BookingModal from "@/components/booking-modal";
import CallbackPopup from "@/components/callback-popup";
import InstagramReels from "@/components/instagram-reels";
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL, REELS_BY_SERVICE } from "@/lib/instagram-reels";
import { SiInstagram } from "react-icons/si";
import { BrandHeader, BrandFooter } from "@/components/redesign/brand-chrome";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, formatINR } from "@/lib/canonical-services";
import { useBookingOffer, formatOfferEnd } from "@/hooks/use-booking-offer";
import { formatServiceTime } from "@/lib/service-time";
import { serviceSeoTitle, serviceSeoDescription, serviceStructuredData } from "@/lib/service-seo";
import type { BusinessHour } from "@shared/schema";

// Import before/after images
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

export default function ServiceLanding() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  // Once dismissed the sticky bar stays gone for the rest of the visit.
  const [floatingCtaDismissed, setFloatingCtaDismissed] = useState(false);
  // True while the final "Ready to Transform" CTA section is on screen — the floating bar
  // hides then, so it never covers the real Book Now button or the footer contact info.
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
  const [showVideo, setShowVideo] = useState(false);

  // Free-booking offer state, decided server-side. Declared here (before the early
  // returns) because hooks cannot be called conditionally.
  const offer = useBookingOffer();
  const offerEnds = formatOfferEnd(offer.until);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services", slug],
    enabled: !!slug,
  });

  // Hide the floating CTA once the real bottom CTA scrolls into view.
  useEffect(() => {
    const el = finalCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      // Hidden from the bottom CTA onwards, not only while it is on screen: the site footer
      // now sits below it, and the bar would otherwise reappear over the footer's contacts.
      ([entry]) => setFinalCtaVisible(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [service]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    );
  }

  // Customer-facing empty state for an unknown or deactivated slug. This used to be a
  // bare "Service Not Found" heading — which is where all four homepage transformation
  // CTAs landed, because they pointed at inactive slugs.
  if (!service) {
    return (
      <div className="p91-brand min-h-screen bg-black text-white flex flex-col">
        <BrandHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-xl w-full text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">We couldn't find that service</h1>
            <p className="text-gray-300 text-lg mb-10">
              It may have been renamed or is no longer offered. All of our current services
              are listed on the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/#services">
                <Button
                  size="lg"
                  className="bg-[var(--neon-green)] hover:brightness-95 w-full sm:w-auto text-black font-bold rounded-[10px]"
                  data-testid="button-service-not-found-services"
                >
                  Browse All Services
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full sm:w-auto border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-bold"
                data-testid="button-service-not-found-home"
              >
                Go Home
              </Button>
            </div>
            <p className="mt-8 text-gray-400">
              Need help choosing?{" "}
              <a href="/contact" className="text-green-400 hover:text-green-300 underline">
                Contact us
              </a>
            </p>
          </div>
        </main>
        <BrandFooter />
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
  // car", "Ready to Transform Your Car?"). Derive the noun from the service itself.
  // "P91 Car Care" is the brand name and is deliberately left alone.
  const heroImage = resolveServiceImage(service);
  const isBikeService = /\bbike\b|\bmotorcycle\b/i.test(service.title);
  const vehicleNoun = isBikeService ? "bike" : "car";
  const vehicleNounTitle = isBikeService ? "Bike" : "Car";

  return (
    <>
    <ServiceSeo service={service} />
    <div className="p91-brand min-h-screen bg-black text-white">
      {/*
        The site header, shared with every other page (components/redesign/brand-chrome).
        This page used to carry its own green announcement bar and header — a different logo
        size, nav and button from the rest of the site. Book Now still opens this service's
        booking form in place rather than sending the visitor away to /services.
      */}
      <BrandHeader onBookNow={() => setBookingModalOpen(true)} />

      {/* Hero: copy left, enquiry form right — the /ppf-ceramic-coating shape. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-10 lg:py-16">
        {/* The service photo stays, now as a quiet backdrop rather than a full-bleed
            image the text has to fight for contrast against. */}
        {heroImage && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        {/* Stronger on phones, where the copy spans the full width of the photo. */}
        <div className="absolute inset-0 z-0 bg-black/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-black lg:via-black/80 lg:to-black/20" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* items-center: with the form moved out, the offer card lines up with the middle of
              the copy instead of hanging from the top of the column. */}
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            {/* ---------------------------------------------------------------- copy */}
            {/* 60/40 split on desktop: value proposition left, the offer right. */}
            <div className="min-w-0 space-y-5 lg:col-span-7">
              {/* Plain type, not gradient-clipped: bg-clip-text was cutting the descenders. */}
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {service.title.trim()}
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg">
                {service.description}
              </p>

              {/*
                Three trust pills, every one a fact: the service's own first included item,
                its duration from the record, and the studio (which opens Google Maps).
              */}
              <ul className="flex flex-wrap gap-2" data-testid="trust-pills">
                {service.whatIncluded?.[0] && (
                  <li className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-100">
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    {shortIncluded(service.whatIncluded[0])}
                  </li>
                )}
                {formatServiceTime(service) && (
                  <li className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-100">
                    <Clock className="h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    About {formatServiceTime(service)}
                  </li>
                )}
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3.5 py-2 text-sm text-yellow-300 transition-colors hover:bg-yellow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
                    data-testid="link-studio-map"
                  >
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Adugodi studio
                  </a>
                </li>
              </ul>

              {/* Glass coating needs the vehicle overnight. */}
              {service.slug === 'windshield-glass-coating-new' && (
                <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
                    <div>
                      <div className="font-bold text-amber-400">Vehicle stays 24 hours</div>
                      <p className="mt-1 text-sm leading-relaxed text-amber-100">
                        The coating needs a full 24-hour cure in our controlled environment to bond
                        properly. Please plan for this — an early pickup compromises the finish.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {service.heroVideo && !showVideo && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowVideo(true)}
                  className="min-h-[48px] border-gray-600 px-6 text-base text-white hover:bg-gray-800"
                  data-testid="button-watch-video"
                >
                  <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                  Watch Video
                </Button>
              )}
            </div>

            {/* ------------------------------------------------------- offer + form */}
            <section aria-label="Pricing and booking" className="min-w-0 space-y-4 lg:col-span-5">
              {/*
                ─────────────────────────────────────────────────────────────────────────
                The offer card: the whole online booking journey in one container — price,
                what paying today does, what is included, one button, and the real refund
                terms. It replaced a plain price table.

                Deliberately NOT on it, although a design review suggested them:
                  - "Limited time": the discount has no end date, so none is claimed;
                  - "3-stage paint correction", "certified": the checklist is the service's
                    OWN stored included items, not marketing lines written here;
                  - "balance at shop": whether the ₹299 is deducted is unconfirmed;
                  - "zero risk, cancel up to 24h": the refund terms below are quoted from
                    /refund-policy, which is the policy that governs the ₹299 fee.
                ─────────────────────────────────────────────────────────────────────────
              */}
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-7"
                data-testid="offer-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-green-400">
                    {isAnnualPackage ? 'Annual package' : 'In-studio offer'}
                  </span>
                  {discountPercent > 0 && (
                    <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <ins
                    className="text-4xl font-extrabold leading-none tracking-tight text-white no-underline sm:text-[42px]"
                    data-testid="text-offer-price"
                  >
                    {formatINR(service.price)}
                  </ins>
                  {service.originalPrice && (
                    <del className="text-lg text-gray-500">{formatINR(service.originalPrice)}</del>
                  )}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {isAnnualPackage ? 'Package value' : 'Offer price · paid at the studio after the work'}
                </p>

                <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-300">
                  {offer.free
                    ? 'No booking fee — reserve your slot online free.'
                    : isAnnualPackage
                      ? `Pay ${formatINR(service.price)} online for the full annual package.`
                      : 'Pay just ₹299 online today to hold your slot.'}
                </p>

                <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-gray-100">
                  {/* Items 2–4: the first is already the lead trust pill beside the title. */}
                  {Array.from(new Set((service.whatIncluded || []).map(cleanIncluded)))
                    .slice(1, 4)
                    .map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                        <span>{shortIncluded(item)}</span>
                      </li>
                    ))}
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    <span>₹500 voucher on your 2nd visit</span>
                  </li>
                </ul>

                <Button
                  onClick={() => setBookingModalOpen(true)}
                  className="bg-[var(--neon-green)] hover:brightness-95 mt-6 h-auto min-h-[56px] w-full whitespace-normal rounded-xl py-4 text-base font-bold text-black sm:text-lg"
                  data-testid="button-book-now-hero"
                >
                  {/* Never quote a price the server will not charge: `free` comes from the
                      same server that decides the amount. */}
                  {offer.free
                    ? 'Reserve your slot — no fee'
                    : isAnnualPackage
                      ? `Book the package — ${formatINR(service.price)}`
                      : 'Reserve your slot for ₹299'}
                  <ArrowRight className="ml-2 h-5 w-5 shrink-0" aria-hidden="true" />
                </Button>

                <p className="mt-3 text-center text-xs text-gray-400">
                  {offer.free
                    ? 'Nothing to pay online, so nothing to cancel — just call or message us.'
                    : isAnnualPackage
                      // The package is paid in full, so the ₹299-fee refund rule does not apply.
                      ? 'Paid in full online — cancellation terms apply.'
                      : 'Full refund of the booking fee if you cancel 24+ hours ahead.'}{' '}
                  <a href="/refund-policy" className="underline underline-offset-2 hover:text-gray-200">
                    Refund policy
                  </a>
                </p>
              </div>
              {/* The "Prefer a call?" form used to sit under this card. It made the right
                  column far taller than the left and read as an odd one out beside the
                  title, so it now has its own centred section lower down the page. */}
            </section>
          </div>
        </div>
      </section>

      {/* Before & After Section - Moved to 2nd position */}
      {(service.slug === 'headlight-restoration-both' || service.slug === 'windshield-glass-coating-new' || service.slug === 'exterior-detailing-hard-water-new' || service.slug === 'interior-detailing-service' || (service.beforeAfter && service.beforeAfter.length > 0)) && (
        <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              {/* Starts at text-3xl, not text-5xl. "Transformations" is a single
                  unbreakable 15-character word: at 48px it measures ~368px, and the
                  column is 328px on a 360px phone, so it alone gave the page 25px of
                  horizontal scroll. Every fixed element (header, toast viewport) then
                  stretched to match, which is why the header looked like the culprit.
                  This section only renders for services that have before/after content,
                  which is why some service pages overflowed and others did not. */}
              <h2 className="text-2xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Dramatic Transformations
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See the incredible before and after results of our expert car detailing services. 
                These real transformations speak for themselves.
              </p>
            </div>

            <div className="space-y-16">
              {/* Headlight Restoration Before/After */}
              {service.slug === 'headlight-restoration-both' && (
                <div className="group">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Before Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={headlightBefore}
                        alt="Foggy headlight before restoration"
                        data-testid="image-headlight-before"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          BEFORE
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">Foggy & Yellowed</p>
                        </div>
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={headlightAfter}
                        alt="Crystal clear headlight after restoration"
                        data-testid="image-headlight-after"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 right-6">
                        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          AFTER
                        </div>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">Crystal Clear</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Video */}
                  <div className="mt-12 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">Watch The Complete Process</h3>
                      <p className="text-gray-400">See how we transform foggy headlights to crystal clear</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                      <iframe
                        src="https://www.youtube.com/embed/XXb4J6cBze0"
                        title="Headlight Restoration Process - P91 Car Care"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}

              {/* Glass Coating Before/After */}
              {service.slug === 'windshield-glass-coating-new' && (
                <div className="group">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={glassCoating}
                        alt="Water beading on ceramic coated windshield"
                        data-testid="image-glass-coating"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          COATED GLASS
                        </div>
                      </div>
                      <div className="absolute bottom-6 center-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg mx-auto">
                          <p className="text-sm opacity-90">Water Beading Effect</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Video */}
                  <div className="mt-12 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">See The Water Repelling Effect</h3>
                      <p className="text-gray-400">Watch how water slides off instantly after coating</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                      <iframe
                        src="https://www.youtube.com/embed/Oak9CKJMz6E"
                        title="Glass Coating Water Repelling Demo - P91 Car Care"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}

              {/* Glass Polishing Before/After */}
              {service.slug === 'windshield-glass-polishing' && (
                <div className="group">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={glassPolishing}
                        alt="Crystal clear polished windshield"
                        data-testid="image-glass-polishing"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          POLISHED GLASS
                        </div>
                      </div>
                      <div className="absolute bottom-6 center-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg mx-auto">
                          <p className="text-sm opacity-90">Crystal Clear Clarity</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Video */}
                  <div className="mt-12 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">See The Polishing Process</h3>
                      <p className="text-gray-400">Watch how we restore crystal-clear visibility by removing water spots and scratches</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                      <iframe
                        src="https://www.youtube.com/embed/Oak9CKJMz6E"
                        title="Glass Polishing Process - P91 Car Care"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}

              {/* Exterior Detailing Before/After */}
              {service.slug === 'exterior-detailing-hard-water-new' && (
                <div className="group">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Before Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[350px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={exteriorDetailingBefore}
                        alt="Car before exterior detailing - dull and dirty"
                        data-testid="image-exterior-before"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          BEFORE
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">Dull & Dirty</p>
                        </div>
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[350px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={exteriorDetailingAfter}
                        alt="Car after exterior detailing - glossy orange finish"
                        data-testid="image-exterior-after"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 right-6">
                        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          AFTER
                        </div>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">Showroom Shine</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-8 text-center">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
                      <p className="text-lg text-gray-300 leading-relaxed">
                        Our professional exterior detailing transforms your car's appearance with deep cleaning, 
                        paint correction, and protective coating. See the mirror-like finish and showroom shine 
                        that makes your car look brand new.
                      </p>
                    </div>
                  </div>

                  {/* Optimized Video */}
                  <div className="mt-12 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">Watch The Detailing Process</h3>
                      <p className="text-gray-400">See how we transform dull cars into showroom perfection</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="none"
                        poster={exteriorDetailingAfter}
                        width="640"
                        height="360"
                      >
                        <source src="/attached_assets/Exterior Detailing_1754031679196.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              )}

              {/* Interior Detailing Before/After */}
              {service.slug === 'interior-detailing-service' && (
                <div className="group">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full object-contain transition-transform duration-700 group-hover:scale-105"
                        src={interiorDetailingComparison}
                        alt="Interior detailing before and after comparison - dirty vs clean car interior"
                        data-testid="image-interior-comparison"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-orange-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          SEE THE DIFFERENCE
                        </div>
                      </div>
                      <div className="absolute bottom-6 center-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg mx-auto">
                          <p className="text-sm opacity-90">Before vs After</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
                      <p className="text-lg text-gray-300 leading-relaxed">
                        Transform your {vehicleNoun}'s interior from dirty and stained to fresh and spotless.
                        Our deep cleaning process removes dirt, stains, and odors, leaving your interior 
                        looking and smelling like new.
                      </p>
                    </div>
                  </div>

                  {/* Optimized Interior Video */}
                  <div className="mt-12 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">Interior Detailing Process</h3>
                      <p className="text-gray-400">See our comprehensive interior cleaning transformation</p>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="none"
                        poster={interiorDetailingComparison}
                        width="480"
                        height="270"
                      >
                        <source src="/attached_assets/Interior Detailing_1754032868240.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              )}

              {/* Original beforeAfter data if exists */}
              {service.beforeAfter && service.beforeAfter.map((comparison, index) => (
                <div key={index} className="group">
                  {/* Single Full-Width Comparison Image */}
                  <div className="max-w-5xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl" style={{ maxHeight: '500px' }}>
                      <img
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ objectPosition: 'center bottom', marginTop: '-20%' }}
                        src={comparison.before}
                        alt={`${service.title} transformation ${index + 1}`}
                        data-testid={`image-comparison-${index}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Before label on left side */}
                      <div className="absolute top-6 left-6">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm md:text-lg font-bold shadow-lg">
                          BEFORE
                        </div>
                      </div>
                      
                      {/* After label on right side */}
                      <div className="absolute top-6 right-6">
                        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm md:text-lg font-bold shadow-lg">
                          AFTER
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {comparison.description && (
                      <div className="mt-6 text-center">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6">
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            {comparison.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  {index < service.beforeAfter.length - 1 && (
                    <div className="flex justify-center mt-12 mb-12">
                      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA at bottom of before/after section */}
            <div className="mt-20 text-center">
              <div className="bg-green-600/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto border border-green-400/30">
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Ready for Your Transformation?
                </h3>
                <p className="text-gray-300 mb-6">
                  Join hundreds of satisfied customers who've experienced the P91 difference
                </p>
                <Button
                  size="lg"
                  onClick={() => setBookingModalOpen(true)}
                  className="bg-[var(--neon-green)] hover:brightness-95 text-black font-bold px-6 sm:px-8 py-4 text-base sm:text-lg max-w-full whitespace-normal h-auto rounded-[10px]"
                  data-testid="button-book-transformation"
                >
                  Book Your Transformation
                  <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
                </Button>
              </div>
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
      {service.whatIncluded && service.whatIncluded.length > 0 && (
        <section className="bg-black px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl lg:text-4xl">What's Included</h2>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from(new Set(service.whatIncluded.map(cleanIncluded))).map((item, index) => (
                <li
                  key={index}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3"
                >
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
                  <span className="truncate text-sm text-gray-200 sm:text-base" title={cleanIncluded(item)}>
                    {shortIncluded(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {/* The studio's own reels of this service, when there are any (lib/instagram-reels.ts).
          Pages without a matching reel render nothing here rather than an unrelated one. */}
      <InstagramReels
        reels={REELS_BY_SERVICE[service.slug] ?? []}
        heading="See it on Instagram"
        intro={`Real ${service.title.trim().toLowerCase()} work from our Adugodi studio.`}
        className="bg-black"
      />
      {service.whyChoose && (
        <section className="bg-gray-900 px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl lg:text-4xl">Why P91 Car Care in Adugodi?</h2>
            <p className="text-base leading-relaxed text-gray-300 sm:text-lg">{firstSentence(service.whyChoose)}</p>
          </div>
        </section>
      )}
      {service.process && service.process.length > 0 && (
        <section className="bg-black px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl lg:text-4xl">Our Process</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {service.process.map((step, index) => (
                <li
                  key={index}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-400 text-sm font-bold text-black">
                    {step.step ?? index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-gray-200 sm:text-base" title={step.title}>
                    {step.title}
                  </span>
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
        <section className="py-16 px-4 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Inside the Studio
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See our expert technicians in action as they transform your {vehicleNoun} with precision and care.
              </p>
            </div>

            {/* Single Video - Full Width 16:9 */}
            {service.gallery.find(item => item.type === 'video') && (
              <div className="max-w-6xl mx-auto mb-16">
                <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                  <div className="aspect-video"> {/* 16:9 aspect ratio */}
                    <iframe
                      className="w-full h-full rounded-2xl"
                      src={service.gallery.find(item => item.type === 'video')?.url}
                      title={service.gallery.find(item => item.type === 'video')?.caption || `${service.title} Process Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      data-testid="video-process"
                    />
                  </div>
                  <div className="absolute top-6 left-6">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      PROCESS VIDEO
                    </div>
                  </div>
                  {service.gallery.find(item => item.type === 'video')?.caption && (
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">
                          {service.gallery.find(item => item.type === 'video')?.caption}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Single Image - Full Width */}
            {service.gallery.find(item => item.type === 'image') && (
              <div className="max-w-6xl mx-auto">
                <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl group">
                  <img
                    className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                    src={service.gallery.find(item => item.type === 'image')?.url}
                    alt={
                      service.gallery.find(item => item.type === 'image')?.caption ||
                      `${service.title.trim()} being carried out at the P91 Car Care studio in Adugodi, Bangalore`
                    }
                    width={1600}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    data-testid="image-process"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  {service.gallery.find(item => item.type === 'image')?.caption && (
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">
                          {service.gallery.find(item => item.type === 'image')?.caption}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optional CTA below gallery */}
            <div className="mt-16 text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Experience Professional Car Care
                </h3>
                <p className="text-gray-300 mb-6">
                  Book your service today and let our experts give your {vehicleNoun} the attention it deserves
                </p>
                <Button
                  size="lg"
                  onClick={() => setBookingModalOpen(true)}
                  className="bg-[var(--neon-green)] hover:brightness-95 text-black font-bold px-8 py-4 rounded-[10px]"
                  data-testid="button-book-gallery"
                >
                  Book Your Service
                  <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Testimonials Section */}
      {showTestimonials && service.testimonials && service.testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {service.testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4 italic">"{testimonial.comment}"</p>
                    <div className="flex items-center gap-3">
                      {testimonial.image && (
                        <img
                          className="w-10 h-10 rounded-full object-cover"
                          src={testimonial.image}
                          alt={testimonial.name}
                        />
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-gray-400">Verified Customer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* FAQ Section */}
      {service.faq && service.faq.length > 0 && (
        <section className="py-16 px-4 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl lg:text-4xl">
              {service.title.trim()} in Adugodi, Bangalore: FAQs
            </h2>
            {/*
              Every answer is visible text, not a collapsed accordion. The Radix accordion
              UNMOUNTS closed panels, so the answers were not in the page at all until
              someone clicked — search engines and AI answer engines only ever saw the
              questions (plus the FAQPage schema). Question = h3, answer = the paragraph
              under it, which is the shape those engines quote from.
            */}
            <dl className="grid gap-x-8 gap-y-6 md:grid-cols-2" data-testid="faq-list">
              {service.faq
                .filter((item) => item?.question?.trim() && item?.answer?.trim())
                .map((item, index) => (
                  <div key={index} className="border-t border-gray-800 pt-4">
                    <dt>
                      <h3 className="text-base font-semibold text-white sm:text-lg">{item.question.trim()}</h3>
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-gray-200 sm:text-base">{item.answer.trim()}</dd>
                  </div>
                ))}
            </dl>
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
      {/* Guarantee Section */}
      {service.guaranteeText && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Our Guarantee</h2>
            <p className="text-xl text-gray-300 leading-relaxed">{service.guaranteeText}</p>
          </div>
        </section>
      )}
      {/* Final CTA Section */}
      <section ref={finalCtaRef} className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6">Ready to Transform Your {vehicleNounTitle}?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your {service.title.toLowerCase()} today and experience the P91 difference!
          </p>
          
          <div className="mb-8">
            {/* flex-wrap because the price is live data of unknown length: the PPF rows
                are five figures ("₹65000.00" beside "₹95000.00" and the Save badge),
                which is 2px wider than a 360px phone allows on one line. */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4">
              <span className="text-2xl sm:text-4xl font-bold">₹{service.price}</span>
              {service.originalPrice && (
                <>
                  <span className="text-2xl opacity-75 line-through">₹{service.originalPrice}</span>
                  <Badge className="bg-black text-green-400">Save {discountPercent}%</Badge>
                </>
              )}
            </div>
            {service.urgencyText && (
              <p className="text-black font-semibold animate-pulse">{service.urgencyText}</p>
            )}
          </div>

          {/* ctaText comes from the record and its length is not ours to predict, so this
              wraps rather than forcing the page wider than a 320px phone. */}
          <Button
            size="lg"
            onClick={() => setBookingModalOpen(true)}
            className="h-auto max-w-full whitespace-normal bg-black px-6 py-4 text-lg font-bold text-green-400 hover:bg-gray-900 sm:px-12 sm:text-xl"
            data-testid="button-book-now-final"
          >
            {/* One booking phrase site-wide. ctaText ("Get Protected Now"...) varied per record. */}
            Book Now
            <ArrowRight className="ml-2 h-6 w-6 shrink-0" />
          </Button>

          {/* Contact Info */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              +91 74066 19191
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              info@p91carcare.com
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Bangalore, Karnataka
            </div>
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
              data-testid="link-service-instagram"
            >
              <SiInstagram className="w-4 h-4" aria-hidden="true" />
              @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
      </section>
      <BrandFooter />
      {/*
        Sticky booking bar. Full width along the bottom on phones — price, what paying
        today does, and one Reserve button, reachable however far down the customer has
        scrolled — and a compact card at bottom-right from sm up. Hidden while the page's
        own bottom CTA or the booking modal is on screen. The site-wide WhatsApp button
        lifts above it on /service/* (components/contact-fab.tsx), so the two never touch.
      */}
      {showFloatingCTA && !finalCtaVisible && !bookingModalOpen && !floatingCtaDismissed && (
        <div
          className="fixed inset-x-0 bottom-0 z-[45] sm:inset-x-auto sm:right-4 sm:bottom-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          data-testid="floating-cta-button"
        >
          <div className="relative flex items-center gap-3 border-t border-green-500/40 bg-gray-950/95 px-4 py-3 shadow-2xl backdrop-blur-md sm:max-w-sm sm:rounded-2xl sm:border">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-white">{formatINR(service.price)}</span>
                {service.originalPrice && (
                  <del className="text-xs text-gray-500">{formatINR(service.originalPrice)}</del>
                )}
              </div>
              <div className="truncate text-xs text-green-300">
                {offer.free
                  ? 'No booking fee'
                  : isAnnualPackage ? 'Full package, paid online' : 'Pay ₹299 now to hold your slot'}
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBookingModalOpen(true);
              }}
              className="bg-[var(--neon-green)] hover:brightness-95 min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold text-black"
              data-testid="button-floating-book-now"
            >
              Reserve slot
            </Button>
            {/* Persistent bar, so it needs a way out. 44x44 touch target. */}
            <button
              type="button"
              onClick={() => setFloatingCtaDismissed(true)}
              aria-label="Dismiss booking bar"
              className="inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              data-testid="button-dismiss-floating-cta"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
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