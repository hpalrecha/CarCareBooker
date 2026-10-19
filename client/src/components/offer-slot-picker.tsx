import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BlackoutDate, BusinessHour, Service } from "@shared/schema";
import { isPpfService, offerPriceFor } from "@shared/offer-pricing";
import BookingCalendar from "@/components/booking-calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Service + date + time pickers for the paid offer form.
 *
 * Reads the same live data as the booking modal (/api/services, /api/blackout-dates,
 * /api/business-hours, /api/slot-availability), so a closed day, a blackout or a full slot looks
 * the same here. It only decides what is SELECTABLE: POST /api/offers/diwali/order re-checks the
 * service and slot on the server and stays the authority.
 *
 * The form around it is dark; BookingCalendar reads page-wide colour variables that are light on the
 * public site, so the dark values are pinned on this wrapper.
 */

const DARK_VARS = {
  "--dark-gray": "#1a1a1d",
  "--medium-gray": "#323238",
  "--neon-line": "rgba(0,255,106,.28)",
  "--txt": "#EDEEF0",
  "--txt-2": "#A0A4AB",
  "--txt-3": "#868C95",
  "--warn": "#E9B949",
} as CSSProperties;

/** Inline for the same reason as the calendar: `.p91x .grid` would override the utility classes. */
const SLOT_GRID = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 } as const;

interface SlotAvailability {
  availability: Record<string, { booked: number; max: number; available: boolean }>;
  available?: boolean;
  reasonText?: string;
}

/** "16:00" -> "4:00 PM" */
export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2026-10-21" -> "Wed, 21 Oct" (parsed as a local date, so no timezone shift). */
function formatDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function StepLabel({ n, children }: { n: number; children: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4EB848] text-xs font-bold text-[#04120A]">
        {n}
      </span>
      <Label className="text-sm font-semibold text-gray-100">{children}</Label>
    </div>
  );
}

export interface OfferSlotValue {
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
}

export default function OfferSlotPicker({
  value,
  onChange,
  errors,
  testId,
}: {
  value: OfferSlotValue;
  onChange: (next: OfferSlotValue) => void;
  errors?: Partial<Record<keyof OfferSlotValue, string>>;
  testId: string;
}) {
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: blackoutDates = [] } = useQuery<BlackoutDate[]>({ queryKey: ["/api/blackout-dates"], retry: 1 });
  const { data: businessHours = [] } = useQuery<BusinessHour[]>({ queryKey: ["/api/business-hours"], retry: 1 });

  const { data: slots, isLoading: slotsLoading } = useQuery<SlotAvailability>({
    queryKey: ["/api/slot-availability", value.serviceId, value.appointmentDate],
    enabled: !!value.serviceId && !!value.appointmentDate,
  });

  const selectable = services.filter((s) => s.isActive);
  const slotIds = slots?.availability ? Object.keys(slots.availability).sort() : [];
  const chosen = selectable.find((s) => s.id === value.serviceId);

  return (
    <div className="space-y-6 border-t border-gray-800 pt-5" style={DARK_VARS} data-testid={testId}>
      <div>
        <StepLabel n={1}>Choose your service</StepLabel>
        <Select
          value={value.serviceId}
          onValueChange={(serviceId) => onChange({ serviceId, appointmentDate: value.appointmentDate, appointmentTime: "" })}
        >
          <SelectTrigger className="min-h-[44px] border-gray-700 bg-gray-800" data-testid={`${testId}-service`}>
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent>
            {selectable.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} · ₹{offerPriceFor(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {chosen && (
          <p className="mt-2 text-xs text-gray-400" data-testid={`${testId}-price-note`}>
            {isPpfService(chosen)
              ? "PPF services: slot booking is ₹499."
              : "All other services: slot booking is ₹99."}
          </p>
        )}
        {errors?.serviceId && <p className="mt-1 text-sm text-red-400">{errors.serviceId}</p>}
      </div>

      <div>
        <StepLabel n={2}>Pick a date</StepLabel>
        <BookingCalendar
          selectedDate={value.appointmentDate}
          onSelect={(appointmentDate) => onChange({ ...value, appointmentDate, appointmentTime: "" })}
          blackoutDates={blackoutDates}
          businessHours={businessHours}
        />
        {errors?.appointmentDate && <p className="mt-1 text-sm text-red-400">{errors.appointmentDate}</p>}
      </div>

      <div>
        <StepLabel n={3}>Pick a time</StepLabel>
        <div
          className="min-h-[96px] rounded-xl border border-gray-700 bg-gray-800/60 p-3"
          role="radiogroup"
          aria-label="Choose an appointment time"
        >
          {!value.serviceId || !value.appointmentDate ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {!value.serviceId ? "Choose a service, then a date, to see times." : "Pick a date to see available times."}
            </p>
          ) : slotsLoading ? (
            <p className="py-6 text-center text-sm text-gray-400">Loading times…</p>
          ) : slotIds.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400" data-testid={`${testId}-no-slots`}>
              {slots?.reasonText || "No times available on this date. Please pick another date."}
            </p>
          ) : (
            <div style={SLOT_GRID}>
              {slotIds.map((id) => {
                const a = slots!.availability[id];
                const active = value.appointmentTime === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!a.available}
                    onClick={() => onChange({ ...value, appointmentTime: id })}
                    data-testid={`${testId}-slot-${id}`}
                    className={
                      "min-h-[44px] rounded-lg border px-2 py-2 text-center text-sm transition-colors " +
                      (active
                        ? "border-[#4EB848] bg-[#4EB848] font-bold text-[#04120A]"
                        : a.available
                          ? "border-gray-600 text-gray-100 hover:border-[#4EB848]"
                          : "cursor-not-allowed border-gray-700 text-gray-500 line-through")
                    }
                  >
                    {formatSlot(id)}
                    {!a.available && <span className="block text-[10px] no-underline">Full</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {errors?.appointmentTime && <p className="mt-1 text-sm text-red-400">{errors.appointmentTime}</p>}
      </div>

      {chosen && value.appointmentDate && value.appointmentTime && (
        <div
          className="rounded-xl border border-[#4EB848]/50 bg-[#4EB848]/10 p-3 text-sm text-gray-100"
          data-testid={`${testId}-summary`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400">Your slot</p>
          <p className="mt-1 font-semibold">{chosen.title}</p>
          <p className="text-gray-300">
            {formatDay(value.appointmentDate)} · {formatSlot(value.appointmentTime)}
          </p>
          <p className="mt-1 text-gray-300">
            Slot booking: <span className="font-bold text-white">₹{offerPriceFor(chosen)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
