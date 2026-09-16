import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProtectionChallengeDialog } from "@/components/protection-challenge";
import {
  INVITE_DELAY_MS,
  INVITE_MAX_WAIT_MS,
  INVITE_RETRY_MS,
  aDialogIsOpen,
  challengeAlreadyCompleted,
  inviteAlreadyShown,
  isAdminRoute,
  markInviteShown,
  mayInvite,
} from "@/lib/challenge-invite-state";

/**
 * A single, quiet invitation to take the Protection Challenge.
 *
 * Mounted once above the router, so the five second timer runs from the start of the visit
 * and does not restart on every navigation.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT STOPS IT BEING AN ANNOYANCE:
 *   - once per visit (sessionStorage), so it does not reappear page after page;
 *   - never again once the challenge has been completed (localStorage);
 *   - never over an open booking modal or the challenge itself — it waits for the dialog
 *     to close, and gives up entirely after 30s rather than ambushing someone mid-form;
 *   - never on /admin;
 *   - dismissible with the X, with "Maybe later", with Escape, or by clicking away.
 *
 * WHY NOT A RADIX DIALOG. The booking modal is one. A second modal would fight it for the
 * scroll lock and the focus trap, and `aria-modal` would hide the page from screen readers
 * for what is only an offer. This is a plain non-modal popup: `aria-modal` is absent, the
 * page stays scrollable, and focus moves to the heading without being trapped.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function ProtectionChallengeInvite() {
  const [visible, setVisible] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cheap exits first: nothing to schedule for staff, repeat visitors of this session,
    // or anyone who has already been through the challenge.
    if (isAdminRoute() || inviteAlreadyShown() || challengeAlreadyCompleted()) return;

    let waited = 0;
    let timer: ReturnType<typeof setTimeout>;

    const attempt = () => {
      if (!mayInvite()) {
        // Something is open (most likely the booking modal). Wait for it, within reason.
        waited += INVITE_RETRY_MS;
        if (waited >= INVITE_MAX_WAIT_MS) return;
        timer = setTimeout(attempt, INVITE_RETRY_MS);
        return;
      }
      markInviteShown();
      setVisible(true);
    };

    timer = setTimeout(attempt, INVITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  // Escape closes it, like any other overlay.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  const accept = () => {
    setVisible(false);
    setChallengeOpen(true);
  };

  return (
    <>
      {visible && (
        <div
          // z-[70]: the sticky site header is z-index 60 (styles/redesign.css), so at z-50
          // the header sat over the backdrop and swallowed click-away taps.
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          data-testid="challenge-invite"
        >
          {/* Click-away. Dimmed on desktop; on mobile the sheet sits over the page. */}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute inset-0 h-full w-full cursor-default bg-black/0 sm:bg-black/60"
            data-testid="button-invite-backdrop"
          />
          <div
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="challenge-invite-title"
            aria-describedby="challenge-invite-body"
            className="relative w-full rounded-t-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl outline-none sm:mx-4 sm:w-auto sm:max-w-sm sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
              data-testid="button-invite-close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h2 id="challenge-invite-title" className="pr-10 text-base font-semibold text-white">
              Not sure which protection is right for your vehicle?
            </h2>
            <p id="challenge-invite-body" className="mt-1 text-sm text-gray-400">
              Take our quick Protection Challenge.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={accept}
                className="min-h-[44px] flex-1 bg-green-500 font-bold text-black hover:bg-green-600"
                data-testid="button-invite-accept"
              >
                Take the Challenge
              </Button>
              <Button
                variant="outline"
                onClick={dismiss}
                className="min-h-[44px] flex-1 border-gray-700 text-white hover:bg-gray-800"
                data-testid="button-invite-later"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* The existing challenge, unchanged — this component only decides when to offer it. */}
      <ProtectionChallengeDialog
        open={challengeOpen}
        onOpenChange={setChallengeOpen}
        placement="auto-invite"
      />
    </>
  );
}
