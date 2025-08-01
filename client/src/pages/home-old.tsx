import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ServiceCard from "@/components/service-card";
import BookingCounter from "@/components/booking-counter";
import CountdownTimer from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, Mail, Star, Shield, Users, Zap, CheckCircle, ArrowRight, Award } from "lucide-react";

export default function Home() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Live Booking Counter */}
      <BookingCounter />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
            alt="Professional car detailing service" 
            className="w-full h-full object-cover opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Indicators */}
          <div className="flex justify-center items-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-gray-300">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">2000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">ISO Certified</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Bangalore's #1
            </span><br />
            <span className="text-white">Car Care Service</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional car detailing with <span className="text-green-400 font-semibold">guaranteed satisfaction</span>. 
            Book online in 60 seconds and get your car looking showroom-new.
          </p>

          {/* Countdown Timer */}
          <div className="mb-8 max-w-md mx-auto">
            <CountdownTimer />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg shadow-green-400/25"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-book-service"
            >
              Book Now - Save 30%
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex justify-center items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Free Pickup & Drop</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>100% Satisfaction Guarantee</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span>Same Day Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Banner */}
      <section className="py-6 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="text-white font-bold text-lg">
              🔥 LIMITED TIME: Book today and save up to ₹1000! Only 12 slots left for this week!
            </span>
            <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-600 text-white text-lg px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              MOST POPULAR SERVICES
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Choose Your </span>
              <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Perfect Service
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From quick wash to complete transformation - we have the perfect package for your car's needs
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
          
          {/* Emergency Book Now Section */}
          <div className="text-center mt-16 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              🚨 URGENT: Limited Weekend Slots Available!
            </h3>
            <p className="text-green-100 text-lg mb-6">
              Only <span className="font-bold text-yellow-300">3 slots left</span> for this weekend. 
              Book now before they're gone!
            </p>
            <Button 
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-12 py-4 animate-pulse"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-emergency-book"
            >
              GRAB YOUR SLOT NOW!
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Why 2000+ Customers Trust P91?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're not just another car wash - we're Bangalore's premium car care experts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">100% Guarantee</h3>
              <p className="text-gray-400">Not satisfied? We'll redo it for free</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Same Day Service</h3>
              <p className="text-gray-400">Quick turnaround without compromising quality</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Free Pickup</h3>
              <p className="text-gray-400">We come to you - anywhere in Bangalore</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ISO Certified</h3>
              <p className="text-gray-400">International quality standards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              What Our Customers Say
            </h2>
            <div className="flex justify-center items-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
              <span className="text-2xl font-bold text-yellow-400 ml-2">4.9/5</span>
              <span className="text-gray-400 ml-2">(2000+ reviews)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Amazing service! My car looks brand new. The team was professional and the pickup service was so convenient."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">R</span>
                </div>
                <div>
                  <p className="text-white font-medium">Rajesh Kumar</p>
                  <p className="text-gray-400 text-sm">Koramangala</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Best car wash in Bangalore! The paint protection service is worth every penny. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">P</span>
                </div>
                <div>
                  <p className="text-white font-medium">Priya Sharma</p>
                  <p className="text-gray-400 text-sm">Indiranagar</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Excellent engine bay cleaning! They made my 5-year-old car's engine look factory fresh."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">A</span>
                </div>
                <div>
                  <p className="text-white font-medium">Arjun Mehta</p>
                  <p className="text-gray-400 text-sm">Whitefield</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Car?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join 2000+ satisfied customers who trust P91 for their car care needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-900 text-white font-bold text-xl px-12 py-6"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-final-cta"
            >
              Book Your Service Now
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-6 text-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Free Consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Same Day Service</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>100% Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <footer className="py-12 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">P91 Car Care</h3>
              <p className="text-gray-400">
                Bangalore's premier car detailing and maintenance service center.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span>Adugodi, Bangalore</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Phone className="w-4 h-4 text-green-400" />
                  <span>+91 74066 19191</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4 text-green-400" />
                  <span>info@p91carcare.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Service Hours</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>Mon-Sat: 8AM - 8PM</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>Sunday: 9AM - 6PM</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">© 2024 P91 Car Care. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
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
                        Phone: +91 74066 19191<br />
                        WhatsApp: +91 74066 19191
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
