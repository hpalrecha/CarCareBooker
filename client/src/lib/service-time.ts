/**
 * A service's duration, formatted for people: 120 -> "2 hrs", 420 -> "7 hrs", 1440 -> "1 day".
 *
 * The `duration` column is minutes, but the three full-body PPF records hold 2, 3 and 4 —
 * almost certainly days entered in the wrong unit. That is a data question for the studio,
 * not something to guess at, so an implausible value (under 15 minutes) returns null and
 * callers show something else. The booking modal used to print `Math.floor(4 / 60)` hours,
 * which read "Duration: 0 hours" for a full-body film job.
 *
 * Shared by the service page and the booking modal so the two can never disagree.
 */
/** Services whose turnaround is a range, not a single figure — the `duration`
 *  column only holds one number, so these are shown as text instead. */
const DURATION_RANGE_OVERRIDES: Record<string, string> = {
  "windshield-glass-coating-new": "24 hrs",
  "1-year-bike-ceramic-coating": "36-48 hrs",
  "exterior-detailing-hard-water-new": "6-12 hrs",
  "interior-detailing-service": "18-24 hrs",
  "windshield-glass-polishing": "3-4 hrs",
};

export function formatServiceTime(service: { slug?: string; duration?: number | string }): string | null {
  if (service.slug && service.slug in DURATION_RANGE_OVERRIDES) {
    return DURATION_RANGE_OVERRIDES[service.slug];
  }
  const m = Number(service.duration);
  if (!Number.isFinite(m) || m < 15) return null;
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const h = Math.round((m / 60) * 2) / 2;
    return `${h} hr${h === 1 ? "" : "s"}`;
  }
  const d = Math.round(m / 1440);
  return `${d} day${d === 1 ? "" : "s"}`;
}
