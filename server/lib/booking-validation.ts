// Shared appointment-slot validation used by both customer booking creation and
// admin edit. Checks blackout dates, business hours, past times and capacity against
// the live configuration. Pure orchestration over the storage layer so it can be
// unit-tested with a fake storage.

import { generateHourlySlots, toMinutes, istNow } from "./slots";

export interface SlotValidationDeps {
  getAllBlackoutDates(): Promise<Array<{ date: string; reason: string }>>;
  getBusinessHoursForDay(dayOfWeek: number): Promise<
    { isOpen: boolean; openTime: string; cutoffTime: string; dayName: string } | undefined
  >;
  getBookingCountForSlot(serviceId: string, date: string, timeSlotId: string): Promise<number>;
}

export interface SlotValidationInput {
  serviceId: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM (appointment time)
  timeSlotId: string;    // hour-string slot key used for capacity
  maxPerSlot: number;
  now?: Date;            // injectable for tests
}

export interface SlotValidationResult {
  ok: boolean;
  status: number;        // HTTP status to use on failure
  message: string;
  reason?: "blackout_date" | "closed_day" | "after_cutoff" | "before_open" | "past" | "full" | "invalid";
}

const OK: SlotValidationResult = { ok: true, status: 200, message: "ok" };

export async function validateAppointmentSlot(
  deps: SlotValidationDeps,
  input: SlotValidationInput,
): Promise<SlotValidationResult> {
  const { serviceId, date, time, timeSlotId, maxPerSlot } = input;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toMinutes(time) == null) {
    return { ok: false, status: 400, message: "Invalid appointment date or time.", reason: "invalid" };
  }

  // Blackout
  const blackouts = await deps.getAllBlackoutDates();
  const blackout = blackouts.find((b) => b.date === date);
  if (blackout) {
    return {
      ok: false, status: 400, reason: "blackout_date",
      message: `Booking not available for this day – ${blackout.reason}. Please choose another date.`,
    };
  }

  // Business hours for the weekday
  const dayOfWeek = new Date(date + "T00:00:00").getDay();
  const hours = await deps.getBusinessHoursForDay(dayOfWeek);
  if (hours) {
    if (!hours.isOpen) {
      return { ok: false, status: 400, reason: "closed_day", message: `Sorry, we are closed on ${hours.dayName}. Please select another day.` };
    }
    if (time > hours.cutoffTime) {
      return { ok: false, status: 400, reason: "after_cutoff", message: `Bookings after ${hours.cutoffTime} are not available on ${hours.dayName}. Please select an earlier time.` };
    }
    if (time < hours.openTime) {
      return { ok: false, status: 400, reason: "before_open", message: `We open at ${hours.openTime} on ${hours.dayName}. Please select a later time.` };
    }
  }

  // Past time (same-day, IST)
  const { dateStr: todayIST, minutes: nowMin } = istNow(input.now ?? new Date());
  if (date === todayIST) {
    const slotMin = toMinutes(time)!;
    if (slotMin <= nowMin) {
      return { ok: false, status: 400, reason: "past", message: "This time slot has already passed. Please select a future time slot." };
    }
  }

  // Capacity
  const count = await deps.getBookingCountForSlot(serviceId, date, timeSlotId);
  if (count >= maxPerSlot) {
    return { ok: false, status: 409, reason: "full", message: `This time slot is fully booked (max ${maxPerSlot} bookings). Please select a different time slot.` };
  }

  return OK;
}
