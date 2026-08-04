// Full image audit of all 17 active services against the local built server (which
// serves the updated DB + new static-404 routing). Prints the required table.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

// Target: default local built server; set AUDIT_BASE=https://p91carcare.com for production.
const BASE = process.env.AUDIT_BASE || 'http://localhost:5090';
const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });

const collect = (r) => {
  const out = [];
  for (const f of ['images', 'before_after', 'process', 'gallery']) {
    let v = r[f]; if (!v) continue;
    const walk = (n) => {
      if (!n) return;
      if (typeof n === 'string') { if (/\.(png|jpe?g|webp|avif|gif)/i.test(n) || n.includes('/objects/')) out.push({ field: f, url: n }); return; }
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (typeof n === 'object') Object.values(n).forEach(walk);
    };
    walk(v);
  }
  return out;
};

const check = async (u) => {
  const url = u.startsWith('http') ? u : BASE + (u.startsWith('/') ? u : '/' + u);
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    return { status: r.status, ct, realImage: ct.startsWith('image/') || ct === 'application/octet-stream' };
  } catch (e) { return { status: 'ERR', ct: String(e.message).slice(0, 20), realImage: false }; }
};

const rows = (await pool.query('select title, images, before_after, process, gallery from services where is_active=true order by title')).rows;
await pool.end();

let anyHtml = false, anyBrokenNoFallback = false;
const STEK = /stek/i;
console.log('SERVICE'.padEnd(38) + 'IMG STATUS         RESULT');
console.log('-'.repeat(78));
for (const r of rows) {
  const imgs = collect(r);
  if (!imgs.length) {
    console.log(`${r.title.trim().slice(0, 37).padEnd(38)}(no image)         fallback/placeholder`);
    continue;
  }
  for (const { field, url } of imgs) {
    const c = await check(url);
    const html = c.ct === 'text/html';
    if (html) anyHtml = true;
    const result = c.realImage ? 'REAL IMAGE' : (html || c.status === 404 ? 'FALLBACK (broken file)' : 'other');
    const isStek = STEK.test(r.title);
    if ((html || c.status === 404) && !isStek) anyBrokenNoFallback = true;
    console.log(`${r.title.trim().slice(0, 37).padEnd(38)}[${String(c.status).padEnd(3)} ${c.ct.padEnd(12)}] ${result}   ${field}:${url.slice(-28)}`);
  }
}
console.log('\n' + '='.repeat(78));
console.log('any request returned text/html :', anyHtml ? 'YES ⚠' : 'NO ✅');
console.log('broken (non-STEK, not fallback):', anyBrokenNoFallback ? 'YES ⚠' : 'NO ✅');
console.log('STEK services intentionally show the branded fallback placeholder.');
