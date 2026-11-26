import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LINK_MAP } from "../packages/content/src/site/link-map.ts";
import { OLD_URL_REDIRECTS, NON_REGISTRY_ROUTES, redirectTarget } from "../packages/content/src/site/redirects.ts";
import { PAGES } from "../packages/content/src/site/registry.ts";
import { isGonePath } from "../packages/domain/src/spam-paths.ts";

const LIVE = new Set([...PAGES.map((p) => p.path), ...NON_REGISTRY_ROUTES]);

/** Old URLs from the redirect plan (column 1), split on "|"; patterns and "(new)" rows are skipped. */
const CSV_PATHS = fs.readFileSync(new URL("../docs/seo-plan/04-redirect-and-url-map.csv", import.meta.url), "utf8")
  .split(/\r?\n/).slice(1)
  .map((line) => (line.startsWith('"') ? line.slice(1, line.indexOf('"', 1)) : line.split(",")[0]))
  .flatMap((cell) => cell.split("|").map((s) => s.trim()))
  .filter((s) => /^\/[A-Za-z0-9./-]*$/.test(s));

/** Old blog posts (blog-posts.ts, read as text: that module is not importable by plain Node). */
const OLD_BLOG_SLUGS = [...fs.readFileSync(new URL("../packages/content/src/blog-posts.ts", import.meta.url), "utf8")
  .matchAll(/^\s{4}slug: "([a-z0-9-]+)"/gm)].map((m) => m[1]);

test("the CSV and blog lists were read", () => {
  assert.ok(CSV_PATHS.length >= 15, CSV_PATHS.join(" "));
  assert.ok(OLD_BLOG_SLUGS.length >= 8, OLD_BLOG_SLUGS.join(" "));
});

test("every redirect is permanent, one hop, to a live page, and never from /service/*", () => {
  const sources = new Set();
  for (const r of OLD_URL_REDIRECTS) {
    assert.equal(r.permanent, true, r.source);
    assert.ok(!sources.has(r.source), `duplicate ${r.source}`);
    sources.add(r.source);
    assert.ok(!r.source.startsWith("/service/"), `${r.source}: booking pages stay on the API`);
    assert.ok(LIVE.has(r.destination), `${r.source} -> ${r.destination} is not a live page`);
    assert.equal(redirectTarget(r.destination), null, `${r.destination} redirects again (chain)`);
  }
});

test("every LINK_MAP entry outside /service/* redirects to its mapped page", () => {
  for (const [from, to] of Object.entries(LINK_MAP)) {
    if (from.startsWith("/service/")) assert.equal(redirectTarget(from), null, from);
    else assert.equal(redirectTarget(from), to, from);
  }
});

test("every old blog post, product page and blog category redirects to a live page", () => {
  for (const slug of OLD_BLOG_SLUGS) {
    const to = redirectTarget(`/blog/${slug}`);
    assert.ok(to && LIVE.has(to), `/blog/${slug} -> ${to}`);
  }
  for (const b of ["stek", "nasiol", "p91-premium-ppf"]) assert.equal(redirectTarget(`/products/${b}`), `/brands/${b}`);
  for (const c of ["glass-film", "paint-care", "protection"]) assert.equal(redirectTarget(`/blog/category/${c}`), "/guides");
});

test("every old URL in the redirect plan CSV ends on a live page in one hop, is gone, or stays on the API", () => {
  for (const p of CSV_PATHS) {
    if (p.startsWith("/service/")) { assert.equal(redirectTarget(p), null, `${p} must not be redirected`); continue; }
    if (p === "/this-does-not-exist") { assert.equal(redirectTarget(p), null); assert.ok(!LIVE.has(p)); continue; }
    if (isGonePath(p)) { assert.equal(redirectTarget(p), null, `${p} is 410, not redirected`); continue; }
    const to = redirectTarget(p) ?? p;
    assert.ok(LIVE.has(to), `${p} -> ${to} is not a live page`);
    assert.equal(redirectTarget(to), null, `${p} chains`);
  }
});

test("booking pages are never redirected, whatever the slug", () => {
  for (const p of ["/service/ppf-hatchback", "/service/ppf-premium-suv", "/service/1-year-ceramic-coating", "/service/glass-polishing", "/booking-confirmation/12"]) {
    assert.equal(redirectTarget(p), null, p);
  }
});

test("410 paths: spam slugs, /le48 and the ended offer, slash or not; real pages are not gone", () => {
  for (const p of ["/le48", "/le48/", "/offer/de-dhana-dhan", "/offer/de-dhana-dhan/", "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765"]) assert.equal(isGonePath(p), true, p);
  for (const p of LIVE) assert.equal(isGonePath(p), false, p);
  for (const r of OLD_URL_REDIRECTS) assert.equal(isGonePath(r.source), false, r.source);
});
