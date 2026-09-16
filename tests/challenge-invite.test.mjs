/**
 * The automatic Protection Challenge invitation has one job and one failure mode: being a
 * nuisance. These tests pin the rules that stop it — once per visit, never after the
 * challenge is done, never over an open booking modal, never on an admin screen — and the
 * storage access that must not throw a page down in Safari private mode.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

// Pure-ish module: strip the type annotations and give it a fake window/document.
const stateSrc = read('client/src/lib/challenge-invite-state.ts')
  .replace(/function readFlag\(storage: "sessionStorage" \| "localStorage", key: string\): boolean \{/, 'function readFlag(storage, key) {')
  .replace(/function writeFlag\(storage: "sessionStorage" \| "localStorage", key: string\): void \{/, 'function writeFlag(storage, key) {')
  .replace(/export function (\w+)\(\): (boolean|void) \{/g, 'function $1() {')
  .replace(/^export /gm, '');

function load({ session = {}, local = {}, pathname = '/', openDialog = false, throwOnStorage = false } = {}) {
  const mkStore = (backing) => ({
    getItem: (k) => { if (throwOnStorage) throw new Error('blocked'); return k in backing ? backing[k] : null; },
    setItem: (k, v) => { if (throwOnStorage) throw new Error('blocked'); backing[k] = String(v); },
  });
  const win = { sessionStorage: mkStore(session), localStorage: mkStore(local), location: { pathname } };
  const doc = { querySelector: (sel) => (openDialog && sel.includes('data-state="open"') ? {} : null) };
  const api = new Function(
    'window', 'document',
    stateSrc +
      '; return { mayInvite, canShowNow, INVITE_SNOOZE_MS, INVITE_MAX_SNOOZES, inviteAlreadyShown, challengeAlreadyCompleted, markInviteShown, markChallengeCompleted, isAdminRoute, aDialogIsOpen, INVITE_DELAY_MS, INVITE_RETRY_MS, INVITE_MAX_WAIT_MS, INVITE_SEEN_KEY, CHALLENGE_DONE_KEY };',
  )(win, doc);
  return { api, session, local };
}

const inviteRaw = read('client/src/components/protection-challenge-invite.tsx');
/** Comments removed, so "must not contain X" assertions match code and not the prose explaining X. */
const invite = inviteRaw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const challenge = read('client/src/components/protection-challenge.tsx');
const app = read('client/src/App.tsx');

describe('when the invitation may appear', () => {
  test('a first-time visitor on a public page is invited', () => {
    assert.equal(load().api.mayInvite(), true);
  });

  test('not twice in the same visit', () => {
    const { api, session } = load();
    api.markInviteShown();
    assert.equal(session.p91_challenge_invite_seen, '1');
    assert.equal(api.mayInvite(), false);
    // A fresh visit (empty sessionStorage) may be invited again.
    assert.equal(load({ local: {} }).api.mayInvite(), true);
  });

  test('never again once the challenge has been completed', () => {
    const { api, local } = load();
    api.markChallengeCompleted();
    assert.equal(local.p91_challenge_completed, '1');
    // Survives the visit: a NEW session with the completion flag still stays quiet.
    assert.equal(load({ local: { p91_challenge_completed: '1' } }).api.mayInvite(), false);
  });

  test('never over an open dialog, such as the booking modal', () => {
    assert.equal(load({ openDialog: true }).api.mayInvite(), false);
    assert.equal(load({ openDialog: false }).api.mayInvite(), true);
  });

  test('never on an admin screen', () => {
    for (const pathname of ['/admin', '/admin/dashboard', '/admin/whatsapp']) {
      assert.equal(load({ pathname }).api.isAdminRoute(), true);
      assert.equal(load({ pathname }).api.mayInvite(), false);
    }
    assert.equal(load({ pathname: '/ppf' }).api.isAdminRoute(), false);
  });

  test('blocked storage stays silent instead of throwing', () => {
    const { api } = load({ throwOnStorage: true });
    assert.doesNotThrow(() => api.mayInvite());
    assert.equal(api.mayInvite(), false, 'unreadable storage must not produce a repeating popup');
    assert.doesNotThrow(() => api.markInviteShown());
    assert.doesNotThrow(() => api.markChallengeCompleted());
  });

  test('canShowNow ignores the once-per-visit flag, so a snooze can return', () => {
    const { api } = load({ session: { p91_challenge_invite_seen: '1' } });
    assert.equal(api.mayInvite(), false, 'no NEW invitation once shown this visit');
    assert.equal(api.canShowNow(), true, 'but a snoozed one may come back');
    // The other guards still apply to a returning invitation.
    assert.equal(load({ session: { p91_challenge_invite_seen: '1' }, openDialog: true }).api.canShowNow(), false);
    assert.equal(load({ session: { p91_challenge_invite_seen: '1' }, local: { p91_challenge_completed: '1' } }).api.canShowNow(), false);
    assert.equal(load({ session: { p91_challenge_invite_seen: '1' }, pathname: '/admin' }).api.canShowNow(), false);
  });

  test('"maybe later" returns after five seconds, and is capped', () => {
    const { api } = load();
    assert.equal(api.INVITE_SNOOZE_MS, 5000);
    assert.equal(api.INVITE_MAX_SNOOZES, 1, 'a popup that always returns cannot be dismissed');
  });

  test('the delay is about five seconds, and waiting for a dialog is bounded', () => {
    const { api } = load();
    assert.equal(api.INVITE_DELAY_MS, 5000);
    assert.ok(api.INVITE_RETRY_MS > 0 && api.INVITE_RETRY_MS <= 5000);
    assert.ok(api.INVITE_MAX_WAIT_MS >= 10000 && api.INVITE_MAX_WAIT_MS <= 60000);
  });
});

describe('the invitation component', () => {
  test('schedules once on mount and clears its timer', () => {
    assert.match(invite, /setTimeout\(attempt, INVITE_DELAY_MS\)/);
    assert.match(invite, /return \(\) => clearTimeout\(timer\)/);
    assert.match(invite, /\}, \[\]\);/, 'the timer effect must not depend on route state');
  });

  test('re-checks rather than cancels while a dialog is open, and gives up eventually', () => {
    assert.match(invite, /if \(!mayInvite\(\)\)/);
    assert.match(invite, /waited >= INVITE_MAX_WAIT_MS/);
    assert.match(invite, /setTimeout\(attempt, INVITE_RETRY_MS\)/);
  });

  test('marks the visit only when it actually appears', () => {
    assert.match(invite, /markInviteShown\(\);\s*setVisible\(true\)/);
  });

  test('"Maybe later" snoozes; X, Escape and click-away end the visit', () => {
    // "Maybe later" is the only control wired to the snooze.
    assert.match(invite, /onClick=\{later\}/);
    assert.match(invite, /data-testid="button-invite-later"/);
    // The X and Escape use the permanent dismissal, not the snooze.
    assert.match(invite, /onClick=\{dismiss\}[\s\S]{0,300}data-testid="button-invite-close"/);
    assert.match(invite, /e\.key === "Escape"\) dismiss\(\)/);
    assert.match(invite, /snoozes\.current >= INVITE_MAX_SNOOZES/);
    assert.match(invite, /setTimeout\(retry, INVITE_SNOOZE_MS\)/);
    assert.match(invite, /canShowNow\(\)/, 'a returning invitation still checks for open dialogs');
  });

  test('a pending snooze cannot fire after navigation or once the challenge opens', () => {
    assert.match(invite, /clearTimeout\(snoozeTimer\.current\)/);
    assert.match(invite, /const accept = \(\) => \{\s*clearTimeout\(snoozeTimer\.current\)/);
  });

  test('offers the three ways out the brief asked for, plus Escape', () => {
    assert.match(invite, /Take the Challenge/);
    assert.match(invite, /Maybe Later/);
    assert.match(invite, /data-testid="button-invite-close"/);
    assert.match(invite, /data-testid="button-invite-backdrop"/);
    assert.match(invite, /e\.key === "Escape"/);
  });

  test('is a bottom sheet on mobile and centred on desktop', () => {
    assert.match(invite, /items-end justify-center sm:items-center/);
    assert.match(invite, /rounded-t-2xl[^"]*sm:rounded-2xl/);
  });

  test('is not a modal, so it cannot fight the booking modal for scroll or focus', () => {
    assert.doesNotMatch(invite, /aria-modal/);
    assert.doesNotMatch(invite, /data-state=/, 'must not look like a Radix dialog to its own guard');
    assert.match(invite, /aria-labelledby="challenge-invite-title"/);
  });

  test('opens the existing challenge unchanged', () => {
    assert.match(invite, /<ProtectionChallengeDialog\s+open=\{challengeOpen\}/);
    assert.match(invite, /placement="auto-invite"/);
  });

  test('is mounted once, above the router', () => {
    assert.match(app, /<ProtectionChallengeInvite \/>/);
    assert.match(app, /<Router \/>[\s\S]*<ProtectionChallengeInvite \/>/);
  });
});

describe('completion is recorded wherever the challenge is taken', () => {
  test('reaching the recommendation marks it done', () => {
    assert.match(challenge, /const onReachResult[\s\S]*?markChallengeCompleted\(\)/);
  });

  test('pricing and booking logic are untouched by this feature', () => {
    // Still one lookup, still the catalogue resolver, still no literal price.
    assert.equal((challenge.match(/services\.find\(/g) || []).length, 1);
    assert.match(challenge, /resolveCataloguePrice\(services, rec\.slug\)/);
    assert.doesNotMatch(challenge.replace(/\/\*[\s\S]*?\*\//g, ''), /₹\s?[\d,]+/);
  });
});
