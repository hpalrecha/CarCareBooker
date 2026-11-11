/**
 * /ppf page claims: booking vs installation, the free-booking promise, previous prices, and self-healing.
 *
 * Source-level guards (the behaviour behind them is in ppf-package-booking.itest.mjs, which runs the real endpoints):
 *   - nothing on the campaign pages says or implies same-day installation, and booking and installation stay separate;
 *   - every surface that says "free" asks lib/offer-scope.ts, which compares the campaign's row with the package shown;
 *   - the static /ppf copy (meta description, step list) makes no free-booking promise;
 *   - the booking modal knows about campaigns, and shows no previous price for the PPF rows;
 *   - the /ppf page copy makes no self-healing claim.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
/** Source with comments removed: what the code and the JSX text actually say. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/.*$/gm, '$1');

let landing;
before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'ppf-page-claims-landing.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'client', 'src', 'lib', 'landing-pages.ts')], bundle: true, format: 'esm', platform: 'node',
    outfile: out, logLevel: 'silent', alias: { '@': path.join(repoRoot, 'client', 'src') },
  });
  landing = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

describe('same-day wording', () => {
  test('the campaign landing component promises neither same-day slots nor same-day completion', () => {
    const src = code('client/src/pages/campaign-landing.tsx');
    assert.ok(!/same[-\s]?day/i.test(src));
    assert.ok(!/finished the day you book/i.test(src));
  });
  test('booking is described as booking, installation as the catalogue\'s own studio time', () => {
    const src = code('client/src/pages/campaign-landing.tsx');
    assert.match(src, /Book your slot online/);
    assert.match(src, /<b>Online booking<\/b><span>Pick your date and time<\/span>/);
    assert.match(src, /Approx\. \{time\} in the studio/);
  });
  test('the server-rendered snapshot for the landing pages says none of it either', () => {
    assert.ok(!/same[-\s]?day|finished the day/i.test(code('client/src/lib/crawlable-content.ts').split('export function landingPageContent')[1] ?? ''));
  });
});

describe('the free-booking promise follows the package', () => {
  test('the hero strip and the offer block take the selected row and ask offer-scope', () => {
    for (const f of ['client/src/components/hero-offer-strip.tsx', 'client/src/components/campaign-offer.tsx']) {
      const src = code(f);
      assert.match(src, /serviceSlug: string \| undefined/, f);
      assert.match(src, /from "@\/lib\/offer-scope"/, f);
      assert.ok(!/const offerRunning = \(campaign !== null && isFreeBooking\) \|\| legacy\.free/.test(src), f + ': the old per-page rule is gone');
    }
    assert.match(code('client/src/components/campaign-offer.tsx'), /campaign\.serviceSlug === serviceSlug/);
  });
  test('the page passes the selected row to both', () => {
    const src = code('client/src/pages/campaign-landing.tsx');
    assert.match(src, /<HeroOfferStrip[^>]*serviceSlug=\{service\?\.slug\}/);
    assert.match(src, /serviceSlug=\{service\?\.slug\}\s*onBook=/);
  });
  test('the booking modal is told the landing page and uses the same rule', () => {
    assert.match(code('client/src/pages/campaign-landing.tsx'), /landingPage=\{page\.path\}/);
    const modal = code('client/src/components/booking-modal.tsx');
    assert.match(modal, /useCampaign\(landingPage\)/);
    assert.match(modal, /bookingIsFreeForRow\(/);
    assert.ok(!/const isFreeBooking = offer\.free;/.test(modal), 'the legacy-only check is gone');
  });
  test('the static /ppf copy makes no free-booking promise (meta description, structured-data description, steps)', () => {
    const ppf = landing.getLandingPage('/ppf');
    assert.ok(!/\bfree\b/i.test(ppf.description), ppf.description);
    assert.ok(ppf.description.length <= 160);
    assert.ok(!ppf.howItWorks.some((s) => /\bfree\b/i.test(s)), 'no "free" in the step list');
    assert.ok(ppf.howItWorks.includes('Book your appointment online'));
  });
});

describe('previous price in the booking modal', () => {
  test('the modal gates the struck-through price on showPreviousPrice', () => {
    const modal = code('client/src/components/booking-modal.tsx');
    assert.match(modal, /showPreviousPrice\(service\) &&/);
    assert.ok(!/\{service\.originalPrice &&/.test(modal));
  });
});

describe('self-healing on the /ppf page copy', () => {
  test('campaign-landing.tsx carries no self-healing claim in its text', () => {
    assert.ok(!/self[-\s]?heal/i.test(code('client/src/pages/campaign-landing.tsx')));
  });
  test('the /ppf entry in landing-pages.ts carries none in its fields', () => {
    const ppf = landing.getLandingPage('/ppf');
    assert.ok(!/self[-\s]?heal/i.test(JSON.stringify(ppf)));
  });
});
