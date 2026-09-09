/**
 * Microsoft Clarity route guard.
 *
 * The tag itself is loaded by the official snippet in client/index.html (project
 * yezkqr1rwm). That snippet refuses to inject at all when the FIRST page load is under
 * /admin. This module handles the other direction: this is a single-page app, so an admin
 * can land on the public site, have Clarity recording, and then navigate to
 * /admin/dashboard without any page load happening.
 *
 * Admin screens render real customer names, phone numbers, email addresses, booking
 * records and payment status. None of that belongs in a session recording, so recording
 * is stopped on entry to /admin and resumed on the way out.
 *
 * `start` and `stop` are Clarity's own documented API methods. Everything here is
 * defensive: if the tag is blocked, absent, or throws, nothing else in the app may break.
 * Analytics must never cost a booking.
 *
 * DELIBERATELY NOT DONE HERE:
 *   - no clarity("identify", ...) — that would attach a customer identifier to the session
 *   - no clarity("set", ...) custom tags — no booking, customer or payment field is sent
 * Clarity receives page interactions only, never record content.
 */

declare global {
  interface Window {
    clarity?: ((...args: any[]) => void) & { q?: any[] };
  }
}

/** True while the given path is an admin screen. */
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

let recordingStopped = false;

/**
 * Called on every route change. Stops Clarity while on /admin, resumes once the user
 * leaves. Safe to call repeatedly — it only acts when the state actually changes.
 */
export function applyClarityRouteGuard(pathname: string): void {
  try {
    const clarity = window.clarity;
    if (typeof clarity !== "function") return;

    const shouldStop = isAdminPath(pathname);

    if (shouldStop && !recordingStopped) {
      clarity("stop");
      recordingStopped = true;
      return;
    }

    if (!shouldStop && recordingStopped) {
      clarity("start");
      recordingStopped = false;
    }
  } catch {
    // A blocked or half-loaded tag must never interrupt navigation.
  }
}
