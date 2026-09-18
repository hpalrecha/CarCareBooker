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
export function formatServiceTime(service: { slug?: string; duration?: number | string }): string | null {
  if (service.slug === "windshield-glass-coating-new") return "24 hrs";
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
