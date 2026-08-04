// Pure, testable helpers for computing bookable time slots.
//
// The booking model keys capacity on (serviceId, appointmentDate, hourString) where
// hourString is like "11:00". The `time_slots` table is not wired into booking capacity
// (bookings store the hour string directly), so availability is generated from the
// configured business_hours for the weekday, then filtered by blackout dates, past times
// and per-slot capacity. This keeps the customer-facing calendar consistent with the
// server-side validation in POST /api/bookings.

export interface BusinessHoursLike {
  isOpen: boolean;
  openTime: string;   // "HH:MM"
  cutoffTime: string; // "HH:MM" — last time a slot may START
  dayName?: string;
}

/** Parse "HH:MM" to minutes since midnight. Returns null for malformed input. */
export function toMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Format minutes-since-midnight to a whole-hour "HH:00" slot id. */
export function hourSlotId(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Generate the hourly slot ids that fall within a day's opening window.
 * First slot is the first whole hour >= openTime; last slot is the last whole
 * hour <= cutoffTime. Example: open 10:30, cutoff 16:30 -> 11,12,13,14,15,16.
 */
export function generateHourlySlots(hours: BusinessHoursLike | null | undefined): string[] {
  if (!hours || !hours.isOpen) return [];
  const open = toMinutes(hours.openTime);
  const cutoff = toMinutes(hours.cutoffTime);
  if (open == null || cutoff == null || cutoff < open) return [];

  const firstHour = Math.ceil(open / 60);
  const lastHour = Math.floor(cutoff / 60);
  const slots: string[] = [];
  for (let h = firstHour; h <= lastHour; h++) slots.push(hourSlotId(h));
  return slots;
}

/**
 * Is a whole-hour slot in the past for a same-day booking?
 * `nowMinutes` is the current time-of-day in minutes (IST), only meaningful when
 * the requested date equals today. A slot is past if its start <= now.
 */
export function isPastSlot(slotId: string, isToday: boolean, nowMinutes: number): boolean {
  if (!isToday) return false;
  const s = toMinutes(slotId);
  if (s == null) return false;
  return s <= nowMinutes;
}

export interface AvailabilityInput {
  hours: BusinessHoursLike | null | undefined;
  isBlackout: boolean;
  blackoutReason?: string | null;
  isToday: boolean;
  nowMinutes: number;
  maxPerSlot: number;
  /** booked count per slot id; missing = 0 */
  bookedBySlot: Record<string, number>;
}

export interface AvailabilityResult {
  available: boolean;                 // is the DATE bookable at all
  reason: string | null;              // "blackout_date" | "closed_day" | null
  reasonText?: string;
  maxPerSlot: number;
  slots: Array<{ slotId: string; booked: number; max: number; available: boolean; past: boolean }>;
  // legacy shape kept for the existing frontend: availability[slotId] = {booked,max,available}
  availability: Record<string, { booked: number; max: number; available: boolean }>;
}

/** Compute the full availability payload for one service/date. Pure. */
export function computeAvailability(input: AvailabilityInput): AvailabilityResult {
  const { hours, isBlackout, isToday, nowMinutes, maxPerSlot, bookedBySlot } = input;

  if (isBlackout) {
    return {
      available: false, reason: "blackout_date",
      reasonText: input.blackoutReason || "This date is unavailable.",
      maxPerSlot, slots: [], availability: {},
    };
  }
  if (!hours || !hours.isOpen) {
    return {
      available: false, reason: "closed_day",
      reasonText: hours?.dayName ? `Closed on ${hours.dayName}.` : "Closed on this day.",
      maxPerSlot, slots: [], availability: {},
    };
  }

  const ids = generateHourlySlots(hours);
  const slots = ids.map((slotId) => {
    const booked = bookedBySlot[slotId] || 0;
    const past = isPastSlot(slotId, isToday, nowMinutes);
    return { slotId, booked, max: maxPerSlot, past, available: !past && booked < maxPerSlot };
  });

  const availability: Record<string, { booked: number; max: number; available: boolean }> = {};
  for (const s of slots) availability[s.slotId] = { booked: s.booked, max: s.max, available: s.available };

  return { available: slots.some((s) => s.available), reason: null, maxPerSlot, slots, availability };
}

/** Current IST time-of-day in minutes and the IST date string, from a UTC Date. */
export function istNow(now: Date): { dateStr: string; minutes: number } {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    dateStr: ist.toISOString().split("T")[0],
    minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}
