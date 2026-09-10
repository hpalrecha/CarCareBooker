/**
 * Phase 1 — the browser-side attribution capture rule.
 *
 *   npm run test:integration
 *
 * WHY THIS FILE EXISTS SEPARATELY. The overwrite rule is the load-bearing decision in the
 * whole attribution feature, and it is the one the requirement is explicitly about:
 *
 *     "Preserve attribution throughout the user's session/navigation until booking
 *      submission." / "Do not overwrite attribution during navigation."
 *
 * The failure it prevents is silent and expensive: every internal navigation carries no
 * utm parameters, so a naive "capture on every load" overwrites the ad click with blanks
 * and every booking reports as Direct. The campaign then looks like it converted nobody.
 * Nothing about that failure is visible in the UI, so it has to be caught here.
 *
 * The module reads `window.location`, `document.referrer` and `localStorage`. Rather than
 * pull in a full DOM implementation, this installs the smallest shim that is faithful to
 * the three behaviours that matter — including localStorage THROWING, which is what
 * Safari private mode actually does.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------------
// Minimal DOM shim, installed before the module under test is imported.
// ---------------------------------------------------------------------------------
class MemoryStorage {
  constructor() {
    this.map = new Map();
    this.throwOnWrite = false;
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    if (this.throwOnWrite) throw new Error("QuotaExceededError");
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
}

const storage = new MemoryStorage();

globalThis.window = {
  location: { search: "", pathname: "/", host: "p91carcare.com" },
  localStorage: storage,
};
globalThis.document = { referrer: "" };

/** Point the shim at a URL the way a real navigation would. */
function visit(pathname, search = "", referrer = "") {
  globalThis.window.location.pathname = pathname;
  globalThis.window.location.search = search;
  globalThis.document.referrer = referrer;
}

const { captureAttribution, getAttribution, attributionPayload, __resetAttributionForTests } =
  await import("../client/src/lib/attribution.ts");

describe("first-touch capture", () => {
  beforeEach(() => {
    storage.throwOnWrite = false;
    __resetAttributionForTests();
    visit("/", "", "");
  });

  test("captures utm parameters from the landing URL", () => {
    visit(
      "/ceramic-coating/car",
      "?utm_source=meta&utm_medium=cpc&utm_campaign=ceramic_car_sep&utm_content=video_a&utm_term=ceramic",
      "https://l.facebook.com/",
    );
    const a = captureAttribution();

    assert.equal(a.utmSource, "meta");
    assert.equal(a.utmMedium, "cpc");
    assert.equal(a.utmCampaign, "ceramic_car_sep");
    assert.equal(a.utmContent, "video_a");
    assert.equal(a.utmTerm, "ceramic");
    assert.equal(a.landingPage, "/ceramic-coating/car");
    assert.equal(a.referrer, "https://l.facebook.com/");
  });

  test("captures fbclid — often the only proof a visit came from Meta", () => {
    // Instagram and Facebook in-app browsers routinely strip the referrer, so a click can
    // arrive with no referrer at all and still be paid social.
    visit("/ppf", "?fbclid=IwAR0abcdef123", "");
    const a = captureAttribution();

    assert.equal(a.fbclid, "IwAR0abcdef123");
    assert.equal(a.referrer, null, "no referrer, exactly as an in-app browser sends it");
    assert.equal(a.landingPage, "/ppf");
  });

  test("landing_page records the path only, never the query string", () => {
    // The query string's contents are already captured as their own fields; duplicating
    // them here would make landing_page useless for "which page did they arrive on".
    visit("/ceramic-coating/bike", "?utm_source=meta&fbclid=abc");
    const a = captureAttribution();
    assert.equal(a.landingPage, "/ceramic-coating/bike");
  });

  test("a same-origin referrer is dropped as internal navigation", () => {
    visit("/services", "?utm_source=meta", "https://p91carcare.com/");
    const a = captureAttribution();
    assert.equal(a.referrer, null, "our own pages are not a referral source");
  });
});

describe("the overwrite rule — the requirement this feature turns on", () => {
  beforeEach(() => {
    storage.throwOnWrite = false;
    __resetAttributionForTests();
    visit("/", "", "");
  });

  test("attribution SURVIVES navigation to a page with no parameters", () => {
    // Meta ad -> landing page -> customer browses -> books. The booking must still say Meta.
    visit("/ceramic-coating/car", "?utm_source=meta&utm_campaign=ceramic_car_sep", "https://l.facebook.com/");
    captureAttribution();

    // Internal navigation: /services, then /service/1-year-ceramic-coating, then the modal.
    visit("/services", "");
    captureAttribution();
    visit("/service/1-year-ceramic-coating", "");
    captureAttribution();

    const a = getAttribution();
    assert.equal(a.utmSource, "meta", "the ad click survived two navigations");
    assert.equal(a.utmCampaign, "ceramic_car_sep");
    assert.equal(a.landingPage, "/ceramic-coating/car", "still the page they ARRIVED on");
  });

  test("a genuine second ad click DOES re-attribute", () => {
    // The opposite failure: write-once-forever credits an October booking to a September
    // campaign, and October looks like it produced nothing.
    visit("/ceramic-coating/car", "?utm_source=meta&utm_campaign=sept_campaign");
    captureAttribution();
    assert.equal(getAttribution().utmCampaign, "sept_campaign");

    visit("/ppf", "?utm_source=meta&utm_campaign=october_campaign");
    captureAttribution();
    assert.equal(getAttribution().utmCampaign, "october_campaign", "the newer ad click wins");
    assert.equal(getAttribution().landingPage, "/ppf");
  });

  test("a non-campaign query string does NOT clear a real attribution", () => {
    // ?page=2 or ?ref=nav is ordinary navigation, not an ad click. Treating any query
    // string as campaign signal would wipe attribution on a paginated listing.
    visit("/ceramic-coating/car", "?utm_source=meta&utm_campaign=ceramic_car_sep");
    captureAttribution();

    visit("/blog", "?page=2&ref=footer");
    captureAttribution();

    assert.equal(getAttribution().utmSource, "meta", "pagination is not an ad click");
    assert.equal(getAttribution().utmCampaign, "ceramic_car_sep");
  });

  test("an organic first visit is recorded, then not overwritten by navigation", () => {
    visit("/services", "", "https://www.google.com/");
    captureAttribution();
    const first = getAttribution();
    assert.equal(first.referrer, "https://www.google.com/");
    assert.equal(first.landingPage, "/services");

    visit("/service/car-polishing", "");
    captureAttribution();
    assert.equal(getAttribution().landingPage, "/services", "still the original landing page");
  });
});

describe("the submission payload", () => {
  beforeEach(() => {
    storage.throwOnWrite = false;
    __resetAttributionForTests();
    visit("/", "", "");
  });

  test("carries the campaign fields to the API", () => {
    visit("/ceramic-coating/car", "?utm_source=meta&utm_campaign=ceramic_car_sep&fbclid=IwAR0x");
    captureAttribution();

    const payload = attributionPayload();
    assert.equal(payload.utmSource, "meta");
    assert.equal(payload.utmCampaign, "ceramic_car_sep");
    assert.equal(payload.fbclid, "IwAR0x");
    assert.equal(payload.landingPage, "/ceramic-coating/car");
  });

  test("omits absent fields instead of sending explicit nulls", () => {
    visit("/ppf", "?utm_source=meta");
    captureAttribution();

    const payload = attributionPayload();
    assert.equal(payload.utmSource, "meta");
    assert.ok(!("utmTerm" in payload), "an unset field is absent, not null");
    assert.ok(!("gclid" in payload), "an unset field is absent, not null");
  });

  test("an unattributed visit still produces a valid, empty-ish payload", () => {
    visit("/", "");
    captureAttribution();
    const payload = attributionPayload();
    assert.equal(typeof payload, "object");
    assert.ok(!("utmSource" in payload));
  });
});

describe("storage failure must never cost a booking", () => {
  beforeEach(() => {
    storage.throwOnWrite = false;
    __resetAttributionForTests();
    visit("/", "", "");
  });

  test("a throwing localStorage degrades to memory rather than breaking", () => {
    // Safari private mode throws on setItem. A customer must not lose a booking because
    // analytics could not write.
    storage.throwOnWrite = true;

    visit("/ceramic-coating/car", "?utm_source=meta&utm_campaign=ceramic_car_sep");
    assert.doesNotThrow(() => captureAttribution(), "capture must not throw");

    // The in-memory fallback still serves this page view, which is enough to attribute a
    // booking made without a reload — the common case.
    const payload = attributionPayload();
    assert.equal(payload.utmSource, "meta", "attribution still available in-memory");
  });
});
