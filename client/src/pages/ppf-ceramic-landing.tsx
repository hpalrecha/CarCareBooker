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
  X,
  Gift
} from "lucide-react";
import { Link } from "wouter";

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
    { name: "STEK", description: "Premium self-healing PPF from USA", warranty: "10 Years" },
    { name: "Llumar", description: "Industry leader in paint protection", warranty: "10 Years" },
    { name: "3M", description: "Trusted worldwide protection", warranty: "7 Years" },
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
      priceNote: "Starting from",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: true,
    },
    {
      title: "PPF for Bikes",
      price: "₹5,000",
      priceNote: "Starting from",
      warranty: "5 Year Warranty",
      features: ["Tank & fairing protection", "Self-healing film", "Scratch resistance", "Easy maintenance", "Showroom finish"],
      icon: Bike,
      popular: false,
    },
    {
      title: "Ceramic Coating - Cars",
      price: "₹6,000",
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["9H hardness coating", "Hydrophobic effect", "UV protection", "Easy cleaning", "Enhanced gloss"],
      icon: Car,
      popular: false,
    },
    {
      title: "Ceramic Coating - Bikes",
      price: "₹3,000",
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["Full body coating", "Water beading effect", "Dust repellent", "Color enhancement", "Easy maintenance"],
      icon: Bike,
      popular: false,
    },
  ];

  const testimonials = [
    { name: "Rahul M.", vehicle: "BMW 3 Series", rating: 5, comment: "Got STEK PPF installed. Absolutely premium quality work. My car looks better than showroom!" },
    { name: "Priya K.", vehicle: "Royal Enfield 650", rating: 5, comment: "Ceramic coating on my bike is amazing. Water just slides off and cleaning takes minutes." },
    { name: "Arun S.", vehicle: "Mercedes GLC", rating: 5, comment: "Professional team, clean studio. The 3M PPF installation was flawless." },
  ];

  const faqs = [
    { q: "How long does PPF last?", a: "High-quality PPF from brands like STEK and Llumar can last 7-10 years with proper care." },
    { q: "Can PPF be removed?", a: "Yes, PPF can be professionally removed without damaging the original paint." },
    { q: "What's the difference between PPF and ceramic coating?", a: "PPF is a physical film that protects against scratches and chips. Ceramic coating is a liquid polymer that provides hydrophobic properties and enhanced shine. For maximum protection, we recommend both." },
    { q: "How long does installation take?", a: "PPF installation typically takes 2-5 days depending on coverage. Ceramic coating takes 1-2 days." },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Form */}
      <section className="relative py-12 lg:py-20 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Premium Protection for Your Vehicle
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-green-400">PPF</span> & <span className="text-green-400">Ceramic Coating</span>
                <br />for Cars & Bikes
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Protect your investment with world-class paint protection film and ceramic coating. 
                We use premium brands like <strong>STEK, Llumar, 3M</strong> for PPF and <strong>Nasiol</strong> for ceramic coating.
              </p>

              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-green-400">₹45,000</div>
                  <div className="text-sm text-gray-400">PPF for Cars (Starting)</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-green-400">₹5,000</div>
                  <div className="text-sm text-gray-400">PPF for Bikes (Starting)</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-green-400">₹6,000</div>
                  <div className="text-sm text-gray-400">Ceramic Coating - Cars</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-green-400">₹3,000</div>
                  <div className="text-sm text-gray-400">Ceramic Coating - Bikes</div>
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
            <div id="lead-form" className="bg-gray-900 rounded-2xl p-6 lg:p-8 border border-gray-800 shadow-2xl lg:sticky lg:top-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Get a Free Quote</h2>
                <p className="text-gray-400 mt-2">Fill the form and our expert will contact you within 24 hours</p>
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
                      {submitLeadMutation.isPending ? "Submitting..." : "Get Free Quote"}
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

      {/* Brands Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Premium Brands We Use</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We only work with world-renowned brands to ensure your vehicle gets the best protection available
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
                  <div key={brand.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div>
                      <div className="font-bold text-white text-lg">{brand.name}</div>
                      <div className="text-sm text-gray-400">{brand.description}</div>
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

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the right protection for your vehicle. All prices include professional installation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingCards.map((card) => (
              <div
                key={card.title}
                className={`relative rounded-2xl p-6 border ${
                  card.popular
                    ? "bg-green-500/10 border-green-500"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                {card.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <card.icon className={`w-12 h-12 mx-auto mb-4 ${card.popular ? "text-green-400" : "text-gray-400"}`} />
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-green-400">{card.price}</span>
                    <span className="text-sm text-gray-400 block">{card.priceNote}</span>
                  </div>
                  <div className="text-sm text-green-400 mt-2">{card.warranty}</div>
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
                      : "bg-gray-800 hover:bg-gray-700 text-white"
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
      <section className="py-16 px-4 bg-gray-900">
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

      {/* Before/After Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">See the Difference</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real results from our studio. Every vehicle leaves with showroom-quality finish.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/attached_assets/Why-Ceramic-Coating_1765343151812.jpg"
                alt="PPF Before and After"
                className="w-full h-auto object-cover"
                style={{ objectPosition: 'center bottom', marginTop: '-15%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white">Paint Protection Film Results</h3>
                <p className="text-sm text-gray-300">Self-healing, scratch-resistant, crystal clear protection</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">What Our Customers Say</h3>
              <div className="space-y-6">
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-2">"{testimonial.comment}"</p>
                    <div className="text-sm">
                      <span className="text-white font-medium">{testimonial.name}</span>
                      <span className="text-gray-500"> - {testimonial.vehicle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-900">
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
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Protect Your Vehicle?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get a free quote today. Our experts are ready to help you choose the right protection.
          </p>
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
                className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-6 text-lg"
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
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2025 P91 Car Care. Premium PPF & Ceramic Coating Services in Bangalore.
          </p>
          <div className="mt-4">
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
