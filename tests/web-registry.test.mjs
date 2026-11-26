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

test("no page carries a price of any kind (owner, 26 Nov 2026: no prices on the new site)", () => {
  for (const p of PAGES) {
    const text = JSON.stringify(p.content);
    assert.doesNotMatch(text, /₹\s?\d/, `${p.path} has a rupee figure`);
    assert.doesNotMatch(text, /\{range\}|rangeRows|rangeNote/, `${p.path} still carries a price-range slot`);
  }
});

test("no proof photo is an unverified installer clip", () => {
  for (const p of PAGES) assert.doesNotMatch(JSON.stringify(p.content), /p91-stek-|watermark/i, p.path);
});

test("pageFor finds home and PPF", () => {
  assert.equal(pageFor("/").path, "/");
  assert.equal(pageFor("/services/paint-protection-film").path, "/services/paint-protection-film");
});

// ── Plan 2b: link map, owner decisions (26 Nov 2026), reviews ──
import { LINK_MAP, remapPath } from "../packages/content/src/site/link-map.ts";
import { VERIFIED_REVIEWS } from "../packages/content/src/reviews.ts";
import { impliesManufacturerWarranty } from "../packages/content/src/warranty-wording.ts";

/** Every internal link target in a page's content: markdown `](/x)` and `"href":"/x"`. */
function linkTargets(content) {
  const text = JSON.stringify(content);
  const md = [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
  const hrefs = [...text.matchAll(/"href":"(\/[^"]*)"/g)].map((m) => m[1]);
  return [...md, ...hrefs].map((h) => h.split(/[#?]/)[0]);
}

test("no page links to an old URL (every target is already a new path)", () => {
  const oldKeys = new Set(Object.keys(LINK_MAP));
  for (const p of PAGES) {
    for (const href of linkTargets(p.content)) {
      assert.ok(!oldKeys.has(href), `${p.path} links to old ${href}`);
      assert.equal(remapPath(href), href, `${p.path} links to old ${href}`);
    }
  }
});

test("no page carries a withheld claim, a manufacturer's warranty or rating markup", () => {
  for (const p of PAGES) {
    const text = JSON.stringify(p.content);
    for (const bad of [/manufacturer(?:'|’)s warranty/i, /100\s*%\s*safe/i, /permanent bond/i, /certified technician/i, /AggregateRating/]) {
      assert.doesNotMatch(text, bad, `${p.path} contains ${bad}`);
    }
    assert.ok(!impliesManufacturerWarranty(text), `${p.path} implies a manufacturer's warranty`);
  }
});

test("every quoted review exists in VERIFIED_REVIEWS and is never the one with a price", () => {
  const names = new Set(VERIFIED_REVIEWS.map((r) => r.name));
  for (const p of PAGES) {
    for (const n of p.content?.reviewNames ?? []) {
      assert.ok(names.has(n), `${p.path}: no verified review by ${n}`);
      assert.notEqual(n, "Fazil Ahmed", `${p.path} quotes the review with an exact price`);
    }
  }
});

test("no page shows or asks for a star rating or a review count", () => {
  for (const p of PAGES) assert.doesNotMatch(JSON.stringify(p.content), /Google rating|review count|★|\/ ?5(\.0)? stars?/i, p.path);
});

test("no quoted review states a price (Fazil Ahmed and Rahul Mehta quote exact figures)", () => {
  for (const p of PAGES) {
    for (const n of p.content?.reviewNames ?? []) {
      const r = VERIFIED_REVIEWS.find((v) => v.name === n);
      assert.doesNotMatch(r.text, /(₹|Rs\.?)\s?\d/i, `${p.path}: review by ${n} quotes a price`);
    }
  }
});
