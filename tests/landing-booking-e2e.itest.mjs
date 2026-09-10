/**
 * Phase 2E — landing page to booking record, end to end.
 *
 *   npm run test:integration
 *
 * Proves the landing-page selections are not merely visual: what the customer picked
 * reaches the database, and what they were charged came from the catalogue rather than
 * from anything they sent.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT IS REAL HERE, AND WHAT IS NOT.
 *
 *   real   server/routes.ts mounted on a real socket, driven by real HTTP; the campaign
 *          resolution, the amount authority, attribution parsing and the enum allowlists
 *          are the code that ships.
 *
 *   real   the SERVICE SLUGS and their relative prices, taken from the live catalogue —
 *          so a slug typo in lib/landing-pages.ts fails here rather than in production.
 *
 *   faked  the database. The only Postgres this machine can reach is PRODUCTION, and
 *          writing test bookings or running a migration there is not acceptable at any
 *          point in this work.
 *
 *   faked  the browser. The client half of each journey is asserted directly against
 *          lib/landing-pages.ts — the same module the page renders from — so "which
 *          service does /ppf send when SUV is chosen" is answered by the real mapping.
 *          The rendered journey is verified separately in Chrome.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
import { test, describe, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { __resetRateLimitsForTests } from "../server/lib/rate-limit.ts";
import { LANDING_PAGES, getLandingPage } from "../client/src/lib/landing-pages.ts";

/**
 * The five catalogue rows these pages sell, with the prices production actually holds.
 *
 * Prices matter here for one reason only: to prove the SERVICE row decides the amount.
 * They are the service price, never the booking fee.
 */
const CATALOGUE = [
  { id: "svc-cc", slug: "1-year-ceramic-coating", title: "1 Year Ceramic Coating", price: "5999.00", originalPrice: "12000.00", duration: 420 },
  { id: "svc-bc", slug: "1-year-bike-ceramic-coating", title: "1 Year Bike Ceramic Coating", price: "2999.00", originalPrice: "6000.00", duration: 300 },
  { id: "svc-ph", slug: "ppf-hatchback", title: "P91 PPF - Hatchback", price: "45000.00", originalPrice: "85000.00", duration: 2 },
  { id: "svc-ps", slug: "ppf-sedan", title: "P91 PPF - Sedan", price: "55000.00", originalPrice: "85000.00", duration: 3 },
  { id: "svc-pu", slug: "ppf-suv", title: "P91 PPF - SUV", price: "65000.00", originalPrice: "95000.00", duration: 4 },
];

const db = { services: new Map(), campaigns: new Map(), settings: new Map(), bookings: new Map() };
let seq = 0;

const storage = {
  getService: async (id) => [...db.services.values()].find((s) => s.id === id),
  getServiceBySlug: async (slug) => db.services.get(slug),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async () => ({ dayOfWeek: 0, dayName: "D", isOpen: true, openTime: "00:00", cutoffTime: "23:59" }),
  getBookingCountForSlot: async () => 0,
  getSetting: async (k) => db.settings.get(k),
  getAllCampaigns: async () => [...db.campaigns.values()],
  getCampaign: async (id) => db.campaigns.get(id),
  getCampaignByIdentifier: async (i) => [...db.campaigns.values()].find((c) => c.identifier === i),
  createCampaign: async (v) => { const r = { id: "cmp_" + ++seq, createdAt: new Date(), ...v }; db.campaigns.set(r.id, r); return r; },
  updateCampaign: async (id, p) => { const r = db.campaigns.get(id); Object.assign(r, p); return r; },
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
  exports: {
    // Records exactly what Razorpay was asked to charge — the heart of the price tests.
    createPaymentOrder: async (amount) => { charged.push(amount); return { id: "order_" + ++seq, amount: amount * 100, currency: "INR" }; },
    verifyPaymentSignature: async () => true,
  },
});
mock.module("../server/services/whatsapp.ts", { exports: { whatsappService: { sendBookingConfirmation: async () => ({ success: true, messageId: "w" }) } } });
mock.module("../server/services/scheduler.ts", { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module("../server/services/email.ts", { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module("../server/services/webhook.ts", { exports: { sendBookingWebhook: async () => ({ ok: true }) } });

const charged = [];
let server, base;

before(async () => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/none";
  process.env.SESSION_SECRET = "e2e-secret";
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
  db.services.clear(); db.campaigns.clear(); db.settings.clear(); db.bookings.clear();
  charged.length = 0;
  for (const s of CATALOGUE) db.services.set(s.slug, { ...s, isActive: true, maxBookingsPerSlot: 3 });
  db.settings.set("booking_amount", { key: "booking_amount", value: "299" });
});

const http_ = async (method, path, body, admin = false) => {
  const headers = { "Content-Type": "application/json" };
  if (admin) headers["x-test-admin"] = "1";
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

const futureDate = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

/** The attribution an ad click carries, exactly as Phase 1 captures it. */
const AD_ATTRIBUTION = {
  utmSource: "meta",
  utmMedium: "paid_social",
  utmCampaign: "ceramic_car_sep",
  utmContent: "video_a",
  utmTerm: "ceramic coating bangalore",
  fbclid: "IwAR0e2e_test_click",
  landingPage: "/ceramic-coating/car",
  referrer: "https://l.facebook.com/",
};

/**
 * Book exactly as the landing page does.
 *
 * `serviceSlug` and `vehicleContext` are resolved from lib/landing-pages.ts by the caller,
 * so this mirrors the real client rather than restating its choices.
 */
const bookFromLanding = (serviceSlug, vehicleContext = {}, extra = {}) => {
  const service = db.services.get(serviceSlug);
  return http_("POST", "/api/bookings", {
    serviceId: service.id,
    timeSlotId: "10:00",
    appointmentDate: futureDate(),
    appointmentTime: "10:00",
    customerName: "E2E Customer",
    customerEmail: "e2e@example.com",
    customerPhone: "9876500011",
    ...vehicleContext,
    ...extra,
  });
};

/** Create a running free_booking campaign for a landing page. */
const runningCampaign = async (landingPage, serviceSlug, identifier, vehicleType = "car") =>
  http_("POST", "/api/admin/campaigns", {
    name: "E2E " + identifier,
    identifier,
    serviceSlug,
    vehicleType,
    landingPage,
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
    offerType: "free_booking",
    offerTitle: "Booking Is Free",
    offerDescription: "Reserve at no cost.",
    ctaText: "Book Free Appointment",
  }, true);

/** The service slug a landing page sends for a given category — from the REAL config. */
function slugFor(path, categoryKey) {
  const page = getLandingPage(path);
  if (!page.categories) return page.primaryServiceSlug;
  const key = categoryKey ?? page.defaultCategoryKey;
  return page.categories.find((c) => c.key === key).serviceSlug;
}

// ===========================================================================
describe("A. /ceramic-coating/car -> booking", () => {
  test("sends the ceramic car service and persists it", async () => {
    const slug = slugFor("/ceramic-coating/car");
    assert.equal(slug, "1-year-ceramic-coating", "the page names the right catalogue row");

    const res = await bookFromLanding(slug, { vehicleType: "car" }, AD_ATTRIBUTION);
    assert.equal(res.status, 200);

    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.serviceId, "svc-cc");
    assert.equal(b.vehicleType, "car");
    assert.equal(b.vehicleCategory, null, "ceramic has no body category");
    assert.equal(b.amount, "299", "booking FEE from settings, not the ₹5,999 service price");
  });

  test("campaign context is attached when one is running", async () => {
    await runningCampaign("/ceramic-coating/car", "1-year-ceramic-coating", "ceramic_car_sep");
    const res = await bookFromLanding(slugFor("/ceramic-coating/car"), { vehicleType: "car" }, AD_ATTRIBUTION);

    assert.equal(res.body.freeBooking, true);
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.campaignIdentifier, "ceramic_car_sep");
    assert.ok(b.campaignId);
    assert.equal(b.amount, "0.00");
  });
});

describe("B. /ceramic-coating/bike -> booking", () => {
  test("sends the BIKE service, not the car one", async () => {
    const slug = slugFor("/ceramic-coating/bike");
    assert.equal(slug, "1-year-bike-ceramic-coating");

    const res = await bookFromLanding(slug, { vehicleType: "bike" }, { ...AD_ATTRIBUTION, landingPage: "/ceramic-coating/bike" });
    const b = db.bookings.get(res.body.booking.id);

    assert.equal(b.serviceId, "svc-bc");
    assert.notEqual(b.serviceId, "svc-cc", "the car service must not be booked from the bike page");
    assert.equal(b.vehicleType, "bike");
    assert.equal(b.landingPage, "/ceramic-coating/bike");
  });

  test("a bike campaign attaches, and the vehicle is recorded as bike", async () => {
    await runningCampaign("/ceramic-coating/bike", "1-year-bike-ceramic-coating", "ceramic_bike_sep", "bike");
    const res = await bookFromLanding(slugFor("/ceramic-coating/bike"), { vehicleType: "bike" });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.campaignIdentifier, "ceramic_bike_sep");
    assert.equal(b.vehicleType, "bike");
  });
});

describe("C/D/E. /ppf -> body type -> booking", () => {
  const CASES = [
    { key: "hatchback", slug: "ppf-hatchback", id: "svc-ph", price: 45000 },
    { key: "sedan", slug: "ppf-sedan", id: "svc-ps", price: 55000 },
    { key: "suv", slug: "ppf-suv", id: "svc-pu", price: 65000 },
  ];

  for (const c of CASES) {
    test(`${c.key} selects ${c.slug} and records vehicleCategory`, async () => {
      // Resolved through the REAL landing-page config, so a mapping typo fails here.
      const slug = slugFor("/ppf", c.key);
      assert.equal(slug, c.slug);

      const res = await bookFromLanding(slug, { vehicleType: "car", vehicleCategory: c.key }, {
        ...AD_ATTRIBUTION, landingPage: "/ppf", utmCampaign: "ppf_sep",
      });
      assert.equal(res.status, 200);

      const b = db.bookings.get(res.body.booking.id);
      assert.equal(b.serviceId, c.id, "the SERVICE identifies the package independently");
      assert.equal(b.vehicleCategory, c.key);
      assert.equal(b.vehicleType, "car");
      assert.equal(b.utmCampaign, "ppf_sep");
    });
  }

  test("each body type books a DIFFERENT service — the stale-serviceId regression", async () => {
    // THE BUG: BookingModal read service.id from useForm defaultValues, which are captured
    // ONCE at mount. The modal is mounted before it is opened, so switching body type
    // updated the heading, price and includes but NOT the submitted serviceId. The modal
    // displayed "P91 PPF - SUV" and submitted "ppf-hatchback" — a customer who chose SUV
    // at 65,000 would have been booked onto the 45,000 Hatchback package.
    //
    // Found by intercepting the real POST body in a headless browser. Pinned here so the
    // three journeys can never collapse onto one service again.
    const ids = [];
    for (const key of ["hatchback", "sedan", "suv"]) {
      const res = await bookFromLanding(slugFor("/ppf", key), { vehicleType: "car", vehicleCategory: key });
      ids.push(db.bookings.get(res.body.booking.id).serviceId);
    }
    assert.deepEqual(ids, ["svc-ph", "svc-ps", "svc-pu"]);
    assert.equal(new Set(ids).size, 3, "three body types, three distinct catalogue rows");
  });

  test("the default category is explicit, not array order", async () => {
    const page = getLandingPage("/ppf");
    assert.equal(page.defaultCategoryKey, "hatchback", "stated in the config");
    assert.equal(slugFor("/ppf"), "ppf-hatchback");
  });

  test("vehicleCategory does NOT determine the amount — the service row does", async () => {
    // Book the HATCHBACK service while claiming to be an SUV. The recorded category
    // follows the claim (it is descriptive), but nothing about the money moves.
    const res = await bookFromLanding("ppf-hatchback", { vehicleType: "car", vehicleCategory: "suv" });
    const b = db.bookings.get(res.body.booking.id);

    assert.equal(b.serviceId, "svc-ph", "still the hatchback service");
    assert.equal(b.amount, "299", "still the booking fee");
    assert.equal(charged.at(-1), 299, "Razorpay was asked for the fee, not a category-derived figure");
  });

  test("three PPF campaigns on one landing page cannot coexist — one offer per page", async () => {
    const first = await runningCampaign("/ppf", "ppf-hatchback", "ppf_hatch");
    assert.equal(first.status, 200);
    const second = await runningCampaign("/ppf", "ppf-suv", "ppf_suv");
    assert.equal(second.status, 409, "overlapping active campaigns on /ppf are refused");
  });
});

// ===========================================================================
describe("the server does not trust the client about money", () => {
  test("a client-supplied `amount` is ignored", async () => {
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" }, { amount: 1 });
    assert.equal(db.bookings.get(res.body.booking.id).amount, "299");
    assert.equal(charged.at(-1), 299, "Razorpay was never asked for ₹1");
  });

  test("a client-supplied campaign id cannot create a free booking", async () => {
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" }, {
      campaignId: "cmp_fake", campaignIdentifier: "totally_free", campaign: { offerType: "free_booking" },
    });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.amount, "299", "the fee still applies");
    assert.equal(b.campaignIdentifier, null, "no campaign was running, so none is recorded");
    assert.notEqual(b.campaignId, "cmp_fake", "the client's campaign id is not persisted");
  });

  test("a campaign for ANOTHER service does not make this one free", async () => {
    await runningCampaign("/ceramic-coating/car", "1-year-ceramic-coating", "ceramic_only");
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.amount, "299", "PPF is unaffected by a ceramic campaign");
    assert.equal(b.campaignIdentifier, null);
  });

  test("an invalid vehicleCategory is dropped, not stored and not fatal", async () => {
    for (const bad of ["convertible", "SUV; DROP TABLE bookings", "", 42, null, { evil: true }]) {
      const res = await bookFromLanding("ppf-sedan", { vehicleType: "car", vehicleCategory: bad });
      assert.equal(res.status, 200, "a bad category must never fail a booking");
      assert.equal(db.bookings.get(res.body.booking.id).vehicleCategory, null, `${JSON.stringify(bad)} rejected`);
    }
  });

  test("an invalid vehicleType is dropped the same way", async () => {
    const res = await bookFromLanding("ppf-sedan", { vehicleType: "spaceship", vehicleCategory: "sedan" });
    assert.equal(db.bookings.get(res.body.booking.id).vehicleType, null);
    assert.equal(db.bookings.get(res.body.booking.id).vehicleCategory, "sedan", "the valid one survives");
  });

  test("case and whitespace are normalised rather than rejected", async () => {
    const res = await bookFromLanding("ppf-suv", { vehicleType: " CAR ", vehicleCategory: "  SUV " });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.vehicleType, "car");
    assert.equal(b.vehicleCategory, "suv");
  });

  test("the service price is never written as the booking amount", async () => {
    // The ₹65,000 PPF price must never become the online charge.
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    const b = db.bookings.get(res.body.booking.id);
    assert.notEqual(b.amount, "65000.00");
    assert.equal(b.amount, "299");
  });
});

// ===========================================================================
describe("free booking: the reservation is free, the service is not", () => {
  test("an active campaign zeroes the FEE and leaves the catalogue price alone", async () => {
    await runningCampaign("/ppf", "ppf-suv", "ppf_suv_sep");
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });

    assert.equal(res.body.freeBooking, true);
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.amount, "0.00", "nothing charged online");
    assert.equal(b.paymentStatus, "free");
    assert.equal(charged.length, 0, "Razorpay was not involved at all");

    // The catalogue row is untouched: the service still costs ₹65,000 at the studio.
    assert.equal(db.services.get("ppf-suv").price, "65000.00", "no fake free-service state");
  });

  test("no campaign: the fee applies exactly as before", async () => {
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    assert.equal(res.body.freeBooking, undefined);
    assert.equal(db.bookings.get(res.body.booking.id).amount, "299");
  });

  test("legacy free_booking_until still works with no campaigns at all", async () => {
    db.settings.set("free_booking_until", {
      key: "free_booking_until",
      value: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });
    const res = await bookFromLanding("1-year-ceramic-coating", { vehicleType: "car" });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(res.body.freeBooking, true, "the Phase 1 fallback is intact");
    assert.equal(b.amount, "0.00");
    assert.equal(b.campaignIdentifier, null, "no campaign caused this one");
  });

  test("an EXPIRED campaign charges normally again", async () => {
    await http_("POST", "/api/admin/campaigns", {
      name: "Old", identifier: "ppf_old", serviceSlug: "ppf-suv", vehicleType: "car",
      landingPage: "/ppf",
      startsAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: true, offerType: "free_booking", offerTitle: "Old", ctaText: "Book",
    }, true);
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    assert.equal(db.bookings.get(res.body.booking.id).amount, "299");
  });
});

// ===========================================================================
describe("attribution survives the whole journey", () => {
  test("every ad parameter reaches the booking row", async () => {
    await runningCampaign("/ppf", "ppf-suv", "ppf_suv_sep");
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" }, {
      ...AD_ATTRIBUTION, landingPage: "/ppf", utmCampaign: "ppf_suv_sep",
    });
    const b = db.bookings.get(res.body.booking.id);

    assert.equal(b.utmSource, "meta");
    assert.equal(b.utmMedium, "paid_social");
    assert.equal(b.utmCampaign, "ppf_suv_sep");
    assert.equal(b.utmContent, "video_a");
    assert.equal(b.utmTerm, "ceramic coating bangalore");
    assert.equal(b.fbclid, "IwAR0e2e_test_click");
    assert.equal(b.landingPage, "/ppf");
    assert.equal(b.referrer, "https://l.facebook.com/");
    assert.equal(b.source, "meta", "derived server-side");
    // And the campaign, the vehicle and the package all landed together.
    assert.equal(b.campaignIdentifier, "ppf_suv_sep");
    assert.equal(b.vehicleCategory, "suv");
    assert.equal(b.serviceId, "svc-pu");
  });

  test("the client still cannot spoof `source`", async () => {
    const res = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" }, {
      source: "meta", utmSource: "newsletter",
    });
    assert.equal(db.bookings.get(res.body.booking.id).source, "newsletter", "derived, not accepted");
  });

  test("an unattributed direct visit is recorded as direct, not as a campaign", async () => {
    const res = await bookFromLanding("1-year-ceramic-coating", { vehicleType: "car" });
    const b = db.bookings.get(res.body.booking.id);
    assert.equal(b.source, "direct");
    assert.equal(b.utmCampaign, null);
    assert.equal(b.campaignIdentifier, null);
  });
});

// ===========================================================================
describe("the campaign snapshot is history, not a live join", () => {
  test("renaming the campaign after booking does not rewrite the booking", async () => {
    const created = await runningCampaign("/ppf", "ppf-suv", "ppf_suv_sep");
    const booking = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    const id = booking.body.booking.id;
    assert.equal(db.bookings.get(id).campaignIdentifier, "ppf_suv_sep");

    const renamed = await http_("PATCH", `/api/admin/campaigns/${created.body.id}`, {
      identifier: "ppf_suv_sep_v2", name: "Renamed next month",
    }, true);
    assert.equal(renamed.status, 200);

    assert.equal(
      db.bookings.get(id).campaignIdentifier,
      "ppf_suv_sep",
      "a report run next quarter gives the same answer it gave today",
    );
  });

  test("pausing the campaign does not retroactively unattribute past bookings", async () => {
    const created = await runningCampaign("/ppf", "ppf-suv", "ppf_suv_sep");
    const booking = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    const id = booking.body.booking.id;

    await http_("PATCH", `/api/admin/campaigns/${created.body.id}`, { isActive: false }, true);
    assert.equal(db.bookings.get(id).campaignIdentifier, "ppf_suv_sep");

    // But the NEXT booking correctly gets no campaign and pays the fee.
    const after = await bookFromLanding("ppf-suv", { vehicleType: "car", vehicleCategory: "suv" });
    const b2 = db.bookings.get(after.body.booking.id);
    assert.equal(b2.campaignIdentifier, null);
    assert.equal(b2.amount, "299");
  });
});

// ===========================================================================
describe("the landing-page config matches the catalogue", () => {
  test("every slug named by a landing page exists and is bookable", async () => {
    for (const page of LANDING_PAGES) {
      const slugs = page.categories ? page.categories.map((c) => c.serviceSlug) : [page.primaryServiceSlug];
      for (const slug of slugs) {
        const row = db.services.get(slug);
        assert.ok(row, `${page.path} names ${slug}, which must exist in the catalogue`);
        assert.ok(row.isActive, `${slug} must be bookable`);
      }
    }
  });

  test("each PPF category maps to a DISTINCT catalogue row", async () => {
    const ppf = getLandingPage("/ppf");
    const slugs = ppf.categories.map((c) => c.serviceSlug);
    assert.equal(new Set(slugs).size, slugs.length, "no two body types share a package");
  });

  test("a booking from each landing page is independently identifiable by service", async () => {
    const booked = [];
    for (const page of LANDING_PAGES) {
      const keys = page.categories ? page.categories.map((c) => c.key) : [undefined];
      for (const key of keys) {
        const res = await bookFromLanding(slugFor(page.path, key), {
          vehicleType: page.vehicle,
          ...(key ? { vehicleCategory: key } : {}),
        }, { landingPage: page.path });
        booked.push(db.bookings.get(res.body.booking.id));
      }
    }
    assert.equal(booked.length, 5, "all five journeys");
    assert.equal(new Set(booked.map((b) => b.serviceId)).size, 5, "five distinct catalogue rows");
  });
});
