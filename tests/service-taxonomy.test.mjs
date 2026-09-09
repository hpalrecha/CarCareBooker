/**
 * Pins the derived category/vehicle of every service that exists in PRODUCTION today.
 *
 *   npm test
 *   LIVE_TAXONOMY_CHECK=1 npm test   # additionally re-fetches the live catalogue
 *
 * Why pin the real slugs rather than invented ones: the rule ORDER in
 * client/src/lib/service-taxonomy.ts is load-bearing (Glass must beat Coating, Packages
 * must beat Exterior). A reordering that looks harmless silently moves live services
 * into the wrong tab, which is invisible in a build and in a screenshot. These 17 slugs
 * came from GET https://p91carcare.com/api/services.
 *
 * The optional live check guards the other direction: a service ADDED in production
 * after this file was written that falls through to "Other". That is not a failure —
 * "Other" is reachable under the All tab by design — but it should be a visible prompt
 * to add a rule, not a silent demotion.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The module is TypeScript with no runtime dependencies, so the type annotations are
// stripped rather than pulling a compiler into the test run.
const src = fs
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

const factory = new Function(src + '; return { deriveCategory, deriveVehicle, fitsVehicle, matchesQuery };');
const { deriveCategory, deriveVehicle, fitsVehicle, matchesQuery } = factory();

/** slug -> [expected category, expected vehicle] for all 17 live production services. */
const PRODUCTION = {
  'interior-detailing-service':            ['Interior',    'car'],
  'car-polishing':                         ['Exterior',    'car'],
  'exterior-detailing-hard-water-new':     ['Exterior',    'car'],
  'headlight-restoration-both':            ['Restoration', 'car'],
  'windshield-glass-coating-new':          ['Glass',       'car'],
  'windshield-glass-polishing':            ['Glass',       'car'],
  'stek-suncontrol-films':                 ['Glass',       'car'],
  'stek-windsheild-suncontrol-films':      ['Glass',       'car'],
  '1-year-ceramic-coating':                ['Coating',     'car'],
  '1-year-bike-ceramic-coating':           ['Coating',     'bike'],
  'ppf-hatchback':                         ['PPF',         'hatchback'],
  'ppf-sedan':                             ['PPF',         'sedan'],
  'ppf-suv':                               ['PPF',         'suv'],
  'partial-ppf-hatchback':                 ['PPF',         'hatchback'],
  'partial-ppf-sedan':                     ['PPF',         'sedan'],
  'partial-ppf-suv':                       ['PPF',         'suv'],
  'annual-maintenance-package':            ['Packages',    'car'],
};

describe('service taxonomy — production slugs', () => {
  for (const [slug, [category, vehicle]] of Object.entries(PRODUCTION)) {
    test(slug + ' -> ' + category + ' / ' + vehicle, () => {
      assert.equal(deriveCategory({ slug }), category);
      assert.equal(deriveVehicle({ slug }), vehicle);
    });
  }

  test('all 17 production services are accounted for', () => {
    assert.equal(Object.keys(PRODUCTION).length, 17);
  });

  test('no production service falls through to Other', () => {
    const other = Object.keys(PRODUCTION).filter((slug) => deriveCategory({ slug }) === 'Other');
    assert.deepEqual(other, [], 'these would only appear under "All": ' + other.join(', '));
  });
});

describe('ordering traps that have real consequences', () => {
  test('windshield glass COATING is Glass, not Coating', () => {
    assert.equal(deriveCategory({ slug: 'windshield-glass-coating-new' }), 'Glass');
  });

  test('annual maintenance PACKAGE is Packages, not Exterior via /detail/', () => {
    assert.equal(deriveCategory({ slug: 'annual-maintenance-package' }), 'Packages');
  });

  test('interior DETAILING is Interior, not Exterior via /detail/', () => {
    assert.equal(deriveCategory({ slug: 'interior-detailing-service' }), 'Interior');
  });

  test('bike ceramic coating is a bike, despite ceramic-coating also being a car service', () => {
    assert.equal(deriveVehicle({ slug: '1-year-bike-ceramic-coating' }), 'bike');
    assert.equal(deriveVehicle({ slug: '1-year-ceramic-coating' }), 'car');
  });
});

describe('nothing is ever hidden', () => {
  test('an unrecognised service still classifies, and shows under All', () => {
    const unknown = { slug: 'brand-new-service-2027', title: 'Brand New Service' };
    assert.equal(deriveCategory(unknown), 'Other');
    assert.equal(fitsVehicle(unknown, 'all'), true);
  });

  test('a generic car service survives every car-size filter', () => {
    const s = { slug: 'car-polishing' };
    for (const f of ['all', 'hatchback', 'sedan', 'suv']) {
      assert.equal(fitsVehicle(s, f), true, 'car service hidden by the ' + f + ' filter');
    }
    assert.equal(fitsVehicle(s, 'bike'), false, 'car work should not show under Bike');
  });

  test('bike work is excluded from car filters and vice versa', () => {
    const bike = { slug: '1-year-bike-ceramic-coating' };
    assert.equal(fitsVehicle(bike, 'bike'), true);
    assert.equal(fitsVehicle(bike, 'sedan'), false);
  });

  test('title fallback tolerates the trailing spaces and casing in live titles', () => {
    assert.equal(deriveCategory({ slug: '', title: 'Partial PPF (sedan)   ' }), 'PPF');
    assert.equal(deriveVehicle({ slug: '', title: 'Partial PPF (sedan)   ' }), 'sedan');
  });

  test('empty search matches everything', () => {
    assert.equal(matchesQuery({ title: 'Car Polishing' }, '   '), true);
  });

  test('search finds a service by category name as well as title', () => {
    assert.equal(matchesQuery({ title: 'P91 PPF - SUV', slug: 'ppf-suv' }, 'ppf'), true);
    assert.equal(matchesQuery({ title: 'Interior Detailing Service', slug: 'interior-detailing-service' }, 'interior'), true);
    assert.equal(matchesQuery({ title: 'Car Polishing', slug: 'car-polishing' }, 'ceramic'), false);
  });
});

describe('live catalogue drift (opt-in)', { skip: !process.env.LIVE_TAXONOMY_CHECK }, () => {
  test('every live service classifies, and the pinned set still matches production', async () => {
    const res = await fetch('https://p91carcare.com/api/services');
    assert.equal(res.status, 200);
    const live = await res.json();

    const unclassified = live.filter((s) => deriveCategory(s) === 'Other').map((s) => s.slug);
    assert.deepEqual(unclassified, [], 'add a rule for: ' + unclassified.join(', '));

    const liveSlugs = live.map((s) => s.slug).sort();
    const pinned = Object.keys(PRODUCTION).sort();
    assert.deepEqual(liveSlugs, pinned, 'the live catalogue changed — update PRODUCTION above');
  });
});
