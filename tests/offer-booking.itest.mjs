/**
 * A paid offer lead becomes exactly one booking.
 *
 *   node --import tsx --test tests/offer-booking.itest.mjs
 *
 * Uses an in-memory fake of the storage methods the helper needs, so no database is touched.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureOfferBooking, OFFER_SERVICE_SLUG, OFFER_TIME_SLOT_ID } from "../server/lib/offer-booking.ts";

function fakeStorage() {
  const services = [];
  const bookings = [];
  return {
    services,
    bookings,
    async getServiceBySlug(slug) {
      return services.find((s) => s.slug === slug);
    },
    async createService(s) {
      const row = { id: `svc-${services.length + 1}`, ...s };
      services.push(row);
      return row;
    },
    async getBookingByPaymentOrderId(orderId) {
      return bookings.find((b) => b.razorpayOrderId === orderId);
    },
    async createBooking(b) {
      await new Promise((r) => setTimeout(r, 5)); // widen the race window
      const row = { id: `bk-${bookings.length + 1}`, ...b };
      bookings.push(row);
      return row;
    },
  };
}

const paidLead = {
  id: "lead-1",
  name: "Jeevan",
  email: "j@example.com",
  phone: "8105444699",
  vehicleType: "car",
  amount: "99.00",
  paymentStatus: "paid",
  paymentId: "pay_1",
  razorpayOrderId: "order_1",
  paymentVerifiedAt: new Date("2026-10-16T06:44:24Z"),
  utmSource: null,
};

test("creates a paid, confirmed booking with no slot and a hidden service", async () => {
  const st = fakeStorage();
  const b = await ensureOfferBooking(st, paidLead);
  assert.equal(b.paymentStatus, "paid");
  assert.equal(b.bookingStatus, "confirmed");
  assert.equal(b.razorpayOrderId, "order_1");
  assert.equal(b.paymentId, "pay_1");
  assert.equal(b.amount, "99.00");
  assert.equal(b.source, "diwali_offer");
  assert.equal(b.appointmentDate, null);
  assert.equal(b.timeSlotId, OFFER_TIME_SLOT_ID);
  assert.ok(b.confirmationToken.length >= 40);
  assert.equal(st.services.length, 1);
  assert.equal(st.services[0].slug, OFFER_SERVICE_SLUG);
  assert.equal(st.services[0].isActive, false);
});

test("a replay and a concurrent delivery do not create a second booking", async () => {
  const st = fakeStorage();
  const [a, b] = await Promise.all([ensureOfferBooking(st, paidLead), ensureOfferBooking(st, paidLead)]);
  const c = await ensureOfferBooking(st, paidLead);
  assert.equal(st.bookings.length, 1);
  assert.equal(a.id, b.id);
  assert.equal(a.id, c.id);
  assert.equal(st.services.length, 1);
});

test("an unpaid lead never becomes a booking", async () => {
  const st = fakeStorage();
  await assert.rejects(ensureOfferBooking(st, { ...paidLead, paymentStatus: "pending" }));
  await assert.rejects(ensureOfferBooking(st, { ...paidLead, razorpayOrderId: null }));
  assert.equal(st.bookings.length, 0);
});
