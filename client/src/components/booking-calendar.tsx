import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlackoutDate, BusinessHour } from "@shared/schema";

/**
 * Month calendar for picking an appointment date.
 *
 * Replaces the native `<input type="date">`, which showed every date as selectable and
 * only told the customer a day was unavailable AFTER they picked it and a toast fired.
 * Here a closed day, a blackout day and a past day are visibly disabled before the click.
 *
 * WHAT DRIVES THE DISABLED STATE — all of it live production data, none of it hardcoded:
 *   - past dates      : compared against today in IST, matching the server's own cutoff
 *                       check in POST /api/bookings
 *   - closed weekdays : `businessHours` rows from GET /api/business-hours (isOpen)
 *   - blackout dates  : `blackoutDates` rows from GET /api/blackout-dates, with the
 *                       admin's reason surfaced as the tooltip
 *
 * The redesign prototype hardcoded `CLOSED_DOW = [0]` and two sample blackout dates
 * ("2026-09-17", "2026-09-18") with a pinned `TODAY`. None of that is carried over —
 * this reads the same tables the admin edits, so a blackout added in the admin greys
 * out here immediately.
 *
 * This component decides only what is SELECTABLE. It is not the authority on booking:
 * the server re-validates blackout, business hours, past slots and per-slot capacity on
 * POST /api/bookings, and it stays the authority. A stale calendar therefore fails
 * safely with the server's own error rather than creating a bad booking.
 */

interface BookingCalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  blackoutDates: BlackoutDate[];
  businessHours: BusinessHour[];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Today in IST as YYYY-MM-DD. getUTC* after shifting avoids a double offset for
 *  browsers already running in IST — the same approach the modal uses for slot cutoffs. */
function todayInIST(): string {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const y = istNow.getUTCFullYear();
  const m = String(istNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(istNow.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local calendar arithmetic only — never toISOString(), which would shift the day
 *  backwards for any timezone ahead of UTC and offer a date the server then rejects. */
function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function BookingCalendar({
  selectedDate,
  onSelect,
  blackoutDates,
  businessHours,
}: BookingCalendarProps) {
  const today = todayInIST();
  const [year, month] = useMemo(() => {
    const base = selectedDate || today;
    const [y, m] = base.split("-").map(Number);
    return [y, m - 1];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial month only

  const [view, setView] = useState<{ y: number; m: number }>({ y: year, m: month });

  const blackoutByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const bd of blackoutDates) map.set(bd.date, bd.reason || "Unavailable");
    return map;
  }, [blackoutDates]);

  const closedWeekdays = useMemo(() => {
    const set = new Set<number>();
    for (const h of businessHours) if (!h.isOpen) set.add(h.dayOfWeek);
    return set;
  }, [businessHours]);

  const firstOfMonth = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  // Never let the customer page back into months that are entirely in the past.
  const [todayY, todayM] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const atEarliestMonth = view.y === todayY && view.m === todayM;
  const canGoBack = view.y > todayY || (view.y === todayY && view.m > todayM);

  const step = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const monthLabel = firstOfMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-[var(--medium-gray)] bg-[var(--dark-gray)] p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          data-testid="calendar-prev-month"
          className="p-2 rounded-lg text-[var(--txt-2)] hover:text-[var(--txt)] hover:bg-[var(--medium-gray)] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="font-semibold text-[var(--txt)]" aria-live="polite" data-testid="calendar-month">
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          data-testid="calendar-next-month"
          className="p-2 rounded-lg text-[var(--txt-2)] hover:text-[var(--txt)] hover:bg-[var(--medium-gray)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--txt-3)] py-1">
            {d.slice(0, 1)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Choose an appointment date">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = toKey(view.y, view.m, day);
          const weekday = new Date(view.y, view.m, day).getDay();

          const isPast = key < today;
          const isClosed = closedWeekdays.has(weekday);
          const blackoutReason = blackoutByDate.get(key);
          const isBlackout = blackoutReason !== undefined;
          const disabled = isPast || isClosed || isBlackout;
          const isSelected = key === selectedDate;
          const isToday = key === today;

          // The tooltip is the only place the customer learns WHY a day is unavailable,
          // so the admin's blackout reason is surfaced verbatim.
          const title = isPast
            ? "This date has passed"
            : isBlackout
              ? `Unavailable — ${blackoutReason}`
              : isClosed
                ? "Closed on this day"
                : undefined;

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={disabled}
              title={title}
              aria-label={title ? `${key} — ${title}` : key}
              aria-pressed={isSelected}
              data-testid={`calendar-day-${key}`}
              onClick={() => onSelect(key)}
              className={
                "relative aspect-square rounded-lg text-sm transition-colors " +
                (isSelected
                  ? "bg-[var(--neon-green)] text-[#04120A] font-bold"
                  : disabled
                    ? "text-[var(--txt-3)]/45 line-through cursor-not-allowed"
                    : "text-[var(--txt)] hover:bg-[var(--medium-gray)] hover:text-[var(--neon-green)]") +
                (isToday && !isSelected ? " ring-1 ring-[var(--neon-line)]" : "")
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[var(--medium-gray)] text-[11px] text-[var(--txt-3)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--neon-green)]" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-[var(--neon-line)]" /> Today
        </span>
        <span className="line-through">Closed or unavailable</span>
      </div>
    </div>
  );
}
