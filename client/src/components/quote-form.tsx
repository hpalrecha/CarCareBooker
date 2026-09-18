import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { attributionPayload } from "@/lib/attribution";
import { trackLead } from "@/lib/meta-pixel";
import { isValidMobile } from "@/lib/protection-challenge";

/**
 * "Get your appointment" — the enquiry form for someone not ready to pick a slot online.
 *
 * It sits BESIDE booking, never instead of it: a customer who knows what they want books
 * in one click, and this catches the rest rather than losing them.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * ONE IMPLEMENTATION, TWO PAGES. /ppf-ceramic-coating had its own copy of this form; the
 * service pages now need the same thing, and a second copy is how two lead forms drift
 * into validating differently and reporting different Meta events.
 *
 * WHAT IT DOES NOT DO: quote a price. The catalogue is the only source of prices, and this
 * form deliberately carries none — it tells the studio which service was being read when
 * the enquiry came in, and the studio quotes.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

const quoteSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().refine(isValidMobile, "Enter a 10-digit mobile number"),
  email: z.string().trim().email("Please enter a valid email address"),
  vehicleType: z.enum(["car", "bike"]),
  vehicleModel: z.string().trim().max(120).optional(),
  /** Honeypot: rendered, hidden from people, filled by form-filling bots. */
  website: z.string().optional(),
});
type QuoteValues = z.infer<typeof quoteSchema>;

/**
 * What sending this form costs and what happens next.
 *
 * Was "Booking is free. Service charges apply at the studio." — true of the form, but on
 * a service page it sat beside "Secure your slot for ₹299" and "Pay ₹299 & Get FREE
 * Voucher", so a reader could not tell whether booking cost ₹299 or nothing. This form
 * takes no payment and books nothing by itself; the studio calls to fix the slot. Say
 * exactly that, and say the service is paid for at the studio.
 */
const FORM_NOTE = "No payment to send this — we'll call to confirm your slot. The service is paid at the studio.";

export default function QuoteForm({
  serviceTitle,
  serviceSlug,
  serviceInterest = "ceramic",
  defaultVehicleType = "car",
  heading = "Book Now",
  testId = "quote-form",
  lockVehicleType = false,
  subheading,
  columns = false,
  onSubmitted,
}: {
  /** Called once the server has accepted the lead (e.g. so a popup stops re-offering itself). */
  onSubmitted?: () => void;
  /** One line under the heading. Service pages use it to say this is the no-payment path. */
  subheading?: string;
  /**
   * Two-column fields from `sm` up (name | mobile, email | model), so the form reads as a
   * compact centred block in a page section rather than a tall narrow column.
   */
  columns?: boolean;
  serviceTitle?: string;
  serviceSlug?: string;
  /** How the studio files this lead: the server accepts ppf | ceramic | both. */
  serviceInterest?: "ppf" | "ceramic" | "both";
  defaultVehicleType?: "car" | "bike";
  /**
   * Hide the car/bike picker and send defaultVehicleType. A page that is about ONE kind
   * of vehicle (every /service/* page is) should not ask a biker whether they own a car.
   */
  lockVehicleType?: boolean;
  heading?: string;
  testId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { name: "", phone: "", email: "", vehicleType: defaultVehicleType, vehicleModel: "", website: "" },
  });

  const submit = useMutation({
    mutationFn: async (values: QuoteValues) => {
      const res = await fetch("/api/ppf-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          website: values.website ?? "",
          vehicleType: values.vehicleType,
          vehicleModel: values.vehicleModel || null,
          serviceInterest,
          // Which service page produced this, so the studio can answer knowledgeably.
          message: serviceTitle
            ? `Quote request from the ${serviceTitle}${serviceSlug ? ` (${serviceSlug})` : ""} page.`
            : "Quote request.",
          source: "landing_page",
          // First-touch attribution, read not rewritten.
          ...attributionPayload(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to send. Please try again.");
      }
      return res.json();
    },
    // Lead fires only once the server has accepted the row, never on button press.
    onSuccess: () => {
      setSubmitted(true);
      onSubmitted?.();
      trackLead({
        eventId: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        service: serviceSlug ?? serviceInterest,
      });
    },
    onError: (err: Error) => toast({ title: "Could not send", description: err.message, variant: "destructive" }),
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-500/40 bg-gray-900/70 p-6" data-testid={`${testId}-done`}>
        <h3 className="text-lg font-bold text-white">Thanks — we have your details.</h3>
        <p className="mt-1 text-sm text-gray-300">
          The studio will call you about {serviceTitle ?? "your enquiry"}.
        </p>
        <p className="mt-3 text-xs text-gray-400">{FORM_NOTE}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 sm:p-6" data-testid={testId}>
      <h3 className="text-lg font-bold text-white">{heading}</h3>
      {subheading ? (
        <p className="mt-1 text-sm text-gray-300">{subheading}</p>
      ) : (
        serviceTitle && <p className="mt-1 text-sm text-gray-400">About {serviceTitle}</p>
      )}

      <Form {...form}>
        {/*
          noValidate: the browser runs its own constraint check on type="email" FIRST and
          cancels the submit event, so zod never runs and our messages never appear. Here
          validation is zod's job, and its messages are the ones people read.
        */}
        <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} noValidate className={columns ? "mt-4 grid gap-3 sm:grid-cols-2" : "mt-4 space-y-3"}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Your name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" className="min-h-[44px] border-gray-700 bg-gray-800" data-testid={`input-${testId}-name`} />
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
                    className="min-h-[44px] border-gray-700 bg-gray-800"
                    data-testid={`input-${testId}-phone`}
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
                  <Input {...field} type="email" autoComplete="email" className="min-h-[44px] border-gray-700 bg-gray-800" data-testid={`input-${testId}-email`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className={lockVehicleType ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem className={lockVehicleType ? "hidden" : undefined}>
                  <FormLabel className="text-gray-300">Vehicle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-[44px] border-gray-700 bg-gray-800" data-testid={`select-${testId}-vehicle`}>
                        <SelectValue />
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
              name="vehicleModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Model (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={form.watch("vehicleType") === "bike" ? "e.g. Royal Enfield Classic" : "e.g. Creta"} className="min-h-[44px] border-gray-700 bg-gray-800" data-testid={`input-${testId}-model`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Honeypot. Hidden from people and screen readers, not from form-filling bots,
              which key on name="website". No visible label: page-reading tools reported a
              "Website" field as if customers were being asked for one. */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="sr-only" aria-hidden="true">
                <FormControl>
                  <Input {...field} tabIndex={-1} autoComplete="off" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={submit.isPending}
            className={`min-h-[44px] w-full rounded-[10px] bg-[var(--neon-green)] font-bold text-black hover:brightness-95${columns ? " sm:col-span-2" : ""}`}
            data-testid={`button-${testId}-submit`}
          >
            {submit.isPending ? "Sending…" : "Book Now"}
          </Button>
          {/* The subheading already says "no payment now" when one is given; do not repeat it. */}
          <p className={`text-xs text-gray-400${columns ? " sm:col-span-2" : ""}`}>
            {subheading ? "The service is paid at the studio." : FORM_NOTE}
          </p>
        </form>
      </Form>
    </div>
  );
}
