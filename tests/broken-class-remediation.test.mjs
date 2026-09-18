/**
 * Priority 1 & 2 of the Phase 2 visual-unification plan.
 *
 * Priority 1: `text-neon-green`, `text-deep-black`, `border-medium-gray` and
 * `border-neon-green` are Tailwind classes that emit NO CSS in this project (the colour
 * family is deliberately unregistered — see tailwind.config.ts). They must be spelled as
 * `text-[var(--neon-green)]` etc. instead, which the rest of the codebase (e.g.
 * service-card.tsx) already does correctly. This file pins the 7 live pages that were
 * fixed, plus the one dead/unrouted page whose occurrences were counted alongside them.
 *
 * admin-login.tsx is deliberately EXCLUDED: its only 4 matches are inside a documentation
 * comment describing this exact bug, already fixed in a prior change — there was nothing
 * live to fix there, and that comment must stay intact as a warning to future edits.
 *
 * Priority 2: booking-confirmation.tsx used the old, `position:fixed` `Navbar` component
 * and rendered no footer at all — the last page a paying customer sees looked unlike the
 * rest of the site. It now uses the same `BrandHeader`/`BrandFooter` pair every other
 * non-`.p91x` page uses.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const BROKEN_CLASSES = /text-neon-green|text-deep-black|border-medium-gray|border-neon-green/;

const FIXED_PAGES = [
  'client/src/pages/admin-dashboard.tsx',
  'client/src/pages/admin-whatsapp.tsx',
  'client/src/pages/booking-confirmation.tsx',
  'client/src/pages/privacy-policy.tsx',
  'client/src/pages/refund-policy.tsx',
  'client/src/pages/terms-conditions.tsx',
  'client/src/pages/service-detail.tsx', // dead/unrouted, but counted and fixed for completeness
];

describe('item 9 (Phase 2 priority 1) — no-CSS colour classes removed from live pages', () => {
  for (const p of FIXED_PAGES) {
    test(`${p} no longer uses a broken colour class`, () => {
      assert.doesNotMatch(read(p), BROKEN_CLASSES, `${p} still contains a no-CSS class`);
    });
  }

  test("admin-login.tsx's warning comment about this exact bug is untouched", () => {
    const src = read('client/src/pages/admin-login.tsx');
    assert.match(src, /`text-deep-black` generates no CSS in this project/);
    assert.match(src, /Same story for `text-neon-green` and `border-medium-gray`/);
  });
});

describe('item 10 (Phase 2 priority 2) — booking-confirmation shares the site chrome', () => {
  const src = read('client/src/pages/booking-confirmation.tsx');

  test('the old fixed-position Navbar (no footer, no .p91x scope) is gone', () => {
    assert.doesNotMatch(src, /Navbar/);
    assert.doesNotMatch(src, /@\/components\/navbar/);
  });

  test('BrandHeader/BrandFooter are used, matching every other non-.p91x page', () => {
    assert.match(src, /import \{ BrandHeader, BrandFooter \} from "@\/components\/redesign\/brand-chrome";/);
    const headerCount = (src.match(/<BrandHeader \/>/g) || []).length;
    const footerCount = (src.match(/<BrandFooter \/>/g) || []).length;
    assert.equal(headerCount, 3, 'expected all 3 render branches (loading, error, success) to carry the header');
    assert.equal(footerCount, 3, 'expected all 3 render branches (loading, error, success) to carry the footer');
  });

  test('the stale pt-16 offset for the old fixed navbar is gone (BrandHeader is sticky, not fixed)', () => {
    assert.doesNotMatch(src, /pt-16/);
  });
});
