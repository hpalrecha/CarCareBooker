import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGES, pageFor } from "../packages/content/src/site/registry.ts";

test("every page has a unique absolute path, a title of 30-60 chars and a description of 110-160 chars", () => {
  const paths = new Set();
  for (const p of PAGES) {
    assert.match(p.path, /^\/[a-z0-9/-]*$/, p.path);
    assert.ok(!paths.has(p.path), `duplicate ${p.path}`);
    paths.add(p.path);
    assert.ok(p.title.length >= 30 && p.title.length <= 60, `${p.path} title ${p.title.length}`);
    assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.path} description ${p.description.length}`);
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("no page states an exact rupee price in its copy (ranges only)", () => {
  for (const p of PAGES) {
    const text = JSON.stringify(p.content);
    assert.doesNotMatch(text, /from ₹|₹\d{1,3}(,\d{3})+(?!\s*[–-])/, `${p.path} has an exact price`);
  }
});

test("no proof photo is an unverified installer clip", () => {
  for (const p of PAGES) assert.doesNotMatch(JSON.stringify(p.content), /p91-stek-|watermark/i, p.path);
});

test("pageFor finds home and PPF", () => {
  assert.equal(pageFor("/").path, "/");
  assert.equal(pageFor("/services/paint-protection-film").path, "/services/paint-protection-film");
});
