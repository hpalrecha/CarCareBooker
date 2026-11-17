import { useLocation } from "wouter";
import MobileEstimateBar from "@/components/mobile-estimate-bar";

// No visitor popups are mounted.
// The festival offer popup (components/festival-offer-popup.tsx) was taken down 2026-10-08 until
// the studio supplies the next offer. The "Prefer a call?" popup (components/callback-popup.tsx) was
// removed from every page at the studio's request. To bring either back, restore its lazy import
// and mount it below.

/**
 * Site-wide chrome mounted once above the router: today only the phone "Get Free Estimate" bar.
 *
 * Not shown on /admin (customer data on screen), the booking confirmation, or the offer page
 * itself (its form must not be covered). /service/* has its own booking panel, so the bar is
 * skipped there.
 */
export default function SitePopups() {
  const [location] = useLocation();
  // The offer page is where "Book this offer" lands: its form is the point, so nothing may open over it.
  if (location.startsWith("/admin") || location.startsWith("/booking-confirmation") || location.startsWith("/offer/")) return null;
  return <>{!location.startsWith("/service/") && <MobileEstimateBar />}</>;
}
