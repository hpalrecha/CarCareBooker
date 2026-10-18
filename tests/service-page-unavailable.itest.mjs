/**
 * /service/:slug must answer a failure on OUR side with 503, never with the noindex 404.
 *
 *   node --import tsx --experimental-test-module-mocks --test tests/service-page-unavailable.itest.mjs
 *
 * The handler used to call next() when the database lookup threw (or app.html was missing).
 * The request then reached the catch-all, which answers /service/... with 404.html: HTTP 404
 * and `noindex, follow`. So a transient DB error told Googlebot a real, sitemap-listed page
 * was gone. 503 + Retry-After is the temporary signal Google retries without deindexing.
 * A genuinely unknown or inactive slug must keep its 404 + noindex.
 *
 * Runs against a tiny fake build directory, so no `npm run build` is needed.
 */
import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";

const active = {
  id: "svc-1", slug: "ppf-suv", title: "PPF SUV",
  description: "Paint protection film for SUVs at P91 Car Care in Adugodi, Bangalore.",
  metaTitle: null, metaDescription: null, price: "2999.00", originalPrice: "5999.00",
  duration: 120, images: [], isActive: true, maxBookingsPerSlot: 3,
};
const inactive = { ...active, id: "svc-2", slug: "retired-service", isActive: false };

let lookupThrows = false;
const storage = {
  getServiceBySlug: async (slug) => {
    if (lookupThrows) throw new Error('relation "services" does not exist');
    return [active, inactive].find((s) => s.slug === slug);
  },
  getAllBusinessHours: async () => [],
};
// `namedExports`, not `exports`: Node 24.13 ignores an `exports` key here and mocks the module
// with no exports at all, so `storage` would be undefined inside the handler.
mock.module("../server/storage.ts", { namedExports: { storage } });

const SHELL =
  '<!doctype html><html><head><meta charset="utf-8" /></head><body><div id="root"></div></body></html>';
const NOT_FOUND =
  '<!doctype html><html><head><title>Page not found</title><meta name="robots" content="noindex, follow" /></head><body><div id="root"></div></body></html>';

function makeDist({ withAppShell }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "svc-unavail-"));
  fs.writeFileSync(path.join(dir, "index.html"), SHELL);
  fs.writeFileSync(path.join(dir, "404.html"), NOT_FOUND);
  if (withAppShell) fs.writeFileSync(path.join(dir, "app.html"), SHELL);
  return dir;
}

const servers = [];
const dirs = [];
let base, baseNoShell;
const realConsoleError = console.error;
const logged = [];

async function serve(dist) {
  const { serveStatic } = await import("../server/vite.ts");
  const app = express();
  serveStatic(app, dist);
  const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

before(async () => {
  // Capture (and silence) the handler's error log so the test can assert it was written.
  console.error = (...args) => { logged.push(args.map(String).join(" ")); };
  const withShell = makeDist({ withAppShell: true });
  const noShell = makeDist({ withAppShell: false });
  dirs.push(withShell, noShell);
  base = await serve(withShell);
  baseNoShell = await serve(noShell);
});

after(async () => {
  console.error = realConsoleError;
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});

const get = async (b, p) => {
  const res = await fetch(b + p);
  return { status: res.status, headers: res.headers, body: await res.text() };
};

test("an active service renders 200 with its own metadata (baseline)", async () => {
  lookupThrows = false;
  const r = await get(base, "/service/ppf-suv");
  assert.equal(r.status, 200);
  assert.match(r.body, /<title>/);
  assert.doesNotMatch(r.body, /noindex/);
});

test("a database error answers 503 + Retry-After, not the noindex 404", async () => {
  lookupThrows = true;
  logged.length = 0;
  try {
    const r = await get(base, "/service/ppf-suv");
    assert.equal(r.status, 503);
    assert.equal(r.headers.get("retry-after"), "120");
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(r.body, /noindex|Page not found/);
    assert.ok(logged.some((l) => /ppf-suv/.test(l) && /does not exist/.test(l)), "the error must be logged");
  } finally {
    lookupThrows = false;
  }
});

test("a missing app.html answers 503 for a real service, still 404 for an unknown one", async () => {
  const real = await get(baseNoShell, "/service/ppf-suv");
  assert.equal(real.status, 503);
  assert.equal(real.headers.get("retry-after"), "120");

  const unknown = await get(baseNoShell, "/service/does-not-exist");
  assert.equal(unknown.status, 404);
  assert.match(unknown.body, /noindex, follow/);
});

test("unknown and inactive slugs keep the 404 + noindex shell", async () => {
  lookupThrows = false;
  for (const p of ["/service/does-not-exist", "/service/retired-service"]) {
    const r = await get(base, p);
    assert.equal(r.status, 404, p);
    assert.match(r.body, /noindex, follow/, p);
  }
});
