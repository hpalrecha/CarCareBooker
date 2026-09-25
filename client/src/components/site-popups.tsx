import { useLocation } from "wouter";
import { FestivalOfferPopup } from "@/components/festival-offer";
import CallbackPopup from "@/components/callback-popup";

/**
 * The two visitor popups, mounted once above the router so they cover every public page and
 * survive navigation instead of restarting on each route.
 *
 *   1. The festival offer opens first (2.5s after arrival).
 *   2. "Prefer a call?" follows at 15s. It never opens over another dialog: it waits until the
 *      offer is closed (see lib/callback-popup-state.ts), and shows once per visit.
 *
 * Not shown on /admin (customer data on screen) or the booking confirmation. /service/* mounts
 * its own "Prefer a call?" named after the service, so the generic one is skipped there.
 */
export default function SitePopups() {
  const [location] = useLocation();
  if (location.startsWith("/admin") || location.startsWith("/booking-confirmation")) return null;
  return (
    <>
      <FestivalOfferPopup />
      {!location.startsWith("/service/") && <CallbackPopup isBikeService={false} />}
    </>
  );
}
