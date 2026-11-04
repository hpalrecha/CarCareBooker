import type { BusinessHour } from "@shared/schema";

/**
 * Opening-hours rows ("Monday – Saturday: 10:00 am – 7:00 pm"), shared by pages/contact.tsx and the
 * server-rendered /contact snapshot so the two cannot disagree.
 */
/** "10:30" -> "10:30 am". */
function toDisplayTime(hhmm: string | null | undefined): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LONG: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

/** Collapses consecutive days with identical hours into "Monday – Saturday" style rows. */
export function summariseHours(hours: BusinessHour[]): { label: string; value: string; closed: boolean }[] {
  if (!hours.length) return [];
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const rows: { label: string; value: string; closed: boolean }[] = [];
  const keyFor = (d: number) => {
    const h = byDay.get(d);
    if (!h) return "missing";
    return h.isOpen ? `${h.openTime}-${h.cutoffTime}` : "closed";
  };

  let runStart: number | null = null;
  let runKey = "";
  const flush = (endDay: number) => {
    if (runStart === null) return;
    const h = byDay.get(runStart);
    const closed = !h?.isOpen;
    rows.push({
      label: runStart === endDay ? DAY_LONG[runStart] : `${DAY_LONG[runStart]} – ${DAY_LONG[endDay]}`,
      value: closed ? "Closed" : `${toDisplayTime(h?.openTime)} – ${toDisplayTime(h?.cutoffTime)}`,
      closed,
    });
  };

  for (let i = 0; i < DAY_ORDER.length; i++) {
    const day = DAY_ORDER[i];
    const key = keyFor(day);
    if (runStart === null) { runStart = day; runKey = key; continue; }
    if (key !== runKey) { flush(DAY_ORDER[i - 1]); runStart = day; runKey = key; }
  }
  flush(DAY_ORDER[DAY_ORDER.length - 1]);
  return rows;
}
