/**
 * Admin-only conversion between the `duration` column (integer minutes, DB and API
 * contract, unchanged) and a human-friendly value+unit pair for the edit form.
 *
 * Deliberately separate from lib/service-time.ts, which formats duration for CUSTOMER
 * pages and owns DURATION_RANGE_OVERRIDES for slugs whose real turnaround is a range, not
 * a single figure. This file has no knowledge of slugs or overrides — it only converts a
 * raw number back and forth between units, for the admin who is editing that raw number.
 */

export type DurationUnit = "minutes" | "hours" | "days";

const UNIT_MINUTES: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

/**
 * Stored minutes -> the largest whole unit that represents it exactly, so opening an
 * existing service shows "1 day" instead of "1440 minutes". Falls back to minutes
 * whenever the value doesn't divide evenly into hours or days, since minutes is the only
 * unit that can show it without rounding it away.
 */
export function minutesToDurationInput(
  minutes: number | string | undefined | null,
): { value: string; unit: DurationUnit } {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return { value: "", unit: "minutes" };
  if (m % UNIT_MINUTES.days === 0) return { value: String(m / UNIT_MINUTES.days), unit: "days" };
  if (m % UNIT_MINUTES.hours === 0) return { value: String(m / UNIT_MINUTES.hours), unit: "hours" };
  return { value: String(m), unit: "minutes" };
}

/**
 * The admin's typed value+unit -> the integer minutes the DB column stores. Rounded
 * because the column is `integer notNull`; a fractional hour/day value (e.g. "1.5" days)
 * still resolves to a whole number of minutes rather than being rejected.
 */
export function durationInputToMinutes(value: string, unit: DurationUnit): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * UNIT_MINUTES[unit]);
}
