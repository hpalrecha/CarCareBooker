import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ServiceCard from "@/components/service-card";

import CountdownTimer from "@/components/countdown-timer";
import FakeBookingPopup from "@/components/fake-booking-popup";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
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
      <Header />
      {/* Fake Booking Notifications */}
      <FakeBookingPopup />
      
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
              <span className="text-gray-300">Premium Equipment</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Bangalore's #1
            </span><br />
            <span className="text-white">Car Detailing Center</span>
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
              <span>Professional Detailing</span>
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

      {/* Before & After Results Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-600 text-white text-lg px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              PROVEN RESULTS
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">See The </span>
              <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Amazing Transformation
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real results from our professional car detailing services - your car deserves this level of care
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Headlight Restoration Results */}
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Headlight Restoration - Before & After
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="relative">
                  <img 
                    src="/attached_assets/6634a243-60ef-4577-8f2d-0cb377dadc96_1754028199655.webp" 
                    alt="Foggy headlight before restoration" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    BEFORE
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src="/attached_assets/GVXjDlbWcAAoQD1_1754028199653.jpg" 
                    alt="Crystal clear headlight after restoration" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    AFTER
                  </div>
                </div>
              </div>

              {/* Video Section */}
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

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Restores 90% original clarity</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Improves night driving safety</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Long-lasting UV protection</span>
                </div>
              </div>
            </div>

            {/* Glass Coating Results */}
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Windshield Glass Coating Results
              </h3>
              
              <div className="mb-8">
                <div className="relative">
                  <img 
                    src="/attached_assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg" 
                    alt="Water beading on ceramic coated windshield" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    COATED GLASS
                  </div>
                </div>
              </div>

              {/* Video Section */}
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

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Water slides off instantly</span>
                </div>
                <div className="flex items-center gap-3 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Crystal clear visibility in rain</span>
                </div>
                <div className="flex items-center gap-3 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Lasts up to 12 months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready To Transform Your Car?
            </h3>
            <p className="text-lg text-white/90 mb-6">
              Get the same professional results for your vehicle - book your service today!
            </p>
            <Button 
              size="lg"
              className="bg-white hover:bg-gray-100 text-black font-bold text-xl px-12 py-4"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-book-after-results"
            >
              Book My Service Now
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
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
              From quick detail to complete transformation - we have the perfect package for your car's needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-48 bg-gray-800" />
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-32 bg-gray-800" />
                      <Skeleton className="h-6 w-16 bg-gray-800" />
                    </div>
                    <Skeleton className="h-16 w-full bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20 bg-gray-800" />
                      <Skeleton className="h-8 w-20 bg-gray-800" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              services && Array.isArray(services) && services.map((service: any) => (
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
              We're not just another service - we're Bangalore's premium car detailing experts
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
              <h3 className="text-xl font-bold text-white mb-2">All Bangalore Areas</h3>
              <p className="text-gray-400">Professional detailing across the city</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Expert Technicians</h3>
              <p className="text-gray-400">Certified car detailing specialists</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interior Deep Clean - Full Section Before & After */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              Interior Deep Clean Transformation
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional deep cleaning that transforms stained, worn interiors into pristine condition
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Before Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200"
                  alt="Interior before deep cleaning"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute top-6 left-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  BEFORE
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Worn & Stained Interior</h3>
                    <p className="text-gray-300">Coffee stains, dust buildup, fabric wear, and years of neglect</p>
                  </div>
                </div>
              </div>
              
              {/* After Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=1200"
                  alt="Interior after deep cleaning"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  AFTER
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Pristine & Fresh Interior</h3>
                    <p className="text-gray-300">Deep cleaned, conditioned, and protected like showroom new</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS Divider */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
              <div className="bg-green-400 text-black px-8 py-4 rounded-full font-bold text-2xl shadow-xl border-4 border-white">
                VS
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="space-y-4">
              <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg animate-pulse">
                🔥 SPECIAL OFFER: 60% OFF! 🔥
              </div>
              <div className="text-center">
                <div className="text-gray-400 line-through text-lg mb-2">Original Price: ₹6,250</div>
                <Link href="/service/interior-deep-clean">
                  <Button size="lg" className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg">
                    Get Interior Deep Clean - ₹2,500 ONLY!
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Coating - Full Section Before & After */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              Professional Glass Coating
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Nano-ceramic coating for crystal clear visibility and 6-month water repellent protection
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Before Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200"
                  alt="Glass before coating - water spotted and dirty"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute top-6 left-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  BEFORE
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Dirty & Water Spotted Glass</h3>
                    <p className="text-gray-300">Poor visibility, water spots, grime buildup, and reduced safety</p>
                  </div>
                </div>
              </div>
              
              {/* After Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200"
                  alt="Glass after coating - crystal clear"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  AFTER
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Crystal Clear & Protected</h3>
                    <p className="text-gray-300">Hydrophobic coating, perfect clarity, rain repellent technology</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS Divider */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
              <div className="bg-green-400 text-black px-8 py-4 rounded-full font-bold text-2xl shadow-xl border-4 border-white">
                VS
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="space-y-4">
              <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg animate-pulse">
                🔥 LIMITED TIME: 50% OFF! 🔥
              </div>
              <div className="text-center">
                <div className="text-gray-400 line-through text-lg mb-2">Original Price: ₹6,000</div>
                <Link href="/service/glass-coating">
                  <Button size="lg" className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg">
                    Get Glass Coating - ₹3,000 ONLY!
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Headlight Restoration - Full Section Before & After */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              Headlight Restoration Magic
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional restoration removes oxidation and yellowing for factory-new clarity
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Before Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200"
                  alt="Foggy yellowed headlights before restoration"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute top-6 left-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  BEFORE
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Foggy & Yellowed Headlights</h3>
                    <p className="text-gray-300">Reduced visibility, poor light output, oxidation, safety risk</p>
                  </div>
                </div>
              </div>
              
              {/* After Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1627634777217-c864268db30c?w=1200"
                  alt="Crystal clear restored headlights"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  AFTER
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Crystal Clear & Bright</h3>
                    <p className="text-gray-300">Maximum visibility, like-new appearance, UV protection coating</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS Divider */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
              <div className="bg-green-400 text-black px-8 py-4 rounded-full font-bold text-2xl shadow-xl border-4 border-white">
                VS
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="space-y-4">
              <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg animate-pulse">
                🔥 MEGA DEAL: 70% OFF! 🔥
              </div>
              <div className="text-center">
                <div className="text-gray-400 line-through text-lg mb-2">Original Price: ₹6,000</div>
                <Link href="/service/headlight-restoration">
                  <Button size="lg" className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg">
                    Restore My Headlights - ₹1,800 ONLY!
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Exterior Transformation - Full Section Before & After */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              Complete Exterior Transformation
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Premium wash and detail service that transforms your car from dull to showroom perfect
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Before Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200"
                  alt="Car exterior before premium wash - dirty and dull"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute top-6 left-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  BEFORE
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Dirty & Dull Exterior</h3>
                    <p className="text-gray-300">Road grime, water spots, faded paint, and neglected appearance</p>
                  </div>
                </div>
              </div>
              
              {/* After Image */}
              <div className="relative group overflow-hidden rounded-2xl">
                <img
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200"
                  alt="Car exterior after premium wash - showroom shine"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                  AFTER
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black bg-opacity-80 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white mb-2">Showroom Perfect Shine</h3>
                    <p className="text-gray-300">Mirror finish, protected paint, and lasting showroom shine</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS Divider */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
              <div className="bg-green-400 text-black px-8 py-4 rounded-full font-bold text-2xl shadow-xl border-4 border-white">
                VS
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="space-y-4">
              <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg animate-pulse">
                🔥 SUPER SAVER: 75% OFF! 🔥
              </div>
              <div className="text-center">
                <div className="text-gray-400 line-through text-lg mb-2">Original Price: ₹6,000</div>
                <Link href="/service/premium-wash-detail">
                  <Button size="lg" className="bg-green-400 hover:bg-green-500 text-black font-bold text-xl px-12 py-6 shadow-lg">
                    Get Premium Detail - ₹1,500 ONLY!
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>
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

      <Footer />
    </div>
  );
}