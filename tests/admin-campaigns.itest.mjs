/**
 * Phase 2F — Admin Campaigns.
 *
 *   npm run test:integration
 *
 * Two halves:
 *
 *   the IST boundary   lib/ist-time.ts turns what an admin TYPES into an absolute instant.
 *                      Get this wrong and a campaign opens or closes at the wrong hour for
 *                      every customer, silently. It is the highest-risk code in the phase
 *                      and it is pure, so it is tested directly.
 *
 *   the admin API      driven over real HTTP against the real routes, with a faked
 *                      database. Nothing here writes to production, and no migration is
 *                      run against it.
 */
import { test, describe, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { __resetRateLimitsForTests } from "../server/lib/rate-limit.ts";
import {
  istLocalToInstant,
  instantToIstLocal,
  formatIst,
  IST_OFFSET,
} from "../client/src/lib/ist-time.ts";
import { campaignState } from "../shared/campaign.ts";

// ===========================================================================
// The timezone boundary
// ===========================================================================
describe("IST conversion — what the admin types becomes the right instant", () => {
  test("a typed local time becomes an explicit +05:30 instant", () => {
    assert.equal(istLocalToInstant("2026-09-17T00:00"), "2026-09-17T00:00:00+05:30");
    assert.equal(istLocalToInstant("2026-09-09T09:30"), "2026-09-09T09:30:00+05:30");
  });

  test("the instant is correct regardless of where the browser is", () => {
    // THE bug this prevents: `new Date("2026-09-17T00:00")` is parsed in the BROWSER's
    // zone, so the same form filled identically in London and Bangalore would schedule
    // two different moments.
    const iso = istLocalToInstant("2026-09-17T00:00");
    assert.equal(Date.parse(iso), Date.parse("2026-09-16T18:30:00Z"), "midnight IST is 18:30 UTC");
  });

  test("round-trips through the form field without drifting", () => {
    for (const local of ["2026-09-09T00:00", "2026-09-16T23:59", "2027-01-01T12:00"]) {
      assert.equal(instantToIstLocal(istLocalToInstant(local)), local, `${local} survives a round trip`);
    }
  });

  test("an instant is rendered AS IST, not as the machine's local time", () => {
    // 18:30 UTC is midnight IST the following day.
    assert.equal(instantToIstLocal("2026-09-16T18:30:00Z"), "2026-09-17T00:00");
  });

  test("incomplete or malformed input yields null, never a wrong instant", () => {
    for (const bad of ["", null, undefined, "2026-09-17", "17/09/2026", "2026-09-17T", "nonsense", "2026-13-01T00:00"]) {
      assert.equal(istLocalToInstant(bad), null, `${JSON.stringify(bad)} must not become an instant`);
    }
  });

  test("formatIst names the zone, so a reader cannot assume it is their own", () => {
    const s = formatIst("2026-09-16T18:30:00Z");
    assert.match(s, /IST$/);
    // 18:30 UTC is 00:00 on the SEVENTEENTH in Bangalore. Asserting the day and year
    // rather than the month's abbreviation, because ICU renders en-IN September as
    // "Sept" on some Node builds and "Sep" on others — pinning the spelling would make
    // this fail on a different machine for a reason that is not about timezones.
    assert.match(s, /^17 \w+ 2026/, "rendered in Bangalore time, not UTC");
    assert.ok(!/^16 /.test(s), "must not show the UTC calendar day");
  });

  test("only ONE timezone convention exists in the codebase", () => {
    // server/lib/booking-amount.ts already hardcodes +05:30 for the legacy window. A
    // second convention (an Intl-based conversion, say) is the likeliest source of a
    // future off-by-one-day bug.
    assert.equal(IST_OFFSET, "+05:30");
  });
});

describe("campaign window boundaries, expressed in IST business terms", () => {
  const base = {
    id: "c1", name: "Sept", identifier: "sept", serviceSlug: "svc",
    vehicleType: "car", landingPage: "/ppf",
    // "Runs 9 Sep through 16 Sep" — so it ends AT midnight on the 17th.
    startsAt: istLocalToInstant("2026-09-09T00:00"),
    endsAt: istLocalToInstant("2026-09-17T00:00"),
    isActive: true, offerType: "free_booking", offerTitle: "t", ctaText: "c",
    createdAt: "2026-09-01T00:00:00+05:30",
  };
  const at = (local) => new Date(istLocalToInstant(local));

  test("just BEFORE start: scheduled", () => {
    assert.equal(campaignState(base, at("2026-09-08T23:59")), "scheduled");
  });

  test("exactly AT start: running", () => {
    assert.equal(campaignState(base, at("2026-09-09T00:00")), "running");
  });

  test("mid-campaign: running", () => {
    assert.equal(campaignState(base, at("2026-09-12T14:30")), "running");
  });

  test("just BEFORE end — 11:59pm IST on the final day: still running", () => {
    // The business meaning of "through the 16th". A customer booking late on the last
    // evening in Bangalore must still get the offer.
    assert.equal(campaignState(base, at("2026-09-16T23:59")), "running");
  });

  test("exactly AT end: expired", () => {
    // Half-open [start, end): the end instant belongs to whatever comes next.
    assert.equal(campaignState(base, at("2026-09-17T00:00")), "expired");
  });

  test("after end: expired", () => {
    assert.equal(campaignState(base, at("2026-09-17T00:01")), "expired");
  });

  test("a PAUSED campaign is never running, whatever the clock says", () => {
    const paused = { ...base, isActive: false };
    for (const t of ["2026-09-08T23:59", "2026-09-09T00:00", "2026-09-12T14:30", "2026-09-17T00:00"]) {
      assert.equal(campaignState(paused, at(t)), "paused", `paused at ${t}`);
    }
  });
});

// ===========================================================================
// The admin API
// ===========================================================================
const db = { campaigns: new Map(), services: new Map(), settings: new Map(), bookings: new Map() };
let seq = 0;

const storage = {
  getAllCampaigns: async () => [...db.campaigns.values()],
  getCampaign: async (id) => db.campaigns.get(id),
  getCampaignByIdentifier: async (i) => [...db.campaigns.values()].find((c) => c.identifier === i),
  createCampaign: async (v) => { const r = { id: "cmp_" + ++seq, createdAt: new Date(), updatedAt: new Date(), ...v }; db.campaigns.set(r.id, r); return r; },
  updateCampaign: async (id, p) => { const r = db.campaigns.get(id); Object.assign(r, p); return r; },
  getServiceBySlug: async (s) => db.services.get(s),
  getService: async (id) => [...db.services.values()].find((s) => s.id === id),
  getSetting: async (k) => db.settings.get(k),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async () => ({ dayOfWeek: 0, dayName: "D", isOpen: true, openTime: "00:00", cutoffTime: "23:59" }),
  getBookingCountForSlot: async () => 0,
  createBooking: async (v) => { const b = { id: "bk_" + ++seq, ...v }; db.bookings.set(b.id, b); return b; },
  createBookingWithCapacity: async (v) => storage.createBooking(v),
  updateBooking: async (id, p) => { Object.assign(db.bookings.get(id), p); return db.bookings.get(id); },
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
  exports: { createPaymentOrder: async (a) => ({ id: "order_" + ++seq, amount: a * 100, currency: "INR" }), verifyPaymentSignature: async () => true },
});
mock.module("../server/services/whatsapp.ts", { exports: { whatsappService: { sendBookingConfirmation: async () => ({ success: true, messageId: "w" }) } } });
mock.module("../server/services/scheduler.ts", { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module("../server/services/email.ts", { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module("../server/services/webhook.ts", { exports: { sendBookingWebhook: async () => ({ ok: true }) } });

let server, base;

before(async () => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/none";
  process.env.SESSION_SECRET = "campaigns-admin-secret";
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
        configurable: true, writable: true,
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
  __resetRateLimitsForTests();
  db.campaigns.clear(); db.services.clear(); db.settings.clear(); db.bookings.clear();
  db.services.set("1-year-ceramic-coating", { id: "svc-cc", slug: "1-year-ceramic-coating", title: "1 Year Ceramic Coating", price: "5999.00", duration: 420, isActive: true, maxBookingsPerSlot: 3 });
  db.services.set("ppf-suv", { id: "svc-pu", slug: "ppf-suv", title: "P91 PPF - SUV", price: "65000.00", duration: 4, isActive: true, maxBookingsPerSlot: 3 });
  db.services.set("retired", { id: "svc-old", slug: "retired", title: "Retired", price: "1.00", duration: 1, isActive: false });
  db.settings.set("booking_amount", { key: "booking_amount", value: "299" });
});

const api = async (method, path, body, admin = false) => {
  const headers = { "Content-Type": "application/json" };
  if (admin) headers["x-test-admin"] = "1";
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

/** A campaign body built the way the admin FORM builds it — via the IST converter. */
const formBody = (over = {}) => ({
  name: "September Ceramic Car",
  identifier: "ceramic_car_sep",
  serviceSlug: "1-year-ceramic-coating",
  vehicleType: "car",
  landingPage: "/ceramic-coating/car",
  startsAt: istLocalToInstant("2030-09-09T00:00"),
  endsAt: istLocalToInstant("2030-09-17T00:00"),
  isActive: true,
  offerType: "free_booking",
  offerTitle: "Booking Is Free This Week",
  offerDescription: "Reserve at no cost.",
  ctaText: "Book Free Appointment",
  ...over,
});

const runningBody = (over = {}) => formBody({
  startsAt: new Date(Date.now() - 86400000).toISOString(),
  endsAt: new Date(Date.now() + 86400000).toISOString(),
  ...over,
});

describe("authentication — mutations are never public", () => {
  test("list, create and update all refuse an unauthenticated caller", async () => {
    assert.equal((await api("GET", "/api/admin/campaigns")).status, 401);
    assert.equal((await api("POST", "/api/admin/campaigns", formBody())).status, 401);
    assert.equal((await api("PATCH", "/api/admin/campaigns/cmp_1", { isActive: false })).status, 401);
    assert.equal(db.campaigns.size, 0, "nothing was written");
  });

  test("the PUBLIC campaign endpoint exposes no internal fields", async () => {
    await api("POST", "/api/admin/campaigns", runningBody(), true);
    const res = await api("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar");
    assert.equal(res.status, 200);
    for (const internal of ["id", "createdBy", "createdAt", "updatedAt", "isActive"]) {
      assert.ok(!(internal in res.body.campaign), `${internal} must not be public`);
    }
  });
});

describe("list", () => {
  test("returns campaigns with a SERVER-computed state", async () => {
    await api("POST", "/api/admin/campaigns", formBody(), true);                       // 2030 -> scheduled
    await api("POST", "/api/admin/campaigns", runningBody({ identifier: "live_now", landingPage: "/ppf", serviceSlug: "ppf-suv" }), true);
    await api("POST", "/api/admin/campaigns", formBody({ identifier: "draft_one", isActive: false }), true);

    const res = await api("GET", "/api/admin/campaigns", undefined, true);
    assert.equal(res.status, 200);
    const byId = Object.fromEntries(res.body.map((c) => [c.identifier, c.state]));
    assert.equal(byId.ceramic_car_sep, "scheduled");
    assert.equal(byId.live_now, "running");
    assert.equal(byId.draft_one, "paused");
    // The UI renders this value; it must never recompute the window rules itself.
    for (const c of res.body) assert.ok(typeof c.state === "string" && c.state.length > 0);
  });
});

describe("create — server-side validation", () => {
  test("a valid campaign is accepted", async () => {
    const res = await api("POST", "/api/admin/campaigns", formBody(), true);
    assert.equal(res.status, 200);
    assert.equal(res.body.identifier, "ceramic_car_sep");
    assert.equal(db.campaigns.size, 1);
  });

  test("missing required fields are rejected", async () => {
    const { offerTitle, ...missing } = formBody();
    const res = await api("POST", "/api/admin/campaigns", missing, true);
    assert.equal(res.status, 400);
    assert.ok(res.body.fieldErrors.offerTitle);
    assert.equal(db.campaigns.size, 0);
  });

  test("an invalid or inactive service is rejected", async () => {
    assert.equal((await api("POST", "/api/admin/campaigns", formBody({ serviceSlug: "no-such" }), true)).status, 400);
    const inactive = await api("POST", "/api/admin/campaigns", formBody({ serviceSlug: "retired" }), true);
    assert.equal(inactive.status, 400, "a campaign must not advertise an unbookable service");
    assert.ok(inactive.body.fieldErrors.serviceSlug);
  });

  test("an invalid vehicle type is rejected", async () => {
    const res = await api("POST", "/api/admin/campaigns", formBody({ vehicleType: "tractor" }), true);
    assert.equal(res.status, 400);
    assert.ok(res.body.fieldErrors.vehicleType);
  });

  test("an invalid offer type is rejected", async () => {
    const res = await api("POST", "/api/admin/campaigns", formBody({ offerType: "half_price" }), true);
    assert.equal(res.status, 400);
    assert.ok(res.body.fieldErrors.offerType);
  });

  test("a malformed landing page is rejected", async () => {
    for (const bad of ["/anything", "https://evil.example/ppf", "ppf", ""]) {
      const res = await api("POST", "/api/admin/campaigns", formBody({ landingPage: bad }), true);
      assert.equal(res.status, 400, `${JSON.stringify(bad)} must be rejected`);
    }
    // The three real destinations are accepted.
    for (const good of ["/ceramic-coating/car", "/ceramic-coating/bike", "/ppf"]) {
      db.campaigns.clear();
      const res = await api("POST", "/api/admin/campaigns", formBody({ landingPage: good, identifier: "ok_" + good.replace(/\W/g, "") }), true);
      assert.equal(res.status, 200, `${good} must be accepted`);
    }
  });

  test("invalid dates are rejected", async () => {
    assert.equal((await api("POST", "/api/admin/campaigns", formBody({ startsAt: "nonsense" }), true)).status, 400);
    // A naive local time with no offset is refused — it is ambiguous, and the admin form
    // never produces one.
    const naive = await api("POST", "/api/admin/campaigns", formBody({ startsAt: "2030-09-09T00:00:00" }), true);
    assert.equal(naive.status, 400);
    assert.match(naive.body.fieldErrors.startsAt, /timezone offset/);
  });

  test("end before start is rejected, and so is a zero-length window", async () => {
    const inverted = await api("POST", "/api/admin/campaigns", formBody({
      startsAt: istLocalToInstant("2030-09-17T00:00"), endsAt: istLocalToInstant("2030-09-09T00:00"),
    }), true);
    assert.equal(inverted.status, 400);
    assert.ok(inverted.body.fieldErrors.endsAt);

    const zero = await api("POST", "/api/admin/campaigns", formBody({ endsAt: formBody().startsAt }), true);
    assert.equal(zero.status, 400);
  });

  test("a duplicate identifier is rejected", async () => {
    await api("POST", "/api/admin/campaigns", formBody(), true);
    const dup = await api("POST", "/api/admin/campaigns", formBody({ name: "Another" }), true);
    assert.equal(dup.status, 409);
    assert.ok(dup.body.fieldErrors.identifier);
    assert.equal(db.campaigns.size, 1);
  });

  test("a price field is refused outright — campaigns never carry pricing", async () => {
    // .strict() on the schema. A sender who included `price` believed it would do
    // something, so the request is refused rather than silently ignored.
    for (const extra of [{ price: "4999" }, { discount: 20 }, { discountPercent: 10 }]) {
      const res = await api("POST", "/api/admin/campaigns", { ...formBody(), ...extra }, true);
      assert.equal(res.status, 400, `${JSON.stringify(extra)} must be refused`);
    }
    assert.equal(db.campaigns.size, 0);
  });
});

describe("overlap — the admin is told what is in the way", () => {
  test("an overlapping ACTIVE campaign is refused and NAMES the conflict", async () => {
    await api("POST", "/api/admin/campaigns", runningBody({ name: "Currently Live" }), true);
    const res = await api("POST", "/api/admin/campaigns", runningBody({
      identifier: "second_one", name: "Overlapping",
    }), true);

    assert.equal(res.status, 409);
    assert.equal(res.body.conflicts.length, 1);
    assert.equal(res.body.conflicts[0].name, "Currently Live", "the UI can name it");
    assert.equal(res.body.conflicts[0].identifier, "ceramic_car_sep");
    assert.equal(db.campaigns.size, 1, "the ambiguous campaign was not created");
  });

  test("nothing is silently deactivated to make room", async () => {
    const first = await api("POST", "/api/admin/campaigns", runningBody({ name: "Currently Live" }), true);
    await api("POST", "/api/admin/campaigns", runningBody({ identifier: "second_one" }), true);
    assert.equal(db.campaigns.get(first.body.id).isActive, true, "the existing campaign is untouched");
  });

  test("a PAUSED overlapping campaign is allowed — drafts must be preparable", async () => {
    await api("POST", "/api/admin/campaigns", runningBody(), true);
    const draft = await api("POST", "/api/admin/campaigns", runningBody({
      identifier: "next_month_draft", isActive: false,
    }), true);
    assert.equal(draft.status, 200);
  });

  test("ACTIVATING a draft that would overlap is refused, and it stays paused", async () => {
    await api("POST", "/api/admin/campaigns", runningBody({ name: "Currently Live" }), true);
    const draft = await api("POST", "/api/admin/campaigns", runningBody({ identifier: "draft_two", isActive: false }), true);

    const activate = await api("PATCH", `/api/admin/campaigns/${draft.body.id}`, { isActive: true }, true);
    assert.equal(activate.status, 409);
    assert.equal(activate.body.conflicts[0].name, "Currently Live");
    assert.equal(db.campaigns.get(draft.body.id).isActive, false, "still a draft");
  });

  test("campaigns on DIFFERENT landing pages never conflict", async () => {
    await api("POST", "/api/admin/campaigns", runningBody(), true);
    const other = await api("POST", "/api/admin/campaigns", runningBody({
      identifier: "ppf_sep", landingPage: "/ppf", serviceSlug: "ppf-suv",
    }), true);
    assert.equal(other.status, 200);
  });
});

describe("update, pause and activate", () => {
  test("editing validates the MERGED record, not the patch alone", async () => {
    const c = await api("POST", "/api/admin/campaigns", formBody(), true);
    const bad = await api("PATCH", `/api/admin/campaigns/${c.body.id}`, {
      endsAt: istLocalToInstant("2030-09-01T00:00"),
    }, true);
    assert.equal(bad.status, 400, "end-before-start caught with only one field sent");
    assert.ok(bad.body.fieldErrors.endsAt);
  });

  test("pause then activate round-trips through the computed state", async () => {
    const c = await api("POST", "/api/admin/campaigns", runningBody(), true);
    assert.equal(c.body.state, "running");

    const paused = await api("PATCH", `/api/admin/campaigns/${c.body.id}`, { isActive: false }, true);
    assert.equal(paused.body.state, "paused");

    const resumed = await api("PATCH", `/api/admin/campaigns/${c.body.id}`, { isActive: true }, true);
    assert.equal(resumed.body.state, "running");
  });

  test("a paused campaign disappears from the public endpoint", async () => {
    const c = await api("POST", "/api/admin/campaigns", runningBody(), true);
    assert.ok((await api("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar")).body.campaign);

    await api("PATCH", `/api/admin/campaigns/${c.body.id}`, { isActive: false }, true);
    assert.equal(
      (await api("GET", "/api/campaigns/active?landingPage=%2Fceramic-coating%2Fcar")).body.campaign,
      null,
    );
  });

  test("an unknown campaign is a 404", async () => {
    assert.equal((await api("PATCH", "/api/admin/campaigns/nope", { isActive: false }, true)).status, 404);
  });
});

describe("historical bookings are never rewritten by admin action", () => {
  const booking = () => ({
    serviceId: "svc-cc", timeSlotId: "10:00",
    appointmentDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    appointmentTime: "10:00",
    customerName: "Admin Phase Customer", customerEmail: "c@example.com", customerPhone: "9876500011",
  });

  test("renaming a campaign leaves past bookings alone", async () => {
    const c = await api("POST", "/api/admin/campaigns", runningBody(), true);
    const b = await api("POST", "/api/bookings", booking());
    const id = b.body.booking.id;
    assert.equal(db.bookings.get(id).campaignIdentifier, "ceramic_car_sep");

    await api("PATCH", `/api/admin/campaigns/${c.body.id}`, { identifier: "renamed_v2", name: "Renamed" }, true);
    assert.equal(db.bookings.get(id).campaignIdentifier, "ceramic_car_sep", "history is preserved");
  });

  test("pausing a campaign leaves past bookings attributed, and stops new ones", async () => {
    const c = await api("POST", "/api/admin/campaigns", runningBody(), true);
    const before = await api("POST", "/api/bookings", booking());
    const beforeId = before.body.booking.id;
    assert.equal(db.bookings.get(beforeId).campaignIdentifier, "ceramic_car_sep");
    assert.equal(db.bookings.get(beforeId).amount, "0.00");

    await api("PATCH", `/api/admin/campaigns/${c.body.id}`, { isActive: false }, true);

    assert.equal(db.bookings.get(beforeId).campaignIdentifier, "ceramic_car_sep", "still attributed");
    const after = await api("POST", "/api/bookings", booking());
    const afterB = db.bookings.get(after.body.booking.id);
    assert.equal(afterB.campaignIdentifier, null, "a paused campaign is not attached to new bookings");
    assert.equal(afterB.amount, "299", "and the fee applies again");
  });
});

describe("the legacy free-booking setting is untouched", () => {
  test("/api/booking-offer keeps its exact contract", async () => {
    const res = await api("GET", "/api/booking-offer");
    assert.equal(res.status, 200);
    assert.ok("free" in res.body && "until" in res.body, "shape is unchanged");
  });

  test("with NO campaigns, the legacy setting still makes booking free", async () => {
    db.settings.set("free_booking_until", {
      key: "free_booking_until",
      value: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });
    assert.equal(db.campaigns.size, 0);

    const offer = await api("GET", "/api/booking-offer");
    assert.equal(offer.body.free, true);

    const b = await api("POST", "/api/bookings", {
      serviceId: "svc-cc", timeSlotId: "10:00",
      appointmentDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      appointmentTime: "10:00", customerName: "Legacy", customerEmail: "l@example.com", customerPhone: "9876500011",
    });
    assert.equal(b.body.freeBooking, true);
    assert.equal(db.bookings.get(b.body.booking.id).campaignIdentifier, null, "no campaign caused it");
  });

  test("creating a campaign does not disturb the legacy setting", async () => {
    db.settings.set("free_booking_until", { key: "free_booking_until", value: "2026-09-16" });
    await api("POST", "/api/admin/campaigns", formBody(), true);
    assert.equal(db.settings.get("free_booking_until").value, "2026-09-16", "not migrated, not removed");
  });
});

describe("the Campaigns UI carries no pricing logic", () => {
  test("the panel source contains no price, discount or percentage handling", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const src = fs
      .readFileSync(path.join(root, "client/src/components/admin-campaigns.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    for (const re of [/₹/, /\bdiscount\b/i, /percent/i, /\bprice\s*[:=]/i, /servicePrice/]) {
      assert.ok(!re.test(src), `the campaigns panel must not contain ${re}`);
    }
  });

  test("the landing-page list in the UI matches the one the server enforces", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const ui = fs.readFileSync(path.join(root, "client/src/components/admin-campaigns.tsx"), "utf8");
    const server = fs.readFileSync(path.join(root, "server/lib/campaign.ts"), "utf8");
    for (const p of ["/ceramic-coating/car", "/ceramic-coating/bike", "/ppf"]) {
      assert.ok(ui.includes(`"${p}"`), `UI offers ${p}`);
      assert.ok(server.includes(`"${p}"`), `server accepts ${p}`);
    }
  });
});
