import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/navbar";
import BookingModal from "@/components/booking-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Import images
import headlightBefore from "@assets/6634a243-60ef-4577-8f2d-0cb377dadc96_1754028199655.webp";
import headlightAfter from "@assets/GVXjDlbWcAAoQD1_1754028199653.jpg";
import glassCoating from "@assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ["/api/services/slug", slug],
    enabled: !!slug,
  });

  // Early return for loading state to prevent type errors
  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black text-white">
        <Navbar />
        <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="w-32 h-8 mb-4 bg-medium-gray" />
          <Skeleton className="w-full h-64 mb-8 bg-medium-gray" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="w-full h-32 bg-medium-gray" />
              <Skeleton className="w-full h-48 bg-medium-gray" />
            </div>
            <div>
              <Skeleton className="w-full h-96 bg-medium-gray" />
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (error || !service) {
    return (
      <div className="min-h-screen bg-deep-black text-white">
        <Navbar />
        <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Service Not Found</h1>
            <Link href="/">
              <Button className="bg-neon-green text-deep-black hover:bg-neon-green/90">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Type guard to ensure service is defined
  if (!service) return null;

  const durationInHours = Math.floor(service.duration / 60);
  const durationMinutes = service.duration % 60;
  const durationText = durationInHours > 0 
    ? `${durationInHours}${durationMinutes > 0 ? `.${Math.round((durationMinutes / 60) * 10)}` : ''} hours`
    : `${durationMinutes} minutes`;

  // DEBUG: Log service slug to see if conditional matches
  console.log('Service slug:', service.slug);
  console.log('Is headlight service:', service.slug === 'headlight-restoration-both');
  console.log('Is glass coating service:', service.slug === 'windshield-glass-coating-new');

  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Navbar />
      
      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-neon-green transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Link>
        </div>

        {/* Service Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4" data-testid="text-service-title">
            {service.title}
          </h1>
          <div className="flex items-center space-x-6 text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-neon-green" />
              <span data-testid="text-service-duration">{durationText}</span>
            </div>
            <div className="flex items-center space-x-2">
              {service.originalPrice && (
                <span className="line-through text-gray-500" data-testid="text-original-price">
                  ₹{service.originalPrice}
                </span>
              )}
              <span className="text-neon-green font-bold text-xl" data-testid="text-current-price">
                ₹{service.price}
              </span>
            </div>
          </div>
        </div>

        {/* Service Image */}
        <div className="mb-8">
          <img 
            src={service.images?.[0] || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"} 
            alt={service.title}
            className="w-full h-64 lg:h-96 object-cover rounded-xl" 
            data-testid="img-service-hero"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-20 lg:pb-8">
          {/* Service Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {service.description && (
              <div>
                <h2 className="text-2xl font-semibold text-neon-green mb-4">Service Overview</h2>
                <p className="text-gray-300 leading-relaxed" data-testid="text-service-description">
                  {service.description}
                </p>
              </div>
            )}

            {/* DEBUG: Show service slug */}
            <div className="bg-yellow-900 text-yellow-100 p-4 rounded mb-4">
              DEBUG: Service slug = "{service?.slug}"
              <br />
              Is headlight: {service?.slug === 'headlight-restoration-both' ? 'YES' : 'NO'}
              <br />
              Is glass coating: {service?.slug === 'windshield-glass-coating-new' ? 'YES' : 'NO'}
            </div>

            {/* Before & After Results - Headlight Restoration */}
            {service?.slug === 'headlight-restoration-both' && (
              <div>
                <h2 className="text-2xl font-semibold text-neon-green mb-6">Before & After Results</h2>
                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="relative">
                      <img 
                        src={headlightBefore} 
                        alt="Foggy headlight before restoration" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        BEFORE
                      </div>
                    </div>
                    <div className="relative">
                      <img 
                        src={headlightAfter} 
                        alt="Crystal clear headlight after restoration" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        AFTER
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">Watch The Complete Process</h4>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
                      <iframe
                        src="https://www.youtube.com/embed/XXb4J6cBze0"
                        title="Headlight Restoration Process - P91 Car Care"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-green-400">
                      <Check className="w-5 h-5" />
                      <span>Restores 90% original clarity</span>
                    </div>
                    <div className="flex items-center gap-3 text-green-400">
                      <Check className="w-5 h-5" />
                      <span>Improves night driving safety</span>
                    </div>
                    <div className="flex items-center gap-3 text-green-400">
                      <Check className="w-5 h-5" />
                      <span>Long-lasting UV protection</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Before & After Results - Glass Coating */}
            {service?.slug === 'windshield-glass-coating-new' && (
              <div>
                <h2 className="text-2xl font-semibold text-neon-green mb-6">Glass Coating Results</h2>
                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                  <div className="mb-8">
                    <div className="relative">
                      <img 
                        src={glassCoating} 
                        alt="Water beading on ceramic coated windshield" 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        COATED GLASS
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">See The Water Repelling Effect</h4>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
                      <iframe
                        src="https://www.youtube.com/embed/Oak9CKJMz6E"
                        title="Glass Coating Water Repelling Demo - P91 Car Care"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-blue-400">
                      <Check className="w-5 h-5" />
                      <span>Water slides off instantly</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-400">
                      <Check className="w-5 h-5" />
                      <span>Crystal clear visibility</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-400">
                      <Check className="w-5 h-5" />
                      <span>Lasts up to 12 months</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Why Choose This Service */}
            {service.whyChoose && (
              <div>
                <h2 className="text-2xl font-semibold text-neon-green mb-4">Why Choose This Service?</h2>
                <p className="text-gray-300 leading-relaxed" data-testid="text-why-choose">
                  {service.whyChoose}
                </p>
              </div>
            )}

            {/* What's Included */}
            {service.whatIncluded && service.whatIncluded.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-neon-green mb-4">What You Get</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded.slice(0, Math.ceil(service.whatIncluded.length / 2)).map((item: string, index: number) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index}`}>
                        <Check className="w-5 h-5 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded.slice(Math.ceil(service.whatIncluded.length / 2)).map((item: string, index: number) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index + Math.ceil(service.whatIncluded.length / 2)}`}>
                        <Check className="w-5 h-5 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div>
            <div className="glass-effect rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Book This Service</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white" data-testid="text-sidebar-duration">{durationText}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price:</span>
                  <div className="text-right">
                    {service.originalPrice && (
                      <div className="text-gray-500 line-through text-sm">₹{service.originalPrice}</div>
                    )}
                    <div className="text-neon-green font-bold text-xl" data-testid="text-sidebar-price">
                      ₹{service.price}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-lg py-3"
                onClick={() => setIsBookingModalOpen(true)}
                data-testid="button-book-now"
              >
                Book Now
              </Button>

              <div className="mt-4 text-center text-sm text-gray-400">
                <p>✓ Instant confirmation</p>
                <p>✓ WhatsApp & Email updates</p>
                <p>✓ Secure payment</p>
              </div>
            </div>
          </div>
          
          {/* Mobile Floating Button */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-deep-black via-deep-black/95 to-transparent z-40">
            <Button
              className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 font-bold text-sm sm:text-lg py-4 shadow-2xl rounded-2xl border-2 border-neon-green/30 relative overflow-hidden"
              onClick={() => setIsBookingModalOpen(true)}
              data-testid="button-mobile-book-now"
            >
              <span className="flex items-center justify-center gap-3 relative z-10">
                <span className="text-sm sm:text-base font-bold">Pay ₹299 & Get FREE Voucher</span>
                <span className="text-lg">🎁</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Button>
          </div>
        </div>
      </div>

      <BookingModal 
        service={service} 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </div>
  );
}
