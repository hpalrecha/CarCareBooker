/**
 * Phase 2C — countdown arithmetic and clock correction.
 *
 *   npm run test:integration
 *
 * The countdown is almost entirely edge cases, and none of the important ones are
 * convenient to reproduce by rendering a component and waiting: a device whose clock is
 * two hours wrong, a campaign that ends between two ticks, a tab that slept through the
 * deadline. All of those are ordinary function calls here.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  remainingFrom,
  clockOffset,
  describeRemaining,
  pad2,
  EXPIRED,
} from "../client/src/lib/countdown.ts";

const IST = (s) => new Date(`${s}+05:30`).getTime();
const SECOND = 1000, MINUTE = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

/** The live campaign window: 9 Sep -> 17 Sep 00:00 IST (exclusive). */
const ENDS_AT = new Date(IST("2026-09-17T00:00:00")).toISOString();

describe("remaining time — the normal case", () => {
  test("a future deadline breaks into days, hours, minutes, seconds", () => {
    // 4 days, 12 hours, 35 minutes, 21 seconds before the end.
    const now = IST("2026-09-17T00:00:00") - (4 * DAY + 12 * HOUR + 35 * MINUTE + 21 * SECOND);
    const r = remainingFrom(ENDS_AT, now);

    assert.equal(r.expired, false);
    assert.equal(r.days, 4);
    assert.equal(r.hours, 12);
    assert.equal(r.minutes, 35);
    assert.equal(r.seconds, 21);
  });

  test("units never exceed their range", () => {
    const r = remainingFrom(ENDS_AT, IST("2026-09-09T00:00:00"));
    assert.ok(r.hours < 24 && r.minutes < 60 && r.seconds < 60);
    // 9 Sep 00:00 -> 17 Sep 00:00 IST is EIGHT days (the campaign runs through the 16th).
    assert.equal(r.days, 8, "length comes from the data, not from an assumed duration");
  });

  test("days are NOT zero-padded — a long campaign is legitimate", () => {
    const now = IST("2026-09-17T00:00:00") - 100 * DAY;
    assert.equal(remainingFrom(ENDS_AT, now).days, 100);
    assert.equal(pad2(7), "07");
    assert.equal(pad2(0), "00");
  });

  test("one second before the end", () => {
    const r = remainingFrom(ENDS_AT, IST("2026-09-16T23:59:59"));
    assert.equal(r.expired, false);
    assert.deepEqual([r.days, r.hours, r.minutes, r.seconds], [0, 0, 0, 1]);
  });
});

describe("expiry — clamped, never negative", () => {
  test("exactly AT the deadline is expired", () => {
    // Half-open window: endsAt itself is already over.
    assert.equal(remainingFrom(ENDS_AT, IST("2026-09-17T00:00:00")).expired, true);
  });

  test("past the deadline is expired, not negative", () => {
    const r = remainingFrom(ENDS_AT, IST("2026-09-20T12:00:00"));
    assert.deepEqual(r, EXPIRED);
    assert.equal(r.totalMs, 0);
    for (const v of [r.days, r.hours, r.minutes, r.seconds]) {
      assert.ok(v >= 0, "no unit is ever negative");
    }
  });

  test("a long-expired campaign is still exactly zero", () => {
    // The "-00:00:12" bug: a negative duration formatted as digits looks like a broken
    // page on a form asking for the customer's phone number.
    const r = remainingFrom(ENDS_AT, IST("2030-01-01T00:00:00"));
    assert.deepEqual(r, EXPIRED);
  });

  test("a missing or unparseable deadline fails CLOSED", () => {
    for (const bad of [null, undefined, "", "not-a-date", "tomorrow", {}, []]) {
      assert.equal(remainingFrom(bad, Date.now()).expired, true, `${JSON.stringify(bad)} must expire`);
    }
  });

  test("a Date object works as well as an ISO string", () => {
    const asDate = new Date(IST("2026-09-17T00:00:00"));
    const now = IST("2026-09-16T23:00:00");
    assert.equal(remainingFrom(asDate, now).hours, 1);
  });
});

describe("clock correction — the point of serverNow", () => {
  test("offset is serverNow minus the client clock at response time", () => {
    const serverNow = new Date(IST("2026-09-12T12:00:00")).toISOString();
    const clientNow = IST("2026-09-12T12:00:00");
    assert.equal(clockOffset(serverNow, clientNow), 0, "a correct clock needs no correction");
  });

  test("a client clock two hours BEHIND still shows the right time", () => {
    const realNow = IST("2026-09-12T12:00:00");
    const deviceNow = realNow - 2 * HOUR; // phone is slow
    const offset = clockOffset(new Date(realNow).toISOString(), deviceNow);
    assert.equal(offset, 2 * HOUR);

    const corrected = remainingFrom(ENDS_AT, deviceNow + offset);
    const truth = remainingFrom(ENDS_AT, realNow);
    assert.deepEqual(corrected, truth, "corrected device agrees with the server");

    const uncorrected = remainingFrom(ENDS_AT, deviceNow);
    assert.notDeepEqual(uncorrected, truth, "and would have been wrong without it");
    assert.equal(uncorrected.totalMs - truth.totalMs, 2 * HOUR, "wrong by exactly the clock error");
  });

  test("a client clock two hours AHEAD still shows the right time", () => {
    const realNow = IST("2026-09-12T12:00:00");
    const deviceNow = realNow + 2 * HOUR;
    const offset = clockOffset(new Date(realNow).toISOString(), deviceNow);
    assert.equal(offset, -2 * HOUR);
    assert.deepEqual(remainingFrom(ENDS_AT, deviceNow + offset), remainingFrom(ENDS_AT, realNow));
  });

  test("a wildly wrong clock cannot show a live countdown for a dead campaign", () => {
    // THE failure this prevents. Device thinks it is a week before the campaign; the
    // server knows it ended yesterday. Uncorrected, the customer sees days remaining and
    // is then charged, because the server refuses to waive the fee outside the window.
    const realNow = IST("2026-09-20T00:00:00"); // campaign already over
    const deviceNow = IST("2026-09-10T00:00:00"); // device is 10 days behind

    assert.equal(remainingFrom(ENDS_AT, deviceNow).expired, false, "device alone would show an offer");

    const offset = clockOffset(new Date(realNow).toISOString(), deviceNow);
    assert.equal(remainingFrom(ENDS_AT, deviceNow + offset).expired, true, "corrected: correctly expired");
  });

  test("a missing or malformed serverNow degrades to zero, never to a wrong number", () => {
    for (const bad of [null, undefined, "", "garbage", "not-a-timestamp"]) {
      assert.equal(clockOffset(bad, Date.now()), 0, `${JSON.stringify(bad)} -> no correction`);
    }
  });

  test("sub-second network latency does not matter at display granularity", () => {
    const realNow = IST("2026-09-12T12:00:00");
    // Response arrives 120ms after the server sampled its clock.
    const offset = clockOffset(new Date(realNow).toISOString(), realNow + 120);
    const withLatency = remainingFrom(ENDS_AT, realNow + 120 + offset);
    const perfect = remainingFrom(ENDS_AT, realNow);
    assert.equal(withLatency.seconds, perfect.seconds, "same displayed second");
  });
});

describe("recomputed, not decremented — the sleeping-tab case", () => {
  test("a tab that sleeps through the deadline is correct on its first tick back", () => {
    // A decrementing counter would have ticked ~0 times while asleep and would still be
    // showing hours remaining. Deriving from absolute instants is correct immediately.
    const beforeSleep = IST("2026-09-16T22:00:00");
    assert.equal(remainingFrom(ENDS_AT, beforeSleep).hours, 2);

    const afterSleep = IST("2026-09-17T06:00:00"); // laptop woke up 8 hours later
    assert.equal(remainingFrom(ENDS_AT, afterSleep).expired, true);
  });

  test("skipped ticks cannot accumulate drift", () => {
    // Ten arbitrary sample points; each is computed independently and must agree with the
    // arithmetic, regardless of how many ticks "fired" between them.
    for (let i = 0; i < 10; i++) {
      const now = IST("2026-09-17T00:00:00") - (i * 7 * HOUR + 13 * MINUTE);
      const r = remainingFrom(ENDS_AT, now);
      const rebuilt = r.days * DAY + r.hours * HOUR + r.minutes * MINUTE + r.seconds * SECOND;
      assert.ok(Math.abs(rebuilt - r.totalMs) < 1000, "units reconstruct the total");
    }
  });
});

describe("accessibility text", () => {
  test("omits seconds, so a screen reader is not interrupted every second", () => {
    const now = IST("2026-09-17T00:00:00") - (4 * DAY + 12 * HOUR + 35 * MINUTE + 21 * SECOND);
    const spoken = describeRemaining(remainingFrom(ENDS_AT, now));
    assert.match(spoken, /4 days, 12 hours and 35 minutes remaining/);
    assert.ok(!/second/.test(spoken), "seconds are deliberately not announced");
  });

  test("the announced string is stable for a whole minute", () => {
    // aria-live only announces on CHANGE, so an unchanged string is silent. This is what
    // makes a per-second timer usable with a screen reader.
    const base = IST("2026-09-17T00:00:00") - (2 * HOUR + 30 * MINUTE);
    // Sample from just AFTER a minute boundary: at the boundary itself the minute value
    // is about to roll, so that one instant is the only sample of the outgoing value.
    const start = base + SECOND;
    const first = describeRemaining(remainingFrom(ENDS_AT, start));
    for (let s = 1; s < 60; s++) {
      assert.equal(
        describeRemaining(remainingFrom(ENDS_AT, start + s * SECOND)),
        first,
        `second ${s} within the same minute must not re-announce`,
      );
    }
    const nextMinute = describeRemaining(remainingFrom(ENDS_AT, start + 60 * SECOND));
    assert.notEqual(nextMinute, first, "and it does change once the minute rolls over");
  });

  test("leading zero units are dropped", () => {
    const twoHours = IST("2026-09-17T00:00:00") - (2 * HOUR + 5 * MINUTE);
    assert.match(describeRemaining(remainingFrom(ENDS_AT, twoHours)), /^2 hours and 5 minutes remaining$/);

    const fiveMinutes = IST("2026-09-17T00:00:00") - 5 * MINUTE;
    assert.match(describeRemaining(remainingFrom(ENDS_AT, fiveMinutes)), /^5 minutes remaining$/);
  });

  test("singular units read correctly", () => {
    const oneOfEach = IST("2026-09-17T00:00:00") - (1 * DAY + 1 * HOUR + 1 * MINUTE);
    const spoken = describeRemaining(remainingFrom(ENDS_AT, oneOfEach));
    assert.match(spoken, /1 day, 1 hour and 1 minute remaining/);
  });

  test("expired says so plainly", () => {
    assert.equal(describeRemaining(EXPIRED), "This offer has ended");
    assert.equal(describeRemaining(remainingFrom(ENDS_AT, IST("2026-09-18T00:00:00"))), "This offer has ended");
  });
});

describe("no hardcoded campaign duration", () => {
  test("the countdown reflects whatever the data says, not seven days", () => {
    // The removed fake timer was seeded from `new Date() + 3 days`. Nothing here may
    // assume a length; these three windows are all valid and all different.
    const oneHour = new Date(IST("2026-09-12T13:00:00")).toISOString();
    assert.equal(remainingFrom(oneHour, IST("2026-09-12T12:00:00")).hours, 1);

    const thirtyDays = new Date(IST("2026-10-12T12:00:00")).toISOString();
    assert.equal(remainingFrom(thirtyDays, IST("2026-09-12T12:00:00")).days, 30);

    const tenSeconds = new Date(IST("2026-09-12T12:00:10")).toISOString();
    assert.equal(remainingFrom(tenSeconds, IST("2026-09-12T12:00:00")).seconds, 10);
  });
});
