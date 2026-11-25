/**
 * When the "Prefer a call?" popup may appear on a service page.
 *
 *   - waits CALLBACK_DELAY_MS after the page loads before ever considering it;
 *   - never opens while the booking form or any other dialog is on screen, re-checking
 *     instead, and gives up after CALLBACK_MAX_WAIT_MS;
 *   - appears at most once per visit (sessionStorage);
 *   - never appears once the visitor has already asked for a call this visit.
 *
 * Storage access is wrapped: Safari private mode and blocked storage must not throw a page
 * down, and unreadable storage is treated as "already shown" so it cannot repeat.
 */

export const CALLBACK_SEEN_KEY = "p91_callback_popup_seen";
export const CALLBACK_SENT_KEY = "p91_callback_requested";

export const CALLBACK_DELAY_MS = 15000;
export const CALLBACK_RETRY_MS = 3000;
export const CALLBACK_MAX_WAIT_MS = 60000;

function readSession(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return true; // unreadable: behave as if already shown, so it cannot loop
  }
}

function writeSession(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* storage blocked: nothing to remember, and nothing to break */
  }
}

export function callbackPopupAlreadyShown(): boolean {
  return readSession(CALLBACK_SEEN_KEY);
}

export function markCallbackPopupShown(): void {
  writeSession(CALLBACK_SEEN_KEY);
}

export function callbackAlreadyRequested(): boolean {
  return readSession(CALLBACK_SENT_KEY);
}

export function markCallbackRequested(): void {
  writeSession(CALLBACK_SENT_KEY);
}

/** Anything else on screen: a Radix dialog (booking form or any other). */
export function somethingElseIsOpen(): boolean {
  try {
    return document.querySelector('[role="dialog"][data-state="open"]') !== null;
  } catch {
    return true;
  }
}

export function mayShowCallbackPopup(): boolean {
  return !callbackPopupAlreadyShown() && !callbackAlreadyRequested() && !somethingElseIsOpen();
}
