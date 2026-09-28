/** Baseline security headers: present on every kind of response, HSTS only in production. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { securityHeaders } from '../server/middleware/security-headers.ts';

const build = (isProd) => {
  const app = express();
  app.use(securityHeaders(isProd));
  app.get('/page', (_req, res) => res.type('html').send('<p>hi</p>'));
  app.get('/api/x', (_req, res) => res.json({ ok: true }));
  app.use((_req, res) => res.status(404).send('nope'));
  return app;
};
const listen = (app) => new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });

describe('security headers', () => {
  let prod, dev;
  before(async () => { prod = await listen(build(true)); dev = await listen(build(false)); });
  after(() => { prod.close(); dev.close(); });
  const get = async (srv, p) => (await fetch(`http://127.0.0.1:${srv.address().port}${p}`));

  for (const path of ['/page', '/api/x', '/missing']) {
    test(`${path}: nosniff, referrer policy and frame protection`, async () => {
      const r = await get(prod, path);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(r.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
    });
  }

  test('HSTS in production: 180 days, no includeSubDomains, no preload', async () => {
    const h = (await get(prod, '/page')).headers.get('strict-transport-security');
    assert.equal(h, 'max-age=15552000');
    assert.ok(!/includeSubDomains|preload/i.test(h));
  });

  test('no HSTS outside production (local http must not pin the browser to https)', async () => {
    assert.equal((await get(dev, '/page')).headers.get('strict-transport-security'), null);
  });

  test('no Content-Security-Policy is introduced (it stays off for Razorpay)', async () => {
    assert.equal((await get(prod, '/page')).headers.get('content-security-policy'), null);
  });
});
