/**
 * The 17 /service/* pages share one template. These tests pin the parts of that layout a
 * later edit could quietly undo: the site-wide header carrying the phone and a Book Now
 * that opens the modal in place, the product-page hero (2026-09-23, by request: XPEL's own
 * layout — a thumbnail rail plus boxed main photo on one side, a dark info panel with the
 * booking/offer content on the other, both bounded on the page's white ground, replacing
 * an earlier full-bleed-photo-with-text-overlay hero), and the section rhythm.
 *
 * HERO VIDEO: the studio's own reel, saved under attached_assets/reels/ and keyed to the
 * one matching service via its heroVideo field, plays in TWO places once the record has
 * one: full-bleed behind the top hero's copy (gated by useHeroVideoGate — allowMobile and
 * immediate, since these are small per-service reels reached mostly by internal nav, not
 * the 61MB clip home.tsx/campaign-landing.tsx share), and boxed beside "What's Included" in
 * the Overview section further down (never gated — it is not an LCP element, so it just
 * plays whenever the browser allows). Originally removed entirely because no real
 * per-service footage existed and a generic clip behind the wrong service's name would have
 * misrepresented the work; now that real per-service footage exists, the guards below
 * assert it stays real (never the old generic homepage clips) and safe (muted/looping
 * background footage, not autoplaying sound).
 *
 * Migrated off `.p91-brand`/`BrandHeader` onto full `.p91x` + `SiteHeader`/`SiteFooter` —
 * see tests/design-unification.test.mjs for the site-wide chrome assertions this implies.
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

const heroStart = src.indexOf('<section className="pdp-hero"');
const heroEnd = src.indexOf('</section>', heroStart);
const hero = src.slice(heroStart, heroEnd);

const overviewStart = src.lastIndexOf('<section', src.indexOf('id="overview"'));
const overviewEnd = src.indexOf('</section>', overviewStart);
const overview = src.slice(overviewStart, overviewEnd);

describe('service pages share the /ppf-ceramic-coating layout', () => {
  test('the hero exists where expected', () => {
    assert.ok(heroStart > -1, 'hero section not found');
  });

  test('the site-wide header and footer, with Book Now opening this page\'s booking form', () => {
    const top = src.slice(0, heroStart);
    // Shared chrome (Phase 2, then the full .p91x migration): the page-only green bar and
    // header, and later the .p91-brand/BrandHeader shim, are gone.
    assert.doesNotMatch(top, /from-green-700 to-green-800/);
    assert.match(top, /<SiteHeader onBookNow=\{\(\) => setBookingModalOpen\(true\)\} \/>/);
    assert.match(src, /<SiteFooter \/>/);
    // The phone number lives in the shared header.
    assert.match(read('client/src/components/redesign/site-header.tsx'), /href="tel:\+917406619191"/);
  });

  test('product-page hero: boxed photo slideshow on one side, dark info panel on the other', () => {
    assert.ok(hero.includes('pdp-hero-grid'), 'two-column grid');
    assert.ok(hero.includes('className="pdp-media"'), 'photo column');
    assert.ok(hero.includes('className="pdp-panel"'), 'dark info panel');
    assert.ok(hero.includes('data-testid="hero-slides"'), 'photo slideshow frame');
    assert.ok(hero.includes('data-testid="img-hero"'));
    assert.ok(hero.includes('data-testid="offer-card"'));
    // Offer card content lives directly inside the dark panel now, not a separately
    // recoloured `.card` sitting on top of a light hero.
    assert.doesNotMatch(hero, /className="card"/, 'offer content is not a boxed card-on-card');
    // Comes after the title/description/trust-pills in the same column, not a separate
    // grid track.
    assert.ok(
      hero.indexOf('data-testid="offer-card"') > hero.indexOf('data-testid="trust-pills"'),
      'offer card follows the copy in the same column',
    );
    // The call-back form looked out of place under the card, so it is not in the hero.
    assert.ok(!/<QuoteForm\b/.test(hero), 'no form in the hero');
  });

  test('the hero photos are a slideshow: big frame, advances by itself, controls only for 2+ photos', () => {
    // (2026-09-24, by request) This replaced a thumbnail rail beside the photo.
    assert.doesNotMatch(hero, /data-testid="hero-thumbs"/);
    assert.match(hero, /photos\.length < 2/, 'a single photo is shown plainly, with no controls');
    assert.match(src, /setInterval\(\(\) => setActiveThumbIndex/, 'advances on its own');
    assert.match(src, /prefers-reduced-motion: reduce/, 'and not under reduced motion');
    assert.match(src, /setSlidePaused\(true\)/, 'paused while hovered or focused');
    assert.match(hero, /setActiveThumbIndex\(i\)/, 'the dots switch the photo');
  });

  test('hero + overview video only play a service\'s own saved footage, muted and looping', () => {
    // Gated on the SERVICE RECORD's own heroVideo field, not a hardcoded clip — a
    // service with no footage falls through to its photo instead (isDirectVideoFile
    // branch in service-landing.tsx). autoPlay+muted+loop+playsInline: background
    // footage, never a video that plays with sound or forces fullscreen on mobile.
    assert.match(hero, /<video\b/);
    assert.match(hero, /service\.heroVideo && isDirectVideoFile\(service\.heroVideo\) && showHeroVideo/);
    assert.match(hero, /autoPlay[\s\S]{0,40}muted[\s\S]{0,40}loop[\s\S]{0,40}playsInline/);
    // One video per page (2026-09-24, "don't use the same image in all the places"): the hero plays
    // the footage; the overview and the old closing banner used to play the SAME clip again. The
    // overview now shows a different photo (images[2]) or nothing, and the closing banner is gone.
    assert.doesNotMatch(overview, /<video/);
    assert.doesNotMatch(src, /Closing video section — replaces/);
    assert.match(overview, /overviewImage/);
    // The OLD generic homepage clips this page used to (wrongly) share must never come back.
    assert.doesNotMatch(src, /attached_assets\/(Exterior|Interior) Detailing_/);
  });

  test('hero video is gated (desktop or mobile, no artificial wait); overview video is not — it is not an LCP element', () => {
    assert.match(src, /const showHeroVideo = useHeroVideoGate\(\{ allowMobile: true, immediate: true \}\);/);
    assert.match(hero, /showHeroVideo/);
    assert.doesNotMatch(overview, /showHeroVideo/);
  });

  test('hero copy sits on a solid dark panel, not a scrim over the photo/video', () => {
    // The photo/video and the copy are in separate boxed columns now (pdp-media /
    // pdp-panel), so there is no text-over-footage legibility problem left to solve
    // with a scrim — the panel background alone (#0E1F16, redesign.css) does that job.
    assert.doesNotMatch(hero, /hero-light-scrim/);
    assert.ok(hero.includes('className="pdp-panel"'));
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
    // Sizing comes from .pdp-panel h1 in redesign.css now, not a Tailwind class on the
    // element itself.
    assert.match(read('client/src/styles/redesign.css'), /\.pdp-panel h1 \{/);
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

  test('sections use the shared .section rhythm, not a one-off Tailwind padding', () => {
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
