/**
 * First-touch campaign attribution on the new site (Plan 3 Task 4).
 *
 * A port of apps/admin/src/lib/attribution.ts with the SAME localStorage key, record shape,
 * 30-day expiry and overwrite rule, so a visitor who lands on the new site from an ad and then
 * clicks "Book online" arrives on the old /service/<slug> booking page (same origin, same
 * storage) with the ad's attribution already stored, and the booking form sends it as before.
 * Read that file for the reasoning; the rule in short: a load carrying campaign signal
 * (utm_source / utm_medium / utm_campaign / fbclid / gclid) wins, a load without it never
 * disturbs what is stored. Every storage access is wrapped: analytics must never cost a booking.
 *
 * Plain functions with no path aliases: tests import this file with plain Node.
 */

export const ATTRIBUTION_STORAGE_KEY = "p91_attribution";
const TTL_DAYS = 30;
export const ATTRIBUTION_TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;
const MAX_VALUE_LENGTH = 200;

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  gclid: string | null;
  landingPage: string | null;
  referrer: string | null;
  capturedAt: string;
}

function clean(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed.slice(0, MAX_VALUE_LENGTH);
}

function hasCampaignSignal(params: URLSearchParams): boolean {
  return params.has("utm_source") || params.has("utm_medium") || params.has("utm_campaign") || params.has("fbclid") || params.has("gclid");
}

function externalReferrer(): string | null {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    if (new URL(ref).host === window.location.host) return null;
    return clean(ref);
  } catch {
    return null;
  }
}

function read(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    const age = Date.now() - Date.parse(parsed.capturedAt);
    if (!Number.isFinite(age) || age > ATTRIBUTION_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Capture attribution for this page load. Safe to call on every load; see the overwrite rule above. */
export function captureAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return read();
  }
  const existing = read();
  if (existing && !hasCampaignSignal(params)) return existing;
  const captured: Attribution = {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmContent: clean(params.get("utm_content")),
    utmTerm: clean(params.get("utm_term")),
    fbclid: clean(params.get("fbclid")),
    gclid: clean(params.get("gclid")),
    landingPage: clean(window.location.pathname),
    referrer: externalReferrer(),
    capturedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(captured));
  } catch {
    // Private mode or disabled storage: nothing to keep; the booking page captures again from its own URL.
  }
  return captured;
}
