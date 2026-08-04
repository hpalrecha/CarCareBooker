// Run with:  node --import tsx --test server/lib/booking-validation.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAppointmentSlot, type SlotValidationDeps } from "./booking-validation";

const makeDeps = (over: Partial<{
  blackouts: Array<{ date: string; reason: string }>;
  hours: { isOpen: boolean; openTime: string; cutoffTime: string; dayName: string } | undefined;
  count: number;
}> = {}): SlotValidationDeps => ({
  getAllBlackoutDates: async () => over.blackouts ?? [],
  getBusinessHoursForDay: async () => over.hours ?? { isOpen: true, openTime: "10:30", cutoffTime: "16:30", dayName: "Test" },
  getBookingCountForSlot: async () => over.count ?? 0,
});

const base = {
  serviceId: "svc", date: "2026-08-20", time: "12:00", timeSlotId: "12:00", maxPerSlot: 3,
  now: new Date("2026-08-19T00:00:00Z"),
};

test("valid slot passes", async () => {
  const r = await validateAppointmentSlot(makeDeps(), base);
  assert.equal(r.ok, true);
});

test("blackout date rejected", async () => {
  const r = await validateAppointmentSlot(
    makeDeps({ blackouts: [{ date: "2026-08-20", reason: "Holiday" }] }), base);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "blackout_date");
  assert.equal(r.status, 400);
});

test("closed day rejected", async () => {
  const r = await validateAppointmentSlot(
    makeDeps({ hours: { isOpen: false, openTime: "10:30", cutoffTime: "16:30", dayName: "Sunday" } }), base);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "closed_day");
});

test("after cutoff rejected", async () => {
  const r = await validateAppointmentSlot(makeDeps(), { ...base, time: "17:00", timeSlotId: "17:00" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "after_cutoff");
});

test("before opening rejected", async () => {
  const r = await validateAppointmentSlot(makeDeps(), { ...base, time: "10:00", timeSlotId: "10:00" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "before_open");
});

test("full slot rejected with 409", async () => {
  const r = await validateAppointmentSlot(makeDeps({ count: 3 }), base);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "full");
  assert.equal(r.status, 409);
});

test("past same-day time rejected", async () => {
  // now = 2026-08-20 14:00 IST; slot 12:00 is past
  const r = await validateAppointmentSlot(makeDeps(), {
    ...base, date: "2026-08-20", time: "12:00", timeSlotId: "12:00",
    now: new Date("2026-08-20T08:30:00Z"), // +5.5h = 14:00 IST
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "past");
});

test("invalid date/time rejected", async () => {
  const r = await validateAppointmentSlot(makeDeps(), { ...base, time: "bad" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "invalid");
});
