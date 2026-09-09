import { useLocation } from "wouter";
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

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi P91 Car Care, I'd like to know more about your detailing services.",
);

export function ContactFab() {
  const [location] = useLocation();

  // Staff do not need to WhatsApp themselves, and the button would sit over the
  // dashboard's own controls.
  if (location.startsWith("/admin")) return null;

  // Clear the service page's own sticky booking CTA instead of covering the payment
  // entry point.
  const onServicePage = location.startsWith("/service/");

  return (
    <a
      href={`https://wa.me/${PHONE_DIGITS}?text=${WHATSAPP_MESSAGE}`}
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
