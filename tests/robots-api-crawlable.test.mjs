/**
 * robots.txt must not block the public JSON API.
 *
 * Found in Search Console (2026-10-12): only 2 of 42 sitemap URLs indexed. The pages render
 * their content client-side from /api/services, /api/business-hours, /api/public-config etc.,
 * and robots.txt carried `Disallow: /api/`. Googlebot's renderer obeys robots.txt for
 * sub-resources, so every /service/:slug page rendered as a spinner or "We couldn't find that
 * service" for Google — a Soft 404 — however good the prerendered copy was.
 *
 * The API is now crawlable and every /api response carries `X-Robots-Tag: noindex`, so the
 * JSON itself never lands in the index. Only /api/admin/ stays disallowed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('robots.txt does not disallow the public /api/ tree', () => {
  const routes = read('server/routes.ts');
  assert.doesNotMatch(routes, /`Disallow: \/api\/\\n`/);
  assert.match(routes, /`Disallow: \/api\/admin\/\\n`/);
});

test('every /api response is marked noindex', () => {
  const index = read('server/index.ts');
  assert.match(index, /app\.use\("\/api",[\s\S]{0,120}X-Robots-Tag", "noindex"/);
});
