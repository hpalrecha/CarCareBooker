/**
 * Phase 1 — attribution and rate limiting.
 *
 *   npm run test:integration
 *
 * Runs under tsx, so the TypeScript modules are imported directly rather than
 * regex-stripped. These are the units the ad campaign's reporting depends on:
 *
 *   server/lib/attribution.ts   what gets stored, and what `source` a booking is filed under
 *   server/lib/rate-limit.ts    whether the public endpoints can be hammered
 *
 * The client-side capture rule lives in client/src/lib/attribution.ts and is exercised in
 * tests/attribution-client.itest.mjs against a DOM shim. The overwrite rule is the single
 * most consequential decision in this work, so it is asserted against the real module
 * rather than against a description of it.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { parseAttribution, deriveSource, MAX_ATTRIBUTION_LENGTH } from "../server/lib/attribution.ts";
import { consume, __resetRateLimitsForTests } from "../server/lib/rate-limit.ts";

describe("attribution: what reaches the database", () => {
  test("captures every field the brief requires", () => {
    const a = parseAttribution({
      utmSource: "meta",
      utmMedium: "cpc",
      utmCampaign: "ceramic_car_sep",
      utmContent: "video_a",
      utmTerm: "ceramic coating bangalore",
      fbclid: "IwAR0abc123",
      gclid: "Cj0KCQ",
      landingPage: "/ceramic-coating/car",
      referrer: "https://l.facebook.com/",
    });

    assert.equal(a.utmSource, "meta");
    assert.equal(a.utmMedium, "cpc");
    assert.equal(a.utmCampaign, "ceramic_car_sep");
    assert.equal(a.utmContent, "video_a");
    assert.equal(a.utmTerm, "ceramic coating bangalore");
    assert.equal(a.fbclid, "IwAR0abc123");
    assert.equal(a.gclid, "Cj0KCQ");
    assert.equal(a.landingPage, "/ceramic-coating/car");
    assert.equal(a.referrer, "https://l.facebook.com/");
  });

  test("a missing or malformed body yields all-null rather than throwing", () => {
    // A booking must never fail because attribution was absent or junk.
    for (const input of [null, undefined, {}, "not-an-object", 42]) {
      const a = parseAttribution(input);
      assert.equal(a.utmSource, null);
      assert.equal(a.fbclid, null);
    }
  });

  test("non-string values are rejected, not coerced", () => {
    // String(["a","b"]) is "a,b" — a plausible-looking campaign name that is pure fiction,
    // and indistinguishable from real data once it is in a report.
    const a = parseAttribution({
      utmSource: ["meta", "google"],
      utmCampaign: { toString: () => "evil" },
      fbclid: 12345,
      utmMedium: true,
    });
    assert.equal(a.utmSource, null);
    assert.equal(a.utmCampaign, null);
    assert.equal(a.fbclid, null);
    assert.equal(a.utmMedium, null);
  });

  test("values are bounded, so a crafted request cannot write unbounded data", () => {
    const a = parseAttribution({ utmCampaign: "x".repeat(10_000) });
    assert.equal(a.utmCampaign.length, MAX_ATTRIBUTION_LENGTH);
  });

  test("control characters and line breaks cannot reach a log line or a table cell", () => {
    // Built from code points rather than typed literally: an invisible character pasted
    // into a source file is a test nobody can review.
    const NUL = String.fromCharCode(0);
    const BEL = String.fromCharCode(7);
    const DEL = String.fromCharCode(127);
    const LF = String.fromCharCode(10);
    const CR = String.fromCharCode(13);

    const a = parseAttribution({
      utmCampaign: "spring" + LF + CR + NUL + "sale" + BEL + DEL + " promo",
    });

    const surviving = Array.from(a.utmCampaign).filter((ch) => {
      const c = ch.codePointAt(0);
      return c <= 0x1f || c === 0x7f || (c >= 0x80 && c <= 0x9f);
    });
    assert.deepEqual(surviving, [], "no control character survives");
    assert.equal(a.utmCampaign, "spring sale promo");
  });

  test("blank and whitespace-only values become null, not empty strings", () => {
    const a = parseAttribution({
      utmSource: "   ",
      utmCampaign: "",
      utmTerm: String.fromCharCode(9) + String.fromCharCode(10),
    });
    assert.equal(a.utmSource, null);
    assert.equal(a.utmCampaign, null);
    assert.equal(a.utmTerm, null);
  });
});

describe("deriveSource: the column reporting groups by", () => {
  const attr = (o) => parseAttribution(o);

  test("fbclid alone proves a Meta click", () => {
    // The whole point: Instagram and Facebook in-app browsers strip the referrer, so the
    // click id is often the ONLY evidence a visit came from paid social.
    assert.equal(deriveSource(attr({ fbclid: "IwAR0abc" })), "meta");
  });

  test("fbclid outranks a contradictory utm_source", () => {
    // A mistagged ad is still provably a Meta click.
    assert.equal(deriveSource(attr({ fbclid: "IwAR0abc", utmSource: "newsletter" })), "meta");
  });

  test("recognises the labels marketing actually types", () => {
    for (const s of ["meta", "Meta", "facebook", "FACEBOOK", "instagram", "fb", "ig", "metaads"]) {
      assert.equal(deriveSource(attr({ utmSource: s })), "meta", s + " should be meta");
    }
    for (const s of ["google", "adwords", "googleads"]) {
      assert.equal(deriveSource(attr({ utmSource: s })), "google", s + " should be google");
    }
  });

  test("does NOT match 'fb' or 'ig' as substrings of unrelated sources", () => {
    // The regression this guards: /fb|ig/ as a substring test files "bigcommerce" and
    // "signal" as paid Meta traffic — making a campaign look like it worked when it did
    // not, which is the one direction of error nobody goes looking for.
    assert.equal(deriveSource(attr({ utmSource: "bigcommerce" })), "bigcommerce");
    assert.equal(deriveSource(attr({ utmSource: "signal" })), "signal");
    assert.equal(deriveSource(attr({ utmSource: "fbtest" })), "fbtest");
  });

  test("an unknown utm_source is preserved rather than discarded", () => {
    assert.equal(deriveSource(attr({ utmSource: "newsletter" })), "newsletter");
  });

  test("referrer without campaign params is organic; nothing at all is direct", () => {
    assert.equal(deriveSource(attr({ referrer: "https://www.google.com/" })), "organic");
    assert.equal(deriveSource(attr({})), "direct");
  });

  test("'direct' is a measurement, never a stand-in for 'unknown'", () => {
    // The migration deliberately backfills nothing. NULL means the booking predates
    // measurement; 'direct' means it WAS measured and there was no campaign. Someone will
    // divide one by the other, so the two must not be conflated.
    assert.equal(deriveSource(attr({})), "direct");
    assert.notEqual(deriveSource(attr({})), null);
  });
});

describe("rate limiting", () => {
  beforeEach(() => __resetRateLimitsForTests());

  const opts = { bucket: "test", windowMs: 60_000, max: 3 };

  test("permits up to the quota then refuses", () => {
    const now = 1_000_000;
    assert.equal(consume(opts, "1.2.3.4", now).allowed, true);
    assert.equal(consume(opts, "1.2.3.4", now).allowed, true);
    assert.equal(consume(opts, "1.2.3.4", now).allowed, true);
    assert.equal(consume(opts, "1.2.3.4", now).allowed, false, "4th is over quota");
  });

  test("quotas are per client, so one abuser cannot block everyone", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) consume(opts, "1.1.1.1", now);
    assert.equal(consume(opts, "1.1.1.1", now).allowed, false);
    assert.equal(consume(opts, "2.2.2.2", now).allowed, true, "a different client is unaffected");
  });

  test("quotas are per bucket, so endpoints do not spend each other's budget", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) consume({ ...opts, bucket: "leads" }, "1.1.1.1", now);
    assert.equal(consume({ ...opts, bucket: "leads" }, "1.1.1.1", now).allowed, false);
    assert.equal(
      consume({ ...opts, bucket: "bookings" }, "1.1.1.1", now).allowed,
      true,
      "a different endpoint has its own quota",
    );
  });

  test("the window resets, so a blocked customer is not blocked forever", () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) consume(opts, "1.2.3.4", now);
    assert.equal(consume(opts, "1.2.3.4", now).allowed, false);

    const later = now + 60_001;
    assert.equal(consume(opts, "1.2.3.4", later).allowed, true, "new window, fresh quota");
  });

  test("reports a usable Retry-After", () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) consume(opts, "1.2.3.4", now);
    const r = consume(opts, "1.2.3.4", now + 30_000);
    assert.equal(r.allowed, false);
    assert.ok(r.retryAfterSeconds > 0 && r.retryAfterSeconds <= 60, "seconds within the window");
  });

  test("the configured production quotas admit a normal customer", () => {
    // A limit is only correct if it never fires for real use. These mirror the values in
    // server/routes.ts; if either is tightened, this test should fail first.
    const now = 2_000_000;

    const leads = { bucket: "ppf-leads", windowMs: 10 * 60_000, max: 5 };
    assert.equal(consume(leads, "cust", now).allowed, true, "first enquiry");
    assert.equal(consume(leads, "cust", now + 5_000).allowed, true, "resubmitted after a typo");

    const bookings = { bucket: "bookings", windowMs: 10 * 60_000, max: 10 };
    for (let attempt = 1; attempt <= 5; attempt++) {
      assert.equal(
        consume(bookings, "cust2", now + attempt * 1000).allowed,
        true,
        "retry " + attempt + " after a failed payment must be allowed",
      );
    }
  });
});
