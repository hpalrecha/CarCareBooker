/**
 * /ppf-ceramic-coating prices must come from the catalogue, never from the page.
 *
 * The page shipped for months with its own rupee table — PPF "was ₹65,000" against a real
 * ₹85,000, car ceramic at ₹6,000 against a real ₹5,999 — while BookingModal and the campaign
 * landing pages read GET /api/services. These tests pin both halves of the fix:
 *
 *   1. lib/ppf-ceramic-pricing.ts returns exactly what the catalogue row says, and nothing
 *      when there is no row;
 *   2. the page carries no rupee figure or "% OFF" literal of its own, so a hardcoded price
 *      cannot be reintroduced without this file failing.
 *
 * Run the live drift check against production with:  LIVE_PRICING_CHECK=1 npm test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

// The module is TypeScript with no runtime dependencies, so the type annotations are
// stripped rather than pulling a compiler into the test run.
const src = read('client/src/lib/ppf-ceramic-pricing.ts')
  .replace(/export interface \w+ \{[\s\S]*?\n\}/g, '')
  .replace(/\(services: unknown, slug: string\): CataloguePrice \| null \{/, '(services, slug) {')
  .replace(/\(prices: \(CataloguePrice \| null\)\[\]\): number \{/, '(prices) {')
  .replace(/^export /gm, '');
const { PPF_CERAMIC_PRICE_SLUGS, resolveCataloguePrice, maxDiscountPercent } = new Function(
  src + '; return { PPF_CERAMIC_PRICE_SLUGS, resolveCataloguePrice, maxDiscountPercent };',
)();

/** Page source with comments removed, so assertions match code and not the explanations. */
const page = read('client/src/pages/ppf-ceramic-landing.tsx')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

/** The five catalogue rows as GET /api/services returned them on 2026-09-15 (numeric strings). */
const CATALOGUE = [
  { slug: 'ppf-hatchback', title: 'P91 PPF - Hatchback', price: '45000.00', originalPrice: '85000.00' },
  { slug: 'ppf-sedan', title: 'P91 PPF - Sedan', price: '55000.00', originalPrice: '85000.00' },
  { slug: 'ppf-suv', title: 'P91 PPF - SUV', price: '65000.00', originalPrice: '95000.00' },
  { slug: '1-year-ceramic-coating', title: '1 Year Ceramic Coating', price: '5999.00', originalPrice: '12000.00' },
  { slug: '1-year-bike-ceramic-coating', title: '1 Year Bike Ceramic Coating', price: '2999.00', originalPrice: '6000.00' },
  { slug: 'partial-ppf-sedan', title: 'Partial PPF (sedan)', price: '29999.00', originalPrice: '29999.00' },
];

describe('/ppf-ceramic-coating reads the catalogue slugs it is meant to', () => {
  test('each price on the page is backed by the named catalogue service', () => {
    assert.deepEqual(PPF_CERAMIC_PRICE_SLUGS, {
      ppfHatchback: 'ppf-hatchback',
      ppfSedan: 'ppf-sedan',
      ppfSuv: 'ppf-suv',
      ceramicCar: '1-year-ceramic-coating',
      ceramicBike: '1-year-bike-ceramic-coating',
    });
  });
});

describe('resolveCataloguePrice returns the catalogue row, current and struck-through', () => {
  const cases = [
    ['PPF hatchback', 'ppfHatchback', 45000, 85000, 47],
    ['PPF sedan', 'ppfSedan', 55000, 85000, 35],
    ['PPF SUV', 'ppfSuv', 65000, 95000, 32],
    ['car ceramic', 'ceramicCar', 5999, 12000, 50],
    ['bike ceramic', 'ceramicBike', 2999, 6000, 50],
  ];
  for (const [name, key, price, was, off] of cases) {
    test(`${name}: ${price} was ${was} (${off}% off)`, () => {
      assert.deepEqual(resolveCataloguePrice(CATALOGUE, PPF_CERAMIC_PRICE_SLUGS[key]), {
        price,
        originalPrice: was,
        discountPercent: off,
      });
    });
  }

  test('follows a catalogue change instead of keeping an old figure', () => {
    // Deliberately odd numbers: a resolver that returned any constant would fail here.
    const changed = CATALOGUE.map((s) => ({ ...s, price: '12345.00', originalPrice: '67890.00' }));
    for (const slug of Object.values(PPF_CERAMIC_PRICE_SLUGS)) {
      assert.deepEqual(resolveCataloguePrice(changed, slug), {
        price: 12345,
        originalPrice: 67890,
        discountPercent: 82,
      });
    }
  });

  test('no struck-through figure when the row carries no genuine reduction', () => {
    assert.deepEqual(resolveCataloguePrice(CATALOGUE, 'partial-ppf-sedan'), {
      price: 29999,
      originalPrice: null,
      discountPercent: 0,
    });
    assert.deepEqual(resolveCataloguePrice([{ slug: 'x', price: '100' }], 'x'), {
      price: 100,
      originalPrice: null,
      discountPercent: 0,
    });
  });

  test('no price at all, never a fallback, when the row is missing or unusable', () => {
    assert.equal(resolveCataloguePrice(undefined, 'ppf-sedan'), null, 'catalogue not loaded');
    assert.equal(resolveCataloguePrice({}, 'ppf-sedan'), null, 'non-array payload');
    assert.equal(resolveCataloguePrice(CATALOGUE, 'ppf-bike'), null, 'no bike PPF service exists');
    assert.equal(resolveCataloguePrice([{ slug: 'x', price: 'abc' }], 'x'), null);
    assert.equal(resolveCataloguePrice([{ slug: 'x', price: '0' }], 'x'), null);
  });

  test('"Up to N% OFF" is the largest live saving, 0 when nothing resolved', () => {
    const resolved = Object.values(PPF_CERAMIC_PRICE_SLUGS).map((s) => resolveCataloguePrice(CATALOGUE, s));
    assert.equal(maxDiscountPercent(resolved), 50);
    assert.equal(maxDiscountPercent([null, null]), 0);
  });
});

describe('the page carries no prices of its own', () => {
  test('no rupee figure except the free car wash, which is not a catalogue service', () => {
    const rupees = [...page.matchAll(/₹\s?[\d,]+/g)].map((m) => m[0]);
    assert.deepEqual(rupees, ['₹599'], `hardcoded rupee figures found: ${rupees.join(', ')}`);
  });

  test('no typed-in "% OFF" badge or price/originalPrice value', () => {
    assert.doesNotMatch(page, /\d+\s?% OFF/, 'a discount must be computed from the catalogue row');
    assert.doesNotMatch(page, /\b(price|originalPrice|discount)\s*:\s*["'`\d]/);
  });

  test('every rupee figure is formatted from a resolved catalogue value, never a literal', () => {
    const args = [...new Set([...page.matchAll(/formatINR\(([^)]*)\)/g)].map((m) => m[1].trim()))].sort();
    assert.deepEqual(args, ['pricing.originalPrice', 'pricing.price'], `formatINR called with: ${args.join(', ')}`);
  });

  test('each hero tile is priced from exactly its own catalogue slug', () => {
    for (const [label, key] of [
      ['Hatchback', 'ppfHatchback'],
      ['Sedan', 'ppfSedan'],
      ['SUV', 'ppfSuv'],
      ['Ceramic Cars', 'ceramicCar'],
      ['Ceramic Bikes', 'ceramicBike'],
    ]) {
      assert.match(
        page,
        new RegExp(`<HeroPriceTile label="${label}" pricing=\\{priceFor\\(PPF_CERAMIC_PRICE_SLUGS\\.${key}\\)\\}`),
        `hero tile "${label}" is not priced from PPF_CERAMIC_PRICE_SLUGS.${key}`,
      );
    }
  });

  test('each pricing card is priced from exactly its own catalogue slug', () => {
    for (const [title, key] of [
      ['PPF - Hatchback', 'ppfHatchback'],
      ['PPF - Sedan', 'ppfSedan'],
      ['PPF - SUV', 'ppfSuv'],
      ['Ceramic Coating - Cars', 'ceramicCar'],
      ['Ceramic Coating - Bikes', 'ceramicBike'],
    ]) {
      assert.match(
        page,
        new RegExp(`title: "${title}",\\s*slug: PPF_CERAMIC_PRICE_SLUGS\\.${key},`),
        `card "${title}" is not priced from PPF_CERAMIC_PRICE_SLUGS.${key}`,
      );
    }
  });

  test('prices are resolved from GET /api/services through the shared module', () => {
    assert.match(page, /useQuery<ServiceRecord\[\]>\(\{\s*queryKey:\s*\["\/api\/services"\]/);
    assert.match(page, /from "@\/lib\/ppf-ceramic-pricing"/);
    assert.match(page, /resolveCataloguePrice\(services, slug\)/);
    for (const key of ['ppfHatchback', 'ppfSedan', 'ppfSuv', 'ceramicCar', 'ceramicBike']) {
      assert.match(page, new RegExp(`PPF_CERAMIC_PRICE_SLUGS\\.${key}\\b`), `${key} is not rendered`);
    }
  });

  test('bike PPF, which has no catalogue service, is shown without a price', () => {
    assert.match(page, /title: "PPF for Bikes",\s*slug: null,/);
    assert.match(page, /label="Bikes PPF" pricing=\{null\}/);
  });
});

describe('live catalogue still has every slug the page prices (opt-in)', { skip: !process.env.LIVE_PRICING_CHECK }, () => {
  test('GET https://p91carcare.com/api/services', async () => {
    const services = await (await fetch('https://p91carcare.com/api/services')).json();
    for (const slug of Object.values(PPF_CERAMIC_PRICE_SLUGS)) {
      const p = resolveCataloguePrice(services, slug);
      assert.ok(p, `${slug} is missing or unpriced in the live catalogue`);
    }
  });
});
