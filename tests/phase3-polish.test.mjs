/**
 * Phase 3 "polish and fixes" (audit items 9, 10, 14). Items 12 and 13 are blocked on
 * business decisions (canonical PPF page; real studio photos) and are not touched here.
 * Item 11 (heading hierarchy) was re-verified as already fixed by Phase 2 and needed no
 * change, so it has no dedicated test in this file.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

describe('item 10 — mobile blog carousel no longer bleeds past the viewport on /ppf and /ceramic-coating/car', () => {
  const landingCss = read('client/src/styles/landing-pages.css');
  const redesignCss = read('client/src/styles/redesign.css');

  test(".wrap's mobile padding is 16px (the value .blogc's bleed must match)", () => {
    assert.match(redesignCss, /\.p91x \.wrap \{ padding: 0 16px; \}/);
  });

  test('.blogc bleeds by exactly 16px, matching .wrap, not the old mismatched 20px', () => {
    assert.match(landingCss, /\.p91x \.blogc \{[\s\S]*?margin: 0 -16px;[\s\S]*?padding: 2px 16px 14px;/);
    assert.doesNotMatch(landingCss, /margin: 0 -20px/);
    assert.doesNotMatch(landingCss, /padding: 2px 20px 14px/);
  });
});

describe('item 9 — footer and filter-chip tap targets reach 40px on phone pages', () => {
  const css = read('client/src/styles/redesign.css');

  // .foot-btn, .foot-more and .foot-legal a were raised from a 40px floor to the full
  // WCAG 44px minimum in a later pass (the render QA that followed the .p91x migration
  // found the site's primary and secondary CTAs measuring short of 44px in a real browser).
  // .foot-col a and .teaser-head a.teaser-more were not part of that pass and keep their
  // original 40px floor.
  test('.foot-btn (call/WhatsApp/Instagram) has an explicit 44px floor', () => {
    assert.match(css, /\.p91x \.foot-btn \{[\s\S]{0,120}min-height: 44px;/);
  });

  test('.foot-col a (Services/Company link lists) has enough padding to clear 40px', () => {
    // 10px top + 10px bottom + a ~13.5px line at 1.6 line-height (~21.6px) = ~41.6px.
    assert.match(css, /\.p91x footer\.site \.foot-col a \{ display: block; color: var\(--txt-2\); padding: 10px 0; \}/);
  });

  test('.foot-more and .foot-legal a have a 44px floor; the homepage .teaser-more links keep their 40px floor', () => {
    assert.match(css, /\.p91x \.foot-more \{[\s\S]{0,80}min-height: 44px;/);
    assert.match(css, /\.p91x \.foot-legal a \{[\s\S]{0,80}min-height: 44px;/);
    assert.match(css, /\.p91x \.teaser-head a\.teaser-more \{[\s\S]{0,80}min-height: 40px;/);
  });

  test('vehicle/category filter chips and the two "clear filters" buttons have a 40px floor', () => {
    const filterSrc = read('client/src/components/service-filter.tsx');
    const hits = filterSrc.match(/min-h-\[40px\]/g) || [];
    assert.ok(
      hits.length >= 4,
      `expected the two chip buttons plus the two "clear filters" buttons (4) to carry min-h-[40px], found ${hits.length}`,
    );
  });
});

describe('item 14 — refund policy no longer promises a nonexistent ₹599 service', () => {
  const src = read('client/src/pages/refund-policy.tsx');

  test('the stale ₹599 figure is gone', () => {
    assert.doesNotMatch(src, /599/);
  });

  test('the real service is named at its current catalogue price instead', () => {
    // Premium Car Wash Special is the actual bookable service this section was describing.
    assert.match(src, /Premium Car Wash Special \(₹999\)/);
  });

  test('the other three Section 2 prices match the current admin/catalogue values, not the old stale ones', () => {
    assert.match(src, /Interior Detailing \(₹4,000\)/);
    assert.doesNotMatch(src, /Interior Detailing \(₹2,499\)/);
    assert.doesNotMatch(src, /Interior Detailing \(₹2,999\)/);

    assert.match(src, /Exterior Detailing \(₹5,999\)/);
    assert.doesNotMatch(src, /Exterior Detailing \(₹1,999\)/);
    assert.doesNotMatch(src, /Exterior Detailing \(₹3,499\)/);

    assert.match(src, /Headlight Restoration \(₹1,499\)/);
    assert.doesNotMatch(src, /Headlight Restoration \(₹1,199\)/);
  });
});
