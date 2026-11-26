// Strict Indian mobile number normalisation for the WhatsApp (Meta) API.
//
// Meta expects the E.164 number WITHOUT the leading '+', i.e. "919876543210".
// A valid Indian mobile is 10 digits starting 6-9, optionally with a 91 country code
// and/or a leading 0. Anything else is rejected explicitly rather than silently passed
// to Meta (which would fail opaquely).

export type PhoneNormalizeResult =
  | { ok: true; e164: string; national: string }
  | { ok: false; error: string };

export function normalizeIndianMobile(input: string | null | undefined): PhoneNormalizeResult {
  if (input == null) return { ok: false, error: "empty" };

  // Keep digits only (drops +, spaces, hyphens, parentheses).
  let digits = String(input).replace(/\D/g, "");
  if (!digits) return { ok: false, error: "empty" };

  // Strip a leading international dialing prefix: 00 91 98765... -> 91 98765...
  if (digits.length > 10 && digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Strip country code 91 when present: 919876543210 -> 9876543210
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Strip a single leading 0 (national trunk prefix): 09876543210 -> 9876543210
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Now we must have exactly 10 national digits starting 6-9.
  if (digits.length !== 10) {
    return { ok: false, error: `expected 10 national digits, got ${digits.length}` };
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: "not a valid Indian mobile (must start 6-9)" };
  }

  return { ok: true, national: digits, e164: "91" + digits };
}

/** Mask a phone for logs: keep first 4 and last 3 digits. */
export function maskPhoneDigits(input: string | null | undefined): string {
  if (!input) return "-";
  const d = String(input).replace(/\D/g, "");
  if (d.length < 7) return "***";
  return d.slice(0, 4) + "***" + d.slice(-3);
}
