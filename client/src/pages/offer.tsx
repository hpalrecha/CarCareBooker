import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { offerPriceFor } from "@shared/offer-pricing";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import QuoteForm from "@/components/quote-form";
import { FESTIVAL_OFFER, FestivalCountdown, festivalOfferActive, reportOffer, useOfferCountdown } from "@/components/festival-offer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useToast } from "@/hooks/use-toast";
import { OFFER_SEO } from "@/lib/static-seo";
import { festivalOfferSchema } from "@/lib/offer-schema";
import { loadRazorpay } from "@/lib/razorpay";
import { attributionPayload } from "@/lib/attribution";
import { trackLead } from "@/lib/meta-pixel";

/**
 * /offer/de-dhana-dhan: where "Book this offer" lands.
 *
 * The customer fills the form, and the page then opens the SAME Razorpay Checkout the booking flow
 * uses (UPI, including the QR on desktop) for the offer's slot payment (Rs 499 for PPF
 * services, Rs 99 for any other). The amount is fixed
 * on the server (server/lib/diwali-offer.ts); this page only displays it.
 *
 *   1. POST /api/offers/diwali/order   records the lead as "pending" and returns a Razorpay order
 *   2. Razorpay Checkout               the customer pays
 *   3. POST /api/confirm-payment       the existing endpoint verifies the signature; only then does
 *                                      the lead become "paid" (the Razorpay webhook does the same
 *                                      server-side if the browser never comes back)
 *
 * A closed or failed checkout leaves the lead "pending" in the admin Leads tab, so the studio can
 * still call that customer.
 */

type FormValues = {
  name: string;
  phone: string;
  email: string;
  vehicleType: "car" | "bike";
  vehicleModel?: string;
  website?: string;
  serviceId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
};

type PaidState = { paymentId: string; confirmed: boolean };

async function confirmPayment(response: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  // Same retry rhythm as the booking modal: the webhook may be confirming at the same moment.
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      if (res.ok) return true;
    } catch {
      // fall through to retry
    }
    if (attempt < 5) await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export default function OfferPage() {
  useSeoMeta({
    title: OFFER_SEO.title,
    description: OFFER_SEO.description,
    canonicalPath: OFFER_SEO.path,
    image: OFFER_SEO.image,
    structuredData: festivalOfferSchema("https://p91carcare.com"),
  });
  const { toast } = useToast();
  const { done } = useOfferCountdown();
  const live = !done && festivalOfferActive();
  const o = FESTIVAL_OFFER;
  const [paid, setPaid] = useState<PaidState | null>(null);
  // Same query key as the slot picker, so this is one request. Only used to label the pay button.
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  useEffect(() => {
    if (live) reportOffer("view", "page");
  }, [live]);

  /** Create the pending lead + order, then open Razorpay. Resolves once checkout is on screen. */
  const startPayment = async (values: FormValues) => {
    const res = await fetch("/api/offers/diwali/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        vehicleType: values.vehicleType,
        vehicleModel: values.vehicleModel || null,
        serviceId: values.serviceId,
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
        website: values.website ?? "",
        ...attributionPayload(),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? "We couldn't start the payment. Please try again or call 74066 19191.");
    }
    const { paymentOrder } = await res.json();

    const Razorpay = await loadRazorpay();
    if (!Razorpay) throw new Error("The payment window could not load. Please try again.");
    reportOffer("select", "page", "pay_start");

    const checkout = new Razorpay({
      key: paymentOrder.key,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      order_id: paymentOrder.id,
      name: "P91 Car Care",
      description: `₹${paymentOrder.amount / 100} slot booking · De Dhana Dhan offer`,
      prefill: { name: values.name, email: values.email, contact: values.phone },
      theme: { color: "#4EB848" },
      // UPI first (the QR code on desktop and the app picker on phones); every other method stays available.
      config: {
        display: {
          blocks: { upi: { name: "Pay with UPI", instruments: [{ method: "upi" }] } },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: true },
        },
      },
      handler: async (response: any) => {
        const ok = await confirmPayment(response);
        // Reported only once the SERVER has verified the signature. Razorpay's browser callback alone
        // is not proof, and a conversion counted for a payment the backend never confirmed would
        // overstate results. If verification failed here, Razorpay's webhook still marks the lead
        // paid on the server, and the customer is told exactly that below.
        if (ok) {
          reportOffer("select", "page", "paid");
          trackLead({ eventId: `offer-${response.razorpay_payment_id}`, service: "diwali_offer" });
        }
        setPaid({ paymentId: response.razorpay_payment_id, confirmed: ok });
      },
      modal: {
        ondismiss: () =>
          toast({
            title: "Payment not completed",
            description: "Your details are saved. Tap the button again to pay and book your slot before the offer ends.",
          }),
      },
      timeout: 900,
    });
    checkout.on("payment.failed", (r: any) =>
      toast({
        title: "Payment failed",
        description: r?.error?.description || "The payment could not be processed. Please try again.",
        variant: "destructive",
      }),
    );
    checkout.open();
  };

  return (
    <div className="p91x gl-page min-h-screen">
      <SiteHeader />
      <main id="main">
      <section className="gl-fest gl-offer-page" data-testid="offer-page">
        <div className="wrap gl-fest-row">
          <img src={o.image} alt={o.alt} className="gl-fest-img" width={1080} height={1350} />
          <div className="gl-fest-copy">
            <p className="gl-fest-kicker">{o.kicker} · Limited time</p>
            <h1 className="gl-offer-h1">De Dhana Dhan offer</h1>
            {paid ? (
              <div className="gl-offer-paid" data-testid="offer-paid">
                <p className="gl-fest-lead">
                  <strong>
                    {paid.confirmed
                      ? "Payment received: your slot is booked."
                      : "Payment received: we're confirming it with the bank."}
                  </strong>
                </p>
                <p className="gl-fest-lead">
                  Your slot is booked for the service, date and time you chose. We'll call you to confirm, and to arrange your free dash cam, sun film, sound damping and ceramic coating.
                </p>
                {!paid.confirmed && (
                  <p className="gl-fest-slot">
                    <small>Razorpay reported your payment as successful. If you don't hear from us within 10 minutes, call 74066 19191 and quote payment ID {paid.paymentId}.</small>
                  </p>
                )}
                <p className="gl-fest-slot">
                  <small>Payment ID: {paid.paymentId} · Terms and conditions apply.</small>
                </p>
                <div className="gl-cta-row gl-fest-actions">
                  <a href={o.callHref} className="gl-btn gl-btn-light">Call 74066 19191</a>
                  <a href={o.whatsappHref} target="_blank" rel="noopener noreferrer" className="gl-btn gl-btn-light">WhatsApp us</a>
                </div>
              </div>
            ) : live ? (
              <>
                <p className="gl-fest-lead">
                  Free dash cam, sun film, sound damping and ceramic coating with any premium brand paint protection film installation. Valid till 8 November 2026.
                </p>
                <p className="gl-fest-slot">{o.slot}</p>
                <p className="gl-fest-ends">Offer ends in</p>
                <FestivalCountdown />
                <div className="gl-offer-form" data-testid="offer-form">
                  <QuoteForm
                    serviceTitle="the De Dhana Dhan offer"
                    serviceInterest="ppf"
                    heading="Book your slot"
                    subheading="Slot booking is ₹499 for PPF services and ₹99 for every other service. Enter your details, choose your service, date and time, then pay by UPI, card or net banking."
                    slotPicker
                    testId="offer-quote"
                    submitLabel="Choose a service to continue"
                    submitLabelFor={(id) => {
                      const s = services.find((x) => x.id === id);
                      return s ? `Pay ₹${offerPriceFor(s)} & book my slot` : "Choose a service to continue";
                    }}
                    footerNote="Secure payment by Razorpay. Terms and conditions apply. Valid till 8 November 2026."
                    submitOverride={startPayment}
                  />
                </div>
                <p className="gl-fest-slot">
                  <small>Prefer to talk? Call 74066 19191 or message us on WhatsApp.</small>
                </p>
                <div className="gl-cta-row gl-fest-actions">
                  <a href={o.whatsappHref} target="_blank" rel="noopener noreferrer" className="gl-btn gl-btn-light" onClick={() => reportOffer("select", "page", "whatsapp")}>WhatsApp us</a>
                  <a href={o.callHref} className="gl-btn gl-btn-light" onClick={() => reportOffer("select", "page", "call")}>Call 74066 19191</a>
                </div>
              </>
            ) : (
              <>
                <p className="gl-fest-lead">This offer ended on {o.validTill}. Our current prices and packages are on the services page.</p>
                <div className="gl-cta-row gl-fest-actions">
                  <a href="/services" className="gl-btn gl-btn-solid">See services</a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
