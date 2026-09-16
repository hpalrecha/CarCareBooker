/**
 * The Protection Challenge must recommend a REAL catalogue row and must never invent a price.
 *
 * The failure this guards against is specific: a customer told "SUV PPF, ₹65,000" while the
 * booking carries the hatchback row, or a bike PPF price appearing for a service the
 * catalogue does not sell. So the mapping is pinned per answer set, the price is proven to
 * come from the catalogue resolver, and the component source is checked for the wiring that
 * keeps the shown service and the booked service the same object.
 *
 * Live catalogue check (opt-in):  LIVE_PRICING_CHECK=1 npm test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

// Pure modules with no runtime dependencies: load them by stripping type annotations rather
// than pulling a compiler into the test run (same approach as the other suites here).
const challengeSrc = read('client/src/lib/protection-challenge.ts')
  .replace(/^export type [\s\S]*?;$/gm, '')
  .replace(/export interface \w+ \{[\s\S]*?\n\}/g, '')
  .replace(/function wantsFilm\(goal: string\): boolean \{/, 'function wantsFilm(goal) {')
  .replace(/export function recommend\(answers: Answers\): Recommendation \{/, 'function recommend(answers) {')
  .replace(/export function isValidMobile\(value: string\): boolean \{/, 'function isValidMobile(value) {')
  .replace(
    /export function leadMessage\(answers: Answers, rec: Recommendation, serviceTitle: string\): string \{/,
    'function leadMessage(answers, rec, serviceTitle) {',
  )
  .replace(/const label = \(list: \{ id: string; label: string \}\[\], id: string\) =>/, 'const label = (list, id) =>')
  .replace(/^export /gm, '');
const { recommend, isValidMobile, leadMessage, CHALLENGE_SLUGS, GOALS, FINISHES, VEHICLES } = new Function(
  challengeSrc +
    '; return { recommend, isValidMobile, leadMessage, CHALLENGE_SLUGS, GOALS, FINISHES, VEHICLES };',
)();

const pricingSrc = read('client/src/lib/ppf-ceramic-pricing.ts')
  .replace(/export interface \w+ \{[\s\S]*?\n\}/g, '')
  .replace(/\(services: unknown, slug: string\): CataloguePrice \| null \{/, '(services, slug) {')
  .replace(/\(prices: \(CataloguePrice \| null\)\[\]\): number \{/, '(prices) {')
  .replace(/^export /gm, '');
const { resolveCataloguePrice } = new Function(pricingSrc + '; return { resolveCataloguePrice };')();

/** Component source with comments removed, so assertions match code and not explanations. */
const component = read('client/src/components/protection-challenge.tsx')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const pixel = read('client/src/lib/meta-pixel.ts');
const routes = read('server/routes.ts');

/** GET /api/services as production returned it on 2026-09-16. */
const CATALOGUE = [
  { slug: 'ppf-hatchback', title: 'P91 PPF - Hatchback', price: '45000.00', originalPrice: '85000.00' },
  { slug: 'ppf-sedan', title: 'P91 PPF - Sedan', price: '55000.00', originalPrice: '85000.00' },
  { slug: 'ppf-suv', title: 'P91 PPF - SUV', price: '65000.00', originalPrice: '95000.00' },
  { slug: '1-year-ceramic-coating', title: '1 Year Ceramic Coating', price: '5999.00', originalPrice: '12000.00' },
  { slug: '1-year-bike-ceramic-coating', title: '1 Year Bike Ceramic Coating', price: '2999.00', originalPrice: '6000.00' },
];
const answers = (vehicle, category, goal, finish = 'glossy') => ({ vehicle, category, goal, finish });

describe('the recommendation is a real catalogue row', () => {
  const cases = [
    ['car + hatchback + paint protection', answers('car', 'hatchback', 'protect-paint'), 'ppf-hatchback', 'ppf'],
    ['car + sedan + paint protection', answers('car', 'sedan', 'protect-paint'), 'ppf-sedan', 'ppf'],
    ['car + suv + paint protection', answers('car', 'suv', 'protect-paint'), 'ppf-suv', 'ppf'],
    ['car + suv + scratches', answers('car', 'suv', 'scratches'), 'ppf-suv', 'ppf'],
    ['car + gloss', answers('car', 'sedan', 'gloss'), '1-year-ceramic-coating', 'ceramic'],
    ['car + easier maintenance', answers('car', 'hatchback', 'maintenance'), '1-year-ceramic-coating', 'ceramic'],
    ['bike + gloss', answers('bike', 'motorcycle', 'gloss'), '1-year-bike-ceramic-coating', 'ceramic'],
    ['bike + maintenance', answers('bike', 'motorcycle', 'maintenance'), '1-year-bike-ceramic-coating', 'ceramic'],
  ];
  for (const [name, input, slug, interest] of cases) {
    test(`${name} -> ${slug}`, () => {
      const rec = recommend(input);
      assert.equal(rec.slug, slug);
      assert.equal(rec.serviceInterest, interest);
      assert.ok(CATALOGUE.some((s) => s.slug === rec.slug), `${rec.slug} is not a catalogue service`);
    });
  }

  test('bike + film has no catalogue service, so no price is implied', () => {
    for (const goal of ['protect-paint', 'scratches']) {
      const rec = recommend(answers('bike', 'motorcycle', goal));
      assert.equal(rec.slug, null, 'there is no bike PPF service in the catalogue');
      assert.equal(rec.serviceInterest, 'ppf');
      assert.equal(resolveCataloguePrice(CATALOGUE, rec.slug), null);
    }
  });

  test('every recommendable slug exists in the catalogue', () => {
    for (const slug of Object.values(CHALLENGE_SLUGS)) {
      assert.ok(CATALOGUE.some((s) => s.slug === slug), `${slug} missing from the catalogue`);
    }
  });

  test('the finish preference never changes which service is recommended', () => {
    for (const finish of FINISHES.map((f) => f.id)) {
      assert.equal(recommend(answers('car', 'suv', 'protect-paint', finish)).slug, 'ppf-suv');
      assert.equal(recommend(answers('car', 'suv', 'gloss', finish)).slug, '1-year-ceramic-coating');
    }
  });

  test('an unknown category falls back to a real row, never to undefined', () => {
    const rec = recommend(answers('car', 'spaceship', 'protect-paint'));
    assert.equal(rec.slug, 'ppf-hatchback');
  });
});

describe('prices come from the catalogue, never from the challenge', () => {
  test('the module contains no rupee figure and no price literal', () => {
    const src = read('client/src/lib/protection-challenge.ts');
    assert.doesNotMatch(src, /₹/);
    assert.doesNotMatch(src, /\b\d{4,}\b/, 'a bare price-sized number in the recommendation module');
  });

  test('the component reads the catalogue resolver and never formats a literal', () => {
    assert.match(component, /resolveCataloguePrice\(services, rec\.slug\)/);
    assert.match(component, /useQuery<ServiceRecord\[\]>\(\{ queryKey: \["\/api\/services"\] \}\)/);
    const args = [...new Set([...component.matchAll(/formatINR\(([^)]*)\)/g)].map((m) => m[1].trim()))].sort();
    assert.deepEqual(args, ['pricing.originalPrice', 'pricing.price'], `formatINR called with: ${args.join(', ')}`);
    assert.doesNotMatch(component, /₹\s?[\d,]+/);
  });

  test('resolved prices are exactly the catalogue values', () => {
    assert.deepEqual(resolveCataloguePrice(CATALOGUE, recommend(answers('car', 'suv', 'protect-paint')).slug), {
      price: 65000,
      originalPrice: 95000,
      discountPercent: 32,
    });
    assert.deepEqual(resolveCataloguePrice(CATALOGUE, recommend(answers('car', 'sedan', 'gloss')).slug), {
      price: 5999,
      originalPrice: 12000,
      discountPercent: 50,
    });
  });

  test('an unusable catalogue response yields no price rather than a fallback', () => {
    for (const bad of [undefined, null, {}, [], [{ slug: 'ppf-suv', price: 'abc' }]]) {
      assert.equal(resolveCataloguePrice(bad, 'ppf-suv'), null);
    }
    assert.match(component, /Price on request/);
  });
});

describe('lead capture', () => {
  test('exactly ten digits is required', () => {
    for (const bad of ['', '12345', '12345678901', '98765a4321', '+919876543210', 'abcdefghij']) {
      assert.equal(isValidMobile(bad), false, `${bad} should be rejected`);
    }
    assert.equal(isValidMobile('9876543210'), true);
    assert.equal(isValidMobile('98765 43210'), true, 'spacing is a typing habit, not an invalid number');
  });

  test('name, phone and email are all required by the form schema', () => {
    assert.match(component, /name: z\.string\(\)\.trim\(\)\.min\(2/);
    assert.match(component, /phone: z\.string\(\)\.refine\(isValidMobile/);
    assert.match(component, /email: z\.string\(\)\.trim\(\)\.email\(/);
    assert.doesNotMatch(component, /email:[^\n]*optional\(\)/);
  });

  test('the lead is posted to the existing endpoint with source protection_challenge', () => {
    assert.match(component, /fetch\("\/api\/ppf-leads"/);
    assert.match(component, /source: "protection_challenge"/);
    assert.doesNotMatch(component, /source: "landing_page"/);
  });

  test('the server accepts that source and still rejects invented ones', () => {
    assert.match(routes, /source: z\.enum\(\["landing_page", "exit_intent", "protection_challenge"\]\)/);
  });

  test('the answers travel in message and vehicleModel, so no new columns are needed', () => {
    assert.match(component, /message: leadMessage\(/);
    assert.match(component, /vehicleModel: rec\.vehicleCategory/);
    const rec = recommend(answers('car', 'suv', 'protect-paint'));
    const msg = leadMessage(answers('car', 'suv', 'protect-paint'), rec, 'P91 PPF - SUV');
    assert.match(msg, /Protection Challenge/);
    assert.match(msg, /ppf-suv/, 'staff must be able to find the recommended row');
  });

  test('the honeypot and attribution are sent unchanged', () => {
    assert.match(component, /website: values\.website/);
    assert.match(component, /\.\.\.attributionPayload\(\)/);
    // First-touch attribution is read, never written, by this flow.
    assert.doesNotMatch(component, /captureAttribution|__resetAttribution/);
  });
});

describe('Meta events', () => {
  test('the three custom events exist and are deduplicated', () => {
    for (const fn of ['trackChallengeStart', 'trackChallengeComplete', 'trackWhatsAppContinuation']) {
      assert.match(pixel, new RegExp(`export function ${fn}`), `${fn} missing`);
    }
    assert.match(pixel, /function trackCustom\([\s\S]*?reportedEvents\.has\(eventId\)/);
    assert.match(pixel, /call\("trackCustom", name, params, \{ eventID: eventId \}\)/);
  });

  test('no Purchase event and no value is attached to the challenge', () => {
    assert.doesNotMatch(pixel, /"Purchase"/);
    assert.doesNotMatch(component, /Purchase/);
  });

  test('start fires when a session begins, complete when the result is reached', () => {
    assert.match(component, /const newSession = useCallback\([\s\S]*?trackChallengeStart\(/);
    assert.match(component, /-start`/);
    assert.match(component, /const onReachResult[\s\S]*?trackChallengeComplete\(/);
    assert.match(component, /-complete`/);
    // One id per session means a re-render cannot report a second conversion.
    assert.match(component, /sessionId = useRef/);
  });

  test('Lead fires only after the server accepts the row', () => {
    assert.match(component, /onSuccess: \(\) => \{[\s\S]*?trackLead\(/);
    assert.doesNotMatch(component, /onSubmit[\s\S]{0,200}trackLead\(/);
  });

  test('WhatsApp is reported on the click, not on render', () => {
    assert.match(component, /onClick=\{\(\) =>\s*trackWhatsAppContinuation\(/);
  });
});

describe('booking stays in step with the recommendation', () => {
  test('the same resolved record is shown and handed to BookingModal', () => {
    assert.match(component, /service=\{service as any\}/);
    // Exactly one lookup for the service record; a second one is how they drift apart.
    assert.equal((component.match(/services\.find\(/g) || []).length, 1);
    assert.match(component, /vehicleContext=\{\{ vehicleType: rec\?\.vehicleType, vehicleCategory: rec\?\.vehicleCategory \}\}/);
  });

  test('the booking modal is only rendered once a real service is resolved', () => {
    assert.match(component, /\{service && \(\s*<BookingModal/);
  });
});

describe('wording promises a free booking, never a free service', () => {
  const FORBIDDEN = [
    /free ceramic/i, /free ppf/i, /free service/i, /free coating/i,
    /pay nothing/i, /at no cost/i, /100% free(?! appointment)/i,
  ];
  test('no copy implies the work itself is free', () => {
    for (const pattern of FORBIDDEN) {
      assert.doesNotMatch(component, pattern, `forbidden wording: ${pattern}`);
    }
  });

  test('the free-booking line is present wherever booking is offered', () => {
    assert.match(component, /Booking is free\. Service charges apply at the studio\./);
    assert.match(component, /Book Free Appointment/);
  });
});

describe('placement keeps the challenge optional', () => {
  test('every placement offers a direct booking route beside it', () => {
    assert.match(component, /Already know what you need\? Book Free Appointment/);
  });

  test('the homepage and the three landing pages host it', () => {
    assert.match(read('client/src/pages/home.tsx'), /<ProtectionChallengeCTA placement="home" variant="teaser" \/>/);
    const landing = read('client/src/pages/campaign-landing.tsx');
    assert.match(landing, /<ProtectionChallengeCTA/);
    assert.match(landing, /onBookDirect=\{\(\) => setBookingOpen\(true\)\}/);
  });

  test('it adds no route, so it creates no indexable URL', () => {
    assert.doesNotMatch(read('client/src/App.tsx'), /challenge/i);
    assert.doesNotMatch(read('scripts/prerender.mjs'), /challenge/i);
    assert.doesNotMatch(read('server/routes.ts'), /sitemap[\s\S]{0,4000}challenge/i);
  });
});

describe('accessibility basics', () => {
  test('progress is announced and every control is a real button with a touch target', () => {
    assert.match(component, /aria-live="polite"/);
    assert.equal((component.match(/min-h-\[44px\]/g) || []).length >= 6, true);
    assert.match(component, /focus-visible:outline/);
    assert.match(component, /<FormLabel/);
  });
});

describe('live catalogue still sells everything the challenge recommends (opt-in)', { skip: !process.env.LIVE_PRICING_CHECK }, () => {
  test('GET https://p91carcare.com/api/services', async () => {
    const services = await (await fetch('https://p91carcare.com/api/services')).json();
    for (const slug of Object.values(CHALLENGE_SLUGS)) {
      assert.ok(resolveCataloguePrice(services, slug), `${slug} is missing or unpriced live`);
    }
  });
});
