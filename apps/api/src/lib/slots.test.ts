// Run with:  node --import tsx --test server/lib/slots.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toMinutes, generateHourlySlots, isPastSlot, computeAvailability, istNow,
} from "./slots";

const open = (openTime: string, cutoffTime: string, isOpen = true, dayName = "Test") =>
  ({ isOpen, openTime, cutoffTime, dayName });

test("toMinutes parses and rejects", () => {
  assert.equal(toMinutes("10:30"), 630);
  assert.equal(toMinutes("00:00"), 0);
  assert.equal(toMinutes("23:59"), 1439);
  assert.equal(toMinutes("bad"), null);
  assert.equal(toMinutes("24:00"), null);
  assert.equal(toMinutes(""), null);
  assert.equal(toMinutes(undefined), null);
});

test("generateHourlySlots: 10:30-16:30 -> 11..16", () => {
  assert.deepEqual(generateHourlySlots(open("10:30", "16:30")),
    ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]);
});

test("generateHourlySlots: whole-hour open included", () => {
  assert.deepEqual(generateHourlySlots(open("10:00", "13:00")),
    ["10:00", "11:00", "12:00", "13:00"]);
});

test("generateHourlySlots: closed day -> none", () => {
  assert.deepEqual(generateHourlySlots(open("10:00", "18:00", false)), []);
  assert.deepEqual(generateHourlySlots(null), []);
});

test("generateHourlySlots: Sunday earlier cutoff", () => {
  assert.deepEqual(generateHourlySlots(open("10:30", "15:00")),
    ["11:00", "12:00", "13:00", "14:00", "15:00"]);
});

test("isPastSlot: only same-day, start <= now is past", () => {
  assert.equal(isPastSlot("11:00", true, 11 * 60), true);   // exactly now -> past
  assert.equal(isPastSlot("11:00", true, 10 * 60 + 30), false); // now 10:30 -> 11:00 future
  assert.equal(isPastSlot("11:00", false, 23 * 60), false);  // not today -> never past
});

test("computeAvailability: blackout date -> zero slots, reason", () => {
  const r = computeAvailability({
    hours: open("10:30", "16:30"), isBlackout: true, blackoutReason: "Independence Day",
    isToday: false, nowMinutes: 0, maxPerSlot: 3, bookedBySlot: {},
  });
  assert.equal(r.available, false);
  assert.equal(r.reason, "blackout_date");
  assert.deepEqual(r.slots, []);
  assert.deepEqual(r.availability, {});
});

test("computeAvailability: closed day -> zero slots", () => {
  const r = computeAvailability({
    hours: open("10:30", "16:30", false), isBlackout: false,
    isToday: false, nowMinutes: 0, maxPerSlot: 3, bookedBySlot: {},
  });
  assert.equal(r.available, false);
  assert.equal(r.reason, "closed_day");
  assert.deepEqual(r.slots, []);
});

test("computeAvailability: before opening excluded, after closing excluded", () => {
  const r = computeAvailability({
    hours: open("10:30", "16:30"), isBlackout: false,
    isToday: false, nowMinutes: 0, maxPerSlot: 3, bookedBySlot: {},
  });
  const ids = r.slots.map(s => s.slotId);
  assert.ok(!ids.includes("10:00"), "10:00 before open excluded");
  assert.ok(!ids.includes("17:00"), "17:00 after cutoff excluded");
  assert.ok(!ids.includes("18:00"), "18:00 after cutoff excluded");
  assert.deepEqual(ids, ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]);
});

test("computeAvailability: full slot marked unavailable", () => {
  const r = computeAvailability({
    hours: open("10:00", "13:00"), isBlackout: false,
    isToday: false, nowMinutes: 0, maxPerSlot: 3,
    bookedBySlot: { "11:00": 3, "12:00": 2 },
  });
  const byId = Object.fromEntries(r.slots.map(s => [s.slotId, s]));
  assert.equal(byId["11:00"].available, false, "full slot unavailable");
  assert.equal(byId["12:00"].available, true, "2/3 still available");
  assert.equal(byId["10:00"].available, true);
});

test("computeAvailability: same-day past slot excluded from availability", () => {
  const r = computeAvailability({
    hours: open("10:00", "16:00"), isBlackout: false,
    isToday: true, nowMinutes: 13 * 60 + 5, maxPerSlot: 3, bookedBySlot: {},
  });
  const byId = Object.fromEntries(r.slots.map(s => [s.slotId, s]));
  assert.equal(byId["13:00"].available, false, "13:00 already started -> not bookable");
  assert.equal(byId["14:00"].available, true, "14:00 future -> bookable");
});

test("istNow returns a date string and minute-of-day", () => {
  // 2026-08-04T00:00:00Z + 5.5h = 2026-08-04 05:30 IST
  const { dateStr, minutes } = istNow(new Date("2026-08-04T00:00:00Z"));
  assert.equal(dateStr, "2026-08-04");
  assert.equal(minutes, 5 * 60 + 30);
});
