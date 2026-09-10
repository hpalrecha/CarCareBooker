/**
 * Asia/Kolkata <-> absolute instant conversion, for the admin campaign form.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS AT ALL.
 *
 * `<input type="datetime-local">` yields a NAIVE wall-clock string: "2026-09-17T00:00".
 * It carries no timezone. Handing that to `new Date()` interprets it in the BROWSER's
 * timezone — so the same form, filled identically, produces a different instant depending
 * on where the person filling it happens to be.
 *
 * For a campaign that matters concretely. An admin on holiday, or a laptop still set to
 * another zone, would schedule "midnight on the 17th" as a moment that is not midnight in
 * Bangalore — and the offer would open or close at the wrong hour for every customer.
 *
 * So the conversion is explicit and one-directional at each boundary:
 *
 *   form -> API    istLocalToInstant()  appends +05:30 and produces a real ISO instant
 *   API  -> form   instantToIstLocal()  renders the instant AS IST wall-clock
 *
 * Everything in between — the database column, shared/campaign.ts, the countdown — deals
 * only in absolute instants and never needs to know about a timezone.
 *
 * WHY A FIXED +05:30 AND NOT Intl / a timezone library.
 *
 * India has not observed daylight saving since 1945 and IST is a fixed UTC+05:30. The
 * existing code already relies on exactly this — server/lib/booking-amount.ts hardcodes
 * "T23:59:59.999+05:30" for the legacy offer window, and use-booking-offer.ts formats
 * with "+05:30". Introducing an Intl-based conversion here would be a SECOND timezone
 * convention in the same codebase, which is the thing most likely to produce an
 * off-by-one-day bug later. This matches what is already there.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

/** The business timezone. Fixed: India has no daylight saving. */
export const IST_OFFSET = "+05:30";
export const IST_LABEL = "IST (Asia/Kolkata)";

/**
 * "2026-09-17T00:00" (as typed, meaning IST) -> "2026-09-17T00:00:00+05:30".
 *
 * Returns null for anything that is not a complete datetime-local value, so a half-typed
 * field is reported as missing rather than silently becoming a wrong instant.
 */
export function istLocalToInstant(local: string | null | undefined): string | null {
  if (!local) return null;
  const trimmed = String(local).trim();

  // datetime-local gives YYYY-MM-DDTHH:mm, and YYYY-MM-DDTHH:mm:ss when seconds are shown.
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/.exec(trimmed);
  if (!match) return null;

  const iso = `${match[1]}T${match[2]}${match[3] ?? ":00"}${IST_OFFSET}`;
  // Round-trip check: a value like 2026-02-31T00:00 matches the shape but is not a date.
  if (!Number.isFinite(Date.parse(iso))) return null;
  return iso;
}

/**
 * An absolute instant -> "YYYY-MM-DDTHH:mm" as read in IST, for a datetime-local input.
 *
 * Computed by shifting the instant by the offset and reading the UTC parts. Using the
 * local getters instead would render the instant in the BROWSER's zone, reintroducing
 * exactly the bug this module exists to prevent.
 */
export function instantToIstLocal(instant: string | Date | null | undefined): string {
  if (!instant) return "";
  const ms = instant instanceof Date ? instant.getTime() : Date.parse(String(instant));
  if (!Number.isFinite(ms)) return "";

  const shifted = new Date(ms + 5.5 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}` +
    `T${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}`
  );
}

/**
 * Human-readable IST for a table cell, e.g. "16 Sep 2026, 11:59 pm IST".
 *
 * The zone is named in the string on purpose. A bare timestamp in an admin table invites
 * the reader to assume it is their own local time, and for a campaign deadline that
 * assumption is the whole problem.
 */
export function formatIst(instant: string | Date | null | undefined): string {
  if (!instant) return "—";
  const ms = instant instanceof Date ? instant.getTime() : Date.parse(String(instant));
  if (!Number.isFinite(ms)) return "—";

  return (
    new Date(ms).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }) + " IST"
  );
}

/**
 * True when the browser is NOT running on IST.
 *
 * Used to show the admin a one-line note explaining that the times they are entering and
 * reading are Bangalore time, not theirs. Cheap, and it removes the single most likely
 * misreading of this screen.
 */
export function browserIsOutsideIst(): boolean {
  try {
    // getTimezoneOffset is minutes BEHIND UTC, so IST is -330.
    return new Date().getTimezoneOffset() !== -330;
  } catch {
    return false;
  }
}
