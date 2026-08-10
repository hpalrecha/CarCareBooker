/**
 * Regression tests for the production fixes.
 *
 *   npm test                    # source-level checks only
 *   TEST_BASE_URL=http://127.0.0.1:5099 npm test    # also runs the HTTP checks
 *
 * Uses node:test — the runner built into Node 20+ — so no new testing framework is
 * added to the project. The HTTP suite is skipped unless TEST_BASE_URL points at a
 * running server, so `npm test` stays useful in CI without a database.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const BASE = process.env.TEST_BASE_URL;

/**
 * Source with comments stripped. Several fixes are documented by quoting the misleading
 * copy they removed ("Only 3 slots left", "Premium Car Wash - ₹599"), so a naive
 * substring search would match the explanation rather than anything a customer sees.
 */
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')  // JSX comments
    .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
    .replace(/^\s*\/\/.*$/gm, '');         // line comments

/* ------------------------------------------------------------------ source checks */

describe('homepage transformation CTAs', () => {
  const home = readCode('client/src/pages/home.tsx');
  const config = read('client/src/lib/canonical-services.ts');

  test('all four CTAs render through the canonical resolver', () => {
    for (const key of [
      'interiorDeepClean', 'glassCoating', 'headlightRestoration', 'exteriorDetailing',
    ]) {
      assert.match(home, new RegExp(`TRANSFORMATION_CTAS\\.${key}`), `${key} CTA missing`);
    }
  });

  test('no CTA links to a known-inactive legacy slug', () => {
    for (const dead of [
      '/service/interior-deep-clean', '/service/glass-coating',
      '/service/headlight-restoration', '/service/premium-wash-detail',
    ]) {
      assert.ok(!home.includes(dead), `home.tsx still links to inactive slug ${dead}`);
    }
  });

  test('no hardcoded stale CTA prices remain', () => {
    for (const stale of ['₹2,500 ONLY', '₹3,000 ONLY', '₹1,800 ONLY', '₹1,500 ONLY']) {
      assert.ok(!home.includes(stale), `stale price "${stale}" still hardcoded`);
    }
  });

  test('every canonical entry carries an id, slug and expected title', () => {
    for (const key of [
      'interiorDeepClean', 'glassCoating', 'headlightRestoration', 'exteriorDetailing',
    ]) {
      const block = config.slice(config.indexOf(`${key}: {`));
      assert.match(block.slice(0, 400), /id: '/, `${key} has no id`);
      assert.match(block.slice(0, 400), /slug: '/, `${key} has no slug`);
      assert.match(block.slice(0, 400), /expectedTitle: '/, `${key} has no expectedTitle`);
    }
  });

  test('resolver matches on id AND slug AND title, not title alone', () => {
    assert.match(config, /s\.slug === entry\.slug && s\.id === entry\.id/);
    assert.match(config, /row\.title\.trim\(\) !== entry\.expectedTitle/);
  });
});

describe('main "Book Your Service Now" CTA', () => {
  const home = read('client/src/pages/home.tsx');
  test('is a real button wired to the services section', () => {
    const idx = home.indexOf('data-testid="button-final-cta"');
    assert.ok(idx > 0, 'final CTA not found');
    const block = home.slice(idx - 500, idx);
    assert.match(block, /getElementById\('services'\)\?\.scrollIntoView/);
  });
  test('the services section it targets exists', () => {
    assert.match(home, /id="services"/);
  });
});

describe('branded 404', () => {
  const nf = read('client/src/pages/not-found.tsx');
  test('developer wording is gone', () => {
    assert.ok(!nf.includes('Did you forget to add the page to the router'));
  });
  test('has Go Home, Browse Services and Contact routes plus chrome', () => {
    assert.match(nf, /button-404-home/);
    assert.match(nf, /button-404-services/);
    assert.match(nf, /link-404-contact/);
    assert.match(nf, /<Header \/>/);
    assert.match(nf, /<Footer \/>/);
  });
  test('exactly one h1', () => {
    assert.equal((nf.match(/<h1/g) || []).length, 1);
  });
});

describe('invalid service slug', () => {
  const sl = read('client/src/pages/service-landing.tsx');
  test('shows a customer-friendly state, not raw debug text', () => {
    assert.ok(!sl.includes('>Service Not Found<'));
    assert.match(sl, /We couldn't find that service/);
    assert.match(sl, /button-service-not-found-services/);
  });
});

describe('booking modal', () => {
  const modal = read('client/src/components/booking-modal.tsx');
  const dialog = read('client/src/components/ui/dialog.tsx');

  test('has exactly one close button (the shared Radix one)', () => {
    assert.equal((modal.match(/data-testid="button-close-modal"/g) || []).length, 0,
      'booking-modal still renders its own close button');
    // Count only the rendered element (opening tag). The file also has a
    // `const DialogClose = DialogPrimitive.Close` alias and a closing tag.
    assert.equal((dialog.match(/<DialogPrimitive\.Close[\s>]/g) || []).length, 1,
      'ui/dialog.tsx must render exactly one close control');
  });

  test('close control meets the 44x44 touch target and is labelled', () => {
    assert.match(dialog, /h-11 w-11/);
    assert.match(dialog, /aria-label="Close"/);
  });

  test('resolves the service image through the shared fallback component', () => {
    assert.match(modal, /<ImageWithFallback/);
    assert.match(modal, /src=\{service\.images\?\.\[0\]\}/);
  });

  test('no hardcoded Unsplash stand-in remains in the modal', () => {
    assert.ok(!modal.includes('images.unsplash.com'));
  });

  test('reserves space with an aspect ratio and does not stretch', () => {
    const idx = modal.indexOf('data-testid="img-service-banner"');
    const block = modal.slice(idx - 400, idx);
    assert.match(block, /aspect-\[2\/1\]/);
    assert.match(block, /object-cover/);
    assert.match(block, /object-center/);
  });
});

describe('service card image handling', () => {
  const card = read('client/src/components/service-card.tsx');
  test('2:1 box, cover, center, lazy, alt from the service name', () => {
    assert.match(card, /aspect-\[2\/1\]/);
    assert.match(card, /object-cover/);
    assert.match(card, /object-center/);
    assert.match(card, /alt=\{`\$\{service\.title\}/);
    assert.match(read('client/src/components/image-with-fallback.tsx'), /loading="lazy"/);
  });
});

describe('service images on disk', () => {
  const dir = 'attached_assets/services';
  const EXPECTED = [
    'car-polishing.webp',
    'headlight-restoration-both-lights.webp',
    'exterior-detailing-hard-water-spot-removal.webp',
    'interior-detailing-service.webp',
    'p91-full-ppf-hatchback.webp',
    'p91-full-ppf-suv.webp',
    'p91-full-ppf-sedan.webp',
    'partial-ppf-hatchback.webp',
    'partial-ppf-suv.webp',
    'partial-ppf-sedan.webp',
    'stek-full-car-sun-control-film.webp',
    'stek-windshield-sun-control-film.webp',
    'windshield-glass-coating.webp',
    'windshield-glass-polishing.webp',
  ];

  test('all 14 exist and are real WebP under 250 KB', () => {
    for (const f of EXPECTED) {
      const p = path.join(repoRoot, dir, f);
      assert.ok(fs.existsSync(p), `missing ${f}`);
      const buf = fs.readFileSync(p);
      assert.equal(buf.subarray(0, 4).toString('ascii'), 'RIFF', `${f} is not RIFF`);
      assert.equal(buf.subarray(8, 12).toString('ascii'), 'WEBP', `${f} is not WEBP`);
      assert.ok(buf.length <= 250 * 1024, `${f} is ${Math.round(buf.length / 1024)} KB`);
    }
  });

  test('no two of the 14 are byte-identical (no shared image)', () => {
    const seen = new Map();
    for (const f of EXPECTED) {
      const key = fs.readFileSync(path.join(repoRoot, dir, f)).length + ':' +
        fs.readFileSync(path.join(repoRoot, dir, f)).subarray(0, 64).toString('hex');
      assert.ok(!seen.has(key), `${f} is a duplicate of ${seen.get(key)}`);
      seen.set(key, f);
    }
  });

  test('the database script maps 14 distinct files', () => {
    const script = read('scripts/set-service-card-images.mjs');
    const files = [...script.matchAll(/file: '([^']+\.webp)'/g)].map((m) => m[1]);
    assert.equal(files.length, 14);
    assert.equal(new Set(files).size, 14, 'duplicate file in the mapping');
    for (const f of files) assert.ok(EXPECTED.includes(f), `unexpected mapping target ${f}`);
  });

  test('the database script matches rows on id + slug and asserts title + active', () => {
    const script = read('scripts/set-service-card-images.mjs');
    assert.match(script, /where id = \$1 and slug = \$2/);
    assert.match(script, /r\.title !== step\.title/);
    assert.match(script, /!r\.is_active/);
  });
});

describe('legal page dates', () => {
  const meta = read('client/src/lib/legal-metadata.ts');
  test('dates are static, not generated at render time', () => {
    for (const f of ['terms-conditions', 'refund-policy', 'privacy-policy']) {
      const src = read(`client/src/pages/${f}.tsx`);
      assert.ok(!src.includes('new Date()'), `${f} still renders new Date()`);
      assert.match(src, /LEGAL_LAST_UPDATED\./, `${f} does not use the static metadata`);
    }
  });
  test('every legal page has a fixed date value', () => {
    for (const key of ['privacyPolicy', 'termsConditions', 'refundPolicy']) {
      assert.match(meta, new RegExp(`${key}: "\\d+ \\w+ \\d{4}"`), `${key} has no fixed date`);
    }
  });
});

describe('simulated social proof removed', () => {
  test('the fake-booking components are gone', () => {
    for (const f of [
      'client/src/components/fake-booking-popup.tsx',
      'client/src/components/booking-counter.tsx',
      'client/src/components/countdown-timer.tsx',
    ]) {
      assert.ok(!fs.existsSync(path.join(repoRoot, f)), `${f} still exists`);
    }
  });

  test('nothing imports them any more', () => {
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
    });
    for (const p of walk(path.join(repoRoot, 'client/src'))) {
      const src = fs.readFileSync(p, 'utf8');
      for (const bad of ['FakeBookingPopup', 'BookingCounter', 'countdown-timer']) {
        assert.ok(!src.includes(bad), `${path.relative(repoRoot, p)} references ${bad}`);
      }
    }
  });

  test('no fabricated slot counts remain in customer-facing copy', () => {
    const home = readCode('client/src/pages/home.tsx');
    assert.ok(!home.includes('slots left'));
    assert.ok(!home.includes('Only 12 slots'));
    assert.ok(!/3 slots left/.test(home));
    const landing = readCode('client/src/pages/service-landing.tsx');
    assert.ok(!landing.includes('Limited Slots'), 'floating CTA still claims limited slots');
  });

  test('the sticky booking bar can be dismissed and clears the safe area', () => {
    const landing = read('client/src/pages/service-landing.tsx');
    assert.match(landing, /button-dismiss-floating-cta/);
    assert.match(landing, /env\(safe-area-inset-bottom/);
  });
});

describe('navigation', () => {
  const header = read('client/src/components/header.tsx');
  test('has all required destinations', () => {
    for (const href of [
      '"/"', '"/#services"', '"/contact"', '"/terms-conditions"',
      '"/privacy-policy"', '"/refund-policy"',
    ]) {
      assert.ok(header.includes(`href: ${href}`) || header.includes(`href=${href}`),
        `nav missing ${href}`);
    }
  });
  test('mobile menu exposes aria-expanded and aria-controls', () => {
    assert.match(header, /aria-expanded=\{open\}/);
    assert.match(header, /aria-controls=\{MENU_ID\}/);
  });
  test('Escape closes the mobile menu', () => {
    assert.match(header, /e\.key === "Escape"/);
  });
  test('inner pages anchor to /#services rather than a local element', () => {
    const landing = read('client/src/pages/service-landing.tsx');
    assert.match(landing, /href="\/#services"/);
  });
});

describe('footer', () => {
  const footer = readCode('client/src/components/footer.tsx');
  test('service list is generated from active records, not hardcoded', () => {
    assert.match(footer, /FOOTER_SERVICES/);
    assert.match(footer, /resolveCanonical/);
    assert.ok(!footer.includes('Premium Car Wash - ₹599'), 'non-existent service still listed');
    assert.ok(!footer.includes('₹1,999'), 'stale exterior detailing price still listed');
  });
  test('each listed service is a link to its canonical slug', () => {
    assert.match(footer, /href=\{`\/service\/\$\{row\.slug\}`\}/);
  });
  test('prices use the shared INR formatter', () => {
    assert.match(footer, /formatINR\(row\.price\)/);
  });
});

describe('static asset serving', () => {
  const vite = read('server/vite.ts');
  const index = read('server/index.ts');
  test('a missing asset 404s in both dev and production paths', () => {
    assert.equal((vite.match(/status\(404\)\.type\("text\/plain"\)/g) || []).length, 2);
  });
  test('attached_assets is mounted before the SPA catch-all', () => {
    assert.ok(index.indexOf("app.use('/attached_assets'") < index.indexOf('serveStatic(app)'));
  });
  test('a missing attached_assets directory is fatal in production', () => {
    assert.match(index, /fs\.existsSync\(attachedAssetsPath\)/);
    assert.match(index, /process\.exit\(1\)/);
  });
  test('the Dockerfile copies attached_assets to the runtime path', () => {
    const df = read('Dockerfile');
    assert.match(df, /COPY attached_assets \.\/attached_assets/);
    assert.match(df, /WORKDIR \/app/);
  });

  test('the runtime install keeps devDependencies (dist/index.js imports vite)', () => {
    // Comments stripped: the trailing "Slimming this image" note discusses
    // `npm ci --omit=dev` in prose, which is documentation, not an instruction.
    const df = read('Dockerfile').replace(/^\s*#.*$/gm, '');
    // The runtime stage is everything from the second FROM onwards.
    const runtime = df.slice(df.indexOf('AS runtime'));
    const installAt = runtime.indexOf('npm ci');
    const nodeEnvAt = runtime.indexOf('ENV NODE_ENV=production');
    assert.ok(installAt > 0 && nodeEnvAt > 0, 'runtime stage is missing npm ci or NODE_ENV');
    // npm silently drops devDependencies when NODE_ENV=production is already set,
    // which produced "Cannot find package 'vite'" at container start.
    assert.ok(nodeEnvAt > installAt,
      'ENV NODE_ENV=production must come AFTER npm ci, or dev deps are dropped');
    assert.match(runtime, /npm ci --include=dev/,
      'runtime install must explicitly include devDependencies');
    assert.ok(!/npm ci --omit=dev/.test(runtime), 'runtime install must not omit dev deps');
    assert.match(runtime, /test -f node_modules\/vite\/package\.json/,
      'build must assert vite is installed rather than let the container crash-loop');
  });
  test('.dockerignore does not exclude attached_assets', () => {
    const di = read('.dockerignore');
    assert.ok(!di.split('\n').some((l) => l.trim() === 'attached_assets'));
  });
});

describe('bike ceramic coating content', () => {
  test('the SEO hook drives title/OG/JSON-LD from the service record', () => {
    const landing = read('client/src/pages/service-landing.tsx');
    assert.match(landing, /useSeoMeta/);
    assert.match(landing, /"@type": "Service"/);
    // The old inline <title>/<meta> JSX is inert in React 18 and must be gone.
    assert.ok(!landing.includes('<title>{service.metaTitle'));
  });
  test('car testimonials are hidden on the bike page only, and not deleted', () => {
    const landing = read('client/src/pages/service-landing.tsx');
    assert.match(landing, /TESTIMONIALS_SUPPRESSED = new Set<string>\(\['1-year-bike-ceramic-coating'\]\)/);
    assert.match(landing, /\{showTestimonials && service\.testimonials/);
    // The suppression must be presentation-only — no script may clear the column.
    for (const f of ['scripts/fix-service-content.mjs', 'scripts/set-service-card-images.mjs']) {
      assert.ok(!/testimonials\s*=/.test(read(f)), `${f} writes testimonials`);
    }
  });

  test('the content script never writes price, duration or discount', () => {
    const script = read('scripts/fix-service-content.mjs');
    const updates = [...script.matchAll(/update services set ([\s\S]*?)where/g)].map((m) => m[1]);
    for (const u of updates) {
      for (const forbidden of ['price', 'original_price', 'duration', 'discount', 'is_active', 'slug']) {
        assert.ok(!new RegExp(`\\b${forbidden}\\s*=`).test(u),
          `content script writes ${forbidden}`);
      }
    }
  });
});

/* -------------------------------------------------------------------- HTTP checks */

describe('HTTP', { skip: BASE ? false : 'set TEST_BASE_URL to run' }, () => {
  const SERVICE_IMAGES = [
    'car-polishing', 'headlight-restoration-both-lights',
    'exterior-detailing-hard-water-spot-removal', 'interior-detailing-service',
    'p91-full-ppf-hatchback', 'p91-full-ppf-suv', 'p91-full-ppf-sedan',
    'partial-ppf-hatchback', 'partial-ppf-suv', 'partial-ppf-sedan',
    'stek-full-car-sun-control-film', 'stek-windshield-sun-control-film',
    'windshield-glass-coating', 'windshield-glass-polishing',
  ];

  let services;
  before(async () => {
    services = await (await fetch(`${BASE}/api/services`)).json();
  });

  test('every service image is 200 image/webp, not index.html', async () => {
    for (const name of SERVICE_IMAGES) {
      const res = await fetch(`${BASE}/attached_assets/services/${name}.webp`);
      assert.equal(res.status, 200, `${name}: status ${res.status}`);
      assert.equal(res.headers.get('content-type'), 'image/webp', `${name}: wrong type`);
      const len = Number(res.headers.get('content-length'));
      assert.ok(len > 10000, `${name}: suspiciously small (${len} bytes)`);
    }
  });

  test('a missing asset returns 404 text/plain, not the SPA shell', async () => {
    const res = await fetch(`${BASE}/attached_assets/services/does-not-exist.webp`);
    assert.equal(res.status, 404);
    assert.ok(!(res.headers.get('content-type') || '').includes('text/html'));
  });

  test('the four CTA target services are active and resolvable', async () => {
    const targets = [
      ['interior-detailing-service', '43f050c6-488b-4657-9458-99d23364c72a', 'Interior Detailing Service'],
      ['windshield-glass-coating-new', 'c2517260-3e7e-4de1-9886-542fb5d7df8f', 'Windshield Glass Coating'],
      ['headlight-restoration-both', 'd7fae6bd-fbf4-445f-8faa-e67d8461fbdc', 'Headlight Restoration - Both Lights'],
      ['exterior-detailing-hard-water-new', 'd5e11a48-afe4-4757-9796-a98322ac5bf2', 'Exterior Detailing with Hard Water Spot Removal'],
    ];
    for (const [slug, id, title] of targets) {
      const row = services.find((s) => s.slug === slug);
      assert.ok(row, `${slug} is not in /api/services (inactive?)`);
      assert.equal(row.id, id, `${slug}: id drifted`);
      assert.equal(row.title.trim(), title, `${slug}: title drifted`);
    }
  });

  test('the legacy CTA slugs are NOT served (they are inactive)', () => {
    for (const dead of [
      'interior-deep-clean', 'glass-coating', 'headlight-restoration', 'premium-wash-detail',
    ]) {
      assert.ok(!services.some((s) => s.slug === dead), `${dead} unexpectedly active`);
    }
  });

  test('no two active services share an images[0]', () => {
    const seen = new Map();
    for (const s of services) {
      const img = s.images?.[0];
      if (!img) continue;
      assert.ok(!seen.has(img), `${s.title} shares an image with ${seen.get(img)}`);
      seen.set(img, s.title);
    }
  });

  test('the bike service reads as a bike service', () => {
    const bike = services.find((s) => s.slug === '1-year-bike-ceramic-coating');
    assert.ok(bike, 'bike service missing');
    assert.match(bike.title, /Bike/);
    assert.match(bike.metaTitle, /Bike/);
    assert.match(bike.metaDescription, /motorcycle/i);
    const blob = [bike.description, bike.heroTitle, bike.heroSubtitle, bike.whyChoose].join(' ');
    assert.ok(!/Audi/i.test(blob), 'Audi reference still present');
    assert.ok(!/Transform your car/i.test(blob), '"Transform your car" still present');
    assert.match(blob, /fuel tank/i);
    assert.match(blob, /fairing/i);
    assert.equal(bike.images[0], '/attached_assets/services/bike-ceramic-coating-1-year.webp');
  });

  test('the two STEK services have no dead before/after rows', () => {
    for (const slug of ['stek-suncontrol-films', 'stek-windsheild-suncontrol-films']) {
      const row = services.find((s) => s.slug === slug);
      assert.ok(row, `${slug} missing`);
      assert.deepEqual(row.beforeAfter, [], `${slug} still has before_after entries`);
    }
  });

  test('valid service routes render, invalid ones still return the SPA shell', async () => {
    const ok = await fetch(`${BASE}/service/car-polishing`);
    assert.equal(ok.status, 200);
    const bad = await fetch(`${BASE}/service/definitely-not-a-service`);
    assert.equal(bad.status, 200, 'SPA routes are client-rendered; the page shows the friendly state');
  });
});
