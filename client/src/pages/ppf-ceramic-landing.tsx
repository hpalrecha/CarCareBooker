import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Sparkles, 
  Car, 
  Bike, 
  Check, 
  Star, 
  Award, 
  Clock, 
  Phone, 
  MapPin,
  ChevronRight,
  Gift,
  Users,
  Zap,
  BadgeCheck,
  Timer,
  RefreshCcw
} from "lucide-react";
import { Link } from "wouter";
import p91Logo from "@assets/Car Care (4)_1753951564515.png";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  vehicleType: z.enum(["car", "bike"]),
  serviceInterest: z.enum(["ppf", "ceramic", "both"]),
  vehicleModel: z.string().optional(),
  message: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(23, 59, 59, 999);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-2 justify-center">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Mins" },
        { value: timeLeft.seconds, label: "Secs" }
      ].map((item, idx) => (
        <div key={idx} className="bg-red-600 rounded-lg p-2 min-w-[50px] text-center">
          <div className="text-xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
          <div className="text-[10px] text-red-200 uppercase">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function PpfCeramicLanding() {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      vehicleType: "car",
      serviceInterest: "ppf",
      vehicleModel: "",
      message: "",
    },
  });

  const exitForm = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      vehicleType: "car",
      serviceInterest: "ppf",
      vehicleModel: "",
      message: "",
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData & { source?: string }) => {
      return await apiRequest("POST", "/api/ppf-leads", data);
    },
    onSuccess: () => {
      setHasSubmitted(true);
      toast({
        title: "Thank you!",
        description: "We'll contact you within 24 hours to discuss your requirements.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  const exitLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData & { source?: string }) => {
      return await apiRequest("POST", "/api/ppf-leads", { ...data, source: "exit_intent" });
    },
    onSuccess: () => {
      setShowExitPopup(false);
      toast({
        title: "Free Car Wash Confirmed!",
        description: "We'll contact you to schedule your free car wash at our studio.",
      });
      exitForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShown && !hasSubmitted) {
        setShowExitPopup(true);
        setExitIntentShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [exitIntentShown, hasSubmitted]);

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const onSubmit = (data: LeadFormData) => {
    submitLeadMutation.mutate(data);
  };

  const onExitSubmit = (data: LeadFormData) => {
    exitLeadMutation.mutate({ ...data, source: "exit_intent" });
  };

  const ppfBrands = [
    { name: "P91 Premium PPF", description: "Our in-house premium self-healing film", warranty: "7 Years", highlight: true, badge: "EXCLUSIVE" },
    { name: "STEK", description: "Premium self-healing PPF from USA", warranty: "10 Years", highlight: false },
    { name: "Llumar", description: "Industry leader in paint protection", warranty: "10 Years", highlight: false },
    { name: "3M", description: "Trusted worldwide protection", warranty: "7 Years", highlight: false },
  ];

  const ceramicBrands = [
    { name: "Nasiol", description: "Nano-ceramic technology from Turkey", warranty: "1-3 Years" },
  ];

  const features = [
    { icon: Shield, title: "Stone Chip Protection", description: "Guards against road debris and gravel damage" },
    { icon: Sparkles, title: "Self-Healing Technology", description: "Minor scratches disappear with heat" },
    { icon: Award, title: "UV Protection", description: "Prevents paint fading and oxidation" },
    { icon: Clock, title: "Long-lasting Shine", description: "Maintains showroom finish for years" },
  ];

  const pricingCards = [
    {
      title: "PPF for Cars",
      price: "₹45,000",
      originalPrice: "₹65,000",
      priceNote: "Starting from",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: true,
      discount: "30% OFF"
    },
    {
      title: "PPF for Bikes",
      price: "₹5,000",
      originalPrice: "₹8,000",
      priceNote: "Starting from",
      warranty: "5 Year Warranty",
      features: ["Tank & fairing protection", "Self-healing film", "Scratch resistance", "Easy maintenance", "Showroom finish"],
      icon: Bike,
      popular: false,
      discount: "37% OFF"
    },
    {
      title: "Ceramic Coating - Cars",
      price: "₹6,000",
      originalPrice: "₹9,000",
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["9H hardness coating", "Hydrophobic effect", "UV protection", "Easy cleaning", "Enhanced gloss"],
      icon: Car,
      popular: false,
      discount: "33% OFF"
    },
    {
      title: "Ceramic Coating - Bikes",
      price: "₹3,000",
      originalPrice: "₹5,000",
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["Full body coating", "Water beading effect", "Dust repellent", "Color enhancement", "Easy maintenance"],
      icon: Bike,
      popular: false,
      discount: "40% OFF"
    },
  ];

  const testimonials = [
    { name: "Deepak Jain", vehicle: "PPF Customer", rating: 5, comment: "Absolute professional in what they do, got PPF job done on my car, has come out amazing. Thank you Hitesh and Nikhil, referred to everyone." },
    { name: "Syed Najeeb", vehicle: "Car Polishing", rating: 5, comment: "Car polishing has done very good, my car has turned as a showroom one. People must visit!" },
    { name: "Anto Alex", vehicle: "Windshield Service", rating: 5, comment: "It was an amazing experience, got my scratches from my windshield off. Thank you team." },
    { name: "Prem Chuluka", vehicle: "Detailing Customer", rating: 5, comment: "Staff and management were extremely professional, the quality of work was great and completed within committed timelines." },
    { name: "Darshan Raam", vehicle: "Ford Owner", rating: 5, comment: "Had the Windshield Scrubbing and Polishing done to remove the minor scratches and scrubbing marks. Excellent results!" },
    { name: "malik rehan", vehicle: "Windshield Service", rating: 5, comment: "This place is just awesome, they did more than what I asked for and removed marks from my car's windshield that no other place could. Just awesome!" },
    { name: "Naveen Kumar", vehicle: "Maruti Baleno", rating: 5, comment: "I have given my Baleno for ceramic coating in P91 car care, the work is excellent with good finishing. Highly recommend P91 car care." },
    { name: "Manoj Arvind", vehicle: "Detailing Customer", rating: 5, comment: "Awesome place to get your car detailing done. The attention to detail is next level." },
    { name: "Mahesh Kumar", vehicle: "Regular Customer", rating: 5, comment: "Very professional service and they use genuine products. Totally satisfied with the services." },
    { name: "Satyam Chaudhary", vehicle: "Glass Coating", rating: 5, comment: "I got my car glass coating and the service was wonderful. Water is flowing down and even without using wiper, road is clearly visible!" },
    { name: "Mohammed Aahad", vehicle: "Windshield Customer", rating: 5, comment: "Very good experience, staff is very friendly. I got my windshield restoration done and would recommend it to others. Just loved the work!" },
    { name: "Rohit Rao", vehicle: "Headlight Restoration", rating: 5, comment: "Nikhil & team did a great job in headlight restoration for my car. They were quick enough & gave a pristine new look. Highly recommend!" },
    { name: "Abhishek Shisodia", vehicle: "PPF & Washing", rating: 5, comment: "Beautiful detailed work! They have the best PPF and washing service in Bangalore!" },
    { name: "Rinesh Xavier", vehicle: "Audi A4", rating: 5, comment: "One of the best in South India. Had a good experience with my Audi A4 for windshield cleaning and polishing." },
    { name: "Arya Mohanty", vehicle: "MG Hector", rating: 5, comment: "I took my MG Hector for interior deep cleaning and I am very satisfied with their service. Highly recommended!" },
    { name: "Arijit Basu", vehicle: "Full Service", rating: 5, comment: "Highly recommended! Very nicely done car external polishing and full interior cleaning. Satisfied with their work and behavior." },
    { name: "jithu m", vehicle: "PPF Customer", rating: 5, comment: "I got PPF done for my car, must say real professional work at affordable pricing. Contact Mr Hitesh and Mr Vishal, they are amazing!" },
    { name: "Kamal Gaur", vehicle: "Premium Service", rating: 5, comment: "Exceptional service, thoughtful team — highly recommended." },
    { name: "Mohan Kumar Dk", vehicle: "Budget Friendly", rating: 5, comment: "Excellent service and value for money, moreover it's budget friendly. I'm really satisfied with their work." },
    { name: "USDOT Logistics", vehicle: "Impressed Customer", rating: 5, comment: "It's really tough job to maintain 4.9 on Google but they really deserve this!" },
    { name: "Fuzail Mohammed", vehicle: "Car Service", rating: 5, comment: "I recently had my car serviced at P91 and I'm extremely satisfied with the experience. The staff were professional!" },
    { name: "Mohammed Asif Suhaib", vehicle: "Regular Customer", rating: 5, comment: "Loved the service! They WhatsApp the status of the wash. Mr. Nikhil was super helpful in doubt clearance." },
  ];

  const completedWorks = [
    { vehicle: "Mercedes GLC 300", service: "Full Body PPF", image: "/attached_assets/Why-Ceramic-Coating_1765343151812.jpg" },
    { vehicle: "BMW 5 Series", service: "Ceramic Coating", image: "/attached_assets/ceramic-coating-in-Attention-2-Detail-Griffith-In_1759817529138.webp" },
    { vehicle: "Audi Q7", service: "PPF + Ceramic", image: "/attached_assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg" },
    { vehicle: "Range Rover", service: "Premium PPF", image: "/attached_assets/download_1753962041724.jpg" },
    { vehicle: "Porsche Cayenne", service: "Stek PPF", image: "/attached_assets/images (8)_1753962041723.jpg" },
    { vehicle: "Toyota Fortuner", service: "Full Protection", image: "/attached_assets/ff034468a03ea55ea0924270de1e42bd_1754032817032.jpg" },
  ];

  const faqs = [
    { q: "How long does PPF last?", a: "High-quality PPF from brands like STEK, Llumar, and P91 can last 7-10 years with proper care." },
    { q: "Can PPF be removed?", a: "Yes, PPF can be professionally removed without damaging the original paint." },
    { q: "What's the difference between PPF and ceramic coating?", a: "PPF is a physical film that protects against scratches and chips. Ceramic coating is a liquid polymer that provides hydrophobic properties and enhanced shine. For maximum protection, we recommend both." },
    { q: "How long does installation take?", a: "PPF installation typically takes 2-5 days depending on coverage. Ceramic coating takes 1-2 days." },
    { q: "What warranty do you provide?", a: "We provide up to 10-year warranty on PPF with NO QUESTIONS ASKED replacement policy. If the film fails, we replace it FREE!" },
    { q: "Why choose P91 over others?", a: "We are Bangalore's BIGGEST detailing studio with 500+ cars completed, premium brands, and the best warranty in the industry." },
  ];

  const stats = [
    { value: "500+", label: "Cars Protected" },
    { value: "100+", label: "Bikes Covered" },
    { value: "10+", label: "Years Warranty" },
    { value: "4.9", label: "Google Rating" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Banner - Urgency */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Timer className="w-5 h-5 animate-pulse" />
            <span>LIMITED TIME OFFER - UP TO 40% OFF!</span>
          </div>
          <CountdownTimer />
        </div>
      </div>

      {/* Header with Logo */}
      <header className="py-4 px-4 bg-black/90 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={p91Logo} alt="P91 Car Care" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <div className="text-sm text-green-400 font-semibold">Bangalore's Biggest</div>
              <div className="text-xs text-gray-400">Detailing Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+917406619191" className="hidden md:flex items-center gap-2 text-green-400 hover:text-green-300">
              <Phone className="w-4 h-4" />
              +91 74066 19191
            </a>
            <Button onClick={scrollToForm} className="bg-green-500 hover:bg-green-600 text-black font-bold">
              Get Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Form */}
      <section className="relative py-12 lg:py-20 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Premium Protection
                </div>
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Award className="w-4 h-4" />
                  #1 in Bangalore
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-green-400">PPF</span> & <span className="text-green-400">Ceramic Coating</span>
                <br />for Cars & Bikes
              </h1>

              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                  <Zap className="w-5 h-5" />
                  BANGALORE'S BIGGEST DETAILING STUDIO
                </div>
                <p className="text-gray-300 text-sm">
                  500+ vehicles protected | 10+ years warranty | No questions asked replacement
                </p>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Protect your investment with world-class paint protection. 
                We use premium brands including our exclusive <strong className="text-green-400">P91 Premium PPF</strong>, 
                plus STEK, Llumar, 3M, and Nasiol ceramic coating.
              </p>

              {/* Warranty Highlight */}
              <div className="bg-green-500/10 border-2 border-green-500 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <BadgeCheck className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="font-bold text-green-400 text-lg">NO QUESTIONS ASKED WARRANTY</div>
                    <div className="text-gray-300 text-sm">PPF fails? We REPLACE it FREE. Up to 10 years coverage.</div>
                  </div>
                </div>
              </div>

              {/* Stats Counter */}
              <div className="grid grid-cols-4 gap-2 py-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-2xl lg:text-3xl font-bold text-green-400">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Discounted Price Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">30% OFF</div>
                  <div className="text-sm text-gray-400 line-through">₹65,000</div>
                  <div className="text-2xl font-bold text-green-400">₹45,000</div>
                  <div className="text-xs text-gray-400">PPF for Cars</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">37% OFF</div>
                  <div className="text-sm text-gray-400 line-through">₹8,000</div>
                  <div className="text-2xl font-bold text-green-400">₹5,000</div>
                  <div className="text-xs text-gray-400">PPF for Bikes</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">33% OFF</div>
                  <div className="text-sm text-gray-400 line-through">₹9,000</div>
                  <div className="text-2xl font-bold text-green-400">₹6,000</div>
                  <div className="text-xs text-gray-400">Ceramic - Cars</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">40% OFF</div>
                  <div className="text-sm text-gray-400 line-through">₹5,000</div>
                  <div className="text-2xl font-bold text-green-400">₹3,000</div>
                  <div className="text-xs text-gray-400">Ceramic - Bikes</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-400" />
                  +91 74066 19191
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  Bangalore
                </div>
              </div>
            </div>

            {/* Lead Form */}
            <div id="lead-form" className="bg-gray-900 rounded-2xl p-6 lg:p-8 border border-gray-800 shadow-2xl lg:sticky lg:top-24">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium mb-3">
                  <Timer className="w-3 h-3" />
                  Limited Slots Available
                </div>
                <h2 className="text-2xl font-bold text-white">Get a Free Quote</h2>
                <p className="text-gray-400 mt-2">Our expert will contact you within 24 hours</p>
              </div>

              {hasSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                  <p className="text-gray-400">We've received your inquiry. Our team will contact you shortly.</p>
                  <Button
                    onClick={() => setHasSubmitted(false)}
                    variant="outline"
                    className="mt-4"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 XXXXX XXXXX" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vehicle-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="bike">Bike</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serviceInterest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Interest *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-service-interest">
                                  <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ppf">PPF</SelectItem>
                                <SelectItem value="ceramic">Ceramic Coating</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BMW 3 Series, Royal Enfield 650" {...field} data-testid="input-vehicle-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us more about your requirements..." {...field} data-testid="textarea-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6 text-lg"
                      disabled={submitLeadMutation.isPending}
                      data-testid="button-submit-lead"
                    >
                      {submitLeadMutation.isPending ? "Submitting..." : "Get Free Quote Now"}
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By submitting, you agree to be contacted by our team. No spam, we promise!
                    </p>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-4 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-green-400" />
              <div className="text-sm font-medium text-white">10 Year Warranty</div>
              <div className="text-xs text-gray-400">No questions asked</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-green-400" />
              <div className="text-sm font-medium text-white">500+ Happy Customers</div>
              <div className="text-xs text-gray-400">And counting</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <div className="text-sm font-medium text-white">4.9 Google Rating</div>
              <div className="text-xs text-gray-400">200+ reviews</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RefreshCcw className="w-8 h-8 text-green-400" />
              <div className="text-sm font-medium text-white">Free Replacement</div>
              <div className="text-xs text-gray-400">If PPF fails, we replace</div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Premium Brands We Use</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Including our exclusive <span className="text-green-400 font-bold">P91 Premium PPF</span> - the best value protection in India
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PPF Brands */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Paint Protection Film (PPF)
              </h3>
              <div className="space-y-4">
                {ppfBrands.map((brand) => (
                  <div 
                    key={brand.name} 
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      brand.highlight 
                        ? "bg-green-500/20 border-2 border-green-500" 
                        : "bg-gray-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {brand.highlight && (
                        <div className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                          {brand.badge}
                        </div>
                      )}
                      <div>
                        <div className={`font-bold text-lg ${brand.highlight ? "text-green-400" : "text-white"}`}>
                          {brand.name}
                        </div>
                        <div className="text-sm text-gray-400">{brand.description}</div>
                      </div>
                    </div>
                    <div className="text-green-400 font-medium text-sm">{brand.warranty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ceramic Brands */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Ceramic Coating
              </h3>
              <div className="space-y-4">
                {ceramicBrands.map((brand) => (
                  <div key={brand.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div>
                      <div className="font-bold text-white text-lg">{brand.name}</div>
                      <div className="text-sm text-gray-400">{brand.description}</div>
                    </div>
                    <div className="text-green-400 font-medium text-sm">{brand.warranty}</div>
                  </div>
                ))}
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                  <p className="text-sm text-gray-300">
                    <strong className="text-green-400">Pro Tip:</strong> Combine PPF + Ceramic Coating for ultimate protection and shine!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
              data-testid="button-cta-brands"
            >
              Get Quote for Your Vehicle
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Completed Works Gallery */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Recent Work</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Check out some of the premium vehicles we've protected at our studio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedWorks.map((work, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-2xl overflow-hidden border border-gray-800 hover:border-green-500 transition-all"
              >
                <img
                  src={work.image}
                  alt={work.vehicle}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BadgeCheck className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">{work.service}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{work.vehicle}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400 mb-4">And 500+ more vehicles protected!</p>
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
            >
              Get Your Vehicle Protected
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Timer className="w-4 h-4" />
              Limited Time Offer - Up to 40% OFF
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              All prices include professional installation and warranty. These are DISCOUNTED rates for a limited time only!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingCards.map((card) => (
              <div
                key={card.title}
                className={`relative rounded-2xl p-6 border ${
                  card.popular
                    ? "bg-green-500/10 border-green-500"
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                {card.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {card.discount}
                  </span>
                </div>
                
                <div className="text-center mb-6 pt-4">
                  <card.icon className={`w-12 h-12 mx-auto mb-4 ${card.popular ? "text-green-400" : "text-gray-400"}`} />
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <div className="mt-4">
                    <span className="text-lg text-gray-500 line-through">{card.originalPrice}</span>
                    <span className="text-3xl font-bold text-green-400 ml-2">{card.price}</span>
                    <span className="text-sm text-gray-400 block">{card.priceNote}</span>
                  </div>
                  <div className="text-sm text-green-400 mt-2 flex items-center justify-center gap-1">
                    <BadgeCheck className="w-4 h-4" />
                    {card.warranty}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {card.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={scrollToForm}
                  className={`w-full ${
                    card.popular
                      ? "bg-green-500 hover:bg-green-600 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                  data-testid={`button-pricing-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  Get Quote
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why PPF & Ceramic Coating?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Protect your vehicle's paint from daily wear and tear while maintaining that showroom shine
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
                <feature.icon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
              data-testid="button-cta-features"
            >
              Protect Your Vehicle Today
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Reviews Section - 20+ reviews */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              <span className="text-4xl font-bold text-white">4.9</span>
              <span className="text-gray-400 text-lg">/ 5.0</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              200+ verified reviews from happy customers across Bangalore
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto pr-2">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx} 
                className="bg-gray-800/50 rounded-xl p-5 border border-gray-700"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-3 text-sm">"{testimonial.comment}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{testimonial.name}</div>
                    <div className="text-gray-500 text-xs">{testimonial.vehicle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
            >
              Join 500+ Happy Customers
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
              data-testid="button-cta-faq"
            >
              Still Have Questions? Get Expert Advice
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-900/30 to-green-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            Bangalore's #1 Detailing Studio
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Protect Your Vehicle?</h2>
          <p className="text-xl text-gray-300 mb-4">
            Get a free quote today. Our experts are ready to help you choose the right protection.
          </p>
          <div className="bg-green-500/10 border border-green-500 rounded-xl p-4 mb-8 inline-block">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-green-400" />
              <span className="text-green-400 font-bold">NO QUESTIONS ASKED WARRANTY - We Replace FREE if PPF Fails!</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
              data-testid="button-final-cta"
            >
              Get Free Quote
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <a href="tel:+917406619191">
              <Button
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-6 text-lg w-full sm:w-auto"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call Now: +91 74066 19191
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={p91Logo} alt="P91 Car Care" className="h-10 w-auto" />
              <div>
                <div className="text-sm font-bold text-white">P91 Car Care</div>
                <div className="text-xs text-gray-400">Bangalore's Biggest Detailing Studio</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center">
              © 2025 P91 Car Care. Premium PPF & Ceramic Coating Services in Bangalore.
            </p>
            <Link href="/" className="text-green-400 hover:underline text-sm">
              Back to P91 Car Care Home
            </Link>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <Dialog open={showExitPopup} onOpenChange={setShowExitPopup}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Gift className="w-8 h-8 text-green-400" />
              Wait! Free Car Wash Offer
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Don't leave empty-handed! Fill this form and get a <strong className="text-green-400">FREE Premium Car Wash</strong> worth ₹599 at our studio!
            </DialogDescription>
          </DialogHeader>

          <Form {...exitForm}>
            <form onSubmit={exitForm.handleSubmit(onExitSubmit)} className="space-y-4">
              <FormField
                control={exitForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} data-testid="exit-input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={exitForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 XXXXX XXXXX" {...field} data-testid="exit-input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={exitForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} data-testid="exit-input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={exitForm.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="exit-select-vehicle">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={exitForm.control}
                  name="serviceInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="exit-select-interest">
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ppf">PPF</SelectItem>
                          <SelectItem value="ceramic">Ceramic</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6"
                disabled={exitLeadMutation.isPending}
                data-testid="button-exit-submit"
              >
                {exitLeadMutation.isPending ? "Claiming..." : "Claim Free Car Wash"}
                <Gift className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
