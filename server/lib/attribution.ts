/**
 * Server-side validation of campaign attribution.
 *
 * Attribution arrives from the browser, so it is untrusted input that gets written to the
 * database and later read back into an admin dashboard. Three things have to be true of
 * anything stored:
 *
 *   BOUNDED    a crafted request must not be able to write a megabyte into a varchar, or
 *              fill the table with one row.
 *   TYPED      an object, an array or a number where a string is expected must be
 *              rejected rather than coerced — `String(["a","b"])` silently becomes "a,b".
 *   INERT      these values are rendered in the admin booking table. Control characters
 *              and newlines are stripped so a value cannot break the surrounding layout
 *              or smuggle a second line into a log entry.
 *
 * Note what is NOT done here: no HTML escaping. React escapes on render, and escaping on
 * the way IN would double-encode and store `&amp;amp;` for a genuine `&` in a campaign
 * name. Escaping belongs at the boundary where the value is interpreted, and for this
 * application that boundary is JSX.
 *
 * NEVER THROWS. A malformed attribution field must not fail a booking. The customer is
 * trying to buy something; losing the sale to protect a marketing label is the wrong
 * trade every time. Bad values become null and the booking proceeds unattributed.
 */

import { z } from "zod";

/** Matches the varchar width used by the attribution columns, with headroom to spare. */
export const MAX_ATTRIBUTION_LENGTH = 200;

/** Fields accepted from the client, in wire form. */
export interface AttributionInput {
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  utmTerm?: unknown;
  fbclid?: unknown;
  gclid?: unknown;
  landingPage?: unknown;
  referrer?: unknown;
}

/** Validated, storable attribution. Every field is a bounded string or null. */
export interface StoredAttribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  gclid: string | null;
  landingPage: string | null;
  referrer: string | null;
}

const EMPTY: StoredAttribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  fbclid: null,
  gclid: null,
  landingPage: null,
  referrer: null,
};

/**
 * True for characters that must never reach a log line or an admin table cell:
 * C0 controls, DEL, the C1 range, and the two Unicode line separators.
 *
 * Written as a code-point test rather than a regex character class on purpose. A class
 * covering these ranges is all escape sequences, and an escape that is silently mangled
 * in transit produces a regex that still compiles and still matches — just the wrong
 * things. This version is readable and cannot be corrupted into something plausible.
 */
function isControlChar(code: number): boolean {
  if (code <= 0x1f) return true; // C0 controls, incl. tab, CR and LF
  if (code === 0x7f) return true; // DEL
  if (code >= 0x80 && code <= 0x9f) return true; // C1 controls
  return code === 0x2028 || code === 0x2029; // LINE / PARAGRAPH SEPARATOR
}

/**
 * One untrusted value to a storable string or null.
 *
 * Rejects non-strings outright rather than coercing: an array reaching `String()` becomes
 * a comma-joined string that looks like a legitimate campaign name, which is worse than
 * no value at all because it is indistinguishable from real data in a report.
 */
function sanitise(value: unknown): string | null {
  if (typeof value !== "string") return null;

  // Replace every control character with a space, then collapse runs of whitespace.
  let stripped = "";
  for (const ch of value) {
    stripped += isControlChar(ch.codePointAt(0) ?? 0) ? " " : ch;
  }
  const collapsed = stripped.replace(/\s+/g, " ").trim();

  if (collapsed === "") return null;
  return collapsed.slice(0, MAX_ATTRIBUTION_LENGTH);
}

/**
 * Zod schema for the attribution block, for routes that parse their body with Zod.
 *
 * Every field is optional and `unknown`, because rejecting the whole request over a
 * malformed campaign label would fail a booking for a marketing typo. The values are
 * narrowed by `parseAttribution` instead.
 */
export const attributionSchema = z
  .object({
    utmSource: z.unknown().optional(),
    utmMedium: z.unknown().optional(),
    utmCampaign: z.unknown().optional(),
    utmContent: z.unknown().optional(),
    utmTerm: z.unknown().optional(),
    fbclid: z.unknown().optional(),
    gclid: z.unknown().optional(),
    landingPage: z.unknown().optional(),
    referrer: z.unknown().optional(),
  })
  .partial();

/**
 * Validate an attribution block from a request body.
 *
 * Returns every field, null where absent or unusable, so callers can spread the result
 * straight into an insert without deciding which keys exist.
 */
export function parseAttribution(body: AttributionInput | null | undefined): StoredAttribution {
  if (!body || typeof body !== "object") return { ...EMPTY };

  return {
    utmSource: sanitise(body.utmSource),
    utmMedium: sanitise(body.utmMedium),
    utmCampaign: sanitise(body.utmCampaign),
    utmContent: sanitise(body.utmContent),
    utmTerm: sanitise(body.utmTerm),
    fbclid: sanitise(body.fbclid),
    gclid: sanitise(body.gclid),
    landingPage: sanitise(body.landingPage),
    referrer: sanitise(body.referrer),
  };
}

/**
 * The coarse channel a booking came from, derived from its attribution.
 *
 * Derived rather than accepted from the client: `source` is what the admin dashboard
 * groups by, and a value the browser could set is a value that can be spoofed into the
 * business's own reporting. It is computed from the campaign parameters instead, so it
 * always agrees with them.
 *
 * Order matters. fbclid is checked before utm_source because a Meta ad whose destination
 * URL was tagged `utm_source=facebook_ad_manager` (or mistyped) is still, provably, a
 * Meta click — the click id is the harder signal, so it wins.
 */
export function deriveSource(attribution: StoredAttribution): string {
  if (attribution.fbclid) return "meta";
  if (attribution.gclid) return "google";

  const utm = (attribution.utmSource ?? "").toLowerCase().trim();
  if (utm) {
    // Whole-token matching, not substring. "fb" and "ig" are the abbreviations marketing
    // teams actually use, but as substrings they also match "bigcommerce", "signal" and
    // "fbtest" — misfiling organic traffic as paid Meta, which is the one direction of
    // error that makes a campaign look like it worked when it did not.
    const token = utm.replace(/[^a-z0-9]/g, "");
    const META = new Set(["facebook", "instagram", "meta", "fb", "ig", "facebookads", "metaads", "instagramads"]);
    const GOOGLE = new Set(["google", "adwords", "gads", "googleads"]);
    if (META.has(token)) return "meta";
    if (GOOGLE.has(token)) return "google";
    return utm.slice(0, 50);
  }

  // No campaign parameters. An external referrer means organic; nothing at all means the
  // customer arrived directly — or from a context that strips referrers, which is
  // precisely why the utm parameters above must be on every ad destination URL.
  if (attribution.referrer) return "organic";
  return "direct";
}
