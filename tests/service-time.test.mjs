/**
 * lib/service-time.ts's formatServiceTime() is the single source every duration display
 * reads from (service-card.tsx, booking-modal.tsx, service-detail.tsx, vehicle-selector.tsx,
 * campaign-landing.tsx). Two behaviours are pinned here:
 *
 *   1. `durationText` (the admin-editable override column, added 2026-09-28) always wins,
 *      even over the legacy DURATION_RANGE_OVERRIDES slug map — that map is a stopgap for
 *      rows nobody has entered text for yet, not a ceiling on what the admin can set.
 *   2. Every row that had no durationText keeps EXACTLY the output it had before that
 *      column existed — this is a pure addition, not a behaviour change for existing data.
 *
 * Run via plain `node --test`, so the TypeScript type annotations are stripped rather than
 * pulling a compiler into the test run (same approach as tests/ppf-ceramic-pricing.test.mjs).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const src = read('client/src/lib/service-time.ts')
  .replace(/: Record<string, string>/, '')
  .replace(/export function formatServiceTime\(service: \{[\s\S]*?\}\): string \| null \{/, 'function formatServiceTime(service) {');

const { formatServiceTime, DURATION_RANGE_OVERRIDES } = new Function(
  `${src}\n; return { formatServiceTime, DURATION_RANGE_OVERRIDES };`,
)();

describe('formatServiceTime — durationText override', () => {
  test('durationText wins over a computed numeric value', () => {
    assert.equal(
      formatServiceTime({ slug: '1-year-ceramic-coating', duration: 1440, durationText: '36-48 hrs' }),
      '36-48 hrs',
    );
  });

  test('durationText wins over a legacy DURATION_RANGE_OVERRIDES entry for the same slug', () => {
    assert.equal(
      formatServiceTime({
        slug: 'exterior-detailing-hard-water-new',
        duration: 420,
        durationText: '12-18 hrs',
      }),
      '12-18 hrs',
    );
  });

  test('surrounding whitespace in durationText is trimmed', () => {
    assert.equal(formatServiceTime({ duration: 60, durationText: '  2-3 days  ' }), '2-3 days');
  });

  test('an empty or whitespace-only durationText is treated as unset, not as ""', () => {
    assert.equal(formatServiceTime({ slug: '1-year-ceramic-coating', duration: 1440, durationText: '' }), '1 day');
    assert.equal(formatServiceTime({ duration: 420, durationText: '   ' }), '7 hrs');
  });

  test('null/undefined durationText falls through to existing behaviour', () => {
    assert.equal(formatServiceTime({ duration: 1440, durationText: null }), '1 day');
    assert.equal(formatServiceTime({ duration: 1440 }), '1 day');
  });
});

describe('formatServiceTime — unchanged for rows without durationText (regression pin)', () => {
  test('every current DURATION_RANGE_OVERRIDES entry is unaffected', () => {
    for (const [slug, expected] of Object.entries(DURATION_RANGE_OVERRIDES)) {
      assert.equal(formatServiceTime({ slug, duration: 9999 }), expected, `${slug} regressed`);
    }
  });

  test('plain numeric formatting is unaffected: 45 -> "45 min", 420 -> "7 hrs", 1440 -> "1 day"', () => {
    assert.equal(formatServiceTime({ duration: 45 }), '45 min');
    assert.equal(formatServiceTime({ duration: 420 }), '7 hrs');
    assert.equal(formatServiceTime({ duration: 1440 }), '1 day');
    assert.equal(formatServiceTime({ duration: 2880 }), '2 days');
  });

  test('an implausible value (under 15 minutes) with no override or durationText still returns null', () => {
    assert.equal(formatServiceTime({ duration: 3 }), null);
  });
});
