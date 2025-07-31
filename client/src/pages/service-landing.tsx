import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Star, Clock, Shield, Phone, Mail, MapPin, Play, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
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
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          {service.discountText && (
            <Badge className="mb-4 bg-red-600 hover:bg-red-700 text-white text-lg px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              {service.discountText}
            </Badge>
          )}
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            {service.heroTitle || service.title}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
            {service.heroSubtitle || service.description}
          </p>

          {/* Pricing */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-4xl font-bold text-green-400">₹{service.price}</span>
              {service.originalPrice && (
                <>
                  <span className="text-2xl text-gray-500 line-through">₹{service.originalPrice}</span>
                  <Badge className="bg-green-600 text-white">Save {discountPercent}%</Badge>
                </>
              )}
            </div>
            {service.urgencyText && (
              <p className="text-red-400 font-semibold animate-pulse">{service.urgencyText}</p>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setBookingModalOpen(true)}
              className="bg-green-400 hover:bg-green-500 text-black font-bold px-8 py-4 text-lg"
              data-testid="button-book-now-hero"
            >
              {service.ctaText || "Book Now"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            {service.heroVideo && !showVideo && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowVideo(true)}
                className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
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

      {/* Gallery Section */}
      {service.gallery && service.gallery.length > 0 && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">Gallery</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.gallery.map((item, index) => (
                <div key={index} className="relative group overflow-hidden rounded-lg">
                  {item.type === 'video' ? (
                    <video
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      controls
                      src={item.url}
                    />
                  ) : (
                    <img
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      src={item.url}
                      alt={item.caption || service.title}
                    />
                  )}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
                      <p className="text-sm">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        service={service}
      />
    </div>
  );
}