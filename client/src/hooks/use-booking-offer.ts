import { useQuery } from "@tanstack/react-query";

/**
 * Whether the free-booking offer is currently running.
 *
 * ONE source of truth for every surface that mentions the price — the booking modal, the
 * service pages, the homepage. They all previously hardcoded or independently derived
 * "₹299", which is how "Premium Car Wash - ₹599" and "Exterior Detailing - ₹1,999" drifted
 * out of sync with the catalogue in the first place.
 *
 * The answer comes from GET /api/booking-offer, computed by the same server that decides
 * the amount. The browser deliberately does not evaluate the date itself: the window is an
 * IST calendar date, and a device in another timezone — or with a wrong clock — would
 * otherwise advertise "free" for a booking the backend still charges for.
 *
 * Fails closed. While loading, on network error, or if the endpoint is unreachable,
 * `free` is false and the normal fee copy shows. Promising a free booking and then
 * charging is far worse than briefly showing the fee during the offer.
 */
export interface BookingOffer {
  /** True only while the server says the offer window is open. */
  free: boolean;
  /** YYYY-MM-DD final day of the offer, or null when it is not running. */
  until: string | null;
}

export function useBookingOffer(): BookingOffer {
  const { data } = useQuery<BookingOffer>({
    queryKey: ["/api/booking-offer"],
    retry: false,
    // The window turns off at a fixed moment. A long cache would keep showing "free"
    // after it closed, so this is refetched often enough to be honest.
    staleTime: 60_000,
  });

  return { free: data?.free === true, until: data?.until ?? null };
}

/** "16 September 2026" for offer copy. Returns null when the offer is not running. */
export function formatOfferEnd(until: string | null): string | null {
  if (!until) return null;
  const d = new Date(`${until}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
