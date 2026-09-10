/**
 * Step 1 — the campaign HTTP endpoints, against the REAL route handlers.
 *
 *   npm run test:integration
 *
 * The unit tests in campaign-window.itest.mjs prove the LOGIC. This proves the WIRING:
 * that the routes are mounted, that admin endpoints are authenticated, that validation is
 * actually reached, and that overlap is refused at the API rather than only detected in a
 * function nobody called.
 *
 * The database is an in-memory double — the only reachable Postgres is production, and
 * creating campaigns there to make a test pass is not acceptable. Everything above
 * storage is the code that ships.
 */
import { test, describe, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";

const db = { campaigns: new Map(), services: new Map(), settings: new Map(), bookings: new Map() };
let seq = 0;

const storage = {
  getAllCampaigns: async () => [...db.campaigns.values()],
  getCampaign: async (id) => db.campaigns.get(id),
  getCampaignByIdentifier: async (identifier) =>
    [...db.campaigns.values()].find((c) => c.identifier === identifier),
  createCampaign: async (values) => {
    const row = { id: "cmp_" + ++seq, createdAt: new Date(), updatedAt: new Date(), ...values };
    db.campaigns.set(row.id, row);
    return row;
  },
  updateCampaign: async (id, patch) => {
    const row = db.campaigns.get(id);
    Object.assign(row, patch, { updatedAt: new Date() });
    return row;
  },
  getServiceBySlug: async (slug) => db.services.get(slug),
  getService: async (id) => [...db.services.values()].find((s) => s.id === id),
  getSetting: async (k) => db.settings.get(k),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async () => ({ dayOfWeek: 0, dayName: "D", isOpen: true, openTime: "00:00", cutoffTime: "23:59" }),
  getBookingCountForSlot: async () => 0,
  createBooking: async (values) => {
    const b = { id: "bk_" + ++seq, ...values };
    db.bookings.set(b.id, b);
    return b;
  },
  createBookingWithCapacity: async (values) => storage.createBooking(values),
  updateBooking: async (id, patch) => { Object.assign(db.bookings.get(id), patch); return db.bookings.get(id); },
  getBooking: async (id) => db.bookings.get(id),
  getBookingByConfirmationToken: async () => undefined,
  getBookingByPaymentOrderId: async () => undefined,
  getTimeSlot: async () => ({ id: "ts", startTime: "10:00 AM", endTime: "11:00 AM" }),
  getBookingsByStatus: async () => [],
  getAdmin: async (id) => (id === "admin-1" ? { id: "admin-1", email: "a@p91.test", name: "Admin" } : undefined),
};

class SlotFullError extends Error {}
mock.module("../server/storage.ts", { exports: { storage, SlotFullError } });
mock.module("../server/services/payment.ts", {
  exports: {
    createPaymentOrder: async (amount) => ({ id: "order_" + ++seq, amount: amount * 100, currency: "INR" }),
    verifyPaymentSignature: async () => true,
  },
});
mock.module("../server/services/whatsapp.ts", {
  exports: { whatsappService: { sendBookingConfirmation: async () => ({ success: true, messageId: "w" }) } },
});
mock.module("../server/services/scheduler.ts", { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module("../server/services/email.ts", { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module("../server/services/webhook.ts", { exports: { sendBookingWebhook: async () => ({ ok: true }) } });

let server;
let base;

/**
 * Admin auth is a session cookie. Rather than fake the middleware — which would stop this
 * file from proving that the routes ARE authenticated — a tiny shim installs the session
 * before the real routes see the request, and only for requests carrying a test header.
 * Requests without it flow through the genuine authenticateAdmin and must be refused.
 */
before(async () => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/none";
  process.env.SESSION_SECRET = "campaign-api-test-secret";
  process.env.RAZORPAY_KEY_ID = "rzp_test_fake";
  process.env.RAZORPAY_KEY_SECRET = "fake";
  process.env.RAZORPAY_WEBHOOK_SECRET = "fake";
  process.env.NODE_ENV = "test";

  const { registerRoutes } = await import("../server/routes.ts");
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
  app.use((req, _res, next) => {
    if (req.headers["x-test-admin"] === "1") {
      Object.defineProperty(req, "session", {
        value: { adminId: "admin-1", destroy: (cb) => cb?.(), save: (cb) => cb?.() },
        configurable: true,
        writable: true,
      });
    }
    next();
  });
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => { if (server) await new Promise((r) => server.close(r)); });

beforeEach(() => {
  db.campaigns.clear(); db.services.clear(); db.settings.clear(); db.bookings.clear();
  db.services.set("1-year-ceramic-coating", {
    id: "svc-ceramic", slug: "1-year-ceramic-coating", title: "1 Year Ceramic Coating",
    price: "5999.00", duration: 420, isActive: true, maxBookingsPerSlot: 3,
  });
  db.services.set("retired-service", {
    id: "svc-old", slug: "retired-service", title: "Retired", price: "100.00", duration: 60, isActive: false,
  });
  db.settings.set("booking_amount", { key: "booking_amount", value: "299" });
});

const req = async (method, path, body, admin = false) => {
  const headers = { "Content-Type": "application/json" };
  if (admin) headers["x-test-admin"] = "1";
  const res = await fetch(base + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

/** Far-future window so these tests never expire. */
const FUTURE_START = "2030-09-09T00:00:00+05:30";
const FUTURE_END = "2030-09-17T00:00:00+05:30";
/** A window that is running right now, whenever "now" happens to be. */
const runningWindow = () => ({
  startsAt: new Date(Date.now() - 86_400_000).toISOString(),
  endsAt: new Date(Date.now() + 86_400_000).toISOString(),
});

const validBody = (over = {}) => ({
  name: "September Ceramic Car",
  identifier: "ceramic_car_sep",
  serviceSlug: "1-year-ceramic-coating",
  vehicleType: "car",
  landingPage: "/ceramic-coating/car",
  startsAt: FUTURE_START,
  endsAt: FUTURE_END,
  isActive: true,
  offerType: "free_booking",
  offerTitle: "Free booking this week",
  offerDescription: "Book at no cost; the service is charged at the studio.",
  ctaText: "Book Free Appointment",
  ...over,
});

// ===========================================================================
describe("admin campaign endpoints are authenticated", () => {
  test("all three refuse an unauthenticated caller", async () => {
    assert.equal((await req("GET", "/api/admin/campaigns")).status, 401);
    assert.equal((await req("POST", "/api/admin/campaigns", validBody())).status, 401);
    assert.equal((await req("PATCH", "/api/admin/campaigns/cmp_1", { isActive: false })).status, 401);
    assert.equal(db.campaigns.size, 0, "nothing was written");
  });
});

describe("POST /api/admin/campaigns — server-side validation", () => {
  test("accepts a well-formed campaign", async () => {
    const r = await req("POST", "/api/admin/campaigns", validBody(), true);
    assert.equal(r.status, 200);
    assert.equal(r.body.identifier, "ceramic_car_sep");
    assert.equal(r.body.state, "scheduled", "state is computed, not stored");
    assert.equal(db.campaigns.size, 1);
  });

  test("rejects a malformed body with field-keyed errors", async () => {
    const r = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "BAD IDENT", vehicleType: "boat", ctaText: "", landingPage: "/nope",
    }), true);
    assert.equal(r.status, 400);
    for (const f of ["identifier", "vehicleType", "ctaText", "landingPage"]) {
      assert.ok(r.body.fieldErrors[f], `${f} reported`);
    }
    assert.equal(db.campaigns.size, 0, "nothing written");
  });

  test("rejects a timestamp with no timezone offset", async () => {
    const r = await req("POST", "/api/admin/campaigns", validBody({ startsAt: "2030-09-09T00:00:00" }), true);
    assert.equal(r.status, 400);
    assert.match(r.body.fieldErrors.startsAt, /timezone offset/);
  });

  test("rejects end <= start", async () => {
    const r = await req("POST", "/api/admin/campaigns", validBody({ startsAt: FUTURE_END, endsAt: FUTURE_START }), true);
    assert.equal(r.status, 400);
    assert.ok(r.body.fieldErrors.endsAt);
  });

  test("rejects a service that does not exist or is inactive", async () => {
    const missing = await req("POST", "/api/admin/campaigns", validBody({ serviceSlug: "no-such-service" }), true);
    assert.equal(missing.status, 400);
    assert.ok(missing.body.fieldErrors.serviceSlug);

    const inactive = await req("POST", "/api/admin/campaigns", validBody({ serviceSlug: "retired-service" }), true);
    assert.equal(inactive.status, 400, "a campaign must not advertise an unbookable service");
  });

  test("rejects a duplicate identifier", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true);
    const dup = await req("POST", "/api/admin/campaigns", validBody({ name: "Another" }), true);
    assert.equal(dup.status, 409);
    assert.ok(dup.body.fieldErrors.identifier);
    assert.equal(db.campaigns.size, 1);
  });

  test("rejects unknown fields — a stray `price` must not be silently ignored", async () => {
    const r = await req("POST", "/api/admin/campaigns", { ...validBody(), price: "1" }, true);
    assert.equal(r.status, 400, "the sender believed price would do something; say it will not");
  });
});

describe("overlap is refused at the API, not just resolved at read time", () => {
  test("a second active campaign overlapping the same landing page is refused", async () => {
    assert.equal((await req("POST", "/api/admin/campaigns", validBody(), true)).status, 200);

    const overlap = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "ceramic_car_sep_b", name: "Overlapping",
      startsAt: "2030-09-12T00:00:00+05:30", endsAt: "2030-09-20T00:00:00+05:30",
    }), true);

    assert.equal(overlap.status, 409);
    assert.match(overlap.body.message, /overlaps/i);
    assert.equal(overlap.body.conflicts.length, 1);
    assert.equal(overlap.body.conflicts[0].identifier, "ceramic_car_sep");
    assert.equal(db.campaigns.size, 1, "the ambiguous campaign was not created");
  });

  test("an ADJACENT campaign is allowed", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true);
    const next = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "ceramic_car_oct", name: "October",
      startsAt: FUTURE_END, endsAt: "2030-09-30T00:00:00+05:30",
    }), true);
    assert.equal(next.status, 200, "half-open windows make back-to-back campaigns legal");
  });

  test("a PAUSED overlapping campaign is allowed — drafts must be preparable", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true);
    const draft = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "ceramic_car_draft", name: "Next month draft", isActive: false,
    }), true);
    assert.equal(draft.status, 200);
  });

  test("a campaign on a DIFFERENT landing page is allowed", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true);
    const other = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "ppf_sep", name: "PPF", landingPage: "/ppf",
    }), true);
    assert.equal(other.status, 200);
  });

  test("activating a paused draft that would overlap is refused", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true);
    const draft = await req("POST", "/api/admin/campaigns", validBody({
      identifier: "ceramic_car_draft", name: "Draft", isActive: false,
    }), true);

    const activate = await req("PATCH", `/api/admin/campaigns/${draft.body.id}`, { isActive: true }, true);
    assert.equal(activate.status, 409, "the overlap check runs on edit too");
    assert.equal(db.campaigns.get(draft.body.id).isActive, false, "still paused");
  });
});

describe("PATCH /api/admin/campaigns/:id", () => {
  test("validates the MERGED record, not the patch alone", async () => {
    const created = await req("POST", "/api/admin/campaigns", validBody(), true);
    // Only endsAt is sent; it must still be checked against the STORED startsAt.
    const bad = await req("PATCH", `/api/admin/campaigns/${created.body.id}`, {
      endsAt: "2030-09-01T00:00:00+05:30",
    }, true);
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fieldErrors.endsAt, "end-before-start caught with only one field sent");
  });

  test("pause and resume work", async () => {
    const created = await req("POST", "/api/admin/campaigns", validBody(), true);
    const paused = await req("PATCH", `/api/admin/campaigns/${created.body.id}`, { isActive: false }, true);
    assert.equal(paused.status, 200);
    assert.equal(paused.body.isActive, false);
    assert.equal(paused.body.state, "paused");

    const resumed = await req("PATCH", `/api/admin/campaigns/${created.body.id}`, { isActive: true }, true);
    assert.equal(resumed.body.state, "scheduled");
  });

  test("a 404 for an unknown campaign", async () => {
    assert.equal((await req("PATCH", "/api/admin/campaigns/nope", { isActive: false }, true)).status, 404);
  });
});

describe("GET /api/campaigns/active — public resolution", () => {
  test("returns null and a server clock when nothing is running", async () => {
    const r = await req("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar");
    assert.equal(r.status, 200);
    assert.equal(r.body.campaign, null);
    assert.ok(Number.isFinite(Date.parse(r.body.serverNow)), "serverNow is always present");
  });

  test("requires a landing page", async () => {
    assert.equal((await req("GET", "/api/campaigns/active")).status, 400);
  });

  test("returns the running campaign, and never leaks internals", async () => {
    await req("POST", "/api/admin/campaigns", validBody({ ...runningWindow() }), true);

    const r = await req("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar");
    assert.equal(r.status, 200);
    assert.equal(r.body.campaign.identifier, "ceramic_car_sep");
    assert.equal(r.body.campaign.offerType, "free_booking");
    assert.equal(r.body.campaign.ctaText, "Book Free Appointment");
    assert.ok(Number.isFinite(Date.parse(r.body.campaign.endsAt)), "endsAt drives the countdown");

    for (const internal of ["createdBy", "id", "updatedAt"]) {
      assert.ok(!(internal in r.body.campaign), `${internal} must not be public`);
    }
  });

  test("a scheduled or expired campaign is not served", async () => {
    await req("POST", "/api/admin/campaigns", validBody(), true); // 2030 — scheduled
    const r = await req("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar");
    assert.equal(r.body.campaign, null, "a future campaign is not an offer yet");
  });

  test("a paused campaign is invisible to customers", async () => {
    await req("POST", "/api/admin/campaigns", validBody({ ...runningWindow(), isActive: false }), true);
    const r = await req("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar");
    assert.equal(r.body.campaign, null);
  });

  test("serverNow tracks the server clock, which is what makes the countdown device-independent", async () => {
    const before = Date.now();
    const r = await req("GET", "/api/campaigns/active?landingPage=%2Fppf");
    const reported = Date.parse(r.body.serverNow);
    assert.ok(reported >= before - 1000 && reported <= Date.now() + 1000);
  });
});

describe("booking under a campaign", () => {
  const bookingBody = (over = {}) => ({
    serviceId: "svc-ceramic",
    timeSlotId: "10:00",
    appointmentDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    appointmentTime: "10:00",
    customerName: "Campaign Customer",
    customerEmail: "c@example.com",
    customerPhone: "9876500011",
    ...over,
  });

  test("NO campaign: the booking fee is charged exactly as before", async () => {
    const r = await req("POST", "/api/bookings", bookingBody());
    assert.equal(r.status, 200);
    const stored = db.bookings.get(r.body.booking.id);
    assert.equal(stored.amount, "299");
    assert.equal(stored.paymentStatus, "pending", "a paid booking, unchanged");
    assert.equal(stored.campaignId, null);
    assert.equal(stored.campaignIdentifier, null);
  });

  test("ACTIVE free_booking campaign: nothing is charged, and the campaign is snapshotted", async () => {
    await req("POST", "/api/admin/campaigns", validBody({ ...runningWindow() }), true);

    const r = await req("POST", "/api/bookings", bookingBody());
    assert.equal(r.status, 200);
    assert.equal(r.body.freeBooking, true);

    const stored = db.bookings.get(r.body.booking.id);
    assert.equal(stored.amount, "0.00");
    assert.equal(stored.paymentStatus, "free");
    assert.equal(stored.campaignIdentifier, "ceramic_car_sep", "snapshot written");
    assert.ok(stored.campaignId, "join key written too");
    assert.equal(stored.vehicleType, "car", "vehicle carried from the campaign");
  });

  test("the snapshot SURVIVES the campaign being renamed", async () => {
    const created = await req("POST", "/api/admin/campaigns", validBody({ ...runningWindow() }), true);
    const booking = await req("POST", "/api/bookings", bookingBody());
    const bookingId = booking.body.booking.id;
    assert.equal(db.bookings.get(bookingId).campaignIdentifier, "ceramic_car_sep");

    // Admin renames the campaign a month later.
    const renamed = await req("PATCH", `/api/admin/campaigns/${created.body.id}`, {
      identifier: "ceramic_car_sep_v2", name: "Renamed",
    }, true);
    assert.equal(renamed.status, 200);

    assert.equal(
      db.bookings.get(bookingId).campaignIdentifier,
      "ceramic_car_sep",
      "history is NOT rewritten by an admin edit",
    );
  });

  test("an `offerType: none` campaign does not touch pricing", async () => {
    await req("POST", "/api/admin/campaigns", validBody({ ...runningWindow(), offerType: "none" }), true);
    const r = await req("POST", "/api/bookings", bookingBody());
    const stored = db.bookings.get(r.body.booking.id);
    assert.equal(stored.amount, "299", "presentation-only campaigns charge normally");
    assert.equal(stored.campaignIdentifier, null, "and are not recorded as the cause of a free booking");
  });

  test("an EXPIRED campaign charges normally again", async () => {
    await req("POST", "/api/admin/campaigns", validBody({
      startsAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 86400000).toISOString(),
    }), true);
    const r = await req("POST", "/api/bookings", bookingBody());
    assert.equal(db.bookings.get(r.body.booking.id).amount, "299");
  });

  test("LEGACY free_booking_until still works with no campaigns at all", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    db.settings.set("free_booking_until", { key: "free_booking_until", value: tomorrow });

    const r = await req("POST", "/api/bookings", bookingBody());
    assert.equal(r.body.freeBooking, true, "the legacy path is untouched");
    const stored = db.bookings.get(r.body.booking.id);
    assert.equal(stored.amount, "0.00");
    assert.equal(stored.campaignIdentifier, null, "no campaign caused this one");
  });
});
