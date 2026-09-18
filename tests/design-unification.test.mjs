/**
 * Phase 2: one design across the site.
 *
 * Before: the homepage, blog, contact and guides used the approved redesign (Archivo +
 * IBM Plex, the shared header and footer, brand green); /services and the policy pages used
 * an older header with Terms/Privacy/Refund in the main menu; the service pages and
 * /ppf-ceramic-coating each had their own header, system fonts and a different green.
 *
 * These tests pin the unified state so a page cannot quietly drift back.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const code = (p) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Routed pages built with Tailwind that now take the shared chrome. */
const UNIFIED = [
  'client/src/pages/services.tsx',
  'client/src/pages/privacy-policy.tsx',
  'client/src/pages/refund-policy.tsx',
  'client/src/pages/terms-conditions.tsx',
  'client/src/pages/not-found.tsx',
  'client/src/pages/service-landing.tsx',
  'client/src/pages/ppf-ceramic-landing.tsx',
];

describe('shared header, footer and type', () => {
  for (const file of UNIFIED) {
    test(`${path.basename(file)} uses the site header, footer and brand type`, () => {
      const src = code(file);
      assert.match(src, /<BrandHeader\b/);
      assert.match(src, /<BrandFooter \/>/);
      assert.match(src, /className="p91-brand /, 'brand typography on the page root');
      assert.doesNotMatch(src, /from "@\/components\/header"|from "@\/components\/footer"/, 'the retired chrome');
    });
  }

  test('no routed page still imports the old header or footer', () => {
    const app = read('client/src/App.tsx');
    const pagesDir = path.join(repoRoot, 'client/src/pages');
    for (const f of fs.readdirSync(pagesDir)) {
      const src = fs.readFileSync(path.join(pagesDir, f), 'utf8');
      if (!/from "@\/components\/(header|footer)"/.test(src)) continue;
      // cancellation-policy and terms-of-service have no route: nobody can reach them.
      const name = f.replace('.tsx', '');
      assert.ok(!app.includes(`@/pages/${name}"`), `${f} is routed but still uses the old chrome`);
    }
  });

  test('each piece of chrome gets its own .p91x scope, without breaking sticky', () => {
    const chrome = read('client/src/components/redesign/brand-chrome.tsx');
    assert.equal((chrome.match(/<div className="p91x" style=\{\{ display: "contents" \}\}>/g) || []).length, 2);
  });

  test('.p91-brand carries typography only — never layout', () => {
    const css = read('client/src/styles/redesign.css');
    const block = css.slice(css.indexOf('.p91-brand {'));
    assert.match(block, /font-family: "IBM Plex Sans"/);
    assert.match(block, /\.p91-brand h1, \.p91-brand h2, \.p91-brand h3, \.p91-brand h4 \{\s*font-family: Archivo/);
    assert.doesNotMatch(block, /display:|grid|margin|padding|width/, '.p91x-style generic layout rules must not leak here');
  });

  test('on pages with their own booking flow, header Book Now starts it in place', () => {
    const header = read('client/src/components/redesign/site-header.tsx');
    assert.match(header, /onBookNow \? \(\s*<button type="button" className="btn-book" onClick=\{onBookNow\}/);
    assert.match(read('client/src/pages/service-landing.tsx'), /<BrandHeader onBookNow=\{\(\) => setBookingModalOpen\(true\)\} \/>/);
    assert.match(read('client/src/pages/ppf-ceramic-landing.tsx'), /<BrandHeader onBookNow=\{scrollToForm\} \/>/);
  });
});

describe('brand green and one booking phrase', () => {
  test('primary buttons use the brand green, not three different greens', () => {
    for (const f of ['client/src/pages/service-landing.tsx', 'client/src/pages/ppf-ceramic-landing.tsx', 'client/src/components/quote-form.tsx']) {
      const src = code(f);
      assert.doesNotMatch(src, /hover:bg-green-600|hover:bg-\[#0ea371\]|bg-\[#10B981\]/, f);
      assert.match(src, /bg-\[var\(--neon-green\)\]/, f);
    }
  });

  test('"Book Now" everywhere except the Protection Challenge (left untouched)', () => {
    for (const f of ['client/src/pages/campaign-landing.tsx', 'client/src/components/campaign-offer.tsx', 'client/src/pages/service-landing.tsx']) {
      assert.doesNotMatch(code(f), /Book Free Appointment|service\.ctaText \|\|/, f);
    }
  });

  test('the off-brand fixed blue "Call Now" tab is gone from /ppf-ceramic-coating', () => {
    assert.doesNotMatch(read('client/src/pages/ppf-ceramic-landing.tsx'), /floating-call-btn/);
  });
});

describe('/services cards', () => {
  const card = code('client/src/components/service-card.tsx');

  test('no "Limited Time" / "MEGA SAVINGS" badge — only the computed % off', () => {
    assert.doesNotMatch(card, /service\.discountText/);
    assert.match(card, /\{discountPercent\}% off/);
  });

  test('no Tailwind classes that generate no CSS in this project', () => {
    assert.doesNotMatch(card, /text-neon-green|border-neon-green|text-deep-black|glass-effect|neon-glow/);
  });

  test('prices are formatted and implausible durations are not printed', () => {
    assert.match(card, /formatINR\(service\.price\)/);
    assert.match(card, /formatServiceTime\(service\)/);
    assert.doesNotMatch(card, /minutes/);
  });

  test('no button nested inside the card link', () => {
    assert.doesNotMatch(card, /<Button\b|<button\b/);
  });
});
