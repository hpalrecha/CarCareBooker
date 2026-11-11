/**
 * /ppf served over real HTTP: the real routes, the real serveStatic, and the built output.
 *
 *   npm run build && npm run test:integration
 *
 * The database is the only fake: it returns the six live PPF rows (tests/fixtures/ppf-six-records.json, captured from
 * public GET /api/services on 2026-11-11) plus the rest of a minimal catalogue. Nothing here touches a payment gateway,
 * a message service or a real database.
 *
 * WHAT IS PROVEN: the first response for /ppf (no JavaScript) already holds both tiers, both warranty terms and all
 * six prices, equal to the catalogue rows; /ppf stays self-canonical and indexable; the page degrades, rather than
 * breaks, when a row or the whole read is missing; and no other page or the sitemap changed.
 */
import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(repoRoot, 'dist', 'public');
const built = fs.existsSync(path.join(DIST, 'ppf', 'index.html'));
const six = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'fixtures', 'ppf-six-records.json'), 'utf8')).records;

const PRICES = {
  'ppf-hatchback': '₹50,000', 'ppf-sedan': '₹60,000', 'ppf-suv': '₹70,000',
  'ppf-premium-hatchback': '₹70,000', 'ppf-premium-sedan': '₹80,000', 'ppf-premium-suv': '₹90,000',
};

const ceramic = (slug, id) => ({
  id, slug, title: slug, description: 'Ceramic coating', price: '7500.00', originalPrice: '12000.00', duration: 1440,
  durationText: '36-48 hrs', whatIncluded: ['Coating'], faq: [], images: [], isActive: true, maxBookingsPerSlot: 3,
});
const rest = [ceramic('1-year-ceramic-coating', 'c-1'), ceramic('1-year-bike-ceramic-coating', 'c-2')];

const state = { services: [...six, ...rest], throwOnGetAll: false };

describe('/ppf served HTML', { skip: !built ? 'run `npm run build` first' : false }, () => {
  let server, base;

  before(async () => {
    const storage = {
      getAllServices: async () => { if (state.throwOnGetAll) throw new Error('simulated database failure'); return state.services; },
      getServiceBySlug: async (slug) => { if (state.throwOnGetAll) throw new Error('simulated database failure'); return state.services.find((s) => s.slug === slug); },
      getService: async (id) => state.services.find((s) => s.id === id),
      getSetting: async () => undefined,
      getAllCampaigns: async () => [],
      getAllBlackoutDates: async () => [],
      getBusinessHoursForDay: async () => undefined,
      getAllBusinessHours: async () => [],
      getBookingCountForSlot: async () => 0,
      getBooking: async () => undefined,
      getBookingByConfirmationToken: async () => undefined,
      getBookingByPaymentOrderId: async () => undefined,
      getBookingsByStatus: async () => [],
      getTimeSlot: async () => undefined,
      getAllPpfLeads: async () => [],
      getAdmin: async () => undefined,
    };
    class SlotFullError extends Error {}
    mock.module('../server/storage.ts', { exports: { storage, SlotFullError } });
    mock.module('../server/services/scheduler.ts', { exports: { schedulerService: { startReminderScheduler() {} } } });
    process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/none';
    process.env.SESSION_SECRET = 'ppf-packages-test-secret';
    process.env.NODE_ENV = 'test';
    process.env.PUBLIC_SITE_ORIGIN = 'https://p91carcare.com';
    const { registerRoutes } = await import('../server/routes.ts');
    const { serveStatic } = await import('../server/vite.ts');
    const app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    serveStatic(app, DIST);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => { if (server) await new Promise((r) => server.close(r)); });

  const get = async (p) => { const res = await fetch(base + p); return { status: res.status, html: await res.text() }; };
  /** The text inside <main>, scripts removed: what a crawler without JavaScript reads. */
  const mainText = (html) => (html.match(/<main[\s\S]*<\/main>/i) || [''])[0]
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

  test('the first response holds both tiers, both warranty terms and all six prices', async () => {
    state.services = [...six, ...rest]; state.throwOnGetAll = false;
    const { status, html } = await get('/ppf');
    assert.equal(status, 200);
    const text = mainText(html);
    assert.match(text, /Choose your PPF package/);
    assert.match(text, /Basic PPF: 5-year warranty/);
    assert.match(text, /Premium PPF: 7-year warranty/);
    for (const row of six) {
      const line = new RegExp(row.title.trim().replace(/[-]/g, '[-]') + '[^.]*');
      assert.ok(text.includes(row.title.trim()), row.slug);
      assert.ok(text.includes(PRICES[row.slug]), `${row.slug}: ${PRICES[row.slug]}`);
    }
    assert.equal((text.match(/₹70,000/g) || []).length >= 2, true, '₹70,000 is Basic SUV and Premium Hatchback');
  });

  test('every price in the HTML equals the catalogue row (changing a row changes the page)', async () => {
    state.services = [...six.map((r) => (r.slug === 'ppf-premium-suv' ? { ...r, price: '95000.00' } : r)), ...rest];
    const { html } = await get('/ppf');
    const text = mainText(html);
    assert.ok(text.includes('₹95,000'));
    assert.ok(!text.includes('₹90,000'));
    state.services = [...six, ...rest];
  });

  test('the section comes before the catalogue sections, inside <main>, with no previous price or discount label', async () => {
    const { html } = await get('/ppf');
    const main = (html.match(/<main[\s\S]*<\/main>/i) || [''])[0];
    const iPackages = main.indexOf('Choose your PPF package');
    assert.ok(iPackages > 0);
    assert.ok(iPackages < main.indexOf('Frequently asked questions'));
    const text = mainText(html);
    assert.ok(!/50% OFF|% OFF/i.test(text));
    assert.ok(!/same-day/i.test(text.slice(text.indexOf('Choose your PPF package'), text.indexOf('Frequently asked questions'))));
  });

  test('/ppf stays self-canonical, index,follow, with one H1 and the FAQ schema still present', async () => {
    const { html } = await get('/ppf');
    assert.match(html, /<link rel="canonical" href="https:\/\/p91carcare\.com\/ppf"/);
    assert.match(html, /<meta name="robots" content="index,follow"/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, /"@type":"FAQPage"/);
  });

  test('the whole /ppf response carries no withheld claim: not in the text, the FAQ, or any JSON-LD', async () => {
    state.services = [...six, ...rest]; state.throwOnGetAll = false;
    const { html } = await get('/ppf');
    assert.ok(!/self[-\s]?heal/i.test(html), 'no self-healing anywhere in the first response');
    assert.ok(!/manufactur|film or coating maker/i.test(html.replace(/<script[^>]*src=[^>]*><\/script>/g, '')), 'nothing says the manufacturer issues the warranty');
    assert.match(html, /What warranty comes with it\?[\s\S]{0,200}This package lists a 5-year warranty\. Written warranty terms provided at handover\./, 'FAQ answer keeps the period and uses the approved line');
    assert.match(html, /"text":"This package lists a 5-year warranty\. Written warranty terms provided at handover\."/, 'and so does the FAQPage JSON-LD');
    const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const faq = ld.find((b) => b['@type'] === 'FAQPage');
    assert.ok(faq, 'FAQPage JSON-LD is still present');
    assert.equal(faq.mainEntity.length, six[0].faq.length, 'every question is kept');
    assert.match(JSON.stringify(faq), /This package lists: Full body PPF coverage; 5-year warranty/);
    assert.match(mainText(html), /What's included Full body PPF coverage 5-year warranty/);
  });

  test('one missing row removes one price and nothing else', async () => {
    state.services = [...six.filter((r) => r.slug !== 'ppf-premium-sedan'), ...rest];
    const { status, html } = await get('/ppf');
    assert.equal(status, 200);
    const text = mainText(html);
    assert.ok(!text.includes('₹80,000'));
    assert.ok(text.includes('₹90,000') && text.includes('₹50,000'));
    state.services = [...six, ...rest];
  });

  test('a database failure still serves /ppf (200, canonical, hero text), without prices', async () => {
    state.throwOnGetAll = true;
    const { status, html } = await get('/ppf');
    state.throwOnGetAll = false;
    assert.equal(status, 200);
    assert.match(html, /<link rel="canonical" href="https:\/\/p91carcare\.com\/ppf"/);
    assert.match(mainText(html), /Paint Protection Film for Your Car/);
    assert.ok(!mainText(html).includes('Choose your PPF package'));
  });

  test('the ceramic landing pages are unchanged (no package section)', async () => {
    for (const p of ['/ceramic-coating/car', '/ceramic-coating/bike']) {
      const { status, html } = await get(p);
      assert.equal(status, 200, p);
      assert.ok(!mainText(html).includes('Choose your PPF package'), p);
    }
  });

  test('the six /service/ppf-* pages keep their /ppf canonical, and the sitemap lists /ppf once and none of the six', async () => {
    for (const row of six) {
      const { status, html } = await get('/service/' + row.slug);
      assert.equal(status, 200, row.slug);
      assert.match(html, /<link rel="canonical" href="https:\/\/p91carcare\.com\/ppf"/, row.slug);
      assert.ok(!/manufactur/i.test(html), `${row.slug}: the service page (HTML and FAQPage JSON-LD) does not name the manufacturer as the warranty issuer`);
      assert.match(html, /Written warranty terms provided at handover\./, row.slug);
    }
    const sm = (await get('/sitemap.xml')).html;
    assert.equal((sm.match(/<loc>https:\/\/p91carcare\.com\/ppf<\/loc>/g) || []).length, 1);
    assert.ok(!/\/service\/ppf-/.test(sm), 'no consolidated PPF page in the sitemap');
  });
});
