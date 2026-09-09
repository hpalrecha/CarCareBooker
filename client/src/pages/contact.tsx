import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Phone } from "lucide-react";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { localBusinessSchema } from "@/lib/local-business";
import type { BusinessHour } from "@shared/schema";

/**
 * Contact page in the approved redesign.
 *
 * FORM CONTRACT IS UNTOUCHED. The schema, the five field names (name, email, phone,
 * subject, message), the resolver, the mutation and the POST /api/contact endpoint are
 * character-for-character what they were. Only the markup around them changed — the
 * inputs are now plain elements wired through react-hook-form's register() rather than
 * the shadcn <Form> wrapper, because the prototype's field styling does not survive that
 * component's own classes. `register` submits the identical payload, so the backend and
 * the admin see no difference.
 *
 * Two departures from the prototype, both to avoid publishing something untrue:
 *
 *   - Opening hours come from GET /api/business-hours. The prototype hardcodes
 *     "Mon–Sat 10:00 am – 7:00 pm / Sunday Closed"; production has all seven days open at
 *     10:30–16:30, Sunday 10:30–15:00. A customer turned away on a Sunday we are open is
 *     a real cost.
 *   - The prototype has no contact form at all. This page keeps its form, because
 *     removing a working submission path is not a design change.
 */

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactFormSchema>;

/** "10:30" -> "10:30 am". */
function toDisplayTime(hhmm: string | null | undefined): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LONG: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

/** Collapses consecutive days with identical hours into "Monday – Saturday" style rows. */
function summarise(hours: BusinessHour[]): { label: string; value: string; closed: boolean }[] {
  if (!hours.length) return [];
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const rows: { label: string; value: string; closed: boolean }[] = [];
  const keyFor = (d: number) => {
    const h = byDay.get(d);
    if (!h) return "missing";
    return h.isOpen ? `${h.openTime}-${h.cutoffTime}` : "closed";
  };

  let runStart: number | null = null;
  let runKey = "";
  const flush = (endDay: number) => {
    if (runStart === null) return;
    const h = byDay.get(runStart);
    const closed = !h?.isOpen;
    rows.push({
      label: runStart === endDay ? DAY_LONG[runStart] : `${DAY_LONG[runStart]} – ${DAY_LONG[endDay]}`,
      value: closed ? "Closed" : `${toDisplayTime(h?.openTime)} – ${toDisplayTime(h?.cutoffTime)}`,
      closed,
    });
  };

  for (let i = 0; i < DAY_ORDER.length; i++) {
    const day = DAY_ORDER[i];
    const key = keyFor(day);
    if (runStart === null) { runStart = day; runKey = key; continue; }
    if (key !== runKey) { flush(DAY_ORDER[i - 1]); runStart = day; runKey = key; }
  }
  flush(DAY_ORDER[DAY_ORDER.length - 1]);
  return rows;
}

export default function Contact() {
  const { toast } = useToast();

  const { data: businessHours = [] } = useQuery<BusinessHour[]>({
    queryKey: ["/api/business-hours"],
    retry: 1,
  });

  useSeoMeta({
    title: "Contact P91 Car Care | Indiranagar, Bangalore",
    description:
      "Call, WhatsApp or visit the P91 Car Care detailing studio in Indiranagar, Bangalore. " +
      "Opening hours, directions and enquiry form.",
    image: "/Car Care (4)_1753951564515.png",
    canonicalPath: "/contact",
    structuredData: localBusinessSchema({
      origin: typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin,
      businessHours,
    }),
  });

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  const { register, handleSubmit, formState: { errors } } = form;
  const hourRows = summarise(businessHours);

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <section className="section">
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span> <span>Contact</span>
          </nav>

          <div className="section-head">
            <h1 style={{ fontSize: "clamp(26px,4.6vw,40px)", fontWeight: 800 }}>Contact us</h1>
            <p>
              Come to the studio, call, or send a photo of your car on WhatsApp and we'll tell you
              what it needs.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <h2>Studio</h2>
              {/* NAP block. This must stay character-for-character consistent with the
                  address in lib/local-business.ts and with the Google Business Profile —
                  local ranking depends on the three agreeing, and a visible address that
                  differs from the schema is a signal that the listing is unverified. */}
              <p className="contact-lines">
                <b>P91 Car Care</b><br />
                100 Feet Road, HAL 2nd Stage<br />
                Indiranagar<br />
                Bengaluru, Karnataka 560038<br />
                India<br />
                <a href="tel:+917406619191" data-testid="link-contact-phone">+91 74066 19191</a>
              </p>
              <p className="fineprint">Trading as Plus Nine One Inc · GSTIN 29AMIPP3288M1Z6</p>
            </div>

            <div className="contact-card">
              <h2>Opening hours</h2>
              {hourRows.length > 0 ? (
                <table className="hours" data-testid="table-hours">
                  <tbody>
                    {hourRows.map((r) => (
                      <tr key={r.label}>
                        <td>{r.label}</td>
                        <td className={r.closed ? "shut" : undefined}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="contact-lines">Call the studio for today's hours.</p>
              )}
              <p className="fineprint">Hours are read live from the booking system.</p>
            </div>

            <div className="contact-card">
              <h2>Get in touch</h2>
              <div className="contact-actions">
                <a className="cta-lg" href="https://wa.me/917406619191" data-testid="link-contact-whatsapp">
                  WhatsApp us
                </a>
                <a className="cta-ghost" href="tel:+917406619191">
                  <Phone className="i" aria-hidden="true" /> 74066 19191
                </a>
              </div>
              <p className="contact-lines">
                <a href="mailto:info@p91carcare.com">info@p91carcare.com</a><br />
                GST: 29AMIPP3288M1Z6
              </p>
            </div>
          </div>

          {/* ---------- enquiry form: markup only, contract unchanged ---------- */}
          <h2 className="more-h">Send us a message</h2>
          <div className="form-card">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="contact-name">Your name</label>
                  <input id="contact-name" type="text" autoComplete="name" data-testid="input-contact-name" {...register("name")} />
                  {errors.name && <p className="form-err">{errors.name.message}</p>}
                </div>
                <div className="form-field">
                  <label htmlFor="contact-phone">Mobile number</label>
                  <input id="contact-phone" type="tel" autoComplete="tel" data-testid="input-contact-phone" {...register("phone")} />
                  {errors.phone && <p className="form-err">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="contact-email">Email address</label>
                <input id="contact-email" type="email" autoComplete="email" data-testid="input-contact-email" {...register("email")} />
                {errors.email && <p className="form-err">{errors.email.message}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" type="text" data-testid="input-contact-subject" {...register("subject")} />
                {errors.subject && <p className="form-err">{errors.subject.message}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" rows={5} data-testid="input-contact-message" {...register("message")} />
                {errors.message && <p className="form-err">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                className="cta-lg"
                disabled={contactMutation.isPending}
                data-testid="button-contact-submit"
              >
                {contactMutation.isPending ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>

          {/* ---------- map ---------- */}
          <h2 className="more-h">Find us</h2>
          <div className="map-frame">
            <iframe
              title="Map showing P91 Car Care in Indiranagar, Bangalore"
              src="https://www.google.com/maps?q=Indiranagar,Bangalore&output=embed"
              width={1600}
              height={610}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="map-actions">
            <a
              className="cta-lg"
              href="https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Indiranagar+Bengaluru"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions →
            </a>
            <a
              className="cta-ghost"
              href="https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Indiranagar+Bengaluru"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
          {/* Honest about the limitation rather than dropping a pin on the wrong building.
              See lib/local-business.ts — the exact street address still has to come from
              the Google Business Profile. */}
          <p className="fineprint" style={{ marginTop: 12 }}>
            The map is centred on Indiranagar. It will point at the exact studio pin once the
            street address is confirmed.
          </p>

          <div className="article-cta">
            <div>
              <h3>Rather just book?</h3>
              <p>Pick a service and hold a slot. The balance is settled at the studio.</p>
            </div>
            <div className="article-cta-btns">
              <Link href="/services" className="cta-lg" data-testid="link-contact-book">Book a service</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
