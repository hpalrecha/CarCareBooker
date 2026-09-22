/**
 * Covers server/lib/service-auto-image.ts — the best-guess photo picker for a brand-new
 * service created with no image of its own (e.g. via the simplified admin form, which
 * has no upload step).
 *
 * Deliberately conservative: an unresolved or ambiguous match must return null, never a
 * wrong guess — the existing UI already shows a clean branded placeholder for a service
 * with no image (client/src/components/image-with-fallback.tsx), so "no photo yet" is a
 * perfectly fine outcome and always safer than a mismatched one.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Both modules are TypeScript with no runtime dependencies between them beyond the one
// import, so type annotations are stripped rather than pulling a compiler into the test
// run — the same approach tests/service-taxonomy.test.mjs already uses.
const taxonomySrc = fs
  .readFileSync(path.join(repoRoot, 'client/src/lib/service-taxonomy.ts'), 'utf8')
  .replace(/^export type[\s\S]*?;$/gm, '')
  .replace(/: \[RegExp, Service(Category|Vehicle)\]\[\]/g, '')
  .replace(/: \{ key: ServiceVehicle \| "all"; label: string \}\[\]/g, '')
  .replace(/: Service(Category|Vehicle)\[\]/g, '')
  .replace(/service: \{[^}]*\}/g, 'service')
  .replace(/filter: ServiceVehicle \| "all"/g, 'filter')
  .replace(/query: string/g, 'query')
  .replace(/\): Service(Category|Vehicle) \{/g, ') {')
  .replace(/\): boolean \{/g, ') {')
  .replace(/\): string \{/g, ') {')
  .replace(/^export /gm, '');

const autoImageSrc = fs
  .readFileSync(path.join(repoRoot, 'server/lib/service-auto-image.ts'), 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('import '))
  .join('\n')
  .replace(/AUTO_IMAGE_CANDIDATES: string\[\]/, 'AUTO_IMAGE_CANDIDATES')
  .replace(/function tokens\(text: string\): Set<string> \{/, 'function tokens(text) {')
  .replace(/function deriveAutoImage\(service: \{[^}]*\}\): string \| null \{/, 'function deriveAutoImage(service) {')
  .replace(/^export /gm, '');

const factory = new Function(
  taxonomySrc + '\n' + autoImageSrc + '; return { deriveAutoImage, AUTO_IMAGE_CANDIDATES, IMAGE_DIR };',
);
const { deriveAutoImage, AUTO_IMAGE_CANDIDATES, IMAGE_DIR } = factory();

describe('AUTO_IMAGE_CANDIDATES stays in sync with the real directory', () => {
  test('matches attached_assets/services/ exactly', () => {
    const onDisk = fs
      .readdirSync(path.join(repoRoot, 'attached_assets/services'))
      .filter((f) => f.endsWith('.webp'))
      .sort();
    assert.deepEqual([...AUTO_IMAGE_CANDIDATES].sort(), onDisk);
  });
});

describe('deriveAutoImage — confident matches', () => {
  const cases = [
    ['1 Year Ceramic Coating - SUV', 'car-ceramic-coating-1-year.webp'],
    ['Bike Ceramic Coating', 'bike-ceramic-coating-1-year.webp'],
    ['Premium Interior Detailing', 'interior-detailing-service.webp'],
    ['Annual Maintenance Package', 'annual-maintenance-package.webp'],
    ['Headlight Polish & Restoration', 'headlight-restoration-both-lights.webp'],
    ['Full PPF - Hatchback', 'p91-full-ppf-hatchback.webp'],
    ['Partial PPF - SUV', 'partial-ppf-suv.webp'],
    ['Windshield Glass Coating - New', 'windshield-glass-coating.webp'],
  ];

  for (const [title, file] of cases) {
    test(`"${title}" -> ${file}`, () => {
      assert.equal(deriveAutoImage({ title, slug: '' }), `${IMAGE_DIR}/${file}`);
    });
  }
});

describe('deriveAutoImage — refuses to guess', () => {
  test('an unrelated/nonsense title classifies as Other', () => {
    assert.equal(deriveAutoImage({ title: 'Free Car Freshener Giveaway', slug: '' }), null);
  });

  test('PPF with no size word matches nothing (every PPF photo is size-specific)', () => {
    assert.equal(deriveAutoImage({ title: 'Paint Protection Film for my car', slug: '' }), null);
  });

  test('an unresolved tie between two equally-plausible photos returns null', () => {
    assert.equal(deriveAutoImage({ title: 'Stek Sun Control Film', slug: '' }), null);
  });

  test('empty title/slug never throws and returns null', () => {
    assert.equal(deriveAutoImage({ title: '', slug: '' }), null);
    assert.equal(deriveAutoImage({}), null);
  });
});

describe('storage.ts — auto-image only runs on create, never on update', () => {
  const src = fs.readFileSync(path.join(repoRoot, 'server/storage.ts'), 'utf8');

  const createBody = src.slice(src.indexOf('async createService'), src.indexOf('async updateService'));
  const updateBody = src.slice(src.indexOf('async updateService'), src.indexOf('async setServiceActiveStatus'));

  test('createService calls deriveAutoImage', () => {
    assert.match(createBody, /deriveAutoImage/);
  });

  test('updateService never references deriveAutoImage', () => {
    assert.doesNotMatch(updateBody, /deriveAutoImage/);
  });
});
