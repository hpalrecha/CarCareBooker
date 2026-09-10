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
import { useSeoMeta } from "@/hooks/use-seo-meta";
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
  RefreshCcw,
  MessageCircle
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
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


export default function PpfCeramicLanding() {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const { toast } = useToast();

  // This page is the largest and most deliberate marketing page in the project, built for
  // the highest-value service, and it declared no title or meta of its own — so in search
  // results and shared links it was indistinguishable from the homepage. Its own title and
  // description let it compete for PPF and ceramic-coating queries on its own terms.
  useSeoMeta({
    title: "Paint Protection Film & Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "PPF and 9H ceramic coating for cars and bikes in Bangalore. See real before-and-after " +
      "work, compare packages, and get a quote from P91 Car Care.",
    image: "/Car Care (4)_1753951564515.png",
  });

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
    { name: "P91 Premium PPF", description: "Our in-house premium self-healing film", warranty: "5 Years", highlight: true, badge: "EXCLUSIVE" },
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
      title: "PPF - Hatchback",
      price: "₹45,000",
      originalPrice: "₹65,000",
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: false,
      discount: "30% OFF"
    },
    {
      title: "PPF - Sedan",
      price: "₹55,000",
      originalPrice: "₹75,000",
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: true,
      discount: "27% OFF"
    },
    {
      title: "PPF - SUV",
      price: "₹65,000",
      originalPrice: "₹90,000",
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: false,
      discount: "28% OFF"
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

  /**
   * WITHHELD PENDING BUSINESS CONFIRMATION — do not repopulate without sign-off.
   *
   * This page previously carried 21 hardcoded testimonials, a "4.9 / 5.0" rating, a
   * "200+ verified reviews" subtitle and a "Join 500+ Happy Customers" CTA. They read
   * like genuine Google reviews — real names, specific services, plausible detail — but
   * none of it is sourced from anything this codebase can verify, and one of the
   * testimonials even cited the 4.9 figure back at itself.
   *
   * This page is about to receive paid Meta traffic. An unverifiable rating or review
   * count on an ad landing page is not just a brief violation, it is advertising-
   * standards exposure, so the claims come down until the business confirms them.
   *
   * TO RESTORE: confirm the rating, the review count and the testimonial text against
   * the actual Google Business Profile, confirm the reviews may be reproduced, then
   * source them from that profile rather than from an array in a source file — a number
   * hardcoded here silently goes stale the day the profile changes.
   *
   * Genuine per-service testimonials entered by an admin (services.testimonials, shown
   * on /service/:slug) are untouched. Those are real business data with a known author.
   */
  const testimonials: { name: string; vehicle: string; rating: number; comment: string }[] = [];

  const completedWorks = [
    { vehicle: "Range Rover Evoque", service: "P91 Premium PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.00_PM_1765537183721.png" },
    { vehicle: "MG Comet EV", service: "Full Body PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.06_PM_1765537183722.png" },
    { vehicle: "Maruti Swift", service: "P91 PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.14_PM_1765537183722.png" },
    { vehicle: "Mercedes GLE", service: "Nasiol Ceramic", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.21_PM_1765537183723.png" },
    { vehicle: "Toyota Innova Hycross", service: "Stek ForceShield PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.27_PM_1765537183723.png" },
    { vehicle: "Nissan GT-R", service: "Stek PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.33_PM_1765537183723.png" },
    { vehicle: "BMW 3 Series", service: "Stek Gloss PPF + Sunfilm", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.40_PM_1765537183724.png" },
    { vehicle: "Mahindra XUV700", service: "Stek PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.28.46_PM_1765537183724.png" },
    { vehicle: "Toyota Vellfire", service: "Stek PPF", image: "/attached_assets/Screenshot_2025-12-12_at_4.29.31_PM_1765537183724.png" },
    { vehicle: "Maruti Baleno", service: "Ceramic Coating", image: "/attached_assets/unnamed_(1)_1765537193655.webp" },
    { vehicle: "Tata Harrier", service: "Full Body PPF", image: "/attached_assets/unnamed_(2)_1765537193656.webp" },
    { vehicle: "Hyundai Creta", service: "Stek PPF", image: "/attached_assets/unnamed_1765537193657.webp" },
  ];

  const faqs = [
    { q: "How long does PPF last?", a: "High-quality PPF from brands like STEK, Llumar, and P91 can last 7-10 years with proper care." },
    { q: "Can PPF be removed?", a: "Yes, PPF can be professionally removed without damaging the original paint." },
    { q: "What's the difference between PPF and ceramic coating?", a: "PPF is a physical film that protects against scratches and chips. Ceramic coating is a liquid polymer that provides hydrophobic properties and enhanced shine. For maximum protection, we recommend both." },
    { q: "How long does installation take?", a: "PPF installation typically takes 2-5 days depending on coverage. Ceramic coating takes 1-2 days." },
    { q: "What warranty do you provide?", a: "We provide up to 10-year warranty on PPF with a no-questions-asked replacement policy. If the film fails, we replace it free." },
    // Rewritten: the previous answer claimed "Bangalore's BIGGEST detailing studio",
    // "500+ cars completed" and "the best warranty in the industry" — an unverifiable
    // statistic wrapped in two comparative superlatives. Replaced with what the page
    // can actually stand behind: the named films and coatings, and the studio location.
    { q: "Why choose P91 over others?", a: "We install named-brand films and coatings — STEK, Llumar, 3M and Nasiol, alongside our own P91 Premium PPF — from our studio in Indiranagar, Bangalore, and we back PPF with a written replacement warranty." },
  ];

  /**
   * Hero trust tiles.
   *
   * Was four counters: "500+ Cars Protected", "100+ Bikes Covered", "10+ Years Warranty",
   * "4.9 Google Rating". Three of those are unverifiable and the fourth restates the
   * warranty already stated twice above it. Replaced with attributes that are true by
   * construction and checkable from this site's own content — the films we name, the
   * vehicles we take, and the confirmed studio address — so the tile row keeps its
   * layout and its job without asserting a number nobody has verified.
   *
   * See the testimonials block above for the restore procedure.
   */
  const stats = [
    { value: "PPF", label: "Films & Coatings" },
    { value: "Car & Bike", label: "Both Serviced" },
    { value: "Indiranagar", label: "Bangalore Studio" },
    { value: "Warranty", label: "Backed Install" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Floating Call & WhatsApp Buttons - Fixed to right side */}
      <div className="fixed right-0 top-32 z-50 flex flex-col gap-0">
        <a 
          href="tel:+917406619191" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-l-lg shadow-lg flex items-center gap-2 transition-all hover:pr-4"
          data-testid="floating-call-btn"
        >
          <Phone className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">Call Now</span>
        </a>
        <a 
          href="https://wa.me/917406619191?text=Hi%20P91%20Car%20Care!%20I'm%20interested%20in%20PPF%20/%20Ceramic%20Coating.%20Please%20share%20more%20details." 
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-3 rounded-l-lg shadow-lg flex items-center gap-2 transition-all hover:pr-4"
          data-testid="floating-whatsapp-btn"
        >
          <SiWhatsapp className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">WhatsApp</span>
        </a>
      </div>

      {/* This banner carried a countdown seeded from `new Date() + 3 days` at page load,
          so the "offer" always expired three days from whenever you happened to visit.
          Countdown removed; restore it only against a real offer end time held in
          configuration. */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Timer className="w-5 h-5" />
            <span>Professional PPF &amp; Ceramic Coating — request a quote today</span>
          </div>
        </div>
      </div>

      {/* Header with Logo */}
      <header className="py-4 px-4 bg-black/90 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={p91Logo} alt="P91 Car Care" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <div className="text-sm text-green-400 font-semibold">P91 Car Care</div>
              <div className="text-xs text-gray-400">Detailing Studio · Indiranagar</div>
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
                {/* Was "#1 in Bangalore" — an unverifiable ranking claim. The studio
                    location is the verifiable fact, and it is the one a local customer
                    clicking an ad actually wants in the first three seconds. */}
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Award className="w-4 h-4" />
                  Indiranagar, Bangalore
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-green-400">PPF</span> & <span className="text-green-400">Ceramic Coating</span>
                <br />for Cars & Bikes
              </h1>

              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/50 rounded-xl p-4">
                {/* Was "BANGALORE'S BIGGEST DETAILING STUDIO" over "500+ vehicles
                    protected | 10+ years warranty | No questions asked replacement".
                    The superlative and the vehicle count are unverified; the warranty
                    terms are a real business commitment and are kept, stated once here
                    rather than repeated as a statistic. */}
                <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                  <Zap className="w-5 h-5" />
                  PAINT PROTECTION SPECIALISTS
                </div>
                <p className="text-gray-300 text-sm">
                  STEK · Llumar · 3M · Nasiol · P91 Premium PPF | Up to 10-year PPF warranty with no-questions-asked replacement
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

              {/* Discounted Price Cards - PPF by Car Type */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">PPF Pricing (Full Body) <span className="text-green-400 text-sm font-normal">- Starts at</span></h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">30% OFF</div>
                    <div className="text-xs text-gray-400 line-through">₹65,000</div>
                    <div className="text-xl font-bold text-green-400">₹45,000</div>
                    <div className="text-xs text-gray-400">Hatchback</div>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-3 border-2 border-green-500 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">POPULAR</div>
                    <div className="text-xs text-gray-400 line-through">₹75,000</div>
                    <div className="text-xl font-bold text-green-400">₹55,000</div>
                    <div className="text-xs text-gray-400">Sedan</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">28% OFF</div>
                    <div className="text-xs text-gray-400 line-through">₹90,000</div>
                    <div className="text-xl font-bold text-green-400">₹65,000</div>
                    <div className="text-xs text-gray-400">SUV</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">37% OFF</div>
                    <div className="text-xs text-gray-400 line-through">₹8,000</div>
                    <div className="text-xl font-bold text-green-400">₹5,000</div>
                    <div className="text-xs text-gray-400">Bikes PPF</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">33% OFF</div>
                    <div className="text-xs text-gray-400 line-through">₹9,000</div>
                    <div className="text-xl font-bold text-green-400">₹6,000</div>
                    <div className="text-xs text-gray-400">Ceramic Cars</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">40% OFF</div>
                    <div className="text-xs text-gray-400 line-through">₹5,000</div>
                    <div className="text-xl font-bold text-green-400">₹3,000</div>
                    <div className="text-xs text-gray-400">Ceramic Bikes</div>
                  </div>
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
                            <Input placeholder="Enter your name" {...field} data-testid="input-name" data-clarity-mask="true" />
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
                              <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" data-clarity-mask="true" />
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
                              <Input placeholder="+91 XXXXX XXXXX" {...field} data-testid="input-phone" data-clarity-mask="true" />
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
                      <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
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
            {/* Two tiles here asserted "500+ Happy Customers" and "4.9 Google Rating /
                200+ reviews". Both are withheld pending confirmation against the actual
                Google Business Profile — see the testimonials block for the restore
                procedure. Replaced with the installation facts, so the four-tile row
                keeps its shape and still answers "why trust these people with my paint". */}
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-green-400" />
              <div className="text-sm font-medium text-white">In-Studio Installation</div>
              <div className="text-xs text-gray-400">Indiranagar, Bangalore</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <div className="text-sm font-medium text-white">Named-Brand Films</div>
              <div className="text-xs text-gray-400">STEK · Llumar · 3M · Nasiol</div>
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
              {/* "the best value protection in India" was an unverifiable comparative
                  claim about the whole market. What is true and checkable is that this
                  is our own film, sold alongside the named third-party brands below. */}
              Including our own <span className="text-green-400 font-bold">P91 Premium PPF</span>, alongside the brands below
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
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
              data-testid="button-cta-brands"
            >
              Get Quote for Your Vehicle
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedWorks.map((work, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-green-500 transition-all aspect-[3/4]"
              >
                <img
                  src={work.image}
                  alt={work.vehicle}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <BadgeCheck className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs font-medium">{work.service}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{work.vehicle}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            {/* Was "And 500+ more vehicles protected!" — an unverified count. */}
            <p className="text-gray-400 mb-4">Recent work from our Indiranagar studio.</p>
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
            >
              Get Your Vehicle Protected
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section - PPF & Ceramic Benefits */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">See PPF & Ceramic in Action</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Watch real-world demonstrations of how PPF and ceramic coating protect your vehicle
            </p>
          </div>

          {/* PPF Benefits Videos */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              PPF Protection - Visual Benefits
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/q1YKI4JCqsY" 
                  title="PPF Protection Demo 1"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/AhjRUqE6lPc" 
                  title="PPF Protection Demo 2"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/8KQfzSqS4IM" 
                  title="PPF Protection Demo 3"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/bMoHlh6W3Sg" 
                  title="PPF Protection Demo 4"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Ceramic Coating Videos */}
          <div>
            <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Ceramic Coating - Long-lasting Effects
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/kzQ5kqFbogY" 
                  title="Ceramic Coating Demo 1"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/IdbBrF7VQ1Q" 
                  title="Ceramic Coating Demo 2"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all">
                <iframe 
                  src="https://www.youtube.com/embed/Do6CQefTRC0" 
                  title="Ceramic Coating Demo 3"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
            >
              Get This Protection for Your Vehicle
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
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
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
              data-testid="button-cta-features"
            >
              Protect Your Vehicle Today
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* Reviews Section.
          Renders ONLY when there are confirmed reviews to show. `testimonials` is
          deliberately empty (see its declaration), so today this section is absent
          rather than showing an empty grid under a heading promising reviews.

          The "4.9 / 5.0" figure and the "200+ verified reviews" subtitle that used to
          head this section are gone with it — an aggregate rating is exactly the kind of
          claim that must come from the Google Business Profile, not from markup. */}
      {testimonials.length > 0 && (
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
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
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
            >
              Book Your Free Appointment
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>
      )}

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
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
              data-testid="button-cta-faq"
            >
              Still Have Questions? Get Expert Advice
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-900/30 to-green-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            PPF &amp; Ceramic Coating · Indiranagar
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Button
              onClick={scrollToForm}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg max-w-full whitespace-normal h-auto"
              data-testid="button-final-cta"
            >
              Get Free Quote
              <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
            <a href="tel:+917406619191">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10 px-8 py-6 text-lg w-full sm:w-auto"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call Now
              </Button>
            </a>
            <a 
              href="https://wa.me/917406619191?text=Hi%20P91%20Car%20Care!%20I'm%20interested%20in%20PPF%20/%20Ceramic%20Coating.%20Please%20share%20more%20details." 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg w-full sm:w-auto"
              >
                <SiWhatsapp className="mr-2 w-5 h-5" />
                WhatsApp Us
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
                <div className="text-xs text-gray-400">Detailing Studio · Indiranagar, Bangalore</div>
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
                      <Input placeholder="Enter your name" {...field} data-testid="exit-input-name" data-clarity-mask="true" />
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
                      <Input placeholder="+91 XXXXX XXXXX" {...field} data-testid="exit-input-phone" data-clarity-mask="true" />
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
                      <Input type="email" placeholder="your@email.com" {...field} data-testid="exit-input-email" data-clarity-mask="true" />
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
