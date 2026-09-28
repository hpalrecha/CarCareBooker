/**
 * lib/duration-input.ts converts between the `duration` column (integer minutes — DB and
 * API contract, unchanged) and the value+unit pair the admin edit form now shows.
 *
 * Pinned here because a rounding or unit-selection mistake would silently corrupt the
 * stored minutes for every service saved through the admin form, the same class of bug
 * the PPF "2/3/4 minutes, almost certainly days" data problem came from (see
 * client/src/lib/landing-pages.ts). These tests never touch the DB, the API, booking
 * availability or lib/service-time.ts's customer-facing formatting/overrides — this file
 * is the admin-only conversion layer only.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

// The module is TypeScript with no runtime dependencies, so the type annotations are
// stripped rather than pulling a compiler into the test run (same approach as
// tests/ppf-ceramic-pricing.test.mjs).
const src = read('client/src/lib/duration-input.ts')
  .replace(/^export type DurationUnit[\s\S]*?;$/m, '')
  .replace(/: Record<DurationUnit, number>/, '')
  .replace(/export function minutesToDurationInput\(\s*minutes: number \| string \| undefined \| null,\s*\): \{ value: string; unit: DurationUnit \} \{/, 'function minutesToDurationInput(minutes) {')
  .replace(/export function durationInputToMinutes\(value: string, unit: DurationUnit\): number \{/, 'function durationInputToMinutes(value, unit) {');

const { minutesToDurationInput, durationInputToMinutes } = new Function(
  `${src}\n; return { minutesToDurationInput, durationInputToMinutes };`,
)();

describe('minutesToDurationInput', () => {
  test('1440 minutes -> 1 day', () => {
    assert.deepEqual(minutesToDurationInput(1440), { value: '1', unit: 'days' });
  });

  test('2880 minutes -> 2 days', () => {
    assert.deepEqual(minutesToDurationInput(2880), { value: '2', unit: 'days' });
  });

  test('4320 minutes -> 3 days (live PPF turnaround value)', () => {
    assert.deepEqual(minutesToDurationInput(4320), { value: '3', unit: 'days' });
  });

  test('420 minutes -> 7 hours (whole hours, not days)', () => {
    assert.deepEqual(minutesToDurationInput(420), { value: '7', unit: 'hours' });
  });

  test('60 minutes -> 1 hour', () => {
    assert.deepEqual(minutesToDurationInput(60), { value: '1', unit: 'hours' });
  });

  test('45 minutes -> stays minutes (does not divide evenly into hours)', () => {
    assert.deepEqual(minutesToDurationInput(45), { value: '45', unit: 'minutes' });
  });

  test('accepts a string, as stored values arrive from the API/form as strings', () => {
    assert.deepEqual(minutesToDurationInput('1440'), { value: '1', unit: 'days' });
  });

  test('missing/zero/invalid -> empty value, minutes unit (new-service default)', () => {
    assert.deepEqual(minutesToDurationInput(undefined), { value: '', unit: 'minutes' });
    assert.deepEqual(minutesToDurationInput(null), { value: '', unit: 'minutes' });
    assert.deepEqual(minutesToDurationInput(0), { value: '', unit: 'minutes' });
    assert.deepEqual(minutesToDurationInput('not-a-number'), { value: '', unit: 'minutes' });
  });
});

describe('durationInputToMinutes', () => {
  test('1 day -> 1440 minutes', () => {
    assert.equal(durationInputToMinutes('1', 'days'), 1440);
  });

  test('2 days -> 2880 minutes', () => {
    assert.equal(durationInputToMinutes('2', 'days'), 2880);
  });

  test('7 hours -> 420 minutes', () => {
    assert.equal(durationInputToMinutes('7', 'hours'), 420);
  });

  test('45 minutes -> 45 minutes (identity)', () => {
    assert.equal(durationInputToMinutes('45', 'minutes'), 45);
  });

  test('fractional day rounds to a whole minute, since the column is integer', () => {
    assert.equal(durationInputToMinutes('1.5', 'days'), 2160);
  });

  test('invalid or negative input yields NaN rather than a silently wrong minute count', () => {
    assert.ok(Number.isNaN(durationInputToMinutes('not-a-number', 'minutes')));
    assert.ok(Number.isNaN(durationInputToMinutes('-5', 'hours')));
  });

  test('round-trips with minutesToDurationInput for every whole-day/whole-hour case above', () => {
    for (const minutes of [1440, 2880, 4320, 420, 60]) {
      const { value, unit } = minutesToDurationInput(minutes);
      assert.equal(durationInputToMinutes(value, unit), minutes);
    }
  });
});
