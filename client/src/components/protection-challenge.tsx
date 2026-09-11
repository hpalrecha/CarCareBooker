import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Droplets, CheckCircle, ArrowLeft, ArrowRight, Phone, Car, Bike } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import BookingModal from "@/components/booking-modal";
import { getAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/meta-pixel";
import { formatINR, type ServiceRecord } from "@/lib/canonical-services";

import glassCoatingImg from "@assets/Before-and-After-Ceramic-Coating-on-Glass (1)_1754028454560.jpg";
import exteriorDetailingAfterImg from "@assets/20241227_164016_1754031651194.jpg";
import ppfImg from "@assets/stock_images/ppf_hero.jpg";
import bikeHeroImg from "@assets/stock_images/bike_ceramic_hero.jpg";

interface ProtectionChallengeProps {
  onBookOverride?: (service: ServiceRecord) => void;
  "data-testid"?: string;
}

type VehicleType = "car" | "bike";
type CarCategory = "hatchback" | "sedan" | "suv";
type BikeCategory = "street" | "superbike" | "cruiser";
type PrimaryGoal = "gloss" | "protection" | "water_spots" | "new_car_look";
type VisualChoice = "water_beading" | "mirror_gloss" | "clear_ppf";

export default function ProtectionChallenge({
  onBookOverride,
  "data-testid": testId = "protection-challenge",
}: ProtectionChallengeProps) {
  const [step, setStep] = useState<number>(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [vehicleCategory, setVehicleCategory] = useState<string>("hatchback");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("gloss");
  const [visualChoice, setVisualChoice] = useState<VisualChoice>("mirror_gloss");

  // Lead capture form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  const bySlug = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    return new Map(list.map((s) => [s.slug, s]));
  }, [services]);

  // Determine recommended service record based on user choices
  const recommendedService: ServiceRecord | undefined = useMemo(() => {
    if (vehicleType === "bike") {
      return bySlug.get("1-year-bike-ceramic-coating") ?? bySlug.get("1-year-ceramic-coating");
    }
    if (primaryGoal === "protection" || visualChoice === "clear_ppf") {
      const slug = `ppf-${vehicleCategory}` as const;
      return bySlug.get(slug) ?? bySlug.get("ppf-hatchback") ?? bySlug.get("1-year-ceramic-coating");
    }
    return bySlug.get("1-year-ceramic-coating");
  }, [vehicleType, vehicleCategory, primaryGoal, visualChoice, bySlug]);

  const priceLabel = formatINR(recommendedService?.price);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const attribution = getAttribution();
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || `${cleanPhone}@customer.p91`,
        vehicleType,
        serviceInterest: recommendedService?.slug?.includes("ppf") ? "ppf" : "ceramic",
        vehicleModel: vehicleCategory,
        message: `Challenge choices: goal=${primaryGoal}, visual=${visualChoice}, rec=${recommendedService?.title ?? "Ceramic"}`,
        source: "protection_challenge",
        ...attribution,
      };

      const res = await fetch("/api/ppf-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit lead");
      }

      const result = await res.json();
      trackLead({
        eventId: `challenge-${result.id || Date.now()}`,
        service: recommendedService?.slug,
        vehicleType,
      });

      setSubmitted(true);
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenBooking = () => {
    if (onBookOverride && recommendedService) {
      onBookOverride(recommendedService);
    } else {
      setBookingModalOpen(true);
    }
  };

  return (
    <section
      className="my-10 rounded-2xl bg-gradient-to-b from-[var(--dark-gray)] to-[#111116] border border-[var(--medium-gray)] p-4 sm:p-8 text-white shadow-2xl relative overflow-hidden"
      id="protection-challenge"
      data-testid={testId}
    >
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[var(--neon-green)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto">
        {/* Header Badge */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold text-[var(--neon-green)] bg-[var(--neon-green)]/10 rounded-full border border-[var(--neon-green)]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Matcher
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">P91 Protection Challenge 🚗</h2>
          <p className="text-xs sm:text-sm text-[var(--txt-2)] mt-1 max-w-md mx-auto">
            Find the exact coating or PPF match for your vehicle in under 60 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        {!submitted && (
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs text-[var(--txt-2)] font-semibold mb-2">
              <span>{step < 5 ? `Step ${step} of 5` : "Final Result"}</span>
              <span>{Math.round((step / 5) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-[var(--medium-gray)]/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--neon-green)] to-emerald-400"
                initial={{ width: "20%" }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Step Container with AnimatePresence */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* STEP 1: Vehicle Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-center text-white">What are you protecting?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[110px] ${
                        vehicleType === "car"
                          ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white shadow-lg"
                          : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500 text-gray-300"
                      }`}
                      onClick={() => {
                        setVehicleType("car");
                        setVehicleCategory("hatchback");
                        handleNext();
                      }}
                      data-testid="challenge-option-car"
                    >
                      <Car className="w-9 h-9 text-[var(--neon-green)]" />
                      <span className="font-bold text-base">Car</span>
                    </button>

                    <button
                      type="button"
                      className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[110px] ${
                        vehicleType === "bike"
                          ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white shadow-lg"
                          : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500 text-gray-300"
                      }`}
                      onClick={() => {
                        setVehicleType("bike");
                        setVehicleCategory("street");
                        handleNext();
                      }}
                      data-testid="challenge-option-bike"
                    >
                      <Bike className="w-9 h-9 text-[var(--neon-green)]" />
                      <span className="font-bold text-base">Motorcycle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Body Type Category */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-center text-white">
                    {vehicleType === "car" ? "Select your car body type:" : "Select your motorcycle style:"}
                  </h3>

                  {vehicleType === "car" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "hatchback", title: "Hatchback", desc: "Swift, i20, Baleno, Altroz" },
                        { key: "sedan", title: "Sedan", desc: "City, Verna, Virtus, Ciaz" },
                        { key: "suv", title: "SUV / Crossover", desc: "Creta, Seltos, Fortuner, XUV700" },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          className={`p-4 rounded-xl border text-left transition-all duration-200 min-h-[90px] flex flex-col justify-between ${
                            vehicleCategory === cat.key
                              ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white"
                              : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500"
                          }`}
                          onClick={() => {
                            setVehicleCategory(cat.key);
                            handleNext();
                          }}
                          data-testid={`challenge-option-${cat.key}`}
                        >
                          <span className="font-bold text-sm">{cat.title}</span>
                          <span className="text-xs text-[var(--txt-2)] mt-1">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "street", title: "Street / Commuter", desc: "Duke, Pulsar, Apache" },
                        { key: "superbike", title: "Sports / Fairing", desc: "Ninja, R15, CBR" },
                        { key: "cruiser", title: "Cruiser / Adventure", desc: "RE Classic, Himalayan, Meteor" },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          className={`p-4 rounded-xl border text-left transition-all duration-200 min-h-[90px] flex flex-col justify-between ${
                            vehicleCategory === cat.key
                              ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white"
                              : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500"
                          }`}
                          onClick={() => {
                            setVehicleCategory(cat.key);
                            handleNext();
                          }}
                          data-testid={`challenge-option-${cat.key}`}
                        >
                          <span className="font-bold text-sm">{cat.title}</span>
                          <span className="text-xs text-[var(--txt-2)] mt-1">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Primary Goal */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-center text-white">What is your primary goal?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "gloss", title: "✨ Mirror Gloss & Shine", desc: "Deep gloss reflection & swirl reduction" },
                      { key: "protection", title: "🛡️ Paint & Scratch Shield", desc: "Protection against stone chips & scratches" },
                      { key: "water_spots", title: "🧼 Borewell Water Resistance", desc: "Prevents hard water spots & makes washing easy" },
                      { key: "new_car_look", title: "💎 Preserve Showroom Value", desc: "Keep factory paint immaculate for resale" },
                    ].map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        className={`p-4 rounded-xl border text-left transition-all duration-200 min-h-[84px] ${
                          primaryGoal === g.key
                            ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white"
                            : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500 text-gray-300"
                        }`}
                        onClick={() => {
                          setPrimaryGoal(g.key as PrimaryGoal);
                          handleNext();
                        }}
                        data-testid={`challenge-goal-${g.key}`}
                      >
                        <span className="font-bold text-sm block leading-snug">{g.title}</span>
                        <span className="text-xs text-[var(--txt-2)] mt-1 block leading-tight">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Interactive Visual Choice */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-center text-white">Which finish would you choose?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: "water_beading",
                        title: "Hydrophobic Water Shield",
                        desc: "Water beads & rolls off instantly",
                        img: glassCoatingImg,
                      },
                      {
                        key: "mirror_gloss",
                        title: "Deep Mirror Gloss",
                        desc: "Machine-corrected showroom shine",
                        img: exteriorDetailingAfterImg,
                      },
                      {
                        key: "clear_ppf",
                        title: "Urethane Armor (PPF)",
                        desc: "Physical shield against chips & scratches",
                        img: vehicleType === "bike" ? bikeHeroImg : ppfImg,
                      },
                    ].map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        className={`rounded-xl border overflow-hidden text-left transition-all duration-200 flex flex-col ${
                          visualChoice === v.key
                            ? "border-[var(--neon-green)] ring-2 ring-[var(--neon-green)]/50 bg-[var(--medium-gray)]"
                            : "border-[var(--medium-gray)] bg-[var(--medium-gray)]/30 hover:border-gray-500"
                        }`}
                        onClick={() => {
                          setVisualChoice(v.key as VisualChoice);
                          handleNext();
                        }}
                        data-testid={`challenge-visual-${v.key}`}
                      >
                        <div className="h-28 w-full relative">
                          <ImageWithFallback src={v.img} alt={v.title} width={300} height={140} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <span className="font-bold text-xs text-white block leading-tight">{v.title}</span>
                          <span className="text-[11px] text-[var(--txt-2)] mt-0.5 block leading-tight">{v.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Lead Capture & Recommendation Preview */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-[var(--dark-gray)] border border-[var(--neon-green)]/30 text-center">
                    <span className="text-xs uppercase font-bold tracking-wider text-[var(--neon-green)]">Your Match Result</span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {recommendedService?.title || "1-Year Ceramic Coating"}
                    </h3>
                    <p className="text-xs text-[var(--txt-2)] mt-1">
                      Based on your vehicle choices, this treatment offers optimal gloss and protection.
                    </p>
                    {priceLabel && (
                      <div className="mt-2 text-lg font-bold text-[var(--neon-green)]">
                        {priceLabel} <span className="text-xs font-normal text-gray-400">(Live Catalogue Price)</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmitLead} className="space-y-3">
                    <p className="text-xs text-center text-gray-300 font-semibold">
                      Unlock your personalized recommendation & book free appointment:
                    </p>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-semibold">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--medium-gray)]/60 border border-[var(--medium-gray)] text-white text-sm focus:border-[var(--neon-green)] focus:outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        data-testid="input-challenge-name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-semibold">10-Digit Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--medium-gray)]/60 border border-[var(--medium-gray)] text-white text-sm focus:border-[var(--neon-green)] focus:outline-none"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        data-testid="input-challenge-phone"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-semibold">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--medium-gray)]/60 border border-[var(--medium-gray)] text-white text-sm focus:border-[var(--neon-green)] focus:outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="input-challenge-email"
                      />
                    </div>

                    {formError && (
                      <p className="text-xs text-red-400 font-semibold text-center" data-testid="text-challenge-error">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="cta-lg w-full py-3.5 text-sm font-extrabold"
                      data-testid="button-submit-challenge-lead"
                    >
                      {isSubmitting ? "Generating Match..." : "Get My Recommendation & Price →"}
                    </button>
                    <p className="text-[11px] text-center text-[var(--txt-2)]">
                      🔒 Booking is free — service charges apply at the studio. No spam.
                    </p>
                  </form>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="flex justify-between items-center pt-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-white px-2 py-1"
                    data-testid="button-challenge-back"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </button>
                ) : (
                  <div />
                )}

                <a
                  href="#services"
                  onClick={handleOpenBooking}
                  className="text-xs text-[var(--neon-green)] hover:underline font-semibold"
                  data-testid="link-challenge-bypass"
                >
                  Already know what you need? Book Free Appointment →
                </a>
              </div>
            </motion.div>
          ) : (
            /* POST-SUBMISSION SUCCESS STATE */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6 space-y-5"
              data-testid="challenge-success"
            >
              <div className="w-14 h-14 bg-[var(--neon-green)]/20 text-[var(--neon-green)] rounded-full flex items-center justify-center mx-auto border border-[var(--neon-green)]/40">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white">You're all set 🎉</h3>
                <p className="text-xs text-[var(--txt-2)] mt-1">
                  We've matched your preferences with our Indiranagar studio catalogue.
                </p>
              </div>

              {recommendedService && (
                <div className="p-4 rounded-xl bg-[var(--medium-gray)]/40 border border-[var(--medium-gray)] text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--neon-green)]">Recommended Match</span>
                    {priceLabel && <span className="text-base font-extrabold text-white">{priceLabel}</span>}
                  </div>
                  <h4 className="text-lg font-bold text-white leading-tight">{recommendedService.title}</h4>
                  <p className="text-xs text-[var(--txt-2)] leading-relaxed">
                    {recommendedService.description || "Machine paint correction & nano-protection tailored for your vehicle."}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleOpenBooking}
                  className="cta-lg w-full sm:w-auto"
                  data-testid="button-challenge-success-book"
                >
                  Book Free Appointment →
                </button>
                <a
                  href="https://wa.me/917406619191"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-ghost w-full sm:w-auto inline-flex items-center justify-center gap-2"
                  data-testid="link-challenge-success-whatsapp"
                >
                  <Phone className="w-4 h-4" /> WhatsApp Us
                </a>
              </div>

              <p className="text-xs text-[var(--txt-2)]">
                💡 <b>Booking is free</b> · Service charges apply at the studio
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking modal instance if opened directly */}
        {recommendedService && (
          <BookingModal
            service={recommendedService}
            isOpen={bookingModalOpen}
            onClose={() => setBookingModalOpen(false)}
            vehicleContext={{
              vehicleType,
              vehicleCategory,
            }}
          />
        )}
      </div>
    </section>
  );
}
