/**
 * Static guard: no unauthenticated debug or test route may be mounted by the server.
 *
 * Runs in `npm test` (no database, no network). The runtime proof, with the real route table and faked
 * storage, is tests/security-unauthenticated-endpoints.itest.mjs.
 *
 * Why: until this check existed, POST /api/test-payment-confirmation (marked any booking paid and sent a
 * WhatsApp confirmation), POST /api/test-whatsapp (sent WhatsApp templates to any number through the
 * business account) and POST /api/test-payment (echo) were live in production for months with no
 * authentication and no reference anywhere in the app. See INDEXING-INVESTIGATION-REPORT.md.
 *
 * What is checked: every route registration in server/**.ts whose path starts /api/test, /api/debug, /api/dev,
 * /api/tmp, /api/temp, /api/demo or /api/sandbox must not exist. If a genuine admin-only debug tool is ever
 * needed, mount it behind authenticateAdmin under /api/admin/ instead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function listTs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listTs(p));
    else if (/\.(ts|mts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

const ROUTE_RE = /\b(?:app|router)\s*\.\s*(?:get|post|put|patch|delete|all|use)\s*\(\s*(["'`])(\/api\/(?:test|debug|dev|tmp|temp|demo|sandbox)[^"'`]*)\1/gi;

test('no server file registers a /api/test*, /api/debug* or similar route', () => {
  const found = [];
  for (const file of listTs(path.join(repoRoot, 'server'))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(ROUTE_RE)) found.push(`${path.relative(repoRoot, file)}: ${m[2]}`);
  }
  assert.deepEqual(found, [], 'debug routes must not be mounted:\n' + found.join('\n'));
});

test('the guard itself matches the routes it was written for (so it cannot pass vacuously)', () => {
  const sample = `
    app.post("/api/test-payment", handler);
    app.post("/api/test-payment-confirmation", async (req, res) => {});
    app.post('/api/test-whatsapp', h);
    router.get(\`/api/debug/state\`, h);`;
  const hits = [...sample.matchAll(ROUTE_RE)].map((m) => m[2]);
  assert.deepEqual(hits, ['/api/test-payment', '/api/test-payment-confirmation', '/api/test-whatsapp', '/api/debug/state']);
});

test('no client, script or workflow in the repository calls the removed endpoints', () => {
  const needles = ['test-payment-confirmation', 'api/test-whatsapp', 'api/test-payment'];
  const roots = ['client/src', 'scripts', 'server', '.github'].map((p) => path.join(repoRoot, p)).filter((p) => fs.existsSync(p));
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
      if (!/\.(ts|tsx|js|mjs|json|yml|yaml|sh)$/.test(e.name)) continue;
      const src = fs.readFileSync(p, 'utf8');
      // The explanatory comments in server/routes.ts are allowed; a call or a route is not.
      for (const n of needles) {
        if (!src.includes(n)) continue;
        const code = src.split('\n').filter((l) => l.includes(n) && !/^\s*(\/\/|\*)/.test(l));
        if (code.length) hits.push(`${path.relative(repoRoot, p)}: ${code[0].trim().slice(0, 100)}`);
      }
    }
  };
  roots.forEach(walk);
  assert.deepEqual(hits, [], 'something still references a removed debug endpoint:\n' + hits.join('\n'));
});
