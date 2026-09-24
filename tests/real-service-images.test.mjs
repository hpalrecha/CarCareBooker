import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'client/src/lib/real-service-images.ts'), 'utf8');
// Comments explain what was replaced and may name those files; only real code counts.
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('real service images', () => {
  test('every mapped image exists on disk (a typo would show a broken picture)', () => {
    const paths = [...code.matchAll(/["'](\/attached_assets\/[^"']+)["']/g)].map((m) => m[1]);
    assert.ok(paths.length >= 8, 'expected the mapping to name several images');
    for (const p of paths) {
      assert.ok(fs.existsSync(path.join(root, p.replace(/^\//, ''))), `${p} is missing`);
    }
  });

  test('no mapped image is one of the known AI-style renders, stock or third-party files', () => {
    const banned = [/attached_assets\/services\//, /stock_images/, /generated_images/, /Attention-2-Detail/, /GVXjD/, /Before-and-After/];
    // Only the REAL map is held to this. The realistic AI renders that are deliberately used, and
    // labelled illustrative, for services with no photograph live in ILLUSTRATIVE_IMAGES.
    const start = code.indexOf('export const REAL_SERVICE_IMAGES');
    const end = code.indexOf('export const ILLUSTRATIVE_IMAGES');
    assert.ok(start > 0 && end > start, 'markers');
    for (const re of banned) assert.doesNotMatch(code.slice(start, end), re, `real mapping references ${re}`);
  });

  test('it only touches the two service GETs', () => {
    const q = fs.readFileSync(path.join(root, 'client/src/lib/queryClient.ts'), 'utf8');
    assert.match(q, /applyRealServiceImages\(/);
    assert.match(code, /url === "\/api\/services"/);
    assert.match(code, /\/api\\\/services\\\//);
  });
});
