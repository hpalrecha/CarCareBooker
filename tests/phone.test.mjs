/**
 * isValidMobile: exactly ten digits, spacing/dashes tolerated as typing habits.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const src = read('client/src/lib/phone.ts')
  .replace(/export function isValidMobile\(value: string\): boolean \{/, 'function isValidMobile(value) {')
  .replace(/^export /gm, '');
const { isValidMobile } = new Function(src + '; return { isValidMobile };')();

describe('isValidMobile', () => {
  test('exactly ten digits is required', () => {
    for (const bad of ['', '12345', '12345678901', '98765a4321', '+919876543210', 'abcdefghij']) {
      assert.equal(isValidMobile(bad), false, `${bad} should be rejected`);
    }
    assert.equal(isValidMobile('9876543210'), true);
    assert.equal(isValidMobile('98765 43210'), true, 'spacing is a typing habit, not an invalid number');
  });
});
