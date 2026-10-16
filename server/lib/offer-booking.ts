import crypto from "crypto";
import type { Booking, PpfLead } from "@shared/schema";
import { DIWALI_OFFER } from "./diwali-offer";

/**
 * A PAID offer lead also becomes a row in `bookings`, so the studio sees it in the admin Bookings
 * tab and it flows to ERPNext through the same n8n webhook as every other paid booking.
 *
 * The lead row is kept: it is still the record of the form the customer filled in.
 *
 * What a booking needs that an offer lead does not have is filled with neutral placeholders:
 *   serviceId   a hidden (inactive) service, so the Bookings tab can name what was bought
 *   timeSlotId  no foreign key on this column; "offer-pending" marks "no slot chosen yet"
 *   date/time   null. The studio calls the customer and sets them afterwards.
 */

export const OFFER_SERVICE_SLUG = "de-dhana-dhan-slot";
export const OFFER_TIME_SLOT_ID = "offer-pending";

/** The slice of storage this module needs, so it is testable without a database. */
export interface OfferBookingStorage {
  getServiceBySlug(slug: string): Promise<{ id: string } | undefined>;
  createService(service: any): Promise<{ id: string }>;
  getBookingByPaymentOrderId(orderId: string): Promise<Booking | undefined>;
  createBooking(booking: any): Promise<Booking>;
}

async function ensureOfferService(storage: OfferBookingStorage): Promise<string> {
  const existing = await storage.getServiceBySlug(OFFER_SERVICE_SLUG);
  if (existing) return existing.id;
  try {
    const created = await storage.createService({
      title: "De Dhana Dhan Offer - Rs 99 Slot",
      slug: OFFER_SERVICE_SLUG,
      description: "Paid slot booking from the De Dhana Dhan (Dussehra & Diwali) offer page.",
      price: String(DIWALI_OFFER.amountRupees),
      duration: 0,
      // Never listed on the site or bookable by customers: it only labels offer bookings.
      isActive: false,
    });
    return created.id;
  } catch (err) {
    // Two payments confirmed at once can both try to create it; the slug is unique, so one loses.
    const raced = await storage.getServiceBySlug(OFFER_SERVICE_SLUG);
    if (raced) return raced.id;
    throw err;
  }
}

// One server process: serialises the browser confirmation and the webhook for the same order.
const inFlight = new Map<string, Promise<Booking>>();

/**
 * Create the booking for a paid offer lead, once. Returns the existing booking when there is one.
 * The lead must already be marked paid; an unpaid lead is refused.
 */
export function ensureOfferBooking(
  storage: OfferBookingStorage,
  lead: PpfLead,
): Promise<Booking> {
  const orderId = lead.razorpayOrderId;
  if (lead.paymentStatus !== "paid" || !orderId) {
    return Promise.reject(new Error("offer lead is not paid"));
  }
  const running = inFlight.get(orderId);
  if (running) return running;

  const job = (async () => {
    const existing = await storage.getBookingByPaymentOrderId(orderId);
    if (existing) return existing;
    const serviceId = await ensureOfferService(storage);
    return storage.createBooking({
      serviceId,
      timeSlotId: OFFER_TIME_SLOT_ID,
      appointmentDate: null,
      appointmentTime: null,
      customerName: lead.name,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      amount: lead.amount ?? String(DIWALI_OFFER.amountRupees),
      paymentId: lead.paymentId,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      razorpayOrderId: orderId,
      paymentVerifiedAt: lead.paymentVerifiedAt ?? new Date(),
      source: DIWALI_OFFER.source,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmContent: lead.utmContent,
      utmTerm: lead.utmTerm,
      fbclid: lead.fbclid,
      gclid: lead.gclid,
      landingPage: lead.landingPage,
      referrer: lead.referrer,
      vehicleType: lead.vehicleType,
      confirmationToken: crypto.randomBytes(32).toString("base64url"),
    });
  })().finally(() => inFlight.delete(orderId));

  inFlight.set(orderId, job);
  return job;
}
