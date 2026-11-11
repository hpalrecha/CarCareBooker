/**
 * The structured data of the festival offer (/offer/de-dhana-dhan): the seller, and what happens when the offer ends.
 *
 * THE DEFECTS. (1) The seller was an AutoRepair (a local business) with only a name and an @id, so a validator reported a
 * local business without an address. The seller is the studio itself, so it is now the one complete, owner-confirmed
 * business entity that the home page, /contact and the service pages publish, built by the same function; no address is
 * written in offer-schema.ts. (2) The Offer stayed "InStock" with a validThrough in the past after the offer ended; after
 * the end date there is now no Offer at all.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://p91carcare.com';
const DIST = path.join(repoRoot, 'dist', 'public');
const DURING = new Date('2026-11-01T12:00:00+05:30');
const AFTER = new Date('2026-11-09T00:00:00+05:30');

let content;
before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'offer-schema-test.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'scripts', 'prerender-content-entry.ts')], bundle: true, format: 'esm', platform: 'node',
    outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src') },
  });
  content = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

describe('festivalOfferSchema while the offer runs', () => {
  test('the seller is the studio with its confirmed address, and is not a name-only stub', () => {
    const { seller } = content.festivalOfferSchema(ORIGIN, DURING);
    assert.equal(seller['@type'], 'AutoRepair');
    assert.equal(seller['@id'], `${ORIGIN}/#business`);
    assert.equal(seller.name, 'P91 Car Care');
    assert.equal(seller.address.streetAddress, '49, 13th Cross, Ayappa Garden, Adugodi');
    assert.equal(seller.address.postalCode, '560030');
    assert.equal(seller.address.addressLocality, 'Bengaluru');
    assert.equal(seller.telephone, '+917406619191');
  });

  test('the seller is exactly the shared business entity (no second copy of business details)', () => {
    const { '@context': _c, ...business } = content.localBusinessSchema(ORIGIN);
    assert.deepEqual(content.festivalOfferSchema(ORIGIN, DURING).seller, business);
  });

  test('the nested seller carries no @context of its own', () => {
    assert.equal('@context' in content.festivalOfferSchema(ORIGIN, DURING).seller, false);
  });

  test('the offer itself is unchanged: id, url, name, price, currency, availability and end date', () => {
    const o = content.festivalOfferSchema(ORIGIN, DURING);
    assert.equal(o['@type'], 'Offer');
    assert.equal(o['@id'], `${ORIGIN}/offer/de-dhana-dhan#offer`);
    assert.equal(o.url, `${ORIGIN}/offer/de-dhana-dhan`);
    assert.equal(o.price, '99');
    assert.equal(o.priceCurrency, 'INR');
    assert.equal(o.availability, 'https://schema.org/InStock');
    assert.equal(o.validThrough, '2026-11-08T23:59:59+05:30');
  });

  test('no business detail is written in offer-schema.ts itself', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'client/src/lib/offer-schema.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/streetAddress|postalCode|Ayappa|560030|telephone/.test(src));
  });
});

describe('festivalOfferSchema after the offer ends', () => {
  test('there is no Offer: no price, no InStock, no validThrough in the past', () => {
    assert.equal(content.festivalOfferSchema(ORIGIN, AFTER), null);
    assert.notEqual(content.festivalOfferSchema(ORIGIN, new Date('2026-11-08T23:59:59+05:30')), null, 'the last second of 8 November is still inside the offer');
    assert.equal(content.festivalOfferSchema(ORIGIN, new Date('2026-11-09T00:00:00+05:30')), null);
  });
});

describe('the prerendered offer page', { skip: !fs.existsSync(path.join(DIST, 'offer', 'de-dhana-dhan', 'index.html')) ? 'run `npm run build` first' : false }, () => {
  const html = () => fs.readFileSync(path.join(DIST, 'offer', 'de-dhana-dhan', 'index.html'), 'utf8');
  const blocks = () => [...html().matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

  test('carries the offer exactly as the build date says: an Offer with the complete seller while it runs, none after', () => {
    const ended = new Date() > new Date('2026-11-08T23:59:59+05:30');
    const offers = blocks().filter((b) => b['@type'] === 'Offer');
    if (ended) {
      assert.equal(offers.length, 0, 'no Offer after the end date');
      assert.ok(!/InStock/.test(html()));
    } else {
      assert.equal(offers.length, 1);
      assert.equal(offers[0].seller.address.postalCode, '560030');
    }
  });

  test('the breadcrumb is still there', () => {
    assert.ok(blocks().some((b) => b['@type'] === 'BreadcrumbList'));
  });
});
