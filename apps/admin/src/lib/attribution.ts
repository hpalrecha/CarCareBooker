/**
 * First-touch campaign attribution.
 *
 * THE PROBLEM THIS SOLVES. Management wants to know which advertisement produced a
 * booking. Nothing in this application recorded that. A customer arriving from
 *
 *     /ceramic-coating/car?utm_source=meta&utm_campaign=ceramic_car_sep
 *
 * browsed the catalogue, opened the booking modal and booked — and the resulting row
 * was indistinguishable from someone who typed the domain in directly.
 *
 * It cannot be recovered after the fact either. Instagram and Facebook in-app browsers
 * routinely strip the referrer, so paid social arrives looking like Direct traffic; the
 * `utm_*` parameters on the destination URL are the only durable signal, and they are
 * gone from the address bar the moment the customer clicks a link.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE OVERWRITE RULE — the load-bearing decision in this file.
 *
 * The requirement is "do not overwrite attribution during navigation". The naive reading,
 * write-once-and-never-again, is wrong in one direction and the naive opposite,
 * write-on-every-load, is wrong in the other:
 *
 *   write once, ever          a customer who clicks a September ad, does not book, then
 *                             clicks an October ad and books, is credited to September.
 *                             The October campaign looks like it produced nothing.
 *
 *   write on every load       every internal navigation has no utm parameters, so the
 *                             second page view overwrites the ad click with blanks. This
 *                             is precisely the bug the requirement is about.
 *
 * So the rule is: a load carrying CAMPAIGN SIGNAL wins; a load carrying none never
 * disturbs what is already stored. Internal navigation carries no signal, so it cannot
 * overwrite — and a genuine second ad click, which does carry signal, correctly re-attributes.
 *
 * `hasCampaignSignal` is what "carrying signal" means, and it is deliberately narrow:
 * only parameters an ad platform actually appends. A stray `?ref=` or `?page=2` is not
 * campaign signal and must not clear a real attribution.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * STORAGE. localStorage with a 30-day expiry, not sessionStorage.
 *
 * sessionStorage dies when the tab closes, and the single most common mobile journey is
 * exactly that: tap the ad, look, leave, come back later and book. That booking would
 * record as Direct and the campaign would appear not to convert. Thirty days is chosen to
 * cover Meta's own click-attribution window rather than being arbitrary.
 *
 * Nothing here is personal data. utm parameters, a click id and a referring host are
 * campaign metadata, not identity, and no name, number, email or device fingerprint is
 * collected — the brief asks for "device information if appropriate and privacy-safe",
 * and the privacy-safe answer for a booking form is to collect none.
 *
 * EVERY storage access is wrapped. Safari private mode throws on localStorage.setItem,
 * some in-app browsers disable it outright, and a customer must never lose a booking
 * because analytics could not write. On failure this degrades to an in-memory value that
 * survives the page view, which is still enough to attribute the booking that follows.
 */

const STORAGE_KEY = "p91_attribution";

/**
 * How long a stored attribution stays authoritative.
 *
 * Matches Meta's 7-day-click window with headroom, so a booking that Meta counts as a
 * conversion is one this database can also attribute. Lower it and long consideration
 * cycles (PPF is a ₹45,000+ decision) silently become Direct.
 */
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

/** Bound every stored value. A crafted URL must not be able to fill storage or a column. */
const MAX_VALUE_LENGTH = 200;

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  /** Meta's click identifier. Present on any click from Facebook or Instagram ads. */
  fbclid: string | null;
  /** Google's click identifier — captured for the existing Google Ads tag. */
  gclid: string | null;
  /** Path the visitor first landed on, e.g. "/ceramic-coating/car". Never the query string. */
  landingPage: string | null;
  /** External referring URL, or null for direct and internal navigation. */
  referrer: string | null;
  /** ISO timestamp of capture, used for expiry. */
  capturedAt: string;
}

/** Used when localStorage is unavailable, so the current page view still attributes. */
let memoryFallback: Attribution | null = null;

/** Trim, bound, and treat blank as absent. */
function clean(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  return trimmed.slice(0, MAX_VALUE_LENGTH);
}

/**
 * True when this URL looks like an ad click rather than ordinary navigation.
 *
 * Narrow on purpose — see the overwrite rule above. Adding a parameter here means any URL
 * carrying it can wipe a real campaign attribution, so only add ones an ad platform
 * genuinely appends.
 */
function hasCampaignSignal(params: URLSearchParams): boolean {
  return (
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.has("fbclid") ||
    params.has("gclid")
  );
}

/**
 * The referring URL, or null when it is not meaningful.
 *
 * Same-origin referrers are dropped: those are internal navigation, and recording
 * "https://p91carcare.com/services" as the referrer of a booking tells nobody anything
 * while making a real external referrer harder to spot.
 */
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryFallback;
    const parsed = JSON.parse(raw) as Attribution;
    // Expired records are treated as absent so a months-old ad click cannot be credited
    // with a booking it did not cause.
    const age = Date.now() - Date.parse(parsed.capturedAt);
    if (!Number.isFinite(age) || age > TTL_MS) return null;
    return parsed;
  } catch {
    return memoryFallback;
  }
}

function write(value: Attribution): void {
  memoryFallback = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode, disabled storage, quota. The in-memory copy above still serves this
    // page view, which is enough to attribute a booking made without a reload.
  }
}

/**
 * Capture attribution for this page load.
 *
 * Call once, as early as possible. Safe to call again — the overwrite rule makes repeat
 * calls without campaign signal a no-op.
 *
 * Returns what is now stored, so a caller can log or assert on it.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return read();
  }

  const existing = read();

  // Ordinary navigation, and something is already stored: leave it completely alone.
  // This is the case the requirement is about, and it is the common one.
  if (existing && !hasCampaignSignal(params)) return existing;

  const captured: Attribution = {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmContent: clean(params.get("utm_content")),
    utmTerm: clean(params.get("utm_term")),
    fbclid: clean(params.get("fbclid")),
    gclid: clean(params.get("gclid")),
    // Path only. The query string holds the parameters already captured above, and
    // storing it whole would duplicate them into a column that is meant to answer
    // "which page did they land on".
    landingPage: clean(window.location.pathname),
    referrer: externalReferrer(),
    capturedAt: new Date().toISOString(),
  };

  write(captured);
  return captured;
}

/**
 * Attribution to attach to a submission, or null when there is none.
 *
 * Read at submit time rather than at mount, so a customer who lands on an ad, opens the
 * booking form and submits carries the ad's attribution even though the form component
 * never saw the URL that had it.
 */
export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  return read();
}

/**
 * The subset sent to the API, flattened to the wire field names the server validates.
 *
 * Returns an empty object rather than nulls when there is nothing to report, so a request
 * body from an unattributed visit stays clean instead of carrying nine explicit nulls.
 */
export function attributionPayload(): Record<string, string> {
  const a = getAttribution();
  if (!a) return {};

  const payload: Record<string, string> = {};
  const put = (key: string, value: string | null) => {
    if (value) payload[key] = value;
  };

  put("utmSource", a.utmSource);
  put("utmMedium", a.utmMedium);
  put("utmCampaign", a.utmCampaign);
  put("utmContent", a.utmContent);
  put("utmTerm", a.utmTerm);
  put("fbclid", a.fbclid);
  put("gclid", a.gclid);
  put("landingPage", a.landingPage);
  put("referrer", a.referrer);

  return payload;
}

/** Test-only. Clears both the stored record and the in-memory fallback. */
export function __resetAttributionForTests(): void {
  memoryFallback = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Exported for tests so the expiry boundary can be asserted without waiting 30 days. */
export const __ATTRIBUTION_TTL_MS = TTL_MS;
export const __ATTRIBUTION_STORAGE_KEY = STORAGE_KEY;
