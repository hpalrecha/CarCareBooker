import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/navbar";
import BookingModal from "@/components/booking-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ["/api/services/slug", slug],
    enabled: !!slug,
  });

  // Early return for loading state to prevent type errors
  if (isLoading || !service) {
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

  const durationInHours = Math.floor(service.duration / 60);
  const durationMinutes = service.duration % 60;
  const durationText = durationInHours > 0 
    ? `${durationInHours}${durationMinutes > 0 ? `.${Math.round((durationMinutes / 60) * 10)}` : ''} hours`
    : `${durationMinutes} minutes`;

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
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-deep-black via-deep-black/95 to-transparent z-50">
            <Button
              className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-lg py-4 shadow-2xl"
              onClick={() => setIsBookingModalOpen(true)}
              data-testid="button-mobile-book-now"
            >
              Book Now - ₹{service.price}
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
