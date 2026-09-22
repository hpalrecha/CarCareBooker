/**
 * The "Prefer a call?" popup on service pages.
 *
 * Its failure mode is being a nuisance. These tests run the real rules (bundled with
 * esbuild) against a fake window/document and pin: once per visit, never after a call was
 * already requested, never over another popup or the booking form, and no crash when
 * storage is blocked.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
let state;

before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'callback-popup-state.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'client/src/lib/callback-popup-state.ts')],
    bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'silent',
  });
  state = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

/** Install a fake browser for one assertion. */
function browser({ session = {}, dialogOpen = false, storageThrows = false } = {}) {
  const store = {
    getItem: (k) => { if (storageThrows) throw new Error('blocked'); return k in session ? session[k] : null; },
    setItem: (k, v) => { if (storageThrows) throw new Error('blocked'); session[k] = String(v); },
  };
  globalThis.window = { sessionStorage: store };
  globalThis.document = {
    querySelector: (sel) => (dialogOpen && sel.includes('role="dialog"')) ? {} : null,
  };
  return session;
}

describe('when "Prefer a call?" may pop up', () => {
  test('a new visitor with nothing else open gets it', () => {
    browser();
    assert.equal(state.mayShowCallbackPopup(), true);
  });

  test('only once per visit', () => {
    const session = browser();
    state.markCallbackPopupShown();
    assert.equal(session.p91_callback_popup_seen, '1');
    assert.equal(state.mayShowCallbackPopup(), false);
  });

  test('not after the visitor already asked for a call', () => {
    const session = browser();
    state.markCallbackRequested();
    assert.equal(session.p91_callback_requested, '1');
    assert.equal(state.mayShowCallbackPopup(), false);
  });

  test('never over the booking form or any other dialog', () => {
    browser({ dialogOpen: true });
    assert.equal(state.mayShowCallbackPopup(), false);
  });

  test('blocked storage stays silent and does not loop', () => {
    browser({ storageThrows: true });
    assert.doesNotThrow(() => state.mayShowCallbackPopup());
    assert.equal(state.mayShowCallbackPopup(), false, 'unreadable storage counts as already shown');
    assert.doesNotThrow(() => state.markCallbackPopupShown());
    assert.doesNotThrow(() => state.markCallbackRequested());
  });

  test('waits well after page load, and gives up eventually', () => {
    assert.ok(state.CALLBACK_DELAY_MS >= 10000, 'must not fire the instant the page loads');
    assert.ok(state.CALLBACK_RETRY_MS > 0 && state.CALLBACK_RETRY_MS <= 5000);
    assert.ok(state.CALLBACK_MAX_WAIT_MS >= 30000 && state.CALLBACK_MAX_WAIT_MS <= 120000);
  });
});

describe('the popup component', () => {
  const popup = read('client/src/components/callback-popup.tsx');

  test('marks the visit only when it actually opens, and clears its timer', () => {
    assert.match(popup, /markCallbackPopupShown\(\);\s*setOpen\(true\)/);
    assert.match(popup, /return \(\) => clearTimeout\(timer\)/);
    assert.match(popup, /setTimeout\(attempt, CALLBACK_DELAY_MS\)/);
    assert.match(popup, /waited >= CALLBACK_MAX_WAIT_MS/);
  });

  test('is a real dialog: Escape, click-away and the close button all work', () => {
    assert.match(popup, /<Dialog open=\{open\} onOpenChange=\{setOpen\}>/);
  });

  test('the form reports a successful request back, so the popup stops offering itself', () => {
    const form = read('client/src/components/quote-form.tsx');
    assert.match(form, /setSubmitted\(true\);\s*onSubmitted\?\.\(\);/);
  });
});
