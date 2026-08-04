/**
 * Creates the n8n PostgreSQL credential for the LIVE CarCareBooker database.
 *
 * Reads the connection details from CARCARE_LIVE_DATABASE_URL and posts them to the n8n
 * credentials API. Nothing sensitive is printed: only the resulting credential id/name,
 * which are identifiers, not secrets.
 *
 *   node scripts/ensure-n8n-pg-credential.mjs
 */
const dbUrl = process.env.CARCARE_LIVE_DATABASE_URL;
const apiKey = (process.env.N8N_API_KEY || '').replace(/^"|"$/g, '');
if (!dbUrl || !apiKey) { console.error('need CARCARE_LIVE_DATABASE_URL and N8N_API_KEY'); process.exit(1); }

const u = new URL(dbUrl);
const body = {
  name: 'CarCareBooker Live DB (poller)',
  type: 'postgres',
  data: {
    host: u.hostname,
    database: u.pathname.replace(/^\//, '').split('?')[0],
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    port: Number(u.port || 5432),
    ssl: 'require',
    allowUnauthorizedCerts: false,
    maxConnections: 5,
  },
};

const res = await fetch('https://n8n.plus91inc.in/api/v1/credentials', {
  method: 'POST',
  headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(30000),
});
const text = await res.text();
console.log('  HTTP', res.status);
try {
  const j = JSON.parse(text);
  if (j.id) {
    console.log('  ✅ credential created');
    console.log('  id  :', j.id);
    console.log('  name:', j.name);
    console.log('  type:', j.type);
    console.log('  host:', u.hostname, '| database:', body.data.database, '| ssl: require');
  } else {
    console.log('  response:', JSON.stringify(j).slice(0, 300));
  }
} catch {
  console.log('  response:', text.slice(0, 300));
}
