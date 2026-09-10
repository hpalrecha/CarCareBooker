/**
 * Phase 2C — the countdown timer's lifecycle.
 *
 *   npm run test:integration
 *
 * These are the failures that actually happen to countdowns in production:
 *
 *   an interval that is never cleared          -> a leak that survives navigation
 *   a second interval started by a re-render   -> the display jumps and double-ticks
 *   onExpire firing on every tick after zero   -> the parent re-renders forever
 *   a timer still running after expiry         -> work done for a display nobody sees
 *
 * All of them live in startCountdown() rather than in the component, precisely so they
 * can be asserted deterministically here instead of by rendering a tree and waiting in
 * real seconds. The clock is injected, so "three days pass" costs no wall time.
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { startCountdown } from "../client/src/lib/countdown.ts";

const SECOND = 1000, MINUTE = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

/**
 * A controllable clock and interval scheduler.
 *
 * Replaces the globals for the duration of a test so `setInterval` is deterministic and
 * every timer created can be counted — which is how "no leaked interval" is asserted
 * rather than assumed.
 */
function fakeTimers() {
  let now = new Date("2026-09-10T12:00:00+05:30").getTime();
  const live = new Map();
  let nextId = 1;

  const realSetInterval = globalThis.setInterval;
  const realClearInterval = globalThis.clearInterval;

  globalThis.setInterval = (fn, ms) => {
    const id = nextId++;
    live.set(id, { fn, ms, nextRun: now + ms });
    return id;
  };
  globalThis.clearInterval = (id) => { live.delete(id); };

  return {
    now: () => now,
    /** Advance the clock, running any interval callbacks that fall due. */
    advance(ms) {
      const target = now + ms;
      // Step in scheduled order so a callback that clears its own interval stops firing.
      for (;;) {
        let due = null;
        for (const [id, t] of live) {
          if (t.nextRun <= target && (due === null || t.nextRun < due[1].nextRun)) due = [id, t];
        }
        if (!due) break;
        const [id, timer] = due;
        now = timer.nextRun;
        timer.nextRun += timer.ms;
        timer.fn();
        if (!live.has(id)) continue; // cleared itself
      }
      now = target;
    },
    /** How many intervals are still scheduled. Zero is the only acceptable end state. */
    liveCount: () => live.size,
    restore() {
      globalThis.setInterval = realSetInterval;
      globalThis.clearInterval = realClearInterval;
    },
  };
}

let clock;
beforeEach(() => { clock = fakeTimers(); });
afterEach(() => { clock.restore(); });

/** An ISO deadline `ms` in the future, relative to the fake clock. */
const deadlineIn = (ms) => new Date(clock.now() + ms).toISOString();

describe("a campaign with a future deadline", () => {
  test("ticks once immediately, then once per second", () => {
    const ticks = [];
    const stop = startCountdown({
      endsAt: deadlineIn(2 * DAY),
      offsetMs: 0,
      onTick: (r) => ticks.push(r),
      now: clock.now,
    });

    assert.equal(ticks.length, 1, "fires immediately so the first paint is already correct");
    assert.equal(ticks[0].expired, false);
    assert.equal(ticks[0].days, 2);

    clock.advance(3 * SECOND);
    assert.equal(ticks.length, 4, "one initial + three seconds");

    stop();
  });

  test("counts down, and every value is derived not decremented", () => {
    const ticks = [];
    const stop = startCountdown({
      endsAt: deadlineIn(1 * HOUR + 3 * SECOND),
      offsetMs: 0,
      onTick: (r) => ticks.push(r),
      now: clock.now,
    });

    clock.advance(3 * SECOND);
    const seconds = ticks.map((t) => t.seconds);
    assert.deepEqual(seconds, [3, 2, 1, 0]);
    assert.equal(ticks[ticks.length - 1].minutes, 0);
    assert.equal(ticks[ticks.length - 1].hours, 1);

    stop();
  });
});

describe("a campaign ending within seconds", () => {
  test("reaches zero, fires onExpire exactly once, and STOPS", () => {
    const ticks = [];
    let expiries = 0;

    const stop = startCountdown({
      endsAt: deadlineIn(3 * SECOND),
      offsetMs: 0,
      onTick: (r) => ticks.push(r),
      onExpire: () => { expiries += 1; },
      now: clock.now,
    });

    assert.equal(clock.liveCount(), 1, "one interval while counting");

    clock.advance(3 * SECOND);
    assert.equal(ticks[ticks.length - 1].expired, true);
    assert.equal(expiries, 1);
    assert.equal(clock.liveCount(), 0, "the interval cleared ITSELF on expiry");

    // Ten more minutes pass. Nothing should happen at all.
    const ticksAtExpiry = ticks.length;
    clock.advance(10 * MINUTE);
    assert.equal(ticks.length, ticksAtExpiry, "no further ticks after zero");
    assert.equal(expiries, 1, "onExpire is fired at most once, ever");

    stop();
  });

  test("the last visible value is zero, never negative", () => {
    const ticks = [];
    const stop = startCountdown({
      endsAt: deadlineIn(2 * SECOND),
      offsetMs: 0,
      onTick: (r) => ticks.push(r),
      now: clock.now,
    });

    clock.advance(30 * SECOND);
    for (const t of ticks) {
      assert.ok(t.totalMs >= 0, "no tick ever reports negative time");
      for (const v of [t.days, t.hours, t.minutes, t.seconds]) assert.ok(v >= 0);
    }
    assert.deepEqual(
      [ticks.at(-1).days, ticks.at(-1).hours, ticks.at(-1).minutes, ticks.at(-1).seconds],
      [0, 0, 0, 0],
    );

    stop();
  });
});

describe("an already-expired campaign", () => {
  test("never schedules an interval at all", () => {
    const ticks = [];
    let expiries = 0;

    const stop = startCountdown({
      endsAt: deadlineIn(-1 * DAY), // ended yesterday
      offsetMs: 0,
      onTick: (r) => ticks.push(r),
      onExpire: () => { expiries += 1; },
      now: clock.now,
    });

    assert.equal(ticks.length, 1);
    assert.equal(ticks[0].expired, true, "reports expired immediately, not a positive value");
    assert.equal(expiries, 1);
    assert.equal(clock.liveCount(), 0, "no timer is created for a dead campaign");

    clock.advance(1 * HOUR);
    assert.equal(ticks.length, 1, "and none appears later");

    stop();
  });

  test("a missing or malformed deadline behaves the same way", () => {
    for (const bad of [null, undefined, "", "not-a-date"]) {
      const ticks = [];
      const stop = startCountdown({
        endsAt: bad, offsetMs: 0, onTick: (r) => ticks.push(r), now: clock.now,
      });
      assert.equal(ticks[0].expired, true, `${JSON.stringify(bad)} fails closed`);
      assert.equal(clock.liveCount(), 0);
      stop();
    }
  });
});

describe("clock skew is applied to the live timer", () => {
  test("a device two hours BEHIND still expires at the right moment", () => {
    // Deadline is 1 minute away in SERVER time. The device thinks it is 2 hours earlier,
    // so uncorrected it would show 2h01m remaining and keep counting long past the end.
    const serverDeadline = new Date(clock.now() + 2 * HOUR + 1 * MINUTE).toISOString();
    const offset = 2 * HOUR; // serverNow - deviceNow

    const ticks = [];
    let expired = false;
    const stop = startCountdown({
      endsAt: serverDeadline,
      offsetMs: offset,
      onTick: (r) => ticks.push(r),
      onExpire: () => { expired = true; },
      now: clock.now,
    });

    assert.equal(ticks[0].hours, 0, "corrected: one minute, not two hours");
    assert.equal(ticks[0].minutes, 1);

    clock.advance(1 * MINUTE);
    assert.equal(expired, true, "expires on schedule despite the wrong device clock");

    stop();
  });

  test("a device two hours AHEAD does not expire early", () => {
    const serverDeadline = new Date(clock.now() - 2 * HOUR + 30 * MINUTE).toISOString();
    const offset = -2 * HOUR;

    const ticks = [];
    let expired = false;
    const stop = startCountdown({
      endsAt: serverDeadline,
      offsetMs: offset,
      onTick: (r) => ticks.push(r),
      onExpire: () => { expired = true; },
      now: clock.now,
    });

    assert.equal(ticks[0].expired, false, "still running");
    assert.equal(ticks[0].minutes, 30);

    clock.advance(29 * MINUTE);
    assert.equal(expired, false, "not yet");
    clock.advance(1 * MINUTE);
    assert.equal(expired, true, "expires exactly on the corrected deadline");

    stop();
  });
});

describe("lifecycle — no leaked or duplicated timers", () => {
  test("stop() clears the interval", () => {
    const stop = startCountdown({
      endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: () => {}, now: clock.now,
    });
    assert.equal(clock.liveCount(), 1);
    stop();
    assert.equal(clock.liveCount(), 0, "unmount leaves nothing running");
  });

  test("no ticks are delivered after stop() — the unmount-then-setState leak", () => {
    const ticks = [];
    const stop = startCountdown({
      endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: (r) => ticks.push(r), now: clock.now,
    });
    clock.advance(2 * SECOND);
    const before = ticks.length;

    stop();
    clock.advance(10 * MINUTE);
    assert.equal(ticks.length, before, "a stopped countdown never calls back again");
  });

  test("stop() is idempotent", () => {
    const stop = startCountdown({
      endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: () => {}, now: clock.now,
    });
    stop(); stop(); stop();
    assert.equal(clock.liveCount(), 0);
  });

  test("mount / unmount / remount leaves exactly ONE timer", () => {
    // The remount cycle a route change produces. Each countdown must clean up after
    // itself so the second mount does not double-tick.
    const a = startCountdown({ endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: () => {}, now: clock.now });
    assert.equal(clock.liveCount(), 1);
    a();

    const ticksB = [];
    const b = startCountdown({
      endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: (r) => ticksB.push(r), now: clock.now,
    });
    assert.equal(clock.liveCount(), 1, "still exactly one, not two");

    clock.advance(3 * SECOND);
    assert.equal(ticksB.length, 4, "one initial + three ticks — no doubling");

    b();
    assert.equal(clock.liveCount(), 0);
  });

  test("many mount/unmount cycles leak nothing", () => {
    // Simulates a customer navigating between landing pages repeatedly.
    for (let i = 0; i < 50; i++) {
      const stop = startCountdown({
        endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: () => {}, now: clock.now,
      });
      clock.advance(1 * SECOND);
      stop();
    }
    assert.equal(clock.liveCount(), 0, "50 cycles, zero surviving timers");
  });

  test("concurrent countdowns are independent", () => {
    // Two offer blocks on one page must not interfere.
    const first = [];
    const second = [];
    const stopA = startCountdown({ endsAt: deadlineIn(10 * SECOND), offsetMs: 0, onTick: (r) => first.push(r), now: clock.now });
    const stopB = startCountdown({ endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: (r) => second.push(r), now: clock.now });
    assert.equal(clock.liveCount(), 2);

    clock.advance(10 * SECOND);
    assert.equal(first.at(-1).expired, true, "the short one finished");
    assert.equal(second.at(-1).expired, false, "the long one is unaffected");
    assert.equal(clock.liveCount(), 1, "only the finished one cleared itself");

    stopA(); stopB();
    assert.equal(clock.liveCount(), 0);
  });

  test("a custom interval period is honoured", () => {
    const ticks = [];
    const stop = startCountdown({
      endsAt: deadlineIn(1 * DAY), offsetMs: 0, onTick: (r) => ticks.push(r),
      intervalMs: 250, now: clock.now,
    });
    clock.advance(1 * SECOND);
    assert.equal(ticks.length, 5, "one initial + four at 250ms");
    stop();
  });
});
