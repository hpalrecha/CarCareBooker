import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import BookingModal from "@/components/booking-modal";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: string;
    originalPrice?: string;
    duration: number;
    images?: string[];
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const durationInHours = Math.floor(service.duration / 60);
  const durationMinutes = service.duration % 60;
  const durationText = durationInHours > 0 
    ? `${durationInHours}${durationMinutes > 0 ? `.${Math.round((durationMinutes / 60) * 10)}` : ''} hours`
    : `${durationMinutes} minutes`;

  return (
    <>
      <div className="group glass-effect rounded-2xl overflow-hidden hover:border-neon-green transition-all duration-300 hover:shadow-lg hover:shadow-neon-green/20">
        <img 
          src={service.images?.[0] || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={service.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
          data-testid={`img-service-${service.id}`}
        />
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold" data-testid={`text-service-title-${service.id}`}>
              {service.title}
            </h3>
            <div className="text-right">
              {service.originalPrice && (
                <span className="text-gray-500 line-through text-sm" data-testid={`text-original-price-${service.id}`}>
                  ₹{service.originalPrice}
                </span>
              )}
              <span className="text-neon-green font-bold text-lg ml-2" data-testid={`text-price-${service.id}`}>
                ₹{service.price}
              </span>
            </div>
          </div>
          <p className="text-gray-400 mb-4" data-testid={`text-description-${service.id}`}>
            {service.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center" data-testid={`text-duration-${service.id}`}>
              <Clock className="w-4 h-4 mr-1" />
              {durationText}
            </span>
            <Button 
              className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold"
              onClick={() => setIsModalOpen(true)}
              data-testid={`button-book-${service.id}`}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <BookingModal 
        service={service} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
