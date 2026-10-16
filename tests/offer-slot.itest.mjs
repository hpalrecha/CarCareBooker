/**
 * checkOfferSlot: the server-side slot rules for the paid offer form.
 *
 *   node --import tsx --test tests/offer-slot.itest.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOfferSlot } from "../server/lib/offer-slot.ts";

const open = { isOpen: true, openTime: "10:00", cutoffTime: "18:00", dayName: "Monday" };
const now = new Date("2026-10-20T06:00:00Z"); // 11:30 IST on 2026-10-20
const base = { date: "2026-10-22", time: "11:00", maxPerSlot: 3, blackout: undefined, hours: open, bookedForSlot: 0, now };

test("an open future slot is ok", () => {
  assert.deepEqual(checkOfferSlot(base), { ok: true });
});

test("blackout, closed day, past date, past time today, full slot, off-hours time are all refused", () => {
  assert.equal(checkOfferSlot({ ...base, blackout: { reason: "Diwali" } }).ok, false);
  assert.equal(checkOfferSlot({ ...base, hours: { ...open, isOpen: false } }).ok, false);
  assert.equal(checkOfferSlot({ ...base, date: "2026-10-19" }).ok, false);
  assert.equal(checkOfferSlot({ ...base, date: "2026-10-20", time: "11:00" }).ok, false, "11:00 has started at 11:30 IST");
  assert.equal(checkOfferSlot({ ...base, date: "2026-10-20", time: "14:00" }).ok, true);
  assert.equal(checkOfferSlot({ ...base, bookedForSlot: 3 }).ok, false);
  assert.equal(checkOfferSlot({ ...base, time: "20:00" }).ok, false);
  assert.equal(checkOfferSlot({ ...base, time: "11:30" }).ok, false);
  assert.equal(checkOfferSlot({ ...base, date: "not-a-date" }).ok, false);
});

test("the refusal is a readable sentence", () => {
  const r = checkOfferSlot({ ...base, bookedForSlot: 3 });
  assert.equal(r.ok, false);
  assert.match(r.message, /full/i);
});
