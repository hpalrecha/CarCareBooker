/**
 * Meta Pixel.
 *
 * There was no Meta tracking of any kind before this — no `fbq` anywhere in the codebase.
 * The only Facebook references were the WhatsApp Cloud API's Graph endpoints, which are
 * unrelated. So this is a first installation, not a second one: nothing here can duplicate
 * an existing pixel, and the audit that established that is recorded in the commit.
 *
 * It sits alongside three tags that already exist and it touches none of them:
 *   Google Ads gtag  AW-11467752288   (client/index.html)
 *   GA4              G-QXEEJ4EK4J     (loaded by that gtag)
 *   Microsoft Clarity yezkqr1rwm      (client/index.html)
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THE ID COMES FROM THE SERVER, not from import.meta.env.
 *
 * Vite inlines `VITE_*` at BUILD time. The Dockerfile passes no build arguments, so a
 * VITE_META_PIXEL_ID would be baked as undefined inside the container no matter what the
 * deployment environment held — the tag would simply never load, silently.
 *
 * The Razorpay key already solves this exact problem the same way: the server hands the
 * key to the client at runtime (see booking-modal.tsx, `paymentOrder.key`). This follows
 * that established pattern. GET /api/public-config reads META_PIXEL_ID from the server
 * environment, so marketing can change the pixel by restarting the container instead of
 * rebuilding and redeploying the image.
 *
 * The cost is that PageView fires after a same-origin round trip rather than in <head>.
 * That is a few tens of milliseconds and Clarity already behaves this way. A pixel that
 * never loads is infinitely worse than one that loads slightly late.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * ADMIN GUARD. The pixel is never initialised under /admin, matching the guard on the
 * Clarity snippet. Admin screens show real customer names, phone numbers and booking
 * records, and none of that belongs in an advertising platform's telemetry.
 *
 * Everything is defensive. An ad blocker, a CSP rule or a failed config fetch must never
 * interrupt a booking. Tracking is not allowed to cost a sale.
 */

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[] };
    _fbq?: unknown;
  }
}

/** Resolved pixel id, or null until configured / when not configured at all. */
let pixelId: string | null = null;
let initialised = false;

/**
 * Event ids already reported.
 *
 * The same guard, and the same reasoning, as `reportedPurchases` in analytics.ts: React
 * can remount a component, a submit handler can fire twice on a slow connection, and the
 * booking confirmation path has a retry loop. Every one of those routes ends here with
 * the SAME event id.
 *
 * Reporting a Lead twice inflates the conversion count Meta optimises against, which
 * makes the campaign bid for the wrong thing — a more expensive failure than losing the
 * event entirely. The guard lives in this module rather than at each call site so there
 * is no way to add a caller that forgets it.
 *
 * `eventID` is also sent to Meta itself, which is what would let a future server-side
 * Conversions API implementation deduplicate against these browser events.
 */
const reportedEvents = new Set<string>();

/** True when the current location must not be tracked. */
function isAdminRoute(): boolean {
  try {
    return window.location.pathname.indexOf("/admin") === 0;
  } catch {
    return true; // Unknown location: fail closed and track nothing.
  }
}

/** The official Meta base snippet, transcribed rather than pasted as an opaque blob. */
function injectBaseSnippet(): void {
  if (window.fbq) return;

  const fbq: any = function (...args: any[]) {
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);
}

/** Safe `fbq(...)`. Swallows everything. */
function call(...args: any[]): void {
  try {
    if (typeof window.fbq === "function") window.fbq(...args);
  } catch {
    // Blocked, absent, or throwing. Never the caller's problem.
  }
}

/**
 * Fetch the pixel id and initialise. Call once, at app start.
 *
 * Resolves quietly when no pixel is configured — a deployment without META_PIXEL_ID set
 * is a valid state (it is exactly the state before marketing supplies the id), and it
 * must not produce console noise or a failed request on every page load.
 */
export async function initMetaPixel(): Promise<void> {
  if (initialised || typeof window === "undefined") return;
  if (isAdminRoute()) return;
  initialised = true;

  try {
    const res = await fetch("/api/public-config", { credentials: "same-origin" });
    if (!res.ok) return;
    const config = (await res.json()) as { metaPixelId?: string | null };
    const id = config?.metaPixelId;
    if (!id || typeof id !== "string") return;

    pixelId = id;
    injectBaseSnippet();
    call("init", pixelId);
    trackPageView();
  } catch {
    // No config, offline, blocked. The site works; it is simply untracked.
  }
}

/**
 * PageView.
 *
 * Called on initialisation and again on each client-side route change. This is a single
 * page application: without the second call, Meta would record one PageView for an entire
 * visit and every landing page except the entry point would look unvisited.
 *
 * Not deduplicated — a genuine second view of a page IS a second PageView, and unlike a
 * conversion there is no figure to corrupt by counting it twice.
 */
export function trackPageView(): void {
  if (!pixelId || isAdminRoute()) return;
  call("track", "PageView");
}

/**
 * A qualified lead: the PPF/ceramic enquiry form was accepted by the server.
 *
 * Fires only after the API confirms the row was created. Firing on button press would
 * count validation failures and network errors as leads.
 */
export function trackLead(args: { eventId: string; service?: string; vehicleType?: string }): boolean {
  if (!pixelId || isAdminRoute()) return false;
  if (!args.eventId || reportedEvents.has(args.eventId)) return false;
  reportedEvents.add(args.eventId);

  call(
    "track",
    "Lead",
    {
      content_category: args.service ?? undefined,
      content_name: args.vehicleType ?? undefined,
    },
    { eventID: args.eventId },
  );
  return true;
}

/**
 * A booking: a slot was actually reserved, with contact details and a time.
 *
 * `Schedule` rather than `Lead`, because Meta treats them as different optimisation
 * targets and this is materially further down the funnel than an enquiry — the two must
 * not be pooled into one number.
 *
 * Deliberately NOT `Purchase`, for the same reason analytics.ts refuses to fire a GA
 * purchase for free bookings: during the offer no money changes hands, and a stream of
 * zero-value purchases would corrupt ROAS and make the real ₹299 payments unreadable.
 */
export function trackBooking(args: {
  eventId: string;
  serviceTitle?: string;
  value?: number;
}): boolean {
  if (!pixelId || isAdminRoute()) return false;
  if (!args.eventId || reportedEvents.has(args.eventId)) return false;
  reportedEvents.add(args.eventId);

  call(
    "track",
    "Schedule",
    {
      content_name: args.serviceTitle ?? undefined,
      currency: "INR",
      value: typeof args.value === "number" ? args.value : 0,
    },
    { eventID: args.eventId },
  );
  return true;
}

/** Test-only reset so the dedupe guard does not leak between cases. */
export function __resetMetaPixelForTests(): void {
  reportedEvents.clear();
  pixelId = null;
  initialised = false;
}

/** Test-only injection so event functions can be exercised without a network fetch. */
export function __setPixelIdForTests(id: string | null): void {
  pixelId = id;
  initialised = true;
}
