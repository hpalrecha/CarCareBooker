import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import MobileEstimateBar from "@/components/mobile-estimate-bar";

// The two popups carry the Dialog and form code, but nothing they render is needed for first
// paint: the offer opens at 2.5s and the callback at 15s. Loading them lazily keeps that code
// off the critical path.
// The festival offer popup (components/festival-offer-popup.tsx) is NOT mounted: taken down 2026-10-08 until
// the studio supplies the next offer. To bring an offer back, restore the lazy import and <FestivalOfferPopup />.
const CallbackPopup = lazy(() => import("@/components/callback-popup"));

/**
 * The two visitor popups, mounted once above the router so they cover every public page and
 * survive navigation instead of restarting on each route.
 *
 *   1. The festival offer opens first (2.5s after arrival).
 *   2. "Prefer a call?" follows at 15s. It never opens over another dialog: it waits until the
 *      offer is closed (see lib/callback-popup-state.ts), and shows once per visit.
 *
 * Not shown on /admin (customer data on screen), the booking confirmation, or the offer page
 * itself (its form must not be covered). /service/* mounts
 * its own "Prefer a call?" named after the service, so the generic one is skipped there.
 */
export default function SitePopups() {
  const [location] = useLocation();
  // The offer page is where "Book this offer" lands: its form is the point, so nothing may open over it.
  if (location.startsWith("/admin") || location.startsWith("/booking-confirmation") || location.startsWith("/offer/")) return null;
  return (
    <>
      <Suspense fallback={null}>
        {!location.startsWith("/service/") && <CallbackPopup isBikeService={false} />}
      </Suspense>
      {!location.startsWith("/service/") && <MobileEstimateBar />}
    </>
  );
}
