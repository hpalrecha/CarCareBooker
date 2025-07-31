import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

export default function Home() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
            alt="Professional car detailing service" 
            className="w-full h-full object-cover opacity-40" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-deep-black/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-12 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="gradient-text">Premium Auto</span><br />
                <span className="text-white">Care Services</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                Professional car detailing, maintenance, and repair services in the heart of Bangalore. 
                Book your appointment online and experience the P91 difference.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-lg px-8 py-4"
                  data-testid="button-book-service"
                >
                  Book Service Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black font-semibold text-lg px-8 py-4"
                  data-testid="button-view-services"
                >
                  View Services
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-neon-green" />
                  <span data-testid="text-location">Adugodi, Bangalore</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-neon-green" />
                  <span data-testid="text-hours">7 Days a Week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-deep-black to-dark-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4" data-testid="text-services-title">
              Our Premium Services
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              From basic maintenance to premium detailing, we offer comprehensive car care services 
              that keep your vehicle looking and performing at its best.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-effect rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-48 bg-medium-gray" />
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-32 bg-medium-gray" />
                      <Skeleton className="h-6 w-16 bg-medium-gray" />
                    </div>
                    <Skeleton className="h-16 w-full bg-medium-gray" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20 bg-medium-gray" />
                      <Skeleton className="h-8 w-20 bg-medium-gray" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              services?.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
              data-testid="button-view-all-services"
            >
              View All Services
            </Button>
          </div>
        </div>
      </section>

      {/* Location & Contact */}
      <section id="contact" className="py-20 bg-deep-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4" data-testid="text-contact-title">
              Visit Our Service Center
            </h2>
            <p className="text-gray-300 text-lg">Located in the heart of Bangalore with easy access and parking</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="glass-effect rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-neon-green" data-testid="text-service-center-title">
                  P91 Car Care Center
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="text-neon-green text-xl mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Address</h4>
                      <p className="text-gray-300" data-testid="text-address">
                        123 Service Road, Adugodi<br />
                        Bangalore, Karnataka 560030
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Clock className="text-neon-green text-xl mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Working Hours</h4>
                      <p className="text-gray-300" data-testid="text-working-hours">
                        Monday - Sunday<br />
                        9:00 AM - 7:00 PM
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Phone className="text-neon-green text-xl mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Contact</h4>
                      <p className="text-gray-300" data-testid="text-contact-info">
                        Phone: +91 98765 43210<br />
                        WhatsApp: +91 98765 43210
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-medium-gray">
                  <Button 
                    className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow"
                    data-testid="button-get-directions"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="glass-effect rounded-2xl p-4 h-96">
              <div className="w-full h-full bg-medium-gray rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin className="h-16 w-16 mx-auto mb-4" />
                  <p>Interactive Map</p>
                  <p className="text-sm">Google Maps Integration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-gray border-t border-medium-gray py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-neon-green rounded-lg flex items-center justify-center">
                  <span className="text-deep-black font-bold text-lg">P91</span>
                </div>
                <span className="text-xl font-bold gradient-text">Car Care</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Professional automotive care services in Bangalore. 
                We bring showroom quality to your doorstep with premium products and expert technicians.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-neon-green mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-neon-green transition-colors">Premium Wash</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Interior Cleaning</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Engine Bay Clean</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Paint Protection</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-neon-green mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-neon-green transition-colors">Booking Help</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Cancellation</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Refund Policy</a></li>
                <li><a href="#" className="hover:text-neon-green transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-medium-gray mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 P91 Car Care. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-neon-green text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-neon-green text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
