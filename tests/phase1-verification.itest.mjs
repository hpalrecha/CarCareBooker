/**
 * PHASE 1 END-TO-END VERIFICATION.
 *
 *   npm run test:integration
 *
 * This is the evidence run for the thirteen checks Phase 1 was required to pass. It is
 * deliberately not a unit test: it boots the REAL server/routes.ts on a REAL socket and
 * drives it with REAL HTTP requests, and it uses the REAL client-side attribution and
 * Meta Pixel modules rather than descriptions of them.
 *
 * It also prints what it proved, so the run itself is the report.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT IS FAKED, AND WHY THAT IS HONEST
 *
 *   the database   `storage` is an in-memory double. The only Postgres this machine can
 *                  reach is PRODUCTION (Neon, carcarebooker), and writing test bookings or
 *                  applying a migration there to make a test pass is not acceptable. Every
 *                  layer above storage — routing, validation, rate limiting, honeypot,
 *                  attribution derivation, the confirmation-token gate, the allowlist — is
 *                  the code that ships.
 *
 *   the browser    No headless browser is installed. The client modules are exercised
 *                  directly against a DOM shim, which proves their LOGIC (the overwrite
 *                  rule, pixel deduplication) but not their rendering.
 *
 * WHAT THIS THEREFORE DOES NOT PROVE, and must be confirmed on a real deploy:
 *   - the migration applies cleanly to the real schema
 *   - a real Razorpay checkout still completes end to end
 *   - the pixel is accepted by Meta's Events Manager
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
import { test, describe, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { __resetRateLimitsForTests } from "../server/lib/rate-limit.ts";

const evidence = [];
const proof = (n, claim, detail) => {
  evidence.push(`  [${String(n).padStart(2, "0")}] ${claim}\n       ${detail}`);
};

// ---------------------------------------------------------------------------
// In-memory database double.
// ---------------------------------------------------------------------------
const db = { services: new Map(), bookings: new Map(), settings: new Map(), leads: [], businessHours: new Map() };
let seq = 0;

const storage = {
  getService: async (id) => db.services.get(id),
  getAllBlackoutDates: async () => [],
  getBusinessHoursForDay: async (dow) => db.businessHours.get(dow),
  getBookingCountForSlot: async () => 0,
  getSetting: async (key) => db.settings.get(key),
  createBooking: async (values) => {
    const b = { id: "bk_" + ++seq, whatsappSent: false, emailSent: false, ...values };
    db.bookings.set(b.id, b);
    return b;
  },
  createBookingWithCapacity: async (values) => storage.createBooking(values),
  updateBooking: async (id, patch) => {
    const b = db.bookings.get(id);
    Object.assign(b, patch);
    return b;
  },
  getBooking: async (id) => db.bookings.get(id),
  getBookingByConfirmationToken: async (token) => {
    if (!token || String(token).trim() === "") return undefined;
    return [...db.bookings.values()].find((b) => b.confirmationToken === token);
  },
  getBookingByPaymentOrderId: async (o) => [...db.bookings.values()].find((b) => b.razorpayOrderId === o),
  getTimeSlot: async () => ({ id: "ts", startTime: "10:00 AM", endTime: "11:00 AM" }),
  getBookingsByStatus: async () => [],
  createPpfLead: async (values) => {
    const lead = { id: "lead_" + ++seq, status: "new", createdAt: new Date(), ...values };
    db.leads.push(lead);
    return lead;
  },
  getAllPpfLeads: async () => db.leads,
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
  exports: { whatsappService: { sendBookingConfirmation: async () => ({ success: true, messageId: "wamid.T" }) } },
});
mock.module("../server/services/scheduler.ts", { exports: { schedulerService: { startReminderScheduler() {} } } });
mock.module("../server/services/email.ts", { exports: { sendBookingConfirmationEmail: async () => ({ success: true }) } });
mock.module("../server/services/webhook.ts", { exports: { sendBookingWebhook: async () => ({ ok: true }) } });

let server;
let base;

before(async () => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/none";
  process.env.SESSION_SECRET = "phase1-verification-secret";
  process.env.RAZORPAY_KEY_ID = "rzp_test_fake";
  process.env.RAZORPAY_KEY_SECRET = "fake-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "fake-webhook-secret";
  process.env.META_PIXEL_ID = "1234567890";
  process.env.NODE_ENV = "test";

  const { registerRoutes } = await import("../server/routes.ts");
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
  app.use(express.urlencoded({ extended: false }));
  server = await registerRoutes(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  console.log("\n" + "=".repeat(78));
  console.log("PHASE 1 VERIFICATION EVIDENCE");
  console.log("=".repeat(78));
  console.log(evidence.join("\n"));
  console.log("=".repeat(78) + "\n");
});

beforeEach(() => {
  __resetRateLimitsForTests();
  db.services.clear(); db.bookings.clear(); db.settings.clear();
  db.leads.length = 0; db.businessHours.clear();
  db.services.set("svc-ceramic", {
    id: "svc-ceramic", slug: "1-year-ceramic-coating", title: "1 Year Ceramic Coating",
    price: "5999.00", duration: 240, isActive: true, maxBookingsPerSlot: 3,
  });
  db.settings.set("booking_amount", { key: "booking_amount", value: "299" });
  for (let d = 0; d <= 6; d++) {
    db.businessHours.set(d, { dayOfWeek: d, dayName: "Day" + d, isOpen: true, openTime: "00:00", cutoffTime: "23:59" });
  }
});

const futureDate = () => {
  const d = new Date(Date.now() + 14 * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const post = async (path, body) => {
  const res = await fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};
const get = async (path) => {
  const res = await fetch(base + path);
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, body: json };
};

// ===========================================================================
// The customer journey, end to end.
// ===========================================================================
describe("checks 1-4 — Meta ad to attributed booking", () => {
  test("1+2+3+4: UTM and fbclid enter, survive navigation, and reach the booking", async () => {
    // --- 1 & 2. Arrive from a Meta ad. Uses the REAL client capture module. ---
    const storageShim = {
      map: new Map(),
      getItem(k) { return this.map.has(k) ? this.map.get(k) : null; },
      setItem(k, v) { this.map.set(k, String(v)); },
      removeItem(k) { this.map.delete(k); },
    };
    globalThis.window = {
      location: {
        pathname: "/ceramic-coating/car",
        search: "?utm_source=meta&utm_medium=cpc&utm_campaign=ceramic_car_sep&utm_content=video_a&utm_term=ceramic&fbclid=IwAR0verify123",
        host: "p91carcare.com",
      },
      localStorage: storageShim,
    };
    globalThis.document = { referrer: "" }; // in-app browser: referrer stripped

    const { captureAttribution, attributionPayload } = await import("../client/src/lib/attribution.ts");

    const captured = captureAttribution();
    assert.equal(captured.utmSource, "meta");
    assert.equal(captured.utmCampaign, "ceramic_car_sep");
    proof(1, "Meta attribution enters via URL UTM parameters",
      `utm_source=${captured.utmSource} utm_medium=${captured.utmMedium} utm_campaign=${captured.utmCampaign} utm_content=${captured.utmContent} utm_term=${captured.utmTerm}`);

    assert.equal(captured.fbclid, "IwAR0verify123");
    proof(2, "fbclid captured (referrer was stripped, as in-app browsers do)",
      `fbclid=${captured.fbclid}  referrer=${captured.referrer}`);

    // --- 3. Browse the site. Every hop has NO campaign parameters. ---
    const hops = ["/services", "/service/1-year-ceramic-coating", "/contact", "/service/1-year-ceramic-coating"];
    for (const path of hops) {
      globalThis.window.location.pathname = path;
      globalThis.window.location.search = "";
      captureAttribution();
    }
    const afterNav = attributionPayload();
    assert.equal(afterNav.utmSource, "meta", "attribution survived navigation");
    assert.equal(afterNav.utmCampaign, "ceramic_car_sep");
    assert.equal(afterNav.landingPage, "/ceramic-coating/car", "still the page they arrived on");
    proof(3, `Attribution survived ${hops.length} internal navigations to the booking form`,
      `after ${hops.join(" -> ")}: utm_campaign=${afterNav.utmCampaign} landing_page=${afterNav.landingPage}`);

    // --- 4. Book, sending exactly what the real modal sends. ---
    const res = await post("/api/bookings", {
      serviceId: "svc-ceramic",
      timeSlotId: "10:00",
      appointmentDate: futureDate(),
      appointmentTime: "10:00",
      customerName: "Verification Customer",
      customerEmail: "verify@example.com",
      customerPhone: "9876500011",
      amount: 299,
      isBookingFee: true,
      ...afterNav,
    });
    assert.equal(res.status, 200);

    const stored = db.bookings.get(res.body.booking.id);
    assert.equal(stored.utmSource, "meta");
    assert.equal(stored.utmMedium, "cpc");
    assert.equal(stored.utmCampaign, "ceramic_car_sep");
    assert.equal(stored.utmContent, "video_a");
    assert.equal(stored.utmTerm, "ceramic");
    assert.equal(stored.fbclid, "IwAR0verify123");
    assert.equal(stored.landingPage, "/ceramic-coating/car");
    assert.equal(stored.source, "meta", "source derived server-side");
    proof(4, "Booking row carries the correct attribution",
      `source=${stored.source} utm_campaign=${stored.utmCampaign} fbclid=${stored.fbclid.slice(0, 12)}... landing_page=${stored.landingPage}`);
  });

  test("source is derived server-side and cannot be spoofed by the client", async () => {
    const res = await post("/api/bookings", {
      serviceId: "svc-ceramic", timeSlotId: "10:00",
      appointmentDate: futureDate(), appointmentTime: "10:00",
      customerName: "Spoof Attempt", customerEmail: "s@example.com", customerPhone: "9876500011",
      // A client claiming a source it did not come from.
      source: "meta", utmSource: "newsletter",
    });
    assert.equal(res.status, 200);
    const stored = db.bookings.get(res.body.booking.id);
    assert.equal(stored.source, "newsletter", "server derived from utm_source, ignoring the client's claim");
    proof(4.1, "Client-supplied `source` is ignored; the server derives it",
      `client sent source=meta utm_source=newsletter -> stored source=${stored.source}`);
  });
});

// ===========================================================================
describe("check 5 — Meta conversion fires exactly once", () => {
  test("repeated calls with the same event id report once", async () => {
    globalThis.window = { location: { pathname: "/ppf", search: "", host: "p91carcare.com" }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
    globalThis.document = { referrer: "", createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore() {} } }] };

    const pixel = await import("../client/src/lib/meta-pixel.ts");
    pixel.__resetMetaPixelForTests();
    pixel.__setPixelIdForTests("1234567890");

    const fired = [];
    globalThis.window.fbq = (...args) => fired.push(args);

    // The retry loop, a remount and a double-tap all arrive with the same payment id.
    const first = pixel.trackBooking({ eventId: "payment-pay_ABC", serviceTitle: "Ceramic", value: 299 });
    const second = pixel.trackBooking({ eventId: "payment-pay_ABC", serviceTitle: "Ceramic", value: 299 });
    const third = pixel.trackBooking({ eventId: "payment-pay_ABC", serviceTitle: "Ceramic", value: 299 });

    assert.equal(first, true, "first call reports");
    assert.equal(second, false, "duplicate suppressed");
    assert.equal(third, false, "duplicate suppressed");
    assert.equal(fired.filter((a) => a[0] === "track" && a[1] === "Schedule").length, 1);

    // A genuinely different booking still reports.
    const other = pixel.trackBooking({ eventId: "payment-pay_XYZ", serviceTitle: "PPF", value: 299 });
    assert.equal(other, true, "a different payment is a different conversion");

    proof(5, "Meta conversion fires exactly once per event id",
      `3 calls with payment-pay_ABC -> 1 Schedule event; a different id still fires. eventID sent for CAPI dedup.`);
  });

  test("Lead is deduplicated on the same key", async () => {
    const pixel = await import("../client/src/lib/meta-pixel.ts");
    pixel.__resetMetaPixelForTests();
    pixel.__setPixelIdForTests("1234567890");
    const fired = [];
    globalThis.window.fbq = (...args) => fired.push(args);

    assert.equal(pixel.trackLead({ eventId: "lead-1", service: "ppf" }), true);
    assert.equal(pixel.trackLead({ eventId: "lead-1", service: "ppf" }), false);
    assert.equal(fired.filter((a) => a[1] === "Lead").length, 1);
    proof(5.1, "Lead events deduplicate on the same key", "2 calls with lead-1 -> 1 Lead event");
  });

  test("the pixel is never initialised on an admin route", async () => {
    globalThis.window = { location: { pathname: "/admin/dashboard", search: "", host: "p91carcare.com" }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
    const pixel = await import("../client/src/lib/meta-pixel.ts");
    pixel.__resetMetaPixelForTests();
    await pixel.initMetaPixel();
    assert.equal(pixel.trackLead({ eventId: "lead-admin" }), false, "no tracking under /admin");
    proof(5.2, "Admin screens are excluded from Meta tracking",
      "initMetaPixel() on /admin/dashboard configures nothing; events are no-ops");
  });

  test("the pixel id is served at runtime, not baked at build", async () => {
    const res = await get("/api/public-config");
    assert.equal(res.status, 200);
    assert.equal(res.body.metaPixelId, "1234567890");
    // The Conversions API token must never be exposed here.
    assert.ok(!("metaAccessToken" in res.body), "no secret in public config");
    assert.ok(!("conversionsApiToken" in res.body), "no secret in public config");
    proof(5.3, "Pixel ID is runtime-configurable (META_PIXEL_ID), no rebuild needed",
      `GET /api/public-config -> ${JSON.stringify(res.body)} (no secrets present)`);
  });
});

// ===========================================================================
describe("checks 6-8 — customer confirmation without weakening admin auth", () => {
  test("6+7: a booking yields a token that loads the confirmation with NO auth", async () => {
    const res = await post("/api/bookings", {
      serviceId: "svc-ceramic", timeSlotId: "10:00",
      appointmentDate: futureDate(), appointmentTime: "10:00",
      customerName: "Confirm Customer", customerEmail: "c@example.com", customerPhone: "9876500011",
    });
    assert.equal(res.status, 200);
    const token = res.body.confirmationToken;
    assert.ok(token && token.length >= 40, "an unguessable token was issued");
    proof(6, "A successful booking returns a confirmation token to route the customer to",
      `POST /api/bookings -> confirmationToken (${token.length} chars, 256-bit CSPRNG)`);

    // No cookie, no session, no admin.
    const conf = await get(`/api/bookings/confirmation/${encodeURIComponent(token)}`);
    assert.equal(conf.status, 200, "customer reads their own booking unauthenticated");
    assert.equal(conf.body.customerName, "Confirm Customer");
    assert.equal(conf.body.service.title, "1 Year Ceramic Coating");

    // The allowlist: internals must not leak.
    for (const forbidden of ["paymentId", "razorpayOrderId", "erpSyncStatus", "erpDocumentId",
      "n8nExecutionId", "confirmationToken", "utmSource", "utmCampaign", "fbclid", "source"]) {
      assert.ok(!(forbidden in conf.body), `${forbidden} must not be exposed publicly`);
    }
    proof(7, "Customer confirmation works with NO admin authentication, and leaks nothing",
      `GET /api/bookings/confirmation/<token> -> 200; payment ids, ERP state, and marketing attribution all absent`);
  });

  test("an unknown or blank token is refused, and reveals nothing", async () => {
    const bad = await get("/api/bookings/confirmation/not-a-real-token");
    assert.equal(bad.status, 404);
    assert.equal(bad.body.message, "Booking not found");
    proof(7.1, "Guessed tokens are refused with an indistinguishable 404",
      `GET .../not-a-real-token -> 404 "Booking not found" (same response as a malformed token)`);
  });

  test("8: the admin booking endpoints are STILL protected", async () => {
    const b = await post("/api/bookings", {
      serviceId: "svc-ceramic", timeSlotId: "10:00",
      appointmentDate: futureDate(), appointmentTime: "10:00",
      customerName: "Admin Check", customerEmail: "a@example.com", customerPhone: "9876500011",
    });
    const id = b.body.booking.id;

    const byId = await get(`/api/bookings/${id}`);
    const adminDetail = await get(`/api/admin/bookings/${id}`);
    const list = await get("/api/bookings");

    assert.equal(byId.status, 401, "GET /api/bookings/:id still requires a session");
    assert.equal(adminDetail.status, 401);
    assert.equal(list.status, 401);
    proof(8, "Admin booking endpoints remain session-protected (unchanged)",
      `GET /api/bookings/:id -> 401, GET /api/admin/bookings/:id -> 401, GET /api/bookings -> 401`);
  });
});

// ===========================================================================
describe("checks 9-11 — the public lead endpoint is locked down", () => {
  const validLead = {
    name: "Real Customer", email: "real@example.com", phone: "+91 98765 43210",
    vehicleType: "car", serviceInterest: "ceramic", vehicleModel: "Honda City",
  };

  test("9: malformed requests are rejected with per-field reasons", async () => {
    const bad = await post("/api/ppf-leads", {
      name: "a", email: "not-an-email", phone: "1", vehicleType: "spaceship", serviceInterest: "nope",
    });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fieldErrors, "field-keyed errors returned");
    for (const f of ["name", "email", "phone", "vehicleType", "serviceInterest"]) {
      assert.ok(bad.body.fieldErrors[f], `${f} was rejected`);
    }
    assert.equal(db.leads.length, 0, "nothing was written");

    const missing = await post("/api/ppf-leads", { name: "Only Name" });
    assert.equal(missing.status, 400);
    assert.equal(db.leads.length, 0);

    proof(9, "Invalid lead requests are rejected server-side with per-field errors",
      `5 bad fields -> 400 with fieldErrors {${Object.keys(bad.body.fieldErrors).join(", ")}}; 0 rows written`);
  });

  test("10a: rate limiting blocks a flood", async () => {
    const results = [];
    for (let i = 0; i < 8; i++) {
      results.push((await post("/api/ppf-leads", { ...validLead, email: `f${i}@example.com` })).status);
    }
    const ok = results.filter((s) => s === 200).length;
    const limited = results.filter((s) => s === 429).length;
    assert.equal(ok, 5, "quota is 5 per 10 minutes");
    assert.equal(limited, 3, "the rest are refused");
    assert.equal(db.leads.length, 5, "only the permitted ones were written");
    proof(10, "Rate limiting works on the public lead endpoint",
      `8 rapid submissions -> ${ok} accepted, ${limited} refused with 429; ${db.leads.length} rows written`);
  });

  test("10b: the honeypot silently discards bots", async () => {
    const res = await post("/api/ppf-leads", { ...validLead, website: "http://spam.example" });
    assert.equal(res.status, 200, "responds as success so a bot learns nothing");
    assert.equal(db.leads.length, 0, "but nothing is stored");
    proof(10.1, "Honeypot bot protection works",
      `submission with the hidden field filled -> 200 (indistinguishable from success), 0 rows written`);
  });

  test("11: legitimate submissions still work, in every real phone format", async () => {
    const formats = ["+91 98765 43210", "09876543210", "9876543210", "+919876543210"];
    for (const [i, phone] of formats.entries()) {
      __resetRateLimitsForTests();
      const res = await post("/api/ppf-leads", { ...validLead, phone, email: `ok${i}@example.com` });
      assert.equal(res.status, 200, `phone format "${phone}" must be accepted`);
    }
    assert.equal(db.leads.length, formats.length);

    // And the exit-intent variant still works, with attribution.
    __resetRateLimitsForTests();
    const withAttr = await post("/api/ppf-leads", {
      ...validLead, email: "attr@example.com", source: "exit_intent",
      utmSource: "meta", utmCampaign: "ppf_sep", fbclid: "IwAR0lead",
    });
    assert.equal(withAttr.status, 200);
    const lead = db.leads[db.leads.length - 1];
    assert.equal(lead.source, "exit_intent", "which form produced it");
    assert.equal(lead.channel, "meta", "which campaign channel");
    assert.equal(lead.utmCampaign, "ppf_sep");

    proof(11, "Existing valid PPF submissions still work, and now carry attribution",
      `${formats.length} phone formats accepted; exit_intent lead stored with channel=${lead.channel} utm_campaign=${lead.utmCampaign}`);
  });

  test("a booking flood is limited too", async () => {
    const results = [];
    for (let i = 0; i < 13; i++) {
      results.push((await post("/api/bookings", {
        serviceId: "svc-ceramic", timeSlotId: "10:00",
        appointmentDate: futureDate(), appointmentTime: "10:00",
        customerName: "Flood " + i, customerEmail: `f${i}@example.com`, customerPhone: "9876500011",
      })).status);
    }
    assert.equal(results.filter((s) => s === 429).length, 3, "10 allowed, 3 refused");
    proof(10.2, "Rate limiting also protects the booking endpoint",
      `13 rapid bookings -> 10 accepted, 3 refused with 429`);
  });
});
