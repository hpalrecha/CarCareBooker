import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import BookingModal from "@/components/booking-modal";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useToast } from "@/hooks/use-toast";
import { attributionPayload } from "@/lib/attribution";
import { trackLead, trackChallengeStart, trackChallengeComplete, trackWhatsAppContinuation } from "@/lib/meta-pixel";
import { formatINR, resolveServiceImage, type ServiceRecord } from "@/lib/canonical-services";
import { resolveCataloguePrice } from "@/lib/ppf-ceramic-pricing";
import {
  CATEGORIES,
  FINISHES,
  GOALS,
  VEHICLES,
  isValidMobile,
  leadMessage,
  recommend,
  type Answers,
} from "@/lib/protection-challenge";
import { ChevronLeft } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

/**
 * The P91 Protection Challenge.
 *
 * Four questions and a recommendation, for the visitor who does not yet know whether they
 * want film or a coating. It is an ALTERNATIVE to booking, never a gate in front of it:
 * every placement renders a direct "Book Free Appointment" beside it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHERE THE NUMBERS COME FROM. The result reads GET /api/services and resolves the
 * recommended slug with resolveCataloguePrice() — the same resolver /ppf-ceramic-coating
 * uses. There is no price in this file, and no fallback figure: an unresolvable service
 * shows "Price on request" and the customer can still book or message the studio.
 *
 * WHY A DIALOG AND NOT A ROUTE. A challenge URL would be a thin indexable page competing
 * with the landing pages it sits on. As a dialog it adds no route, no sitemap entry and no
 * prerendered head.
 *
 * WHAT IT SENDS. The existing POST /api/ppf-leads, with source "protection_challenge" so
 * these leads are countable, and the answers written into `message` — the column that
 * exists for exactly this, rather than a migration for descriptive text.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

/** Exactly ten digits — what the booking form asks for. The server accepts 10-15. */
const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().refine(isValidMobile, "Enter a 10-digit mobile number"),
  email: z.string().trim().email("Please enter a valid email address"),
  /** Honeypot: rendered, hidden from people, filled by form-filling bots. */
  website: z.string().optional(),
});
type LeadValues = z.infer<typeof leadSchema>;

const STEP_COUNT = 5;
const WHATSAPP_NUMBER = "917406619191";

type Step = 0 | 1 | 2 | 3 | 4;

export function ProtectionChallengeDialog({
  open,
  onOpenChange,
  placement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement: string;
}) {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [submitted, setSubmitted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { toast } = useToast();

  /**
   * One id per challenge session, created when the session starts.
   *
   * Every Meta event is deduplicated on its id, so a re-render cannot report a second
   * ChallengeStart or a second ChallengeComplete. A new session (reopening the dialog
   * after a reset) gets a new id, because that genuinely is a second challenge.
   */
  const sessionId = useRef<string>("");
  const newSession = useCallback(() => {
    sessionId.current = `pc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    trackChallengeStart({ eventId: `${sessionId.current}-start`, placement });
  }, [placement]);

  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  const rec = useMemo(
    () =>
      answers.vehicle && answers.category && answers.goal && answers.finish
        ? recommend(answers as Answers)
        : null,
    [answers],
  );

  /** THE service record the customer is being shown, and the one booking receives. */
  const service = useMemo(
    () => (rec?.slug && Array.isArray(services) ? services.find((s) => s.slug === rec.slug) : undefined),
    [rec, services],
  );
  const pricing = useMemo(
    () => (rec?.slug ? resolveCataloguePrice(services, rec.slug) : null),
    [rec, services],
  );

  const form = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", phone: "", email: "", website: "" },
  });

  const submitLead = useMutation({
    mutationFn: async (values: LeadValues) => {
      if (!rec) throw new Error("No recommendation");
      const res = await fetch("/api/ppf-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          website: values.website ?? "",
          vehicleType: rec.vehicleType,
          vehicleModel: rec.vehicleCategory,
          serviceInterest: rec.serviceInterest,
          message: leadMessage(answers as Answers, rec, service?.title?.trim() ?? rec.headline),
          source: "protection_challenge",
          // First-touch attribution, untouched by this form: the advertisement that
          // brought them here is already stored and survives reloads and navigation.
          ...attributionPayload(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to submit. Please try again.");
      }
      return res.json();
    },
    // Lead fires only once the server has accepted the row — never on button press.
    onSuccess: () => {
      setSubmitted(true);
      trackLead({
        eventId: `${sessionId.current}-lead`,
        service: rec?.slug ?? rec?.serviceInterest,
        vehicleType: rec?.vehicleType,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Could not send", description: err.message, variant: "destructive" });
    },
  });

  const choose = (key: keyof Answers, value: string, next: Step) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep(next);
  };

  /** Fires once when the recommendation is first shown. */
  const onReachResult = (finish: string) => {
    const complete = { ...answers, finish } as Answers;
    setAnswers(complete);
    setStep(4);
    const r = recommend(complete);
    trackChallengeComplete({
      eventId: `${sessionId.current}-complete`,
      service: r.slug ?? "quote-required",
      vehicleType: r.vehicleType,
    });
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setSubmitted(false);
    form.reset();
    newSession();
  };

  const handleOpenChange = (next: boolean) => {
    if (next) newSession();
    onOpenChange(next);
  };

  const vehicleCategories = answers.vehicle === "bike" ? CATEGORIES.bike : CATEGORIES.car;
  const priceLabel = pricing ? formatINR(pricing.price) : "Price on request";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/* w-[calc(100vw-1rem)]: the base dialog is w-full, which lands 1px past the
            viewport on a 375px screen and gives the page a horizontal scrollbar. */}
        <DialogContent
          className="w-[calc(100vw-1rem)] max-w-lg overflow-y-auto border-gray-800 bg-gray-900 text-white max-h-[90vh] sm:w-full"
          data-testid="dialog-protection-challenge"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">P91 Protection Challenge</DialogTitle>
            <DialogDescription className="text-gray-400">
              Answer a few quick questions and see the protection that fits your vehicle.
            </DialogDescription>
          </DialogHeader>

          {/* Progress: text as well as a bar, so it does not rely on colour alone. */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span aria-live="polite" data-testid="text-challenge-progress">
                Step {Math.min(step + 1, STEP_COUNT)} of {STEP_COUNT}
              </span>
              {step > 0 && step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                  className="inline-flex items-center gap-1 min-h-[44px] px-2 text-gray-300 hover:text-white"
                  data-testid="button-challenge-back"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
                </button>
              )}
            </div>
            <div className="h-1.5 w-full rounded bg-gray-800" role="presentation">
              <div
                className="h-1.5 rounded bg-green-500 transition-all"
                style={{ width: `${((Math.min(step + 1, STEP_COUNT)) / STEP_COUNT) * 100}%` }}
              />
            </div>
          </div>

          {step === 0 && (
            <ChoiceList
              question="What are you protecting?"
              options={VEHICLES}
              onSelect={(id) => choose("vehicle", id, 1)}
              testId="vehicle"
            />
          )}

          {step === 1 && (
            <ChoiceList
              question={answers.vehicle === "bike" ? "Which bike?" : "What do you drive?"}
              options={vehicleCategories}
              onSelect={(id) => choose("category", id, 2)}
              testId="category"
            />
          )}

          {step === 2 && (
            <ChoiceList
              question="What matters most to you?"
              options={GOALS}
              onSelect={(id) => choose("goal", id, 3)}
              testId="goal"
            />
          )}

          {step === 3 && (
            <ChoiceList
              question="Which finish do you prefer?"
              options={FINISHES}
              onSelect={(id) => onReachResult(id)}
              testId="finish"
            />
          )}

          {step === 4 && rec && (
            <div data-testid="challenge-result">
              <h3 className="text-lg font-bold text-white">Your protection match</h3>
              <div className="mt-3 rounded-xl border border-gray-800 bg-gray-800/40 p-4">
                {service && resolveServiceImage(service) && (
                  <ImageWithFallback
                    src={resolveServiceImage(service) as string}
                    alt={service.title}
                    className="mb-3 h-36 w-full rounded-lg object-cover"
                  />
                )}
                <p className="text-base font-semibold text-white" data-testid="text-challenge-service">
                  {service?.title?.trim() ?? rec.headline}
                </p>
                <p className="mt-1 text-2xl font-bold text-green-400" data-testid="text-challenge-price">
                  {priceLabel}
                </p>
                {pricing?.originalPrice !== null && pricing?.originalPrice !== undefined && (
                  <p className="text-sm text-gray-400">
                    <span className="sr-only">Previous price </span>
                    <span className="line-through">{formatINR(pricing.originalPrice)}</span>
                  </p>
                )}
                {!pricing && (
                  <p className="mt-1 text-sm text-gray-400">
                    The studio will confirm the price for your vehicle.
                  </p>
                )}
                <ul className="mt-3 space-y-1 text-sm text-gray-300">
                  {rec.why.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              </div>

              {!submitted ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((values) => submitLead.mutate(values))}
                    className="mt-4 space-y-3"
                    data-testid="form-challenge-lead"
                  >
                    <p className="text-sm text-gray-400">
                      Leave your details and the studio will confirm availability.
                    </p>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Your name</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="name" className="min-h-[44px] bg-gray-800 border-gray-700" data-testid="input-challenge-name" />
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
                          <FormLabel className="text-gray-300">Mobile number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              inputMode="tel"
                              autoComplete="tel"
                              maxLength={10}
                              placeholder="10-digit mobile"
                              className="min-h-[44px] bg-gray-800 border-gray-700"
                              data-testid="input-challenge-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" autoComplete="email" className="min-h-[44px] bg-gray-800 border-gray-700" data-testid="input-challenge-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Honeypot. Hidden from people, not from form-filling bots. */}
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem className="sr-only" aria-hidden="true">
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} tabIndex={-1} autoComplete="off" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={submitLead.isPending}
                      className="min-h-[44px] w-full bg-green-500 font-bold text-black hover:bg-green-600"
                      data-testid="button-challenge-submit"
                    >
                      {submitLead.isPending ? "Sending…" : "Get my recommendation"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="mt-4 space-y-3" data-testid="challenge-submitted">
                  <p className="text-sm text-green-400">Thanks — the studio will call you.</p>
                  {service && (
                    <Button
                      onClick={() => {
                        onOpenChange(false);
                        setBookingOpen(true);
                      }}
                      className="min-h-[44px] w-full bg-green-500 font-bold text-black hover:bg-green-600"
                      data-testid="button-challenge-book"
                    >
                      Book Free Appointment
                    </Button>
                  )}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hi P91, the Protection Challenge suggested ${service?.title?.trim() ?? rec.headline} for my ${rec.vehicleType}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackWhatsAppContinuation({
                        eventId: `${sessionId.current}-whatsapp`,
                        service: rec.slug ?? rec.serviceInterest,
                      })
                    }
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-gray-700 px-4 text-white hover:bg-gray-800"
                    data-testid="link-challenge-whatsapp"
                  >
                    <SiWhatsapp className="h-4 w-4" aria-hidden="true" /> Continue on WhatsApp
                  </a>
                  <p className="text-xs text-gray-400">
                    Booking is free. Service charges apply at the studio.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={reset}
                className="mt-3 min-h-[44px] text-sm text-gray-400 underline hover:text-white"
                data-testid="button-challenge-restart"
              >
                Start again
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/*
        The SAME record the result card showed. Not a second lookup by slug — that is how a
        customer ends up reading "SUV" while the booking carries the hatchback row.
      */}
      {service && (
        <BookingModal
          service={service as any}
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          vehicleContext={{ vehicleType: rec?.vehicleType, vehicleCategory: rec?.vehicleCategory }}
        />
      )}
    </>
  );
}

function ChoiceList({
  question,
  options,
  onSelect,
  testId,
}: {
  question: string;
  options: { id: string; label: string; hint?: string }[];
  onSelect: (id: string) => void;
  testId: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white" data-testid={`text-challenge-question-${testId}`}>
        {question}
      </h3>
      <div className="mt-3 grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className="min-h-[44px] rounded-xl border border-gray-700 bg-gray-800/40 px-4 py-3 text-left text-white transition-colors hover:border-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
            data-testid={`button-challenge-${testId}-${o.id}`}
          >
            <span className="font-medium">{o.label}</span>
            {o.hint && <span className="block text-xs text-gray-400">{o.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The entry point every placement uses: a short pitch, the challenge trigger, and the
 * direct booking route for someone who already knows what they want.
 *
 * `onBookDirect` is supplied by pages that already own a BookingModal (the campaign landing
 * pages); without it the button links to the catalogue rather than opening a second modal.
 */
export default function ProtectionChallengeCTA({
  placement,
  variant = "compact",
  onBookDirect,
}: {
  placement: string;
  variant?: "teaser" | "compact";
  onBookDirect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={
        variant === "teaser"
          ? "rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center"
          : "rounded-xl border border-gray-800 bg-gray-900/40 p-4"
      }
      data-testid={`challenge-cta-${placement}`}
    >
      <p className="text-base font-semibold text-white">Not sure which protection you need?</p>
      <p className="mt-1 text-sm text-gray-400">
        Four quick questions and we will suggest the service that fits your vehicle.
      </p>
      <div className={variant === "teaser" ? "mt-4 flex flex-wrap justify-center gap-3" : "mt-3 flex flex-wrap gap-3"}>
        <Button
          onClick={() => setOpen(true)}
          className="min-h-[44px] bg-green-500 font-bold text-black hover:bg-green-600"
          data-testid={`button-take-challenge-${placement}`}
        >
          Take the Challenge
        </Button>
        {onBookDirect ? (
          <Button
            variant="outline"
            onClick={onBookDirect}
            className="min-h-[44px] w-full whitespace-normal border-gray-700 text-white hover:bg-gray-800 sm:w-auto"
            data-testid={`button-challenge-skip-${placement}`}
          >
            Already know what you need? Book Free Appointment
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="min-h-[44px] w-full whitespace-normal border-gray-700 text-white hover:bg-gray-800 sm:w-auto"
          >
            <a href="/services" data-testid={`link-challenge-skip-${placement}`}>
              Already know what you need? Book Free Appointment
            </a>
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-400">Booking is free. Service charges apply at the studio.</p>
      <ProtectionChallengeDialog open={open} onOpenChange={setOpen} placement={placement} />
    </div>
  );
}
