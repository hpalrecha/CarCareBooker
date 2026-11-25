import { computeAvailability, istNow } from "./slots";

/**
 * Is this service/date/time bookable right now? The same rules the public slot picker shows
 * (blackout, closed weekday, business-hours window, past time today, per-slot capacity), run on
 * the server so a crafted request cannot hold a slot the studio does not offer.
 *
 * Pure: the caller loads the rows. Returns a customer-readable message when it is not bookable.
 */
export interface OfferSlotInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  maxPerSlot: number;
  blackout: { reason?: string | null } | undefined;
  hours: { isOpen: boolean; openTime: string; cutoffTime: string; dayName?: string } | null | undefined;
  /** Bookings already holding this slot. */
  bookedForSlot: number;
  now?: Date;
}

export function checkOfferSlot(input: OfferSlotInput): { ok: true } | { ok: false; message: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date + "T00:00:00Z"))) {
    return { ok: false, message: "Please choose a valid date." };
  }
  const { dateStr, minutes } = istNow(input.now ?? new Date());
  if (input.date < dateStr) {
    return { ok: false, message: "That date has passed. Please choose another date." };
  }
  const result = computeAvailability({
    hours: input.hours ?? undefined,
    isBlackout: !!input.blackout,
    blackoutReason: input.blackout?.reason ?? null,
    isToday: input.date === dateStr,
    nowMinutes: minutes,
    maxPerSlot: input.maxPerSlot,
    bookedBySlot: { [input.time]: input.bookedForSlot },
  });
  if (!result.available && result.reason) {
    return { ok: false, message: result.reasonText || "That date is not available. Please choose another date." };
  }
  const slot = result.slots.find((s) => s.slotId === input.time);
  if (!slot) return { ok: false, message: "That time is not offered on this day. Please choose another time." };
  if (slot.past) return { ok: false, message: "That time has already passed. Please choose a later time." };
  if (!slot.available) return { ok: false, message: "That time slot is full. Please choose another time." };
  return { ok: true };
}
