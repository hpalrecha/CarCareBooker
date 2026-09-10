/**
 * Countdown arithmetic — pure, DOM-free, and the only place remaining time is computed.
 *
 * Separated from the component so the behaviour that actually matters can be tested
 * directly: a countdown is mostly edge cases (expiry, clock skew, a negative result) and
 * almost none of them are convenient to reproduce by rendering a component and waiting.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THE CLOCK OFFSET EXISTS
 *
 * A phone with a wrong clock is not rare — a manually-set device, a dead battery, a
 * traveller who never re-enabled automatic time. If the countdown subtracted `endsAt`
 * from that device's own `Date.now()`, two customers looking at the same offer would see
 * different remaining times, and one of them could see a live countdown for an offer the
 * SERVER considers finished. The server already refuses to charge ₹0 outside the window,
 * so the customer would be shown "free" and then charged — the exact failure the
 * server-authoritative offer work exists to prevent.
 *
 * So the client measures its own error once:
 *
 *     offset = serverNow - clientNow      (both sampled at response time)
 *     correctedNow = Date.now() + offset
 *
 * Network latency makes `offset` inaccurate by up to one round trip, on the order of
 * 100ms. Against a countdown displayed in whole seconds and typically running for days,
 * that is irrelevant — and it is bounded, unlike a wrong device clock, which can be off
 * by hours or years.
 *
 * WHY REMAINING IS RECOMPUTED, NEVER DECREMENTED
 *
 * Each tick derives the value from `endsAt - correctedNow` rather than subtracting one
 * second from the last value. setInterval drifts, browsers throttle timers in background
 * tabs, and a laptop that sleeps for an hour fires far fewer ticks than the wall clock
 * says. A decrementing counter would silently fall behind and could still be showing time
 * remaining after the offer had ended. Recomputing from absolute instants makes the
 * display correct on the very first tick after the tab wakes up, and makes the interval
 * a rendering detail rather than the source of truth.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export interface Remaining {
  /** Whole milliseconds left. Never negative. */
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once nothing remains. The single flag the UI should branch on. */
  expired: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** All zeroes. Returned for expired, missing and unparseable inputs alike. */
export const EXPIRED: Remaining = {
  totalMs: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: true,
};

/**
 * Clock offset from a campaign API response.
 *
 * `clientNow` is passed in rather than read here so the caller can sample it at the exact
 * moment the response arrived — computing it later, at render, would fold the intervening
 * time into the offset and skew every subsequent tick by that amount.
 *
 * Returns 0 for anything unusable, which degrades to trusting the device clock. That is
 * the correct fallback: a missing offset should make the countdown no worse than it would
 * have been without this mechanism, never break it.
 */
export function clockOffset(serverNow: string | null | undefined, clientNow: number): number {
  if (!serverNow) return 0;
  const server = Date.parse(serverNow);
  if (!Number.isFinite(server)) return 0;
  return server - clientNow;
}

/**
 * Break remaining time into display units.
 *
 * CLAMPS AT ZERO. A negative duration is never returned, never displayed, and never
 * formatted — an expired offer showing "-00:00:12" is worse than showing nothing, because
 * it looks like a bug in a page asking for the customer's phone number.
 *
 * An unparseable or missing `endsAt` is treated as EXPIRED, not as "runs forever". Fails
 * closed, consistent with every other offer surface: the cost of hiding a live offer is a
 * lost booking, the cost of showing a dead one is a customer who was promised something
 * the server will not honour.
 */
export function remainingFrom(
  endsAt: string | Date | null | undefined,
  correctedNowMs: number,
): Remaining {
  if (endsAt === null || endsAt === undefined) return EXPIRED;

  const end = endsAt instanceof Date ? endsAt.getTime() : Date.parse(String(endsAt));
  if (!Number.isFinite(end)) return EXPIRED;

  const totalMs = end - correctedNowMs;
  if (totalMs <= 0) return EXPIRED;

  return {
    totalMs,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    minutes: Math.floor((totalMs % HOUR) / MINUTE),
    seconds: Math.floor((totalMs % MINUTE) / SECOND),
    expired: false,
  };
}

/** Two-digit padding for display. Days are NOT padded to two — a 100-day campaign is
 *  legitimate and must not render as "00". */
export function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

export interface CountdownOptions {
  /** ISO instant the campaign ends. Exclusive. */
  endsAt: string | Date | null | undefined;
  /** serverNow - clientNow, from clockOffset(). */
  offsetMs: number;
  /** Called immediately, then once per interval, with freshly computed remaining time. */
  onTick: (remaining: Remaining) => void;
  /** Called at most ONCE, when the countdown reaches zero. */
  onExpire?: () => void;
  /** Tick period. Injectable so tests do not have to wait in real seconds. */
  intervalMs?: number;
  /** Clock source. Injectable so tests can advance time deterministically. */
  now?: () => number;
}

/**
 * The interval discipline, as a plain function.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT INSIDE THE COMPONENT.
 *
 * Everything that can genuinely go wrong with a countdown is here, not in the markup:
 * an interval that is never cleared, a second interval started by a re-render, a stale
 * closure reading last render's deadline, an `onExpire` that fires on every tick after
 * zero. Those are the behaviours worth testing, and testing them through a React tree
 * would mean rendering a component and waiting in real time.
 *
 * As a plain controller with an injectable clock, each of them is a deterministic
 * assertion. The component is left holding three lines that are hard to get wrong, and
 * this file gains no dependency on React.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Returns a `stop` function. Calling it more than once is safe and does nothing extra.
 */
export function startCountdown(options: CountdownOptions): () => void {
  const {
    endsAt,
    offsetMs,
    onTick,
    onExpire,
    intervalMs = 1000,
    now = () => Date.now(),
  } = options;

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let firedExpiry = false;
  let stopped = false;

  const clear = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  const tick = () => {
    if (stopped) return;

    // Recomputed from absolute instants every time, never decremented — so a throttled
    // background tab or a sleeping laptop is corrected on its first tick back rather than
    // drifting further behind with every skipped one.
    const remaining = remainingFrom(endsAt, now() + offsetMs);
    onTick(remaining);

    if (remaining.expired) {
      // Nothing changes from here. A timer that keeps running after the thing it measures
      // has finished is a leak with extra steps.
      clear();
      if (!firedExpiry) {
        firedExpiry = true;
        onExpire?.();
      }
    }
  };

  // Fire immediately so the first paint shows the real value rather than a placeholder
  // that would flash "00 00 00 00" — which reads as an already-expired offer.
  tick();

  // Only schedule if there is still something to count. An already-expired deadline
  // starts no interval at all.
  if (!firedExpiry) {
    intervalId = setInterval(tick, intervalMs);
  }

  return () => {
    stopped = true;
    clear();
  };
}

/**
 * A sentence a screen reader can read, e.g. "4 days, 12 hours and 35 minutes remaining".
 *
 * Deliberately omits SECONDS. The visible display ticks every second; announcing that to
 * a screen reader would interrupt the user once per second and make the page unusable.
 * This string is what gets announced, and it only changes once a minute.
 *
 * Units that are zero at the front are dropped, so a campaign with two hours left reads
 * "2 hours and 5 minutes remaining" rather than "0 days, 2 hours…".
 */
export function describeRemaining(r: Remaining): string {
  if (r.expired) return "This offer has ended";

  const parts: string[] = [];
  if (r.days > 0) parts.push(`${r.days} ${r.days === 1 ? "day" : "days"}`);
  if (r.hours > 0 || parts.length > 0) parts.push(`${r.hours} ${r.hours === 1 ? "hour" : "hours"}`);
  parts.push(`${r.minutes} ${r.minutes === 1 ? "minute" : "minutes"}`);

  const last = parts.pop();
  const phrase = parts.length > 0 ? `${parts.join(", ")} and ${last}` : last;
  return `${phrase} remaining`;
}
