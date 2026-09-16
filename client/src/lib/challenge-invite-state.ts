/**
 * When the Protection Challenge invitation may appear, and when it must not.
 *
 * Two separate memories, because they answer different questions:
 *
 *   sessionStorage — "have we already asked this visit?"  One invitation per visit, so it
 *                    does not reappear on every page they open.
 *   localStorage   — "have they already done it?"  Someone who finished the challenge is
 *                    never invited again, on this visit or a later one.
 *
 * Every access is wrapped: Safari in private mode throws on storage access, and an
 * invitation banner is not worth breaking a page over. A throwing storage degrades to
 * "show nothing", which is the safer side of this decision.
 */

export const INVITE_SEEN_KEY = "p91_challenge_invite_seen";
export const CHALLENGE_DONE_KEY = "p91_challenge_completed";

/** How long a visitor reads the page before being interrupted. */
export const INVITE_DELAY_MS = 5000;

/**
 * Re-check interval while something else is on screen.
 *
 * The invitation must never cover an open booking modal, so when one is open at the five
 * second mark it waits rather than cancelling — the visitor may close it and still be
 * undecided. It gives up after INVITE_MAX_WAIT_MS so it cannot ambush someone who has
 * been filling in a booking form for a minute.
 */
export const INVITE_RETRY_MS = 3000;
export const INVITE_MAX_WAIT_MS = 30000;

function readFlag(storage: "sessionStorage" | "localStorage", key: string): boolean {
  try {
    return window[storage].getItem(key) === "1";
  } catch {
    return true; // Unreadable storage: treat as "already shown" and stay quiet.
  }
}

function writeFlag(storage: "sessionStorage" | "localStorage", key: string): void {
  try {
    window[storage].setItem(key, "1");
  } catch {
    // Private mode or blocked storage. The invitation simply cannot be remembered.
  }
}

/** True once the visitor has been invited during this visit. */
export function inviteAlreadyShown(): boolean {
  return readFlag("sessionStorage", INVITE_SEEN_KEY);
}

export function markInviteShown(): void {
  writeFlag("sessionStorage", INVITE_SEEN_KEY);
}

/** True once the visitor has reached a recommendation, ever. */
export function challengeAlreadyCompleted(): boolean {
  return readFlag("localStorage", CHALLENGE_DONE_KEY);
}

export function markChallengeCompleted(): void {
  writeFlag("localStorage", CHALLENGE_DONE_KEY);
}

/** Admin screens are staff tools; never interrupt them. */
export function isAdminRoute(): boolean {
  try {
    return window.location.pathname.indexOf("/admin") === 0;
  } catch {
    return true; // Unknown location: fail closed.
  }
}

/**
 * Is a Radix dialog (booking modal, the challenge itself) currently open?
 *
 * Matches on `data-state="open"`, which Radix sets and the invitation does not, so the
 * invitation can never see itself here.
 */
export function aDialogIsOpen(): boolean {
  try {
    return document.querySelector('[role="dialog"][data-state="open"]') !== null;
  } catch {
    return false;
  }
}

/** Everything that must be true before the invitation is allowed to appear. */
export function mayInvite(): boolean {
  return !isAdminRoute() && !inviteAlreadyShown() && !challengeAlreadyCompleted() && !aDialogIsOpen();
}
