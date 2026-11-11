/**
 * Local STRUCTURAL validation of the JSON-LD in every prerendered page.
 *
 * WHAT THIS IS, AND IS NOT. It checks that the structured data is well formed and internally consistent: valid JSON,
 * the schema.org context, typed nodes, valid URLs and dates, no duplicate or conflicting entities, and the shape of
 * the types the site emits (BlogPosting, BreadcrumbList, FAQPage, AutoRepair, Offer). It is NOT Google's Rich Results
 * Test and NOT the schema.org validator, and passing it does not prove either would pass.
 *
 * Runs against dist/public after `npm run build` (skipped otherwise).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(repoRoot, 'dist', 'public');
const built = fs.existsSync(path.join(DIST, 'index.html'));

const KNOWN_TYPES = new Set([
  'BlogPosting', 'WebPage', 'Organization', 'ImageObject', 'BreadcrumbList', 'ListItem', 'AutoRepair', 'FAQPage',
  'Question', 'Answer', 'Service', 'Offer', 'AggregateOffer', 'City', 'PostalAddress', 'OpeningHoursSpecification',
  'ReserveAction', 'EntryPoint', 'ItemList', 'Event', 'Place', 'GeoCoordinates', 'ContactPoint', 'Brand', 'Product',
  'CollectionPage', 'WebSite', 'SearchAction', 'Person', 'LocalBusiness',
]);
const URL_KEYS = new Set(['url', 'image', 'item', 'sameAs', 'hasMap', 'urlTemplate', 'logo']);
const DATE_KEYS = new Set(['datePublished', 'dateModified', 'startDate', 'endDate']);

const typesOf = (n) => [].concat(n['@type'] ?? []);
function* nodes(v, pathStr = '') {
  if (Array.isArray(v)) { for (const [i, x] of v.entries()) yield* nodes(x, `${pathStr}[${i}]`); return; }
  if (v && typeof v === 'object') { yield [v, pathStr]; for (const [k, x] of Object.entries(v)) yield* nodes(x, `${pathStr}.${k}`); }
}
function walkStrings(v, key, out, pathStr = '') {
  if (typeof v === 'string') { out.push([key, v, pathStr]); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => walkStrings(x, key, out, `${pathStr}[${i}]`)); return; }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walkStrings(x, k, out, `${pathStr}.${k}`);
}

function pagesUnder(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['assets', 'attached_assets'].includes(e.name)) pagesUnder(f, out); }
    else if (e.name === 'index.html') out.push(f);
  }
  return out;
}

/** Returns a list of problems for one prerendered file. */
export function validatePage(html) {
  const problems = [];
  const blocks = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { blocks.push(JSON.parse(m[1])); } catch (e) { problems.push('invalid JSON: ' + e.message); }
  }
  const topTypes = {};
  const idTypes = new Map();
  for (const b of blocks) {
    for (const t of typesOf(b)) topTypes[t] = (topTypes[t] || 0) + 1;
    if (b['@context'] !== 'https://schema.org') problems.push(`top-level @context is ${JSON.stringify(b['@context'])}`);
    for (const [n, p] of nodes(b)) {
      if (n['@type'] !== undefined) {
        const ts = typesOf(n);
        if (!ts.length || ts.some((t) => typeof t !== 'string' || !t)) problems.push(`${p}: bad @type`);
        for (const t of ts) if (!KNOWN_TYPES.has(t)) problems.push(`${p}: unrecognised type ${t}`);
      }
      if (typeof n['@id'] === 'string' && n['@type'] !== undefined) {
        const prev = idTypes.get(n['@id']);
        const now = typesOf(n).sort().join('+');
        if (prev && prev.types !== now) problems.push(`@id ${n['@id']} used by conflicting types ${prev.types} and ${now}`);
        else if (prev && prev.p !== p && ['AutoRepair', 'LocalBusiness', 'Organization'].some((t) => typesOf(n).includes(t))) problems.push(`@id ${n['@id']} defined twice`);
        idTypes.set(n['@id'], { types: now, p });
      }
    }
    const strings = []; walkStrings(b, '', strings);
    for (const [k, v, p] of strings) {
      if ((URL_KEYS.has(k) || (k === '@id' && /^https?:/.test(v))) && /^https?:/.test(v)) {
        if (/\s/.test(v)) problems.push(`${p}: URL contains whitespace: ${v}`);
        try { new URL(v); } catch { problems.push(`${p}: not a URL: ${v}`); }
      }
      if (DATE_KEYS.has(k) && !/^\d{4}-\d{2}-\d{2}(T[\d:.+\-Z]+)?$/.test(v)) problems.push(`${p}: not an ISO date: ${v}`);
    }
    for (const [n, p] of nodes(b)) {
      const ts = typesOf(n);
      if (ts.includes('BlogPosting')) {
        for (const k of ['headline', 'datePublished', 'mainEntityOfPage', 'author', 'publisher']) if (!n[k]) problems.push(`${p}: BlogPosting missing ${k}`);
        if (typeof n.headline === 'string' && n.headline.length > 110) problems.push(`${p}: headline over 110 characters`);
        if (!n.author?.name) problems.push(`${p}: author has no name`);
        if (!typesOf(n.publisher ?? {}).includes('Organization')) problems.push(`${p}: publisher is not an Organization`);
        if (!n.publisher?.name || !n.publisher?.logo?.url) problems.push(`${p}: publisher needs a name and a logo URL`);
      }
      if (ts.includes('BreadcrumbList')) {
        const items = n.itemListElement || [];
        if (!items.length) problems.push(`${p}: empty BreadcrumbList`);
        items.forEach((it, i) => {
          if (it.position !== i + 1) problems.push(`${p}: breadcrumb position ${it.position} at index ${i}`);
          if (!it.name || !it.item) problems.push(`${p}: breadcrumb item needs name and item`);
        });
      }
      if (ts.includes('FAQPage')) {
        for (const q of n.mainEntity || []) if (!q.name || !q.acceptedAnswer?.text) problems.push(`${p}: FAQ question without name or answer text`);
        if (!(n.mainEntity || []).length) problems.push(`${p}: FAQPage without questions`);
      }
      if (ts.includes('Offer') && !ts.includes('AggregateOffer')) {
        if (n.price !== undefined && !/^\d+(\.\d+)?$/.test(String(n.price))) problems.push(`${p}: Offer price not numeric: ${n.price}`);
        if (n.price !== undefined && !/^[A-Z]{3}$/.test(n.priceCurrency || '')) problems.push(`${p}: Offer priceCurrency`);
      }
      if (ts.includes('AutoRepair') && n.address && !n.address.streetAddress) problems.push(`${p}: AutoRepair address has no street`);
      if (ts.includes('AutoRepair') && !n.address) problems.push(`${p}: AutoRepair without an address`);
    }
  }
  for (const [t, c] of Object.entries(topTypes)) {
    if (c > 1 && ['BreadcrumbList', 'BlogPosting', 'FAQPage', 'AutoRepair', 'Service'].includes(t)) problems.push(`${c} top-level ${t} blocks (duplicate)`);
  }
  return problems;
}

describe('JSON-LD structure of every prerendered page', { skip: !built ? 'run `npm run build` first' : false }, () => {
  test('there are pages to check', () => {
    assert.ok(pagesUnder(DIST).length > 20);
  });

  test('every page passes the structural checks (no known exceptions)', () => {
    const failures = [];
    for (const f of pagesUnder(DIST)) {
      const rel = path.relative(DIST, f).replace(/\\/g, '/');
      for (const problem of validatePage(fs.readFileSync(f, 'utf8'))) failures.push(`${rel}: ${problem}`);
    }
    assert.deepEqual(failures, []);
  });

  test('the checker flags one @id naming two types (the BlogPosting / WebPage conflict that was fixed)', () => {
    const wrap = (j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`;
    const url = 'https://p91carcare.com/blog/x';
    const conflict = wrap({ '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, headline: 'h',
      datePublished: '2026-01-01', author: { name: 'a' }, publisher: { '@type': 'Organization', name: 'P', logo: { url: 'https://p91carcare.com/l.png' } } });
    assert.match(validatePage(conflict).join(), /conflicting types BlogPosting and WebPage/);
    const fixed = wrap({ '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url + '#article', mainEntityOfPage: { '@type': 'WebPage', '@id': url }, headline: 'h',
      datePublished: '2026-01-01', author: { name: 'a' }, publisher: { '@type': 'Organization', name: 'P', logo: { url: 'https://p91carcare.com/l.png' } } });
    assert.deepEqual(validatePage(fixed), []);
  });

  test('the checker catches the defects it exists for', () => {
    const wrap = (j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`;
    const bad = wrap({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'h', datePublished: '2026-01-01', mainEntityOfPage: 'x', author: { name: 'a' },
      publisher: { '@type': 'AutoRepair', '@id': 'https://p91carcare.com/#business', name: 'P91' } });
    const problems = validatePage(bad).join(' | ');
    assert.match(problems, /publisher is not an Organization/);
    assert.match(problems, /publisher needs a name and a logo URL/);
    assert.match(validatePage(wrap({ '@context': 'https://schema.org', '@type': 'AutoRepair', name: 'x' })).join(), /AutoRepair without an address/);
    assert.match(validatePage(wrap({ '@context': 'https://schema.org', '@type': 'Organization', url: 'https://p91carcare.com/a b.png' })).join(), /whitespace/);
    assert.match(validatePage(wrap({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }) + wrap({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] })).join(), /duplicate/);
  });
});
