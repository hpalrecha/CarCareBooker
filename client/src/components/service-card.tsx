import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: string;
    originalPrice?: string;
    duration: number;
    images?: string[];
    discountText?: string;
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const durationInHours = Math.floor(service.duration / 60);
  const durationMinutes = service.duration % 60;
  const durationText = durationInHours > 0 
    ? `${durationInHours}${durationMinutes > 0 ? `.${Math.round((durationMinutes / 60) * 10)}` : ''} hours`
    : `${durationMinutes} minutes`;

  const discountPercent = service.originalPrice 
    ? Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)
    : 0;

  return (
    <Link href={`/service/${service.slug}`}>
      <div className="group glass-effect rounded-2xl overflow-hidden hover:border-neon-green transition-all duration-300 hover:shadow-lg hover:shadow-neon-green/20 cursor-pointer relative">
        {/* Discount Badge */}
        {service.discountText && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
            {service.discountText}
          </div>
        )}
        
        <img 
          src={service.images?.[0] || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={service.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
          data-testid={`img-service-${service.id}`}
        />
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold group-hover:text-neon-green transition-colors" data-testid={`text-service-title-${service.id}`}>
              {service.title}
            </h3>
            <div className="text-right">
              {service.originalPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 line-through text-sm" data-testid={`text-original-price-${service.id}`}>
                    ₹{service.originalPrice}
                  </span>
                  {discountPercent > 0 && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              )}
              <span className="text-neon-green font-bold text-lg block" data-testid={`text-price-${service.id}`}>
                ₹{service.price}
              </span>
            </div>
          </div>
          <p className="text-gray-400 mb-4 line-clamp-2" data-testid={`text-description-${service.id}`}>
            {service.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center" data-testid={`text-duration-${service.id}`}>
              <Clock className="w-4 h-4 mr-1" />
              {durationText}
            </span>
            <Button 
              className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold group-hover:shadow-lg"
              data-testid={`button-view-service-${service.id}`}
              size="sm"
            >
              View Service
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
