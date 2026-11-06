/**
 * Read-only watchdog for the live site (https://p91carcare.com). Run it on a schedule and
 * whenever Search Console shows something odd. It changes nothing and needs no credentials.
 *
 *   node scripts/seo-monitor.mjs                 check, exit 1 if anything needs attention
 *   node scripts/seo-monitor.mjs --only=indexing   daily: sitemap, canonicals, noindex, redirects, robots, API
 *   node scripts/seo-monitor.mjs --only=spam       weekly: spam URLs, cloaking, injected markup, link hosts
 *   node scripts/seo-monitor.mjs --write-baseline  record the current sitemap, link hosts and page
 *                                                  fingerprints as the reviewed, known-good state
 *   node scripts/seo-monitor.mjs --origin=https://staging.example   check another origin
 *
 * What it checks (each maps to something that went wrong or could):
 *   1. Spam URLs from Search Console still answer 410 or 404, never 200 and never a redirect.
 *   2. A made-up spam-shaped URL and a made-up normal URL are not answered 200.
 *   3. Sitemap: every entry is 200, not redirected, self-canonical, not noindex. A URL that is not
 *      in the baseline is reported as NEW (somebody added a page or the sitemap was injected).
 *   4. Cloaking: each page is fetched as a browser, as Googlebot and with a Google Spain referrer;
 *      the visible HTML must be identical. Hacked sites often show spam only to crawlers.
 *   5. Injection markers in every page: hidden links, iframes, obfuscated script loaders, spam
 *      keywords, and links to hosts that are not in the baseline allowlist.
 *   6. Redirects (http, www, /index.html), robots.txt, and the public API noindex header.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = path.join(here, 'seo-monitor-baseline.json');
const args = process.argv.slice(2);
const WRITE = args.includes('--write-baseline');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '--only=all').slice(7);
if (!['all', 'indexing', 'spam'].includes(ONLY)) throw new Error('--only must be all, indexing or spam');
if (WRITE && ONLY !== 'all') throw new Error('--write-baseline needs the full run (no --only)');
const RUN_SPAM = ONLY !== 'indexing'; // spam URLs, cloaking, injected markup, link hosts (weekly)
const RUN_INDEX = ONLY !== 'spam'; // sitemap, canonicals, noindex, redirects, robots, API (daily)
const ORIGIN = (args.find((a) => a.startsWith('--origin=')) || '--origin=https://p91carcare.com').slice(9);

const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UA_GOOGLEBOT =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

// The 22 foreign URLs Search Console reported as Soft 404 (2026-11-05 export).
const SPAM_PATHS = [
  '/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439/',
  '/Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-125889/',
  '/PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/',
  '/2015H-Touring-Windscreen-Smoke-F-650Gs-G650Gs-480098/',
  '/Magnu00e9tico-De-77-Mm-Convierta-El-Filtro-De-Rosca-De-77-Mm-En-965275/',
  '/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/',
  '/16-Colores-30-50cm-Cubo-LED-Resistente-A-La-Intemperie-Y-851666/',
  '/Metales-Profesional-Para-Adultos-Bobina-De-Bu00fasqueda-416517/',
  '/Lavabo-Mu00e1rmol-Mobiliario-Para-Cuarto-De-Bau00f1o-Grifos-555431/',
  '/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762/',
  '/CBR650R-CBR650-2019-2020-Preto-Moto-Bicicleta-Windshield-303943/',
  '/Double-Din-11-Bluetooth-Negro-Talla-U00fanica-Negro-613689/',
  '/Skecten-Set-De-2-Sillas-De-Comedor-Tapizada-En-Polipiel-Para-960752/',
  '/De-Corte-De-Diamante-300-Mm-Disco-De-Diamante-Hu00famedo-O-Seco-884110/',
  '/Estructuras-Hinchables-MXTXW-086-20-quot-Diu00e1metro-899830/',
  '/6-Mois-2-en-1-Tapis-De-Jeux-Bebe-Activitu00e9s-96cm-Tapis-349429/',
  '/Fotogru00e1fico-Mate-Tarjeta-De-Papel-Para-Impresiu00f3n-De-708155/',
  '/De-Escalada-De-U00c1rboles-De-Acero-Inoxidable-Con-2-Engranajes-536551/',
  '/M12-Lens-Mount-Arduino-Raspberry-Pi-NodeMCU-IoT-967449/',
  '/Fajas-Lumbares-Ortopu00e9dicas-Farmacia-980412/',
  '/Regletas-Enchufes-Regleta-Vertical-4000W-16A-Torre-Enchufes-144574/',
  '/Rubi-Peine-Acero-28-Cm-8-X-8-75957-12-ESPATULA-PEINE-ACERO-322916/',
  '/le48',
];

const SPAM_WORDS =
  /\b(viagra|cialis|casino|poker|betting|slot gacor|togel|escort|porn|xxx|payday loan|replica watches|cheap nfl|essay writing|crypto giveaway|judi)\b/i;

const alerts = [];
const notes = [];
const alert = (m) => alerts.push(m);

async function get(url, { ua = UA_BROWSER, referer, redirect = 'manual', method = 'GET' } = {}) {
  const headers = { 'user-agent': ua };
  if (referer) headers.referer = referer;
  // Retry transient network errors (resets, timeouts); a real outage still fails after 3 tries.
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers, redirect, method, signal: AbortSignal.timeout(25000) });
      const body = method === 'HEAD' ? '' : await res.text();
      return { status: res.status, headers: res.headers, body, location: res.headers.get('location') };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error(`Request failed after 3 tries: ${url} (${lastErr?.cause?.code || lastErr?.message})`);
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
const state = { sitemap: [], hosts: new Set(), fingerprints: {} };

// ---- 1 + 2: spam and invented URLs --------------------------------------------------------
if (RUN_SPAM) for (const p of SPAM_PATHS) {
  const r = await get(ORIGIN + p);
  if (r.status !== 410 && r.status !== 404) alert(`SPAM URL not gone: ${r.status} ${p}${r.location ? ' -> ' + r.location : ''}`);
}
if (RUN_SPAM) for (const p of ['/Zapatillas-Running-Hombre-Oferta-Verano-123456', '/this-page-should-never-exist-' + Date.now()]) {
  const r = await get(ORIGIN + p);
  if (r.status === 200 || (r.status >= 300 && r.status < 400)) alert(`Unknown URL answers ${r.status}, expected 404/410: ${p}`);
}

// ---- 3: sitemap ----------------------------------------------------------------------------
const sm = await get(ORIGIN + '/sitemap.xml');
if (sm.status !== 200) alert(`sitemap.xml status ${sm.status}`);
const locs = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
if (locs.length === 0) alert('sitemap.xml has no <loc> entries');
state.sitemap = [...locs].sort();
if (baseline && RUN_INDEX) {
  for (const u of locs) if (!baseline.sitemap.includes(u)) alert(`NEW sitemap URL not in baseline (review it): ${u}`);
  for (const u of baseline.sitemap) if (!locs.includes(u)) alert(`Sitemap URL MISSING vs baseline: ${u}`);
} else if (!baseline) notes.push('No baseline yet: run with --write-baseline after reviewing this output.');

const canonicalOf = (html) => (html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0].match(/href=["']([^"']+)["']/i) || [])[1];
const robotsMeta = (html) => (html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0].match(/content=["']([^"']+)["']/i) || [])[1] || '';
// Visible HTML only: strip scripts/styles/comments and whitespace so analytics or nonce noise cannot cause a diff.
const normalise = (html) =>
  html
    // Cloudflare email obfuscation re-encodes the address on every request; not a real difference.
    .replace(/data-cfemail="[0-9a-f]+"/gi, '')
    .replace(/\/cdn-cgi\/l\/email-protection#[0-9a-f]+/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

const pages = [...new Set([ORIGIN + '/', ...locs])];
for (const url of pages) {
  const b = await get(url);
  if (b.status !== 200) {
    alert(`Page not 200: ${b.status} ${url}`);
    continue;
  }
  if (RUN_INDEX && locs.includes(url)) {
    const canon = canonicalOf(b.body);
    if (canon !== url) alert(`Canonical mismatch on ${url}: ${canon || '(none)'}`);
    if (/noindex/i.test(robotsMeta(b.body)) || /noindex/i.test(b.headers.get('x-robots-tag') || '')) alert(`Sitemap URL is noindex: ${url}`);
  }

  if (!RUN_SPAM) continue;

  // 4: cloaking
  const g = await get(url, { ua: UA_GOOGLEBOT });
  const es = await get(url, { referer: 'https://www.google.es/' });
  const hb = hash(normalise(b.body));
  if (hash(normalise(g.body)) !== hb) alert(`CLOAKING? Googlebot sees different HTML than a browser: ${url}`);
  if (hash(normalise(es.body)) !== hb) alert(`CLOAKING? Google-referred visitor sees different HTML: ${url}`);
  state.fingerprints[url] = hb;
  if (baseline && baseline.fingerprints[url] && baseline.fingerprints[url] !== hb)
    notes.push(`Content changed since baseline (normal if you deployed): ${url}`);

  // 5: injection markers
  const html = b.body;
  if (/<iframe\b/i.test(html)) alert(`iframe found: ${url}`);
  if (/eval\s*\(\s*(atob|unescape|String\.fromCharCode)|document\.write\s*\(\s*unescape|fromCharCode\.apply/i.test(html)) alert(`Obfuscated script pattern: ${url}`);
  if (/<a\b[^>]*style=["'][^"']*(display\s*:\s*none|visibility\s*:\s*hidden|left\s*:\s*-\d{3,})/i.test(html)) alert(`Hidden link: ${url}`);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const kw = text.match(SPAM_WORDS);
  if (kw) alert(`Spam keyword "${kw[0]}" in visible text: ${url}`);
  for (const m of html.matchAll(/(?:href|src|action)=["'](https?:)?\/\/([^/"'?#:]+)/gi)) state.hosts.add(m[2].toLowerCase());
}

if (baseline && RUN_SPAM) {
  for (const h of state.hosts) if (!baseline.hosts.includes(h)) alert(`Link/asset host not in baseline allowlist: ${h}`);
} else if (!baseline && RUN_SPAM) notes.push(`Hosts seen: ${[...state.hosts].sort().join(', ')}`);

// ---- 6: redirects, robots, API --------------------------------------------------------------
const expectRedirect = async (from, to) => {
  const r = await get(from);
  const target = r.location ? new URL(r.location, from).href : '';
  if (r.status !== 301 || target !== to) alert(`Redirect ${from}: got ${r.status} ${r.location || ''}, expected 301 ${to}`);
};
if (RUN_INDEX && ORIGIN === 'https://p91carcare.com') {
  await expectRedirect('http://p91carcare.com/', 'https://p91carcare.com/');
  await expectRedirect('https://www.p91carcare.com/', 'https://p91carcare.com/');
}
if (RUN_INDEX) await expectRedirect(ORIGIN + '/index.html', ORIGIN + '/');
if (RUN_INDEX) await expectRedirect(ORIGIN + '/services/', ORIGIN + '/services');

const robots = RUN_INDEX ? await get(ORIGIN + '/robots.txt') : { body: '' };
if (RUN_INDEX) for (const need of ['Allow: /', 'Disallow: /admin/', 'Disallow: /api/admin/', 'Disallow: /booking-confirmation/', 'Sitemap: https://p91carcare.com/sitemap.xml'])
  if (!robots.body.includes(need)) alert(`robots.txt missing "${need}"`);
if (/^\s*Disallow:\s*\/\s*$/m.test(robots.body)) alert('robots.txt blocks the whole site');
if (RUN_INDEX) for (const line of robots.body.split('\n')) if (/^\s*Disallow:\s*\/api\/?\s*$/i.test(line)) alert('robots.txt blocks the public API');

const api = RUN_INDEX ? await get(ORIGIN + '/api/services') : null;
if (api && api.status !== 200) alert(`/api/services status ${api.status}`);
if (api && !/noindex/i.test(api.headers.get('x-robots-tag') || '')) alert('/api/services lost X-Robots-Tag: noindex');

// ---- output ---------------------------------------------------------------------------------
if (WRITE) {
  fs.writeFileSync(
    BASELINE,
    JSON.stringify({ writtenAt: new Date().toISOString(), sitemap: state.sitemap, hosts: [...state.hosts].sort(), fingerprints: state.fingerprints }, null, 2) + '\n',
  );
  console.log(`Baseline written: ${state.sitemap.length} sitemap URLs, ${state.hosts.size} hosts.`);
  console.log('Hosts:', [...state.hosts].sort().join(', '));
}
console.log(`Mode: ${ONLY}. Checked ${pages.length} pages on ${ORIGIN}${RUN_SPAM ? `, ${SPAM_PATHS.length} spam URLs` : ''}`);
for (const n of notes) console.log('note:', n);
if (alerts.length) {
  console.log(`\n${alerts.length} ALERT(S):`);
  for (const a of alerts) console.log(' -', a);
  process.exit(1);
}
console.log('OK: no alerts.');
