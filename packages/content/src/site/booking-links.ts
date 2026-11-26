/**
 * "Book online" on the new site opens the old booking page for that service (owner, 26 Nov 2026:
 * booking stays online until Plan 2c builds it into Next). After cutover nginx keeps /service/*
 * on the API container, so these links land on the working booking and payment flow.
 *
 * Family -> old booking record slug (all active in /api/services, 26 Nov 2026). PPF has no /ppf
 * booking page any more; /service/ppf-hatchback has the vehicle selector that switches body type.
 * Plan 3 Task 3 inverts this map (with LINK_MAP) for the old pages' canonical.
 */
export const BOOKING_FAMILIES = {
  ppf: "ppf-hatchback",
  "ceramic-car": "1-year-ceramic-coating",
  "ceramic-bike": "1-year-bike-ceramic-coating",
  interior: "interior-detailing-service",
  exterior: "exterior-detailing-hard-water-new",
  headlight: "headlight-restoration-both",
  "glass-coating": "windshield-glass-coating-new",
  "glass-polishing": "windshield-glass-polishing",
  maintenance: "annual-maintenance-package",
  "car-wash": "premium-car-wash-special",
} as const;

export type BookingFamily = keyof typeof BOOKING_FAMILIES;

/**
 * New service page -> booking family. Pages not listed (matte, front and bike PPF, paint correction,
 * sun control film) have no booking record of their own and keep WhatsApp. Glass polishing has no
 * page of its own on the new site; its old page canonicalises to /services/exterior-detailing.
 */
export const BOOKING_LINKS: Record<string, BookingFamily> = {
  "/services/paint-protection-film": "ppf",
  "/services/ceramic-coating": "ceramic-car",
  "/services/ceramic-coating/bike": "ceramic-bike",
  "/services/interior-detailing": "interior",
  "/services/exterior-detailing": "exterior",
  "/services/exterior-detailing/hard-water-spot-removal": "exterior",
  "/services/exterior-detailing/headlight-restoration": "headlight",
  "/services/sun-control-film/windshield-glass-coating": "glass-coating",
  "/services/maintenance-plan": "maintenance",
  "/services/car-wash": "car-wash",
};

const WHATSAPP = "https://wa.me/917406619191";

export type Booking =
  | { online: true; href: string; label: "Book online"; family: BookingFamily }
  | { online: false; href: string; label: "Book on WhatsApp"; family: null };

/** The one Book target for a page: its old booking page when it has one, else WhatsApp. */
export function bookingFor(path: string): Booking {
  const family = BOOKING_LINKS[path];
  if (family) return { online: true, href: `/service/${BOOKING_FAMILIES[family]}`, label: "Book online", family };
  return { online: false, href: WHATSAPP, label: "Book on WhatsApp", family: null };
}
