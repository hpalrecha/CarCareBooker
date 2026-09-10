import { useEffect, useRef, useState } from "react";
import {
  remainingFrom,
  startCountdown,
  describeRemaining,
  pad2,
  type Remaining,
} from "@/lib/countdown";

/**
 * A real countdown to a real campaign deadline.
 *
 * The previous attempt at urgency on this site seeded a timer from `new Date() + 3 days`
 * at page load, so it restarted on every refresh and counted down to nothing. That was
 * removed, with a note to restore it only against a genuine offer end time held in the
 * database. This is that restoration: `endsAt` comes from the campaign row, and the only
 * thing the browser contributes is the tick.
 *
 * WHAT MAKES IT CORRECT
 *
 *   recomputed, not decremented   Each tick derives the value from `endsAt - correctedNow`.
 *                                 setInterval drifts, background tabs are throttled, and a
 *                                 sleeping laptop fires far fewer ticks than the wall
 *                                 clock. A decrementing counter would fall behind and could
 *                                 still show time left after the offer ended; this is
 *                                 correct on the first tick after the tab wakes.
 *
 *   clock-corrected               `serverOffsetMs` removes the device's own clock error, so
 *                                 two phones show the same remaining time even when one is
 *                                 set wrong. Without it a customer could watch a live
 *                                 countdown for an offer the server has already closed —
 *                                 and then be charged.
 *
 *   clamped and self-stopping     Zero is the floor. On reaching it the interval is cleared
 *                                 and `onExpire` fires once, so the page can drop the offer
 *                                 rather than sitting on a row of zeroes.
 *
 * WHAT IT IS NOT SAYING. This is the deadline for the FREE BOOKING offer. The service
 * itself is still charged at the studio. This component never renders the word "free" on
 * its own — the offer wording and the price live in <CampaignOffer>, deliberately
 * together, so a countdown can never appear next to a bare "FREE" with no price beside it.
 */

interface CampaignCountdownProps {
  /** ISO instant the campaign ends. Exclusive. */
  endsAt: string;
  /** serverNow - Date.now(), from useCampaign. */
  serverOffsetMs: number;
  /** Called once, when the countdown reaches zero. */
  onExpire?: () => void;
  /** Visible heading above the digits. */
  label?: string;
  "data-testid"?: string;
}

const UNITS: { key: keyof Pick<Remaining, "days" | "hours" | "minutes" | "seconds">; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

export default function CampaignCountdown({
  endsAt,
  serverOffsetMs,
  onExpire,
  label = "Free booking offer ends in",
  "data-testid": testId = "campaign-countdown",
}: CampaignCountdownProps) {
  // Seeded synchronously so the first paint already shows the real value. Initialising to
  // zero and correcting on the first tick would flash "00 00 00 00" for a second, which
  // reads as an expired offer.
  const [remaining, setRemaining] = useState<Remaining>(() =>
    remainingFrom(endsAt, Date.now() + serverOffsetMs),
  );

  /**
   * `onExpire` held in a ref, so a parent passing an inline arrow function does not
   * restart the countdown on every one of its own renders. That is the classic
   * effect-dependency leak and the usual reason a page ends up with several intervals
   * running at once.
   */
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /**
   * All the interval discipline lives in startCountdown (see lib/countdown.ts) — one
   * timer, cleared on unmount, cleared on expiry, onExpire fired at most once. This
   * effect only mounts it, so there is very little here to get wrong.
   *
   * Deps are the deadline and the clock offset: a new deadline is a new countdown, and a
   * corrected offset must take effect immediately rather than at the next reload.
   */
  useEffect(
    () =>
      startCountdown({
        endsAt,
        offsetMs: serverOffsetMs,
        onTick: setRemaining,
        onExpire: () => onExpireRef.current?.(),
      }),
    [endsAt, serverOffsetMs],
  );

  // Expired renders nothing. The parent decides what replaces the offer; a component
  // whose whole job is "time remaining" should not invent a consolation message.
  if (remaining.expired) return null;

  const spoken = describeRemaining(remaining);

  return (
    <div className="cd" data-testid={testId}>
      <p className="cd-label">{label}</p>

      {/*
        role="timer" with aria-live="off": the visible digits change every second, and
        announcing that would interrupt a screen-reader user once per second and make the
        page unusable. The polite region below carries the same information at MINUTE
        granularity, which is the useful thing to hear.
      */}
      <div className="cd-units" role="timer" aria-live="off">
        {UNITS.map((unit) => (
          <div className="cd-unit" key={unit.key}>
            {/* aria-hidden because the digits are announced by the live region instead,
                without the per-second churn. */}
            <span className="cd-num" aria-hidden="true" data-testid={`${testId}-${unit.key}`}>
              {unit.key === "days" ? remaining.days : pad2(remaining[unit.key])}
            </span>
            {/* A visible text label under every number. The unit is never conveyed by
                position or colour alone. */}
            <span className="cd-unit-label" aria-hidden="true">
              {unit.label}
            </span>
          </div>
        ))}
      </div>

      <span className="sr-only" aria-live="polite" data-testid={`${testId}-spoken`}>
        {spoken}
      </span>
    </div>
  );
}
