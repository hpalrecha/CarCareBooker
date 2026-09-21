/**
 * The 17 /service/* pages share one template, and the studio asked for that template to
 * look like /ppf-ceramic-coating. These tests pin the parts of that layout a later edit
 * could quietly undo: the announcement bar, a header carrying the phone and a CTA, the
 * two-column hero with the enquiry form on the right, and the section rhythm.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const raw =fs.readFileSync(path.join(repoRoot, 'client/src/pages/service-landing.tsx'), 'utf8');
/** Comments stripped, so assertions match code rather than the prose describing it. */
const src = raw.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const heroStart = src.indexOf('<section className="relative overflow-hidden bg-gradient-to-br');
const heroEnd = src.indexOf('</section>', heroStart);
const hero = src.slice(heroStart, heroEnd);

describe('service pages share the /ppf-ceramic-coating layout', () => {
  test('the hero exists where expected', () => {
    assert.ok(heroStart > -1, 'hero section not found');
  });

  test('the site-wide header and footer, with Book Now opening this page\'s booking form', () => {
    const top = src.slice(0, heroStart);
    // Shared chrome (Phase 2): the page-only green bar and header are gone.
    assert.doesNotMatch(top, /from-green-700 to-green-800/);
    assert.match(top, /<BrandHeader onBookNow=\{\(\) => setBookingModalOpen\(true\)\} \/>/);
    assert.match(src, /<BrandFooter \/>/);
    // The phone number lives in the shared header.
    assert.match(read('client/src/components/redesign/site-header.tsx'), /href="tel:\+917406619191"/);
  });

  test('60/40 hero: copy left, offer card alone on the right, vertically centred', () => {
    assert.match(hero, /lg:grid-cols-12 lg:items-center/);
    assert.match(hero, /lg:col-span-7/);
    assert.match(hero, /<section aria-label="Pricing and booking" className="[^"]*lg:col-span-5/);
    assert.ok(hero.includes('data-testid="offer-card"'));
    // The call-back form looked out of place under the card, so it is not in the hero.
    assert.ok(!/<QuoteForm\b/.test(hero), 'no form in the hero');
  });

  test('"Prefer a call?" is a popup, not an inline section', () => {
    assert.ok(!/<QuoteForm\b/.test(src), 'no inline form left on the page');
    assert.match(src, /<CallbackPopup\s+serviceTitle=\{service\.title\.trim\(\)\}\s+serviceSlug=\{service\.slug\}\s+isBikeService=\{isBikeService\}/);
    const popup = read('client/src/components/callback-popup.tsx');
    // Same form, so same validation, endpoint and Lead event.
    assert.match(popup, /<QuoteForm[\s\S]*?heading="Prefer a call\?"[\s\S]*?lockVehicleType[\s\S]*?onSubmitted=\{markCallbackRequested\}/);
    assert.match(popup, /<DialogTitle className="sr-only">Prefer a call\?<\/DialogTitle>/, 'the dialog is named');
  });

  test('the title is plain type, not a gradient that clips descenders', () => {
    const h1 = hero.match(/<h1[^>]*>/)?.[0] ?? '';
    assert.ok(h1, 'hero h1 missing');
    assert.doesNotMatch(h1, /bg-clip-text|text-transparent/);
    assert.match(h1, /text-3xl/, 'mobile base size');
  });

  test('trust pills are facts from the record, and claim nothing unmeasured', () => {
    assert.ok(hero.includes('data-testid="trust-pills"'));
    assert.ok(hero.includes('shortIncluded(service.whatIncluded[0])'));
    assert.doesNotMatch(src, /100% Satisfaction Guaranteed|5-Star Rated Service/);
  });

  test('an implausible duration is never printed', () => {
    // formatServiceTime returns null for the PPF records holding 2/3/4, and every use
    // is guarded on it.
    assert.ok(hero.includes('{formatServiceTime(service) && ('));
    assert.doesNotMatch(src, /\$\{service\.duration\} min/);
  });

  test('sections use the same 64px rhythm as /ppf-ceramic-coating', () => {
    const sections = src.match(/<section[^>]*className="[^"]*"/g) || [];
    for (const s of sections) assert.doesNotMatch(s, /\bpy-(20|24)\b/, s);
  });

  test('booking is still one click from the hero', () => {
    assert.match(hero, /data-testid="button-book-now-hero"/);
    assert.match(hero, /setBookingModalOpen\(true\)/);
  });
  test('included, why-choose and process stay short', () => {
    assert.ok(src.includes('shortIncluded(item)'));
    assert.ok(src.includes('firstSentence(service.whyChoose)'));
    assert.ok(!src.includes('{step.description}'), 'process shows titles only');
    assert.ok(src.includes('new Set(service.whatIncluded.map(cleanIncluded))'), 'duplicates removed');
  });

  test('a lone gallery image is not shown as its own section', () => {
    assert.ok(src.includes("service.gallery.some(item => item.type === 'video')"));
  });
  test('FAQ answers are visible text, not unmounted accordion panels', () => {
    assert.ok(src.includes('data-testid="faq-list"'));
    assert.ok(!src.includes('<AccordionContent'), 'closed Radix panels are not in the DOM');
    assert.ok(src.includes('in Adugodi, Bangalore: FAQs'));
  });

  test('one offer card, with semantic prices, and no offer section repeating it', () => {
    assert.ok(hero.includes('data-testid="offer-card"'));
    assert.match(hero, /<ins\b[\s\S]*?formatINR\(service\.price\)[\s\S]*?<\/ins>/);
    assert.match(hero, /<del\b[^>]*>\{formatINR\(service\.originalPrice\)\}<\/del>/);
    assert.ok(!src.includes('Booking Fee Explanation Section'));
    assert.ok(!src.includes('data-testid="price-card"'), 'the table it replaced');
  });

  test('the card claims nothing the studio has not stated', () => {
    // No end date exists for the discount; deduction of the fee is unconfirmed; the
    // refund line must match /refund-policy (24+ hours, full refund of the fee).
    assert.doesNotMatch(hero, /limited time/i);
    assert.doesNotMatch(src, /Balance at (studio|shop)/i);
    assert.doesNotMatch(hero, /zero risk|certified|3-stage/i);
    assert.ok(hero.includes('Full refund of the booking fee if you cancel 24+ hours ahead.'));
    assert.ok(hero.includes('href="/refund-policy"'));
  });

  test('the two booking routes are named so they cannot be confused', () => {
    assert.ok(hero.includes("'Reserve your slot for ₹299'"));
    assert.ok(read('client/src/components/callback-popup.tsx').includes('No payment now'));
  });

  test('the sticky bar reserves a slot and states the price', () => {
    assert.ok(src.includes('data-testid="button-floating-book-now"'));
    assert.ok(src.includes("'Pay ₹299 now to hold your slot'"));
    assert.match(src, /fixed inset-x-0 bottom-0/, 'full width on phones');
  });
});
