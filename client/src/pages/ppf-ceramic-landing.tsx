import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
// `.lp` styles, shipped in this lazy chunk (see campaign-landing.tsx for the same import
// and why neither lives in main.tsx's global stylesheet anymore).
import "@/styles/landing-pages.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatINR, type ServiceRecord } from "@/lib/canonical-services";
import {
  PPF_CERAMIC_PRICE_SLUGS,
  maxDiscountPercent,
  resolveCataloguePrice,
  type CataloguePrice,
} from "@/lib/ppf-ceramic-pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { PPF_CERAMIC_SEO } from "@/lib/static-seo";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import InstagramReels from "@/components/instagram-reels";
import { REELS_FOR_PPF_CERAMIC_PAGE } from "@/lib/instagram-reels";
import { attributionPayload } from "@/lib/attribution";
import { trackLead as trackMetaLead } from "@/lib/meta-pixel";
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
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  vehicleType: z.enum(["car", "bike"]),
  serviceInterest: z.enum(["ppf", "ceramic", "both"]),
  vehicleModel: z.string().optional(),
  message: z.string().optional(),
  /**
   * Honeypot. Rendered but visually hidden and removed from the tab order, so no human
   * ever fills it; automated form-fillers populate every input they find in the DOM.
   *
   * Client-side validation of this field is deliberately absent — the server decides.
   * A bot does not run this schema anyway, and the ONLY purpose of the field here is to
   * exist in the markup so it can be filled.
   */
  website: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

/** A 400 from the lead endpoint, carrying per-field messages. */
class LeadValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = "LeadValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/** A 429 from the lead endpoint. Carries the server's own wording, which names the phone number. */
class LeadRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadRateLimitError";
  }
}

/**
 * POST a lead and translate the response into typed errors.
 *
 * Not using `apiRequest`: that helper throws `new Error("400: <raw body>")`, which turns
 * the server's structured `fieldErrors` into an unparsed string in a toast. The server now
 * validates every field, so the form has to be able to say WHICH field was wrong —
 * otherwise stricter validation just means more customers seeing a generic failure with
 * no way to fix it, and a lead lost for a mistyped email.
 *
 * Frontend validation is not trusted or relied upon; this exists to surface the SERVER's
 * verdict, which is the authoritative one.
 */
async function postLead(payload: Record<string, unknown>): Promise<unknown> {
  const res = await fetch("/api/ppf-leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (res.ok) return res.json();

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body; fall through to the generic message below */
  }

  if (res.status === 400 && body?.fieldErrors) {
    throw new LeadValidationError(body.message ?? "Please check the form.", body.fieldErrors);
  }
  if (res.status === 429) {
    throw new LeadRateLimitError(body?.message ?? "Too many requests. Please try again shortly.");
  }
  throw new Error(body?.message ?? `Request failed (${res.status})`);
}

/**
 * One hero price tile. Every figure comes from `pricing`, a live catalogue row; when there
 * is no row the tile says so instead of showing a number the booking flow would not charge.
 */
function HeroPriceTile({
  label,
  pricing,
  loading,
  popular = false,
  testId,
}: {
  label: string;
  pricing: CataloguePrice | null;
  loading: boolean;
  popular?: boolean;
  testId: string;
}) {
  return (
    <div
      className="relative overflow-hidden text-center"
      style={{
        borderRadius: 10,
        padding: 12,
        background: popular ? "var(--neon-soft)" : "var(--dark-gray)",
        border: popular ? "1px solid var(--neon-green)" : "1px solid var(--medium-gray)",
      }}
      data-testid={testId}
    >
      {popular ? (
        <div className="absolute top-0 right-0" style={{ background: "var(--neon-green)", color: "#04120A", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "0 0 0 8px" }}>POPULAR</div>
      ) : pricing && pricing.discountPercent > 0 ? (
        <div className="absolute top-0 right-0" style={{ background: "#B4232F", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "0 0 0 8px" }}>{pricing.discountPercent}% OFF</div>
      ) : null}
      {pricing?.originalPrice ? (
        <div style={{ fontSize: 12, color: "var(--txt-3)", textDecoration: "line-through" }} data-testid={`${testId}-was`}>
          {formatINR(pricing.originalPrice)}
        </div>
      ) : (
        // Holds the row height so tiles with and without a struck-through price stay aligned.
        <div className="text-xs" aria-hidden="true">{" "}</div>
      )}
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--neon-green)" }} data-testid={`${testId}-price`}>
        {pricing ? formatINR(pricing.price) : loading ? "…" : "On request"}
      </div>
      <div style={{ fontSize: 12, color: "var(--txt-3)" }}>{label}</div>
    </div>
  );
}


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
    // Shared with scripts/prerender.mjs, whose copy had drifted ("get a quote").
    title: PPF_CERAMIC_SEO.title,
    description: PPF_CERAMIC_SEO.description,
    image: "/Car Care (4)_1753951564515.png",
  });

  // Same query, same rows as the campaign landing pages and BookingModal. Nothing on this
  // page carries its own rupee figure; see lib/ppf-ceramic-pricing.ts.
  const { data: services, isLoading: pricesLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });
  const priceFor = (slug: string | null) => (slug ? resolveCataloguePrice(services, slug) : null);
  const bestDiscount = maxDiscountPercent(Object.values(PPF_CERAMIC_PRICE_SLUGS).map(priceFor));

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
      website: "", // honeypot; see leadFormSchema
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
      website: "", // honeypot; see leadFormSchema
    },
  });

  /**
   * Apply the server's per-field verdict to a react-hook-form instance.
   *
   * Shared by both forms. Unknown field names fall back to a toast rather than being
   * dropped, so a validation rule added on the server can never fail silently in the UI.
   */
  const applyServerErrors = (
    err: unknown,
    setError: (field: any, error: { type: string; message: string }) => void,
    knownFields: string[],
  ): boolean => {
    if (!(err instanceof LeadValidationError)) return false;
    let shown = false;
    for (const [field, message] of Object.entries(err.fieldErrors)) {
      if (knownFields.includes(field)) {
        setError(field, { type: "server", message });
        shown = true;
      }
    }
    if (!shown) {
      toast({ title: "Please check the form", description: err.message, variant: "destructive" });
    }
    return true;
  };

  const LEAD_FIELDS = ["name", "email", "phone", "vehicleType", "serviceInterest", "vehicleModel", "message"];

  const submitLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData & { source?: string }) => {
      // Attribution read at submit time from the first-touch store, so a customer who
      // arrived on an ad and filled this in three scrolls later still carries the campaign.
      return await postLead({ ...data, ...attributionPayload() });
    },
    onSuccess: () => {
      setHasSubmitted(true);
      // Meta Lead, deduplicated. The event id is per submission rather than per row,
      // because the honeypot path deliberately returns a null id.
      trackMetaLead({
        eventId: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        service: form.getValues("serviceInterest"),
        vehicleType: form.getValues("vehicleType"),
      });
      toast({
        title: "Thank you!",
        description: "We'll contact you within 24 hours to discuss your requirements.",
      });
      form.reset();
    },
    onError: (err) => {
      if (applyServerErrors(err, form.setError, LEAD_FIELDS)) return;
      toast({
        title: err instanceof LeadRateLimitError ? "Already received" : "Error",
        description:
          err instanceof Error && err.message
            ? err.message
            : "Failed to submit. Please try again or call us directly.",
        variant: err instanceof LeadRateLimitError ? "default" : "destructive",
      });
    },
  });

  const exitLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData & { source?: string }) => {
      return await postLead({ ...data, source: "exit_intent", ...attributionPayload() });
    },
    onSuccess: () => {
      setShowExitPopup(false);
      trackMetaLead({
        eventId: `lead-exit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        service: exitForm.getValues("serviceInterest"),
        vehicleType: exitForm.getValues("vehicleType"),
      });
      toast({
        title: "Free Car Wash Confirmed!",
        description: "We'll contact you to schedule your free car wash at our studio.",
      });
      exitForm.reset();
    },
    onError: (err) => {
      if (applyServerErrors(err, exitForm.setError, LEAD_FIELDS)) return;
      toast({
        title: err instanceof LeadRateLimitError ? "Already received" : "Error",
        description:
          err instanceof Error && err.message ? err.message : "Failed to submit. Please try again.",
        variant: err instanceof LeadRateLimitError ? "default" : "destructive",
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

  // `slug` names the catalogue row behind each card's price and "% off" badge. Bike PPF has
  // no catalogue service, so it carries no slug and shows no price rather than an invented one.
  const pricingCards = [
    {
      title: "PPF - Hatchback",
      slug: PPF_CERAMIC_PRICE_SLUGS.ppfHatchback,
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: false,
    },
    {
      title: "PPF - Sedan",
      slug: PPF_CERAMIC_PRICE_SLUGS.ppfSedan,
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: true,
    },
    {
      title: "PPF - SUV",
      slug: PPF_CERAMIC_PRICE_SLUGS.ppfSuv,
      priceNote: "Full Body",
      warranty: "5-10 Year Warranty",
      features: ["Full body coverage", "Self-healing film", "Stone chip protection", "UV protection", "Hydrophobic surface"],
      icon: Car,
      popular: false,
    },
    {
      title: "PPF for Bikes",
      slug: null,
      priceNote: "Starting from",
      warranty: "5 Year Warranty",
      features: ["Tank & fairing protection", "Self-healing film", "Scratch resistance", "Easy maintenance", "Showroom finish"],
      icon: Bike,
      popular: false,
    },
    {
      title: "Ceramic Coating - Cars",
      slug: PPF_CERAMIC_PRICE_SLUGS.ceramicCar,
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["9H hardness coating", "Hydrophobic effect", "UV protection", "Easy cleaning", "Enhanced gloss"],
      icon: Car,
      popular: false,
    },
    {
      title: "Ceramic Coating - Bikes",
      slug: PPF_CERAMIC_PRICE_SLUGS.ceramicBike,
      priceNote: "Starting from",
      warranty: "1 Year Warranty",
      features: ["Full body coating", "Water beading effect", "Dust repellent", "Color enhancement", "Easy maintenance"],
      icon: Bike,
      popular: false,
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
    { q: "How long does PPF last?", a: "High-quality PPF from brands like STEK and P91 can last 7-10 years with proper care." },
    { q: "Can PPF be removed?", a: "Yes, PPF can be professionally removed without damaging the original paint." },
    { q: "What's the difference between PPF and ceramic coating?", a: "PPF is a physical film that protects against scratches and chips. Ceramic coating is a liquid polymer that provides hydrophobic properties and enhanced shine. For maximum protection, we recommend both." },
    { q: "How long does installation take?", a: "PPF installation typically takes 2-5 days depending on coverage. Ceramic coating takes 1-2 days." },
    { q: "What warranty do you provide?", a: "We provide up to 10-year warranty on PPF with a no-questions-asked replacement policy. If the film fails, we replace it free." },
    // Rewritten: the previous answer claimed "Bangalore's BIGGEST detailing studio",
    // "500+ cars completed" and "the best warranty in the industry" — an unverifiable
    // statistic wrapped in two comparative superlatives. Replaced with what the page
    // can actually stand behind: the named films and coatings, and the studio location.
    { q: "Why choose P91 over others?", a: "We install named-brand films and coatings — STEK and Nasiol, alongside our own P91 Premium PPF — from our studio in Adugodi, Bangalore, and we back PPF with a written replacement warranty." },
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
    { value: "Adugodi", label: "Bangalore Studio" },
    { value: "Warranty", label: "Backed Install" },
  ];

  return (
    <div className="p91x min-h-screen">
      {/*
        The site header, shared with every other page (components/redesign/site-header).
        Book Now still takes the visitor to this page's enquiry form.
      */}
      <SiteHeader onBookNow={scrollToForm} />

      {/* Hero Section with Form — same two-column shape as the other landing templates
          (`.lp-hero-grid`), copy left, an enquiry form (not a photo) fixed-width on the
          right. */}
      <section className="section lp-hero">
        <div className="wrap">
          <div className="lp-hero-grid">
            {/* Hero Content */}
            <div className="lp-hero-copy">
              <div className="flex flex-wrap gap-2" style={{ marginBottom: 14 }}>
                <span className="eyebrow">
                  <Shield className="i" aria-hidden="true" />
                  Premium Protection
                </span>
                {/* The location is the one fact a local customer checks first, so it opens
                    the studio on Google Maps rather than just sitting there as a label. */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eyebrow"
                  style={{ background: "rgba(233,185,73,.12)", borderColor: "rgba(233,185,73,.35)", color: "var(--warn)" }}
                  data-testid="link-studio-map"
                >
                  <MapPin className="i" aria-hidden="true" />
                  Adugodi, Bangalore
                </a>
              </div>

              <h1>
                <span style={{ color: "var(--neon-green)" }}>PPF</span> &amp; <span style={{ color: "var(--neon-green)" }}>Ceramic Coating</span>
                <br />for Cars &amp; Bikes
              </h1>

              <div style={{ borderRadius: 10, border: "1px solid rgba(233,185,73,.4)", background: "linear-gradient(90deg, rgba(233,185,73,.12), rgba(255,150,60,.08))", padding: 16, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--warn)", fontWeight: 700, marginBottom: 8 }}>
                  <Zap className="i" aria-hidden="true" />
                  PAINT PROTECTION SPECIALISTS
                </div>
                <p style={{ color: "var(--txt-2)", fontSize: 14 }}>
                  STEK · Nasiol · P91 Premium PPF | Up to 10-year PPF warranty with no-questions-asked replacement
                </p>
              </div>

              <p className="lp-lede">
                Protect your investment with world-class paint protection.
                We use premium brands including our exclusive <strong style={{ color: "var(--neon-green)" }}>P91 Premium PPF</strong>,
                plus STEK and Nasiol ceramic coating.
              </p>

              {/* Warranty Highlight */}
              <div style={{ borderRadius: 10, border: "2px solid var(--neon-green)", background: "var(--neon-soft)", padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "var(--neon-green)", borderRadius: "50%", padding: 8, flex: "none" }}>
                    <BadgeCheck style={{ width: 24, height: 24, color: "#04120A" }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--neon-green)" }}>No-questions-asked warranty</div>
                    <div style={{ fontSize: 14, color: "var(--txt-2)" }}>
                      If the PPF fails we replace it at no charge, up to 10 years coverage.
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Counter */}
              {/*
                These tiles hold WORDS, not numbers: two columns on mobile so the longest
                word ("Warranty") has room before the type scales up.
              */}
              <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4" style={{ marginBottom: 4 }}>
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="min-w-0 text-center"
                    style={{ borderRadius: 8, border: "1px solid var(--medium-gray)", background: "var(--dark-gray)", padding: 12 }}
                  >
                    <div className="break-words" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: "var(--neon-green)" }}>
                      {stat.value}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12, color: "var(--txt-3)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Discounted Price Cards - PPF by Car Type */}
              <div style={{ marginBottom: 20 }}>
                {/* h2, not h3: this is the first subsection heading after the page's h1,
                    so it must not skip a level. Same inline style as before — the tag
                    changed, not the appearance. */}
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                  PPF Pricing (Full Body) <span style={{ color: "var(--neon-green)", fontSize: 13, fontWeight: 400 }}>- Starts at</span>
                </h2>
                <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 8 }}>
                  <HeroPriceTile label="Hatchback" pricing={priceFor(PPF_CERAMIC_PRICE_SLUGS.ppfHatchback)} loading={pricesLoading} testId="tile-price-ppf-hatchback" />
                  <HeroPriceTile label="Sedan" pricing={priceFor(PPF_CERAMIC_PRICE_SLUGS.ppfSedan)} loading={pricesLoading} popular testId="tile-price-ppf-sedan" />
                  <HeroPriceTile label="SUV" pricing={priceFor(PPF_CERAMIC_PRICE_SLUGS.ppfSuv)} loading={pricesLoading} testId="tile-price-ppf-suv" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <HeroPriceTile label="Bikes PPF" pricing={null} loading={false} testId="tile-price-ppf-bike" />
                  <HeroPriceTile label="Ceramic Cars" pricing={priceFor(PPF_CERAMIC_PRICE_SLUGS.ceramicCar)} loading={pricesLoading} testId="tile-price-ceramic-car" />
                  <HeroPriceTile label="Ceramic Bikes" pricing={priceFor(PPF_CERAMIC_PRICE_SLUGS.ceramicBike)} loading={pricesLoading} testId="tile-price-ceramic-bike" />
                </div>
              </div>

              <div className="hero-facts">
                <span>
                  <Phone className="i" aria-hidden="true" style={{ color: "var(--neon-green)" }} />
                  +91 74066 19191
                </span>
                <span>
                  <MapPin className="i" aria-hidden="true" style={{ color: "var(--neon-green)" }} />
                  Bangalore
                </span>
              </div>
            </div>

            {/* Lead Form */}
            <div id="lead-form" className="card lp-hero-media" style={{ padding: "24px 22px" }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <span className="eyebrow" style={{ background: "rgba(180,35,47,.14)", borderColor: "rgba(180,35,47,.35)", color: "#ff8a95" }}>
                  <Timer className="i" aria-hidden="true" />
                  Limited Slots Available
                </span>
                {/* No heading here: the form's own submit button already says "Book Now"
                    a few inches below, so a heading repeating the same words added nothing —
                    the eyebrow above and the form fields below already say what this card is. */}
                <p style={{ color: "var(--txt-3)", fontSize: 14, marginTop: 10 }}>Our expert will contact you within 24 hours</p>
              </div>

              {hasSubmitted ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ width: 56, height: 56, background: "var(--neon-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <Check style={{ width: 28, height: 28, color: "var(--neon-green)" }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Thank You!</h3>
                  <p style={{ color: "var(--txt-3)" }}>We've received your inquiry. Our team will contact you shortly.</p>
                  <button
                    type="button"
                    onClick={() => setHasSubmitted(false)}
                    className="cta-ghost"
                    style={{ marginTop: 16 }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Honeypot. Hidden from sight, from screen readers and from the tab
                        order, so no human can reach it; form-filling bots populate every
                        input in the DOM. A submission with this filled is discarded by the
                        server, which replies as though it succeeded.

                        Positioned off-screen rather than display:none — some bots skip
                        fields that are not rendered at all. */}
                    <div
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                    >
                      <label htmlFor="website-url">Website (leave blank)</label>
                      <input
                        id="website-url"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        {...form.register("website")}
                      />
                    </div>
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

                    <button
                      type="submit"
                      className="cta-lg"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled={submitLeadMutation.isPending}
                      data-testid="button-submit-lead"
                    >
                      {submitLeadMutation.isPending ? "Submitting..." : "Book Now"}
                      <ChevronRight className="i" aria-hidden="true" />
                    </button>

                    <p style={{ fontSize: 12, color: "var(--txt-3)", textAlign: "center" }}>
                      By submitting, you agree to be contacted by our team. No spam, we promise!
                    </p>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges — the site's own compact trust-strip pattern (`.strip`), same one
          the homepage uses, rather than a page-local imitation of it. */}
      <section className="strip">
        <div className="wrap">
          <div className="row">
            <div className="cell" style={{ textAlign: "center" }}>
              <Shield className="i" aria-hidden="true" style={{ color: "var(--neon-green)", margin: "0 auto 8px" }} />
              <b>10 Year Warranty</b>
              <span>No questions asked</span>
            </div>
            {/* Two tiles here asserted "500+ Happy Customers" and "4.9 Google Rating /
                200+ reviews". Both are withheld pending confirmation against the actual
                Google Business Profile — see the testimonials block for the restore
                procedure. Replaced with the installation facts, so the four-tile row
                keeps its shape and still answers "why trust these people with my paint". */}
            <div className="cell" style={{ textAlign: "center" }}>
              <Users className="i" aria-hidden="true" style={{ color: "var(--neon-green)", margin: "0 auto 8px" }} />
              <b>In-Studio Installation</b>
              <span>Adugodi, Bangalore</span>
            </div>
            <div className="cell" style={{ textAlign: "center" }}>
              <Star className="i" aria-hidden="true" style={{ color: "#E9B949", margin: "0 auto 8px" }} />
              <b>Named-Brand Films</b>
              <span>STEK · Nasiol</span>
            </div>
            <div className="cell" style={{ textAlign: "center" }}>
              <RefreshCcw className="i" aria-hidden="true" style={{ color: "var(--neon-green)", margin: "0 auto 8px" }} />
              <b>Free Replacement</b>
              <span>If PPF fails, we replace</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="section">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <h2>Premium Brands We Use</h2>
            <p style={{ margin: "10px auto 0" }}>
              {/* "the best value protection in India" was an unverifiable comparative
                  claim about the whole market. What is true and checkable is that this
                  is our own film, sold alongside the named third-party brands below. */}
              Including our own <span style={{ color: "var(--neon-green)", fontWeight: 700 }}>P91 Premium PPF</span>, alongside the brands below
            </p>
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            {/* PPF Brands */}
            <div className="card" style={{ flex: 1, padding: "22px 24px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--neon-green)", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <Shield className="i" aria-hidden="true" />
                Paint Protection Film (PPF)
              </h3>
              <div className="flex flex-col gap-3">
                {ppfBrands.map((brand) => (
                  <div
                    key={brand.name}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 10,
                      background: brand.highlight ? "var(--neon-soft)" : "var(--deep-black)",
                      border: brand.highlight ? "1px solid var(--neon-green)" : "1px solid var(--medium-gray)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {brand.highlight && (
                        <span style={{ background: "var(--neon-green)", color: "#04120A", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 4 }}>
                          {brand.badge}
                        </span>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15.5, color: brand.highlight ? "var(--neon-green)" : "var(--txt)" }}>
                          {brand.name}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--txt-3)" }}>{brand.description}</div>
                      </div>
                    </div>
                    <div style={{ color: "var(--neon-green)", fontWeight: 600, fontSize: 13 }}>{brand.warranty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ceramic Brands */}
            <div className="card" style={{ flex: 1, padding: "22px 24px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--neon-green)", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <Sparkles className="i" aria-hidden="true" />
                Ceramic Coating
              </h3>
              <div className="flex flex-col gap-3">
                {ceramicBrands.map((brand) => (
                  <div key={brand.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 10, background: "var(--deep-black)", border: "1px solid var(--medium-gray)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15.5 }}>{brand.name}</div>
                      <div style={{ fontSize: 13, color: "var(--txt-3)" }}>{brand.description}</div>
                    </div>
                    <div style={{ color: "var(--neon-green)", fontWeight: 600, fontSize: 13 }}>{brand.warranty}</div>
                  </div>
                ))}
                <p style={{ padding: 14, borderRadius: 10, background: "var(--neon-soft)", border: "1px solid var(--neon-line)", fontSize: 13.5, color: "var(--txt-2)" }}>
                  <strong style={{ color: "var(--neon-green)" }}>Pro Tip:</strong> Combine PPF + Ceramic Coating for ultimate protection and shine!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Completed Works Gallery */}
      <section className="section">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <h2>Our Recent Work</h2>
            <p style={{ margin: "10px auto 0" }}>
              Check out some of the premium vehicles we've protected at our studio
            </p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {completedWorks.map((work, idx) => (
              <div key={idx} className="card-img" style={{ position: "relative" }}>
                <ImageWithFallback
                  src={work.image}
                  alt={work.vehicle}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  style={{ aspectRatio: "3 / 4", objectPosition: "top" }}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, background: "linear-gradient(to top, rgba(0,0,0,.85), transparent)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <BadgeCheck style={{ width: 12, height: 12, color: "var(--neon-green)" }} aria-hidden="true" />
                    <span style={{ color: "var(--neon-green)", fontSize: 11, fontWeight: 600 }}>{work.service}</span>
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{work.vehicle}</h3>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            {/* Was "And 500+ more vehicles protected!" — an unverified count. */}
            <p style={{ color: "var(--txt-3)", marginBottom: 16 }}>Recent work from our Adugodi studio.</p>
            <button type="button" onClick={scrollToForm} className="cta-lg">
              Get Your Vehicle Protected
              <ChevronRight className="i" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/*
        Was seven YouTube shorts ("PPF Protection Demo 1"…) that were never confirmed to be the
        studio's own work. The studio asked for its own Instagram videos instead; these are
        its reels, verified in lib/instagram-reels.ts.
      */}
      <InstagramReels
        reels={REELS_FOR_PPF_CERAMIC_PAGE}
        heading="See PPF & Ceramic in Action"
        intro="Real work from our Adugodi studio, straight from our Instagram."
      />

      {/* Pricing Section */}
      <section className="section">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <span className="eyebrow" style={{ background: "rgba(180,35,47,.14)", borderColor: "rgba(180,35,47,.35)", color: "#ff8a95" }}>
              <Timer className="i" aria-hidden="true" />
              Limited Time Offer{bestDiscount > 0 ? ` - Up to ${bestDiscount}% OFF` : ""}
            </span>
            <h2 style={{ marginTop: 14 }}>Transparent Pricing</h2>
            <p style={{ margin: "10px auto 0" }}>
              All prices include professional installation and warranty. These are DISCOUNTED rates for a limited time only!
            </p>
          </div>

          <div className="grid">
            {pricingCards.map((card) => {
              const pricing = priceFor(card.slug);
              return (
              <div
                key={card.title}
                className="card"
                style={{
                  position: "relative", padding: "22px 20px",
                  ...(card.popular ? { background: "var(--neon-soft)", borderColor: "var(--neon-green)" } : {}),
                }}
              >
                {card.popular && (
                  <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--neon-green)", color: "#04120A", padding: "4px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
                    Most Popular
                  </span>
                )}

                {pricing && pricing.discountPercent > 0 && (
                  <span className="card-save" style={{ position: "absolute", top: 10, right: 10 }}>
                    {pricing.discountPercent}% OFF
                  </span>
                )}

                <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 8 }}>
                  <card.icon style={{ width: 40, height: 40, color: card.popular ? "var(--neon-green)" : "var(--txt-3)", margin: "0 auto 12px" }} aria-hidden="true" />
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{card.title}</h3>
                  <div style={{ marginTop: 12 }} data-testid={`price-card-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {pricing ? (
                      <div className="cta-price" style={{ justifyContent: "center" }}>
                        {pricing.originalPrice !== null && (
                          <span className="cta-price-was">{formatINR(pricing.originalPrice)}</span>
                        )}
                        <span className="cta-price-now">{formatINR(pricing.price)}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--neon-green)" }}>
                        {card.slug && pricesLoading ? "…" : "Price on request"}
                      </span>
                    )}
                    <span style={{ display: "block", fontSize: 13, color: "var(--txt-3)", marginTop: 4 }}>{card.priceNote}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--neon-green)", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <BadgeCheck className="i" aria-hidden="true" />
                    {card.warranty}
                  </div>
                </div>

                <ul style={{ marginBottom: 20 }}>
                  {card.features.map((feature, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--txt-2)", marginBottom: 10 }}>
                      <Check className="i" aria-hidden="true" style={{ color: "var(--neon-green)", flex: "none" }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={scrollToForm}
                  className={card.popular ? "btn-book" : "cta-ghost"}
                  style={{ width: "100%", justifyContent: "center" }}
                  data-testid={`button-pricing-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  Book Now
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section — `.lp-benefits`: deliberately not cards, same as every other
          landing template on the site. */}
      <section className="section">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <h2>Why PPF &amp; Ceramic Coating?</h2>
            <p style={{ margin: "10px auto 0" }}>
              Protect your vehicle's paint from daily wear and tear while maintaining that showroom shine
            </p>
          </div>

          <div className="lp-benefits">
            {features.map((feature) => (
              <div className="lp-benefit" key={feature.title} style={{ textAlign: "center", borderTop: "none", paddingTop: 0 }}>
                <feature.icon style={{ width: 34, height: 34, color: "var(--neon-green)", margin: "0 auto 12px" }} aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button type="button" onClick={scrollToForm} className="cta-lg" data-testid="button-cta-features">
              Protect Your Vehicle Today
              <ChevronRight className="i" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Full-bleed photo break, XPEL-style: one large real photo as a visual pause, not a
          hero and not another gallery grid — "Our Recent Work" and the Instagram reels
          above already cover image-led galleries, and everything from "Transparent Pricing"
          through "Why PPF & Ceramic Coating?" is text/icon-only, so this is where the page
          currently has the longest photo-free stretch. Reuses a real, already-approved P91
          work photo (used elsewhere on the site, e.g. /services) rather than one of the
          Our Recent Work portrait screenshots already shown above on this same page — no
          new or downloaded image, and no new claim in the overlay text. */}
      <section
        className="section"
        style={{ padding: 0, position: "relative", minHeight: "clamp(260px, 40vw, 420px)", display: "flex", alignItems: "flex-end", overflow: "hidden" }}
        data-testid="section-photo-break"
      >
        <ImageWithFallback
          src="/attached_assets/services/p91-full-ppf-sedan.webp"
          alt="P91 Premium PPF fitted to a sedan at the P91 Car Care studio in Adugodi, Bangalore"
          sizes="100vw"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          data-testid="image-photo-break"
        />
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(9,9,11,.88) 0%, rgba(9,9,11,.35) 45%, transparent 75%)" }}
        />
        <div className="wrap" style={{ position: "relative", zIndex: 1, paddingBlock: 24 }}>
          <p style={{ color: "var(--neon-green)", fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6 }}>
            Adugodi, Bangalore
          </p>
          <h2 style={{ fontSize: "clamp(22px,3.6vw,32px)", fontWeight: 800, textShadow: "0 2px 16px rgba(0,0,0,.6)" }}>
            PPF &amp; Ceramic Coating
          </h2>
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
      <section className="section">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <h2>What Our Customers Say</h2>
          </div>

          <div className="grid">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card">
                <div className="card-body">
                  <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="i" style={{ color: "#E9B949", fill: "#E9B949" }} />
                    ))}
                  </div>
                  <p style={{ color: "var(--txt-2)", fontSize: 13.5, marginBottom: 10 }}>"{testimonial.comment}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, background: "var(--neon-green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#04120A", fontWeight: 700, fontSize: 14 }}>
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{testimonial.name}</div>
                      <div style={{ color: "var(--txt-3)", fontSize: 12 }}>{testimonial.vehicle}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* FAQ Section */}
      <section className="section">
        <div className="wrap narrow">
          <div className="section-head" style={{ textAlign: "center" }}>
            <h2>Frequently Asked Questions</h2>
          </div>

          {/* Native <details>/<summary> disclosure, not a JS-conditional accordion — every
              answer stays in the raw HTML regardless of open/closed state, so this collapses
              by default without hiding anything from a crawler that doesn't run JS. Same
              .lp-faq CSS (incl. the summary/+ icon rules) service-landing.tsx's FAQ already
              uses. */}
          <div className="lp-faqs">
            {faqs.map((faq, idx) => (
              <details className="lp-faq" key={idx}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button type="button" onClick={scrollToForm} className="cta-lg" data-testid="button-cta-faq">
              Still Have Questions? Get Expert Advice
              <ChevronRight className="i" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section">
        <div className="wrap narrow">
          <div className="lp-final">
            <span className="eyebrow">
              <Award className="i" aria-hidden="true" />
              PPF &amp; Ceramic Coating · Adugodi
            </span>
            <h2 style={{ marginTop: 14 }}>Ready to Protect Your Vehicle?</h2>
            <p>
              Book your appointment today. Our team will help you choose the right protection.
            </p>
            <p style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 10, border: "1px solid var(--neon-green)", background: "var(--neon-soft)", padding: 14, textAlign: "left", margin: "0 auto 24px", maxWidth: "56ch" }}>
              <BadgeCheck style={{ width: 22, height: 22, color: "var(--neon-green)", flex: "none" }} aria-hidden="true" />
              <span style={{ color: "var(--neon-green)", fontWeight: 600, fontSize: 14 }}>
                No-questions-asked warranty — if the PPF fails, we replace it at no charge.
              </span>
            </p>
            <div className="hero-cta" style={{ justifyContent: "center" }}>
              <button type="button" onClick={scrollToForm} className="cta-lg" data-testid="button-final-cta">
                Book Now
                <ChevronRight className="i" aria-hidden="true" />
              </button>
              <a href="tel:+917406619191" className="cta-ghost">
                <Phone className="i" aria-hidden="true" /> Call Now
              </a>
              <a
                href="https://wa.me/917406619191?text=Hi%20P91%20Car%20Care!%20I'm%20interested%20in%20PPF%20/%20Ceramic%20Coating.%20Please%20share%20more%20details."
                target="_blank"
                rel="noopener noreferrer"
                className="cta-ghost"
              >
                <SiWhatsapp className="i" aria-hidden="true" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

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
              {/* Honeypot — see the main form for the reasoning. Distinct id, because two
                  elements sharing one id makes the label ambiguous and can confuse the
                  very form-fillers this is meant to catch. */}
              <div
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
              >
                <label htmlFor="website-url-exit">Website (leave blank)</label>
                <input
                  id="website-url-exit"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...exitForm.register("website")}
                />
              </div>
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
                className="bg-[var(--neon-green)] hover:brightness-95 w-full text-black font-bold py-6 rounded-[10px]"
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
