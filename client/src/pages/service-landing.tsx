import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Star, Clock, Shield, Phone, Mail, MapPin, Play, ArrowRight, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BookingModal from "@/components/booking-modal";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage } from "@/lib/canonical-services";

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

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services", slug],
    enabled: !!slug,
  });

  // Hide the floating CTA once the real bottom CTA scrolls into view.
  useEffect(() => {
    const el = finalCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setFinalCtaVisible(entry.isIntersecting),
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
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-xl w-full text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">We couldn't find that service</h1>
            <p className="text-gray-300 text-lg mb-10">
              It may have been renamed or is no longer offered. All of our current services
              are listed on the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/#services">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-green-400 hover:bg-green-500 text-black font-bold"
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
        <Footer />
      </div>
    );
  }

  const discountPercent = service.originalPrice
    ? Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)
    : 0;

  const showTestimonials = !TESTIMONIALS_SUPPRESSED.has(service.slug);

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
    <div className="min-h-screen bg-black text-white">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/Car Care (4)_1753951564515.png"
              alt="P91 Car Care"
              width={42}
              height={32}
              decoding="async"
              className="h-8 w-auto"
              data-testid="img-logo"
            />
          </div>
          {/* Now points at the real /services catalogue page rather than the homepage
              anchor — the grid does not exist on this page, so #services was a no-op here.

              The label shortens under 640px on purpose. The logo is `h-8 w-auto`, which
              renders about 203px wide; with the full 150px nowrap label that is 353px of
              content in the 328px box a 360px phone gives, and the 25px difference became
              horizontal page scroll (the deployed site does this too — pre-existing). */}
          <a href="/services" className="shrink-0">
            <Button
              variant="ghost"
              className="text-green-400 hover:text-green-300 px-2 sm:px-4"
              data-testid="button-back-home"
            >
              <span className="sm:hidden">← Back</span>
              <span className="hidden sm:inline">← Back to Services</span>
            </Button>
          </a>
        </div>
      </header>
      {/* Hero Section — pt clears the fixed header with margin so the card/callout
          isn't clipped behind it on shorter viewports. */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
        {/* Background Image/Video */}
        <div className="absolute inset-0 z-0">
          {service.heroVideo && showVideo ? (
            <div className="w-full h-full">
              <iframe
                className="w-full h-full object-cover"
                src={`${service.heroVideo}?autoplay=1&mute=1&loop=1&playlist=${service.heroVideo.split('/').pop()}`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              // Same resolver as the card and the booking modal, so all three show the
              // same picture. No remote stand-in: if a service somehow has no image the
              // hero is just the dark gradient.
              style={{
                backgroundImage: [
                  'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))',
                  heroImage ? `url(${heroImage})` : null,
                ].filter(Boolean).join(', '),
              }}
            />
          )}
        </div>

        {/* Hero Content */}
        {/* `w-full min-w-0` is required, not cosmetic: the parent <section> is a flex
            container, so this is a flex item, and a flex item defaults to
            `min-width: auto` — it refuses to shrink below its content's min-content
            width. That measured 394px against a 360px viewport, giving the page 25px of
            horizontal scroll on narrow Android devices (the deployed site does the same;
            this is a pre-existing bug, not one the redesign introduced). */}
        <div className="relative z-10 text-center max-w-5xl w-full min-w-0 mx-auto px-4 py-8">
          {discountPercent > 0 && (
            <Badge className="mb-6 bg-red-600 hover:bg-red-700 text-white text-lg px-6 py-3 rounded-full">
              <Zap className="w-5 h-5 mr-2" />
              {discountPercent}% OFF - Limited Time!
            </Badge>
          )}
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent leading-tight">
            {service.title}
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {service.description}
          </p>

          {/* Booking Fee Pricing */}
          <div className="mb-10">
            <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-2xl p-8 border border-green-500/30 max-w-2xl mx-auto">
              <div className="text-center">
                {service.title === 'Annual Maintenance Package' ? (
                  <>
                    <div className="mb-4">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Complete Package Price</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <span className="text-6xl font-bold text-green-400">₹8999</span>
                      <div className="text-left">
                        <div className="text-sm text-gray-400">Full Payment</div>
                        <div className="text-sm text-green-400 font-semibold">All Services Included</div>
                      </div>
                    </div>
                    <div className="text-base text-gray-300 mb-4">
                      Package Value:
                      <span className="text-green-400 font-bold ml-2 text-xl">₹{service.price}</span>
                      {service.originalPrice && (
                        <span className="text-gray-500 line-through ml-2 text-lg">₹{service.originalPrice}</span>
                      )}
                    </div>
                    <div className="text-sm text-yellow-400 bg-yellow-500/20 rounded-lg px-4 py-2 inline-block">
                      💎 Save ₹9,001 with Complete Package
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Secure Your Slot For Just</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <span className="text-6xl font-bold text-green-400">₹299</span>
                      <div className="text-left">
                        <div className="text-sm text-gray-400">Booking Fee</div>
                        <div className="text-sm text-green-400 font-semibold">+ FREE ₹500 Voucher</div>
                      </div>
                    </div>
                    <div className="text-base text-gray-300 mb-4">
                      Full Service Value:
                      <span className="text-green-400 font-bold ml-2 text-xl">₹{service.price}</span>
                      {service.originalPrice && (
                        <span className="text-gray-500 line-through ml-2 text-lg">₹{service.originalPrice}</span>
                      )}
                    </div>
                    <div className="text-sm text-yellow-400 bg-yellow-500/20 rounded-lg px-4 py-2 inline-block">
                      🎁 Get FREE ₹500 Gift Voucher on 2nd Visit
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Studio Requirement Warning - Only for Glass Coating */}
          {service.slug === 'windshield-glass-coating-new' && (
            <div className="mb-10">
              <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-2xl p-6 border border-amber-500/50 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-amber-400 mr-3" />
                    <h3 className="text-2xl font-bold text-amber-400">IMPORTANT NOTICE</h3>
                  </div>
                  <div className="bg-amber-500/20 rounded-xl p-4 mb-4">
                    <p className="text-lg font-semibold text-white mb-2">
                      🚗 Vehicle Must Stay at Studio for 24 Hours
                    </p>
                    <p className="text-amber-100 text-sm leading-relaxed">
                      The ceramic coating requires a full 24-hour curing period in our controlled environment 
                      to achieve maximum durability and water repellency. This ensures proper bonding and 
                      long-lasting protection.
                    </p>
                  </div>
                  <div className="text-amber-300 text-sm font-medium">
                    ⚠️ Please plan accordingly - Early pickup will compromise coating quality
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Button
              size="lg"
              onClick={() => setBookingModalOpen(true)}
              className="bg-green-400 hover:bg-green-500 text-black font-bold px-6 sm:px-10 py-4 text-base sm:text-lg rounded-full transform hover:scale-105 transition-all duration-200 max-w-full whitespace-normal h-auto"
              data-testid="button-book-now-hero"
            >
              {service.title === 'Annual Maintenance Package' 
                ? 'Pay ₹8999 Complete Package' 
                : 'Pay ₹299 & Get FREE Voucher'
              }
              <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
            
            {service.heroVideo && !showVideo && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowVideo(true)}
                className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black px-8 py-4 text-lg rounded-full"
                data-testid="button-watch-video"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Video
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              100% Satisfaction Guaranteed
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              {service.slug === 'windshield-glass-coating-new' ? '24 Hours Service' : `${service.duration} Minutes Service`}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-green-400" />
              5-Star Rated Service
            </div>
          </div>
        </div>
      </section>
      {/* Before & After Section - Moved to 2nd position */}
      {(service.slug === 'headlight-restoration-both' || service.slug === 'windshield-glass-coating-new' || service.slug === 'exterior-detailing-hard-water-new' || service.slug === 'interior-detailing-service' || (service.beforeAfter && service.beforeAfter.length > 0)) && (
        <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              {/* Starts at text-3xl, not text-5xl. "Transformations" is a single
                  unbreakable 15-character word: at 48px it measures ~368px, and the
                  column is 328px on a 360px phone, so it alone gave the page 25px of
                  horizontal scroll. Every fixed element (header, toast viewport) then
                  stretched to match, which is why the header looked like the culprit.
                  This section only renders for services that have before/after content,
                  which is why some service pages overflowed and others did not. */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
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
                  className="bg-green-400 hover:bg-green-500 text-black font-bold px-6 sm:px-8 py-4 text-base sm:text-lg max-w-full whitespace-normal h-auto"
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
      {/* Booking Fee Explanation Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-green-400">🎉 Special Booking Offer</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">
                {service.title === 'Annual Maintenance Package' ? 'Just ₹8999' : 'Just ₹299'}
              </h3>
              <p className="text-gray-300">
                {service.title === 'Annual Maintenance Package' 
                  ? 'Complete package payment - no additional charges' 
                  : 'Secure your preferred time slot with a small booking fee'
                }
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">FREE ₹500 Voucher</h3>
              <p className="text-gray-300">Get a gift voucher worth ₹500 on 2nd visit</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Transparent</h3>
              <p className="text-gray-300">No hidden charges, pay remainder at service time</p>
            </div>
          </div>
          <p className="text-lg text-gray-300 mb-4">
            {service.title === 'Annual Maintenance Package' 
              ? 'Pay just ₹8999 now for the complete package and receive a gift voucher worth ₹500 on your 2nd visit. Show your booking confirmation at our store to claim your bonus!'
              : 'Pay just ₹299 now to reserve your slot and receive a gift voucher worth ₹500 on your 2nd visit. Show your booking confirmation at our store to claim your bonus!'
            }
          </p>
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 inline-block">
            <p className="text-yellow-300 text-sm">
              💡 <strong>Smart booking system:</strong> No wasted slots, guaranteed service, plus amazing bonus value!
            </p>
          </div>
        </div>
      </section>
      {/* What's Included Section */}
      {service.whatIncluded && service.whatIncluded.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">What's Included</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.whatIncluded.map((item, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Why Choose Us Section */}
      {service.whyChoose && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Why Choose P91 Car Care?</h2>
            <p className="text-xl text-gray-300 leading-relaxed">{service.whyChoose}</p>
          </div>
        </section>
      )}
      {/* Process Section */}
      {service.process && service.process.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">Our Process</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {service.process.map((step, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800 text-center overflow-hidden">
                  <CardContent className="p-0">
                    {step.image && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={step.image}
                          alt={`${step.title} — step ${step.step} of the ${service.title.trim()} process at P91 Car Care`}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                          {step.step}
                        </div>
                      </div>
                    )}
                    <div className={step.image ? "p-6" : "p-8"}>
                      {!step.image && (
                        <div className="w-16 h-16 bg-green-400 text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                          {step.step}
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                      <p className="text-gray-300">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Gallery Section - Single Video in 16:9 Format */}
      {service.gallery && service.gallery.length > 0 && (
        <section className="py-24 px-4 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
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
                      `${service.title.trim()} being carried out at the P91 Car Care studio in Indiranagar, Bangalore`
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
                  className="bg-green-400 hover:bg-green-500 text-black font-bold px-8 py-4"
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
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
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
        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible>
              {service.faq.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-gray-800">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:text-green-400">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 text-base leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}
      {/* Guarantee Section */}
      {service.guaranteeText && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Our Guarantee</h2>
            <p className="text-xl text-gray-300 leading-relaxed">{service.guaranteeText}</p>
          </div>
        </section>
      )}
      {/* Final CTA Section */}
      <section ref={finalCtaRef} className="py-20 px-4 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your {vehicleNounTitle}?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your {service.title.toLowerCase()} today and experience the P91 difference!
          </p>
          
          <div className="mb-8">
            {/* flex-wrap because the price is live data of unknown length: the PPF rows
                are five figures ("₹65000.00" beside "₹95000.00" and the Save badge),
                which is 2px wider than a 360px phone allows on one line. */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4">
              <span className="text-4xl font-bold">₹{service.price}</span>
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

          <Button
            size="lg"
            onClick={() => setBookingModalOpen(true)}
            className="bg-black hover:bg-gray-900 text-green-400 font-bold px-12 py-4 text-xl"
            data-testid="button-book-now-final"
          >
            {service.ctaText || "Book Now"}
            <ArrowRight className="ml-2 w-6 h-6" />
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
          </div>
        </div>
      </section>
      {/* Floating FOMO CTA Button — hidden while the real bottom CTA is on screen so it
          never covers the Book Now button or the footer contact info. */}
      {showFloatingCTA && !finalCtaVisible && !bookingModalOpen && !floatingCtaDismissed && (
        <div
          className="fixed right-4 z-[45] transition-all duration-500 ease-in-out translate-y-0 opacity-100"
          // Sits above the iOS/Android home indicator instead of under it.
          style={{ pointerEvents: 'auto', bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          data-testid="floating-cta-button"
        >
          <div className="bg-gray-900 rounded-2xl shadow-2xl px-4 py-3 mr-1 max-w-xs relative border border-green-500/40">
            {/* Persistent bar, so it needs a way out. 44x44 touch target. */}
            <button
              type="button"
              onClick={() => setFloatingCtaDismissed(true)}
              aria-label="Dismiss booking bar"
              className="absolute -top-3 -right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              data-testid="button-dismiss-floating-cta"
            >
              <span aria-hidden="true" className="text-lg leading-none">×</span>
            </button>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {/* Was an "LIMITED SLOTS" pill with a pulsing dot. No slot count is
                    calculated anywhere, so the claim was fabricated. */}
                <div className="text-gray-300 text-xs font-semibold tracking-wide uppercase mb-1">
                  Book Your Service
                </div>
                <div className="text-white text-sm font-semibold">
                  {service.title === 'Annual Maintenance Package' ? 'Book now for ₹8999' : 'Book now for ₹299'}
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBookingModalOpen(true);
                }}
                className="bg-green-400 hover:bg-green-500 text-black font-bold px-4 py-2 rounded-xl shadow-lg transition-colors flex items-center gap-2 min-w-fit relative z-10"
                data-testid="button-floating-book-now"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-bold">BOOK</span>
              </Button>
            </div>
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
  const name = service.title.trim();

  // Search results truncate around 60 characters, so an admin-set metaTitle is used as
  // given (they chose it) but the generated fallback keeps the brand suffix and drops the
  // location only when the service name is already long. "1 Year Bike Ceramic Coating -
  // Motorcycle Paint Protection | P91 Car Care Bangalore" was 82 characters and got cut
  // mid-phrase.
  const generated = `${name} in Bangalore | P91 Car Care`;
  const title = service.metaTitle || (generated.length <= 60 ? generated : `${name} | P91 Car Care`);

  const description = service.metaDescription || service.description;
  // Separate component, so resolve here rather than reaching for the page's local.
  const seoImage = resolveServiceImage(service);

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
      name,
      description,
      image: seoImage,
      provider,
      offers: {
        "@type": "Offer",
        // Live price from the record. Never a literal — a schema price that disagrees with
        // the page is a Merchant-listing violation as well as a lie to the customer.
        price: service.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin}/service/${service.slug}`,
      },
    },
  ];

  // FAQPage only when the record actually has questions — an empty FAQPage is a
  // structured-data error, and inventing questions to fill it would be worse.
  const faqs = (service.faq || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question.trim(),
        acceptedAnswer: { "@type": "Answer", text: f.answer.trim() },
      })),
    });
  }

  useSeoMeta({
    title,
    description,
    image: seoImage,
    canonicalPath: `/service/${service.slug}`,
    structuredData: schemas,
  });
  return null;
}