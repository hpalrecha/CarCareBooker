/**
 * Step 1 — campaign window resolution, overlap, and the pricing interaction.
 *
 *   npm run test:integration
 *
 * The two properties that matter most here, and why:
 *
 *   DETERMINISM     Overlapping campaigns must never be resolved arbitrarily. "Whatever
 *                   the database returned first" is a bug that shows different customers
 *                   different offers and cannot be reproduced.
 *
 *   NO PRICE DRIFT  Introducing this system must not change what a single customer is
 *                   charged. With zero campaigns the amount logic has to behave exactly
 *                   as it did before, and the legacy free_booking_until path has to keep
 *                   its own IST end-of-day semantics untouched.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  campaignState,
  isCampaignRunning,
  resolveActiveCampaign,
  pickDeterministic,
  campaignsOverlap,
  millisRemaining,
} from "../shared/campaign.ts";
import {
  validateCampaignInput,
  findOverlaps,
  effectiveCampaignForLandingPage,
  campaignFreeBookingForService,
} from "../server/lib/campaign.ts";
import { resolveBookingAmount, DEFAULT_BOOKING_FEE } from "../server/lib/booking-amount.ts";

/**
 * IST helper. Every business expectation in this file is written in Asia/Kolkata, because
 * that is the only timezone this business trades in — and the values are then absolute
 * instants, so the assertions hold wherever the test runs.
 */
const IST = (s) => new Date(`${s}+05:30`);

const base = {
  id: "c1",
  name: "September Ceramic Car",
  identifier: "ceramic_car_sep",
  serviceSlug: "1-year-ceramic-coating",
  vehicleType: "car",
  landingPage: "/ceramic-coating/car",
  startsAt: IST("2026-09-09T00:00:00").toISOString(),
  endsAt: IST("2026-09-17T00:00:00").toISOString(), // exclusive: through 16 Sep IST
  isActive: true,
  offerType: "free_booking",
  offerTitle: "Free booking this week",
  offerDescription: "Book at no cost. The service is charged at the studio.",
  ctaText: "Book Free Appointment",
  createdAt: IST("2026-09-01T10:00:00").toISOString(),
};
const mk = (over = {}) => ({ ...base, ...over });

// ===========================================================================
describe("campaign state — the seven cases", () => {
  test("no campaign at all", () => {
    const r = resolveActiveCampaign([], IST("2026-09-10T12:00:00"));
    assert.equal(r.campaign, null);
    assert.equal(r.state, "none");
    assert.deepEqual(r.conflicts, []);
  });

  test("one active campaign, mid-window", () => {
    const r = resolveActiveCampaign([mk()], IST("2026-09-10T12:00:00"));
    assert.equal(r.campaign.identifier, "ceramic_car_sep");
    assert.equal(r.state, "running");
    assert.deepEqual(r.conflicts, []);
  });

  test("expired campaign", () => {
    const now = IST("2026-09-20T12:00:00");
    assert.equal(campaignState(mk(), now), "expired");
    assert.equal(resolveActiveCampaign([mk()], now).campaign, null);
  });

  test("future campaign is scheduled, not running", () => {
    const now = IST("2026-09-01T12:00:00");
    assert.equal(campaignState(mk(), now), "scheduled");
    assert.equal(resolveActiveCampaign([mk()], now).campaign, null);
  });

  test("inactive campaign is paused, even inside its window", () => {
    const now = IST("2026-09-10T12:00:00");
    const paused = mk({ isActive: false });
    assert.equal(campaignState(paused, now), "paused");
    assert.equal(resolveActiveCampaign([paused], now).campaign, null);
  });

  test("malformed window fails CLOSED, and reports why", () => {
    const now = IST("2026-09-10T12:00:00");
    for (const bad of [
      mk({ startsAt: "not-a-date" }),
      mk({ endsAt: "" }),
      mk({ endsAt: null }),
      mk({ startsAt: undefined }),
      // Inverted: end before start.
      mk({ startsAt: IST("2026-09-17T00:00:00").toISOString(), endsAt: IST("2026-09-09T00:00:00").toISOString() }),
      // Zero-length: half-open [t, t) contains nothing.
      mk({ startsAt: IST("2026-09-10T00:00:00").toISOString(), endsAt: IST("2026-09-10T00:00:00").toISOString() }),
    ]) {
      assert.equal(campaignState(bad, now), "invalid", `should be invalid: ${JSON.stringify(bad.startsAt)}..${JSON.stringify(bad.endsAt)}`);
      assert.equal(isCampaignRunning(bad, now), false, "an invalid campaign is never running");
      assert.equal(resolveActiveCampaign([bad], now).campaign, null);
    }
  });

  test("an invalid window is reported as invalid even when paused", () => {
    // Order matters: a corrupt record must not hide behind being paused and then surprise
    // someone the moment it is switched on.
    assert.equal(campaignState(mk({ startsAt: "nonsense", isActive: false }), IST("2026-09-10T12:00:00")), "invalid");
  });
});

// ===========================================================================
describe("time boundaries — Asia/Kolkata business expectations, half-open [start, end)", () => {
  const c = mk();

  test("one second BEFORE start: not running", () => {
    assert.equal(campaignState(c, IST("2026-09-08T23:59:59")), "scheduled");
  });

  test("exactly AT start: running", () => {
    // Inclusive start. A campaign that begins at midnight is live at midnight.
    assert.equal(campaignState(c, IST("2026-09-09T00:00:00")), "running");
  });

  test("during: running", () => {
    assert.equal(campaignState(c, IST("2026-09-12T14:30:00")), "running");
  });

  test("last usable instant (16 Sep 23:59:59.999 IST): still running", () => {
    // The business meaning of "runs through the 16th". A customer booking at 11:59pm in
    // Bangalore on the final day must still get the offer.
    assert.equal(campaignState(c, IST("2026-09-16T23:59:59.999")), "running");
  });

  test("exactly AT end: NOT running", () => {
    // Exclusive end. This instant belongs to whatever comes next, never to both.
    assert.equal(campaignState(c, IST("2026-09-17T00:00:00")), "expired");
  });

  test("after end: expired", () => {
    assert.equal(campaignState(c, IST("2026-09-17T00:00:01")), "expired");
  });

  test("the boundary is an absolute instant, not a local wall-clock reading", () => {
    // The same moment expressed in three zones must give the same verdict. This is the
    // property that makes the countdown consistent across devices.
    const sameMoment = "2026-09-16T18:29:59.999Z"; // == 23:59:59.999 +05:30
    assert.equal(campaignState(c, new Date(sameMoment)), "running");
    assert.equal(campaignState(c, new Date("2026-09-16T18:30:00.000Z")), "expired");
  });

  test("millisRemaining never goes negative", () => {
    assert.ok(millisRemaining(c, IST("2026-09-10T00:00:00")) > 0);
    assert.equal(millisRemaining(c, IST("2026-09-17T00:00:00")), 0);
    assert.equal(millisRemaining(c, IST("2027-01-01T00:00:00")), 0, "long expired is still 0, never negative");
    assert.equal(millisRemaining(mk({ endsAt: "garbage" }), IST("2026-09-10T00:00:00")), 0);
  });
});

// ===========================================================================
describe("overlapping campaigns — deterministic, never arbitrary", () => {
  const now = IST("2026-09-10T12:00:00");

  const a = mk({ id: "a", identifier: "sept_a", startsAt: IST("2026-09-01T00:00:00").toISOString() });
  const b = mk({ id: "b", identifier: "sept_b", startsAt: IST("2026-09-05T00:00:00").toISOString() });

  test("the most recently STARTED campaign wins", () => {
    const r = resolveActiveCampaign([a, b], now);
    assert.equal(r.campaign.identifier, "sept_b", "b starts later, so b is the current intent");
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].identifier, "sept_a");
  });

  test("the winner does not depend on input order", () => {
    // The whole point: "whatever the database returned first" is not an answer.
    const forwards = resolveActiveCampaign([a, b], now).campaign.id;
    const backwards = resolveActiveCampaign([b, a], now).campaign.id;
    assert.equal(forwards, backwards);
    assert.equal(forwards, "b");
  });

  test("equal starts fall through to most recently CREATED", () => {
    const x = mk({ id: "x", identifier: "x", createdAt: IST("2026-09-01T09:00:00").toISOString() });
    const y = mk({ id: "y", identifier: "y", createdAt: IST("2026-09-01T11:00:00").toISOString() });
    assert.equal(resolveActiveCampaign([x, y], now).campaign.id, "y");
    assert.equal(resolveActiveCampaign([y, x], now).campaign.id, "y");
  });

  test("a total tie still resolves deterministically, by id", () => {
    // Two rows inserted in one transaction can share both timestamps. A comparator that
    // returns 0 here leaves the winner to the database's row order.
    const p = mk({ id: "aaa", identifier: "p" });
    const q = mk({ id: "bbb", identifier: "q" });
    assert.equal(resolveActiveCampaign([p, q], now).campaign.id, "aaa");
    assert.equal(resolveActiveCampaign([q, p], now).campaign.id, "aaa");
    assert.equal(pickDeterministic([q, p]).id, "aaa");
  });

  test("conflicts are always surfaced, never swallowed", () => {
    const r = resolveActiveCampaign([a, b, mk({ id: "c", identifier: "sept_c" })], now);
    assert.equal(r.conflicts.length, 2, "every campaign the winner beat is reported");
    assert.ok(!r.conflicts.some((c) => c.id === r.campaign.id), "the winner is not its own conflict");
  });

  test("expired and paused campaigns are not conflicts", () => {
    const expired = mk({ id: "old", identifier: "old", startsAt: IST("2026-08-01T00:00:00").toISOString(), endsAt: IST("2026-08-10T00:00:00").toISOString() });
    const paused = mk({ id: "draft", identifier: "draft", isActive: false });
    const r = resolveActiveCampaign([mk(), expired, paused], now);
    assert.equal(r.campaign.identifier, "ceramic_car_sep");
    assert.deepEqual(r.conflicts, [], "only RUNNING campaigns compete");
  });

  test("campaigns on different landing pages never compete", () => {
    const car = mk({ id: "car", identifier: "car", landingPage: "/ceramic-coating/car" });
    const bike = mk({ id: "bike", identifier: "bike", landingPage: "/ceramic-coating/bike" });

    const onCar = effectiveCampaignForLandingPage([car, bike], "/ceramic-coating/car", now);
    const onBike = effectiveCampaignForLandingPage([car, bike], "/ceramic-coating/bike", now);
    assert.equal(onCar.campaign.identifier, "car");
    assert.deepEqual(onCar.conflicts, [], "a bike campaign is not a conflict for the car page");
    assert.equal(onBike.campaign.identifier, "bike");
  });
});

// ===========================================================================
describe("overlap detection on the WRITE path — refuse ambiguity at the source", () => {
  test("overlapping active windows on one landing page conflict", () => {
    const a = mk({ id: "a", startsAt: IST("2026-09-01T00:00:00").toISOString(), endsAt: IST("2026-09-10T00:00:00").toISOString() });
    const b = mk({ id: "b", startsAt: IST("2026-09-05T00:00:00").toISOString(), endsAt: IST("2026-09-15T00:00:00").toISOString() });
    assert.equal(campaignsOverlap(a, b), true);
    assert.equal(findOverlaps(b, [a]).length, 1);
  });

  test("ADJACENT windows do not overlap — the half-open interval earns its keep", () => {
    // One ends at exactly the instant the next begins. With an inclusive end these would
    // both own that instant, and every adjacent pair of campaigns would be a conflict.
    const first = mk({ id: "a", startsAt: IST("2026-09-01T00:00:00").toISOString(), endsAt: IST("2026-09-17T00:00:00").toISOString() });
    const next = mk({ id: "b", startsAt: IST("2026-09-17T00:00:00").toISOString(), endsAt: IST("2026-09-30T00:00:00").toISOString() });
    assert.equal(campaignsOverlap(first, next), false);
    assert.deepEqual(findOverlaps(next, [first]), []);
  });

  test("a PAUSED campaign may overlap — drafts must be preparable", () => {
    const live = mk({ id: "a" });
    const draft = mk({ id: "b", isActive: false });
    assert.equal(campaignsOverlap(live, draft), false);
    assert.deepEqual(findOverlaps(draft, [live]), [], "next month's draft can be written today");
  });

  test("a campaign never conflicts with itself when edited", () => {
    const existing = mk({ id: "same" });
    assert.deepEqual(findOverlaps({ ...existing, offerTitle: "Edited" }, [existing]), []);
  });

  test("different landing pages never conflict", () => {
    const car = mk({ id: "a", landingPage: "/ceramic-coating/car" });
    const ppf = mk({ id: "b", landingPage: "/ppf" });
    assert.equal(campaignsOverlap(car, ppf), false);
  });

  test("an invalid window cannot conflict, because it is not a window", () => {
    assert.equal(campaignsOverlap(mk({ id: "a", endsAt: "junk" }), mk({ id: "b" })), false);
  });
});

// ===========================================================================
describe("PRICING — a campaign must not change what anyone is charged", () => {
  const CERAMIC = "1-year-ceramic-coating";

  test("NO campaigns: pricing is byte-identical to before", () => {
    // The property that makes this migration safe to apply to production.
    const normal = resolveBookingAmount({
      serviceSlug: CERAMIC,
      servicePrice: "5999.00",
      bookingAmountSetting: "299",
    });
    assert.equal(normal.amount, 299);
    assert.equal(normal.source, "settings");

    const withEmptyCampaigns = resolveBookingAmount({
      serviceSlug: CERAMIC,
      servicePrice: "5999.00",
      bookingAmountSetting: "299",
      campaignFreeBooking: campaignFreeBookingForService([], CERAMIC).free,
    });
    assert.deepEqual(withEmptyCampaigns, normal, "zero campaigns changes nothing");
  });

  test("LEGACY free_booking_until still works, unchanged", () => {
    const r = resolveBookingAmount({
      serviceSlug: CERAMIC,
      servicePrice: "5999.00",
      bookingAmountSetting: "299",
      freeBookingUntil: "2026-09-16",
      now: IST("2026-09-10T12:00:00"),
    });
    assert.equal(r.amount, 0);
    assert.equal(r.source, "free-offer", "still attributed to the legacy setting, not a campaign");
  });

  test("LEGACY window keeps its INCLUSIVE IST end-of-day semantics", () => {
    // Deliberately different from a campaign's exclusive end. The legacy setting is a
    // DATE ("free until the 16th") and must keep meaning through the end of that day in
    // Bangalore. Timezone handling for campaigns must not have altered this.
    const at = (iso) =>
      resolveBookingAmount({
        serviceSlug: CERAMIC, servicePrice: "5999.00", bookingAmountSetting: "299",
        freeBookingUntil: "2026-09-16", now: IST(iso),
      });
    assert.equal(at("2026-09-16T23:59:59").amount, 0, "11:59pm IST on the final day is still free");
    assert.equal(at("2026-09-17T00:00:01").amount, 299, "the next day is charged");
  });

  test("ACTIVE campaign waives the fee, and says so in `source`", () => {
    const campaigns = [mk()];
    const { free, campaign } = campaignFreeBookingForService(campaigns, CERAMIC, IST("2026-09-10T12:00:00"));
    assert.equal(free, true);
    assert.equal(campaign.identifier, "ceramic_car_sep");

    const r = resolveBookingAmount({
      serviceSlug: CERAMIC, servicePrice: "5999.00", bookingAmountSetting: "299",
      campaignFreeBooking: free,
    });
    assert.equal(r.amount, 0);
    assert.equal(r.source, "campaign-free-offer");
  });

  test("a campaign is SCOPED to its service — it cannot make other services free", () => {
    // The regression this prevents: a ceramic-coating campaign silently waiving the
    // ₹8,999 Annual Maintenance Package because both happen to be bookable that week.
    const campaigns = [mk()];
    const now = IST("2026-09-10T12:00:00");

    assert.equal(campaignFreeBookingForService(campaigns, "annual-maintenance-package", now).free, false);

    const amp = resolveBookingAmount({
      serviceSlug: "annual-maintenance-package",
      servicePrice: "8999.00",
      bookingAmountSetting: "299",
      campaignFreeBooking: campaignFreeBookingForService(campaigns, "annual-maintenance-package", now).free,
    });
    assert.equal(amp.amount, 8999, "the package is still charged in full");
    assert.equal(amp.source, "service-price");
  });

  test("a PAID service still gets its amount from the catalogue, not the campaign", () => {
    // offerType "none" is presentation only — a title and a countdown, no money.
    const presentationOnly = [mk({ offerType: "none" })];
    const now = IST("2026-09-10T12:00:00");
    assert.equal(campaignFreeBookingForService(presentationOnly, CERAMIC, now).free, false);

    const r = resolveBookingAmount({
      serviceSlug: CERAMIC, servicePrice: "5999.00", bookingAmountSetting: "299",
      campaignFreeBooking: false,
    });
    assert.equal(r.amount, 299, "Razorpay is still asked for the server-resolved fee");
    assert.equal(r.source, "settings");
  });

  test("an EXPIRED campaign charges normally again", () => {
    const campaigns = [mk()];
    const after = IST("2026-09-20T12:00:00");
    assert.equal(campaignFreeBookingForService(campaigns, CERAMIC, after).free, false);

    const r = resolveBookingAmount({
      serviceSlug: CERAMIC, servicePrice: "5999.00", bookingAmountSetting: "299",
      campaignFreeBooking: false,
    });
    assert.equal(r.amount, 299);
  });

  test("a corrupt campaign cannot give the catalogue away", () => {
    const corrupt = [mk({ startsAt: "nonsense" }), mk({ id: "z", endsAt: null })];
    assert.equal(campaignFreeBookingForService(corrupt, CERAMIC, IST("2026-09-10T12:00:00")).free, false);
  });

  test("the settings-missing fallback is still the server default", () => {
    const r = resolveBookingAmount({
      serviceSlug: CERAMIC, servicePrice: "5999.00", bookingAmountSetting: null,
      campaignFreeBooking: false,
    });
    assert.equal(r.amount, DEFAULT_BOOKING_FEE);
    assert.equal(r.source, "default");
  });
});

// ===========================================================================
describe("admin input validation — the frontend is not trusted", () => {
  const valid = {
    name: "September Ceramic Car",
    identifier: "ceramic_car_sep",
    serviceSlug: "1-year-ceramic-coating",
    vehicleType: "car",
    landingPage: "/ceramic-coating/car",
    startsAt: "2026-09-09T00:00:00+05:30",
    endsAt: "2026-09-17T00:00:00+05:30",
    isActive: true,
    offerType: "free_booking",
    offerTitle: "Free booking this week",
    offerDescription: "Book at no cost.",
    ctaText: "Book Free Appointment",
  };

  test("a well-formed campaign is accepted", () => {
    const r = validateCampaignInput(valid);
    assert.equal(r.ok, true);
  });

  test("identifier format is enforced", () => {
    for (const bad of ["Ceramic_Car", "ceramic-car-sep", "ab", "x".repeat(61), "ceramic car", "_leading", "trailing_"]) {
      const r = validateCampaignInput({ ...valid, identifier: bad });
      assert.equal(r.ok, false, `"${bad}" must be rejected`);
      assert.ok(r.fieldErrors.identifier);
    }
  });

  test("timestamps must carry a timezone offset", () => {
    // "2026-09-16T00:00:00" is a different instant in every runtime. A campaign starting
    // at midnight in an unspecified zone starts at the wrong time in Bangalore.
    const r = validateCampaignInput({ ...valid, startsAt: "2026-09-09T00:00:00" });
    assert.equal(r.ok, false);
    assert.match(r.fieldErrors.startsAt, /timezone offset/);

    assert.equal(validateCampaignInput({ ...valid, startsAt: "2026-09-09T00:00:00Z" }).ok, true, "Z is an offset");
  });

  test("end must be after start", () => {
    const r = validateCampaignInput({ ...valid, startsAt: "2026-09-17T00:00:00+05:30", endsAt: "2026-09-09T00:00:00+05:30" });
    assert.equal(r.ok, false);
    assert.ok(r.fieldErrors.endsAt);

    const equal = validateCampaignInput({ ...valid, endsAt: valid.startsAt });
    assert.equal(equal.ok, false, "a zero-length campaign is not a campaign");
  });

  test("closed vocabularies are enforced", () => {
    assert.equal(validateCampaignInput({ ...valid, vehicleType: "spaceship" }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, offerType: "half_price" }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, landingPage: "/anything" }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, landingPage: "/ppf" }).ok, true);
  });

  test("CTA length is bounded, because it renders inside a button", () => {
    assert.equal(validateCampaignInput({ ...valid, ctaText: "x" }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, ctaText: "B".repeat(41) }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, ctaText: "Book Free Appointment" }).ok, true);
  });

  test("required offer fields are required", () => {
    assert.equal(validateCampaignInput({ ...valid, offerTitle: "" }).ok, false);
    assert.equal(validateCampaignInput({ ...valid, name: "ab" }).ok, false);
    const { offerTitle, ...missing } = valid;
    assert.equal(validateCampaignInput(missing).ok, false);
  });

  test("isActive must be an explicit boolean", () => {
    assert.equal(validateCampaignInput({ ...valid, isActive: "yes" }).ok, false);
    const { isActive, ...missing } = valid;
    assert.equal(validateCampaignInput(missing).ok, false, "active state is never inferred");
  });

  test("unknown fields are rejected outright", () => {
    // .strict() — a stray `price` field must not be silently accepted and ignored, since
    // the sender clearly believed it would do something.
    const r = validateCampaignInput({ ...valid, price: "1" });
    assert.equal(r.ok, false);
  });

  test("errors are field-keyed so the form can mark the offending input", () => {
    const r = validateCampaignInput({ ...valid, identifier: "BAD", ctaText: "", vehicleType: "boat" });
    assert.equal(r.ok, false);
    for (const f of ["identifier", "ctaText", "vehicleType"]) assert.ok(r.fieldErrors[f], `${f} reported`);
  });
});
