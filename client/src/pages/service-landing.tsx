import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Star, Clock, Shield, Phone, Mail, MapPin, Play, ArrowRight, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import BookingModal from "@/components/booking-modal";

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
  process: Array<{ step: number; title: string; description: string }>;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Service Not Found</h1>
          <Button onClick={() => setLocation("/")} className="bg-green-400 hover:bg-green-500 text-black">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const discountPercent = service.originalPrice 
    ? Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* SEO Meta Tags */}
      <title>{service.metaTitle || `${service.title} - P91 Car Care`}</title>
      <meta name="description" content={service.metaDescription || service.description} />
      
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Car Care (4)_1753951564515.png" 
              alt="P91 Car Care" 
              className="h-8 w-auto"
              data-testid="img-logo"
            />
            <span className="text-xl font-bold text-green-400">P91 Car Care</span>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="text-green-400 hover:text-green-300"
            data-testid="button-back-home"
          >
            ← Back to Services
          </Button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
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
              style={{ 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${service.images?.[0] || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9'})` 
              }}
            />
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 py-8">
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
                  {service.originalPrice && (
                    <span className="text-gray-500 line-through ml-2 text-lg">₹{service.originalPrice}</span>
                  )}
                  <span className="text-green-400 font-bold ml-2 text-xl">₹{service.price}</span>
                </div>
                <div className="text-sm text-yellow-400 bg-yellow-500/20 rounded-lg px-4 py-2 inline-block">
                  🎁 Get FREE Car Wash Voucher Worth ₹500
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Button
              size="lg"
              onClick={() => setBookingModalOpen(true)}
              className="bg-green-400 hover:bg-green-500 text-black font-bold px-10 py-4 text-lg rounded-full transform hover:scale-105 transition-all duration-200"
              data-testid="button-book-now-hero"
            >
              Pay ₹299 & Get FREE Voucher
              <ArrowRight className="ml-2 w-5 h-5" />
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
              {service.duration} Minutes Service
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-green-400" />
              5-Star Rated Service
            </div>
          </div>
        </div>
      </section>

      {/* Booking Fee Explanation Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-green-400">🎉 Special Booking Offer</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Just ₹299</h3>
              <p className="text-gray-300">Secure your preferred time slot with a small booking fee</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">FREE ₹500 Voucher</h3>
              <p className="text-gray-300">Get a complimentary car wash voucher as a bonus</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Transparent</h3>
              <p className="text-gray-300">No hidden charges, pay remainder at service time</p>
            </div>
          </div>
          <p className="text-lg text-gray-300 mb-4">
            Pay just ₹299 now to reserve your slot and receive a FREE car wash voucher worth ₹500. 
            Show your booking confirmation at our store to claim your bonus!
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
                <Card key={index} className="bg-gray-900 border-gray-800 text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-green-400 text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                    <p className="text-gray-300">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Before & After Section - Full Section Layout */}
      {service.beforeAfter && service.beforeAfter.length > 0 && (
        <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Dramatic Transformations
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See the incredible before and after results of our expert car detailing services. 
                These real transformations speak for themselves.
              </p>
            </div>

            <div className="space-y-16">
              {service.beforeAfter.map((comparison, index) => (
                <div key={index} className="group">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Before Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={comparison.before}
                        alt={`Before ${service.title}`}
                        data-testid={`image-before-${index}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          BEFORE
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">Original Condition</p>
                        </div>
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
                      <img
                        className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                        src={comparison.after}
                        alt={`After ${service.title}`}
                        data-testid={`image-after-${index}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-6 right-6">
                        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                          AFTER
                        </div>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <p className="text-sm opacity-90">P91 Transformation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {comparison.description && (
                    <div className="mt-8 text-center">
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
                        <p className="text-lg text-gray-300 leading-relaxed">
                          {comparison.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  {index < service.beforeAfter.length - 1 && (
                    <div className="flex justify-center mt-16">
                      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA at bottom of before/after section */}
            <div className="mt-20 text-center">
              <div className="bg-green-600/20 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-green-400/30">
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Ready for Your Transformation?
                </h3>
                <p className="text-gray-300 mb-6">
                  Join hundreds of satisfied customers who've experienced the P91 difference
                </p>
                <Button
                  size="lg"
                  onClick={() => setBookingModalOpen(true)}
                  className="bg-green-400 hover:bg-green-500 text-black font-bold px-8 py-4 text-lg"
                  data-testid="button-book-transformation"
                >
                  Book Your Transformation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
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
                Watch Our Process
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See our expert technicians in action as they transform your car with precision and care.
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
                    alt={service.gallery.find(item => item.type === 'image')?.caption || `${service.title} Process`}
                    data-testid="image-process"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-6">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      PROCESS IMAGE
                    </div>
                  </div>
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
                  Book your service today and let our experts give your car the attention it deserves
                </p>
                <Button
                  size="lg"
                  onClick={() => setBookingModalOpen(true)}
                  className="bg-green-400 hover:bg-green-500 text-black font-bold px-8 py-4"
                  data-testid="button-book-gallery"
                >
                  Book Your Service
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {service.testimonials && service.testimonials.length > 0 && (
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
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Car?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your {service.title.toLowerCase()} today and experience the P91 difference!
          </p>
          
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
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
              +91 98765 43210
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

      {/* Floating FOMO CTA Button */}
      {showFloatingCTA && !bookingModalOpen && (
        <div 
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-500 ease-in-out ${
            showFloatingCTA ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
          data-testid="floating-cta-button"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-full shadow-2xl px-6 py-4 mx-4 max-w-sm relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-bold tracking-wide">
                    Limited slots available!
                  </span>
                </div>
                <div className="text-white text-sm font-medium">
                  Book your {service?.title?.toLowerCase() || 'service'} slot now
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBookingModalOpen(true);
                }}
                className="bg-white hover:bg-gray-100 text-red-600 font-bold px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-fit relative z-10"
                data-testid="button-floating-book-now"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">₹299 Only</span>
                <span className="sm:hidden">₹299</span>
              </Button>
            </div>
            
            {/* Pulse Animation Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 animate-ping opacity-20"></div>
          </div>
          
          {/* Price Badge */}
          {service?.originalPrice && parseFloat(service.originalPrice) > parseFloat(service.price) && (
            <div className="absolute -top-3 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              Save ₹{(parseFloat(service.originalPrice) - parseFloat(service.price)).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        service={service}
      />
    </div>
  );
}