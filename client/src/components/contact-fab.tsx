import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@/lib/canonical-services";
import { SiWhatsapp } from "react-icons/si";

/**
 * Floating WhatsApp action, matching the approved redesign.
 *
 * WHAT CHANGED AND WHY. This used to be a stack of two wide pills — "74066 19191" and
 * "WhatsApp us" — anchored bottom-LEFT. On the redesigned homepage that stack landed
 * directly on top of the hero's "Book Now" and "WhatsApp us" buttons at a 1366x768
 * window: the word "Book" was completely hidden behind the phone pill. The old position
 * was chosen to avoid the service-page booking bar, which was right, but it traded one
 * collision for a worse one on the page most visitors see first.
 *
 * The prototype's answer is a single 54px circle at bottom-right (`.wa`: right 18px,
 * bottom 18px), with the phone number living in the sticky header instead. That is what
 * this now renders, so it matches the approved design and clears the hero entirely.
 *
 * FUNCTIONALITY IS PRESERVED, not dropped — click-to-call is still one tap away on every
 * page, from the header's call button (desktop), the mobile menu, and the footer.
 *
 * The service-page collision the old comment warned about is handled explicitly:
 * service-landing.tsx renders its ₹299 booking bar at `fixed right-4 z-[45]`, so on
 * /service/* this button lifts above it rather than sharing the corner. That mirrors the
 * prototype's own `.stickybar ~ .wa { bottom: 80px }` rule.
 *
 * Styles are Tailwind utilities, not the scoped `.p91x` stylesheet, because this renders
 * on every route — including pages not yet migrated to the redesign.
 */

const PHONE_DIGITS = "917406619191";

const GENERIC_MESSAGE = "Hi P91 Car Care, I'd like to know more about your detailing services.";

export function ContactFab() {
  const [location] = useLocation();

  // Clear the service page's own sticky booking CTA instead of covering the payment
  // entry point.
  const onServicePage = location.startsWith("/service/");

  // On a service page the message names that service, so the studio knows what the chat
  // is about before replying. Same query key as the page, so React Query shares its one
  // request instead of making a second. (Hooks run before the /admin return below.)
  const slug = onServicePage ? decodeURIComponent(location.split("/")[2] || "") : "";
  const { data: service } = useQuery<{ title?: string; price?: string }>({
    queryKey: ["/api/services", slug],
    enabled: Boolean(slug),
  });
  const serviceTitle = service?.title?.trim();
  // Two-wheeler and car owners often prefer to message rather than fill a form, so the
  // message is ready to send as a booking request: the service, its live price from the
  // record, and a place for the model — the first thing the studio would ask.
  const price = service?.price ? formatINR(service.price) : "";
  const noun = /\bbike\b|\bmotorcycle\b/i.test(serviceTitle || "") ? "bike" : "car";
  const message = serviceTitle
    ? `Hi P91 Car Care, I'd like to book ${serviceTitle}${price ? ` (${price})` : ""} for my ${noun}. Model: `
    : GENERIC_MESSAGE;

  // Staff do not need to WhatsApp themselves, and the button would sit over the
  // dashboard's own controls.
  if (location.startsWith("/admin")) return null;

  return (
    <a
      href={`https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with P91 Car Care on WhatsApp"
      data-testid="link-fab-whatsapp"
      className={
        "fixed right-[18px] z-50 grid h-[54px] w-[54px] place-items-center rounded-full " +
        "bg-[#25D366] text-[#062B12] shadow-[0_6px_22px_rgba(0,0,0,.5)] " +
        "transition-transform hover:scale-105 print:hidden " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
        (onServicePage ? "bottom-24" : "bottom-[18px]")
      }
    >
      <SiWhatsapp className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}

export default ContactFab;
