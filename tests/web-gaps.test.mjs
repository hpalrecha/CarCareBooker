// Owner decisions 26 Nov 2026: [NEEDS] gaps are hidden (never block a page), windshield coating 36-48 hours, no headlight
// warranty period, longer brand pages, and the two overlapping guides rewritten.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { hasGap, withoutGaps, proseWithoutGaps, gapFree, guideBlocksWithoutGaps } from "../packages/content/src/site/gaps.ts";
import { PAGES } from "../packages/content/src/site/registry.ts";
import { HEADLIGHT } from "../packages/content/src/site/headlight-restoration.ts";
import { GLASS_COATING } from "../packages/content/src/site/windshield-glass-coating.ts";
import { BRANDS } from "../packages/content/src/site/brands.ts";
import { guideFor } from "../packages/content/src/site/guides.ts";
import { PPF_FRONT } from "../packages/content/src/site/ppf-front.ts";
import { HARD_WATER } from "../packages/content/src/site/hard-water.ts";
import { formatServiceTime } from "../packages/content/src/service-time.ts";

const root = new URL("../", import.meta.url);

test("hasGap finds a marker in a string or anywhere inside an object", () => {
  assert.equal(hasGap("Plain copy."), false);
  assert.equal(hasGap("Drive time [NEEDS: approx. drive time]"), true);
  assert.equal(hasGap({ q: "Q?", a: "A. [NEEDS: x]" }), true);
  assert.equal(hasGap(null), false);
});

test("prose loses only the sentence that carries a gap, even when the marker has a full stop inside", () => {
  assert.equal(withoutGaps("First. [NEEDS: approx. drive time from Koramangala] Last."), "First. Last.");
  assert.equal(withoutGaps("Keep the windows up for [NEEDS: days], so the edge holds. After that, clean it."), "After that, clean it.");
  assert.equal(withoutGaps("[NEEDS: the usual route]"), "");
  assert.equal(withoutGaps("No gap here. None at all."), "No gap here. None at all.");
  assert.deepEqual(proseWithoutGaps(["Kept.", "[NEEDS: team]"]), ["Kept."]);
});

test("a content item with [NEEDS] is filtered out: list item, FAQ, fact row, caption", () => {
  assert.deepEqual(gapFree(["a", "How are visits booked? [NEEDS: process]", "b"]), ["a", "b"]);
  const faq = gapFree(HEADLIGHT.faq);
  assert.ok(HEADLIGHT.faq.some(hasGap), "the headlight page has gap FAQs to hide");
  assert.equal(faq.length, HEADLIGHT.faq.length - HEADLIGHT.faq.filter(hasGap).length);
  assert.ok(faq.every((f) => !hasGap(f)));
  assert.deepEqual(gapFree([{ k: "Drive", v: "[NEEDS: time]" }, { k: "Pickup", v: "On request" }]), [{ k: "Pickup", v: "On request" }]);
  assert.deepEqual(gapFree([{ car: "Evoque", job: "[NEEDS: service]" }]), []);
});

test("guide blocks: gap prose and items dropped, and a heading left empty goes with them", () => {
  const out = guideBlocksWithoutGaps([
    { t: "h2", text: "Kept" }, { t: "p", text: "Body. [NEEDS: x]" },
    { t: "h2", text: "Emptied" }, { t: "p", text: "[NEEDS: y]" },
    { t: "h2", text: "Parent" }, { t: "h3", text: "Empty child" }, { t: "ul", items: ["[NEEDS: z]"] },
    { t: "h2", text: "Questions" }, { t: "faq", items: [{ q: "Q", a: "[NEEDS: a]" }, { q: "Q2", a: "A2" }] },
  ]);
  assert.deepEqual(out, [{ t: "h2", text: "Kept" }, { t: "p", text: "Body." }, { t: "h2", text: "Questions" }, { t: "faq", items: [{ q: "Q2", a: "A2" }] }]);
});

test("every template and page with content filters gaps through gaps.ts", () => {
  for (const f of ["apps/web/components/templates/service-page.tsx", "apps/web/components/templates/area-page.tsx",
    "apps/web/components/templates/brand-page.tsx", "apps/web/components/templates/guide-page.tsx",
    "apps/web/app/page.tsx", "apps/web/app/faq/page.tsx", "apps/web/app/about/page.tsx"]) {
    assert.match(readFileSync(new URL(f, root), "utf8"), /@p91\/content\/site\/gaps/, f);
  }
  const guide = readFileSync(new URL("apps/web/components/templates/guide-page.tsx", root), "utf8");
  assert.match(guide, /the P91 Car Care team/);
});

test("ship-gate is informational (exit 0); check-pages fails on a visible [NEEDS", () => {
  const r = spawnSync(process.execPath, ["scripts/web/ship-gate.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /not blocking/);
  const check = readFileSync(new URL("scripts/web/check-pages.mjs", root), "utf8");
  assert.match(check, /\\\[NEEDS\|NEEDS:/);
});

test("windshield glass coating: 36 to 48 hours everywhere, never 24", () => {
  const text = JSON.stringify(GLASS_COATING);
  assert.match(text, /36 to 48 hours/);
  assert.doesNotMatch(text, /\b24 ?(hours|hrs)\b/);
  assert.equal(formatServiceTime({ slug: "windshield-glass-coating-new", duration: 1440 }), "36-48 hrs");
});

test("headlight restoration shows no warranty period", () => {
  assert.doesNotMatch(JSON.stringify(HEADLIGHT), /\d+[- ]?months?\b|six[- ]month/i);
});

test("brand pages: long-form sections and 5+ FAQs, no prices", () => {
  for (const [slug, b] of Object.entries(BRANDS)) {
    assert.ok((b.sections ?? []).length >= 4, `${slug} sections`);
    assert.ok(gapFree(b.faq).length >= 5, `${slug} needs 5+ visible FAQs`);
    assert.doesNotMatch(JSON.stringify(b), /₹|Rs\.?\s?\d/, slug);
  }
});

test("the two rewritten guides no longer repeat their service pages and link to them once", () => {
  const pairs = [["how-much-ppf-does-your-car-need", PPF_FRONT, "/services/paint-protection-film/front"],
    ["hard-water-spot-removal-bangalore", HARD_WATER, "/services/exterior-detailing/hard-water-spot-removal"]];
  for (const [slug, svc, href] of pairs) {
    const g = guideFor(slug);
    const body = JSON.stringify(g.blocks);
    assert.equal(body.split(`](${href})`).length - 1, 1, `${slug} links to ${href} once`);
    const guideH2 = new Set(g.blocks.filter((b) => b.t === "h2").map((b) => b.text));
    for (const s of svc.sections) assert.ok(!guideH2.has(s.h2), `${slug} repeats the heading "${s.h2}"`);
    for (const s of svc.sections) for (const p of s.paras) assert.ok(!body.includes(p.slice(0, 80)), `${slug} repeats: ${p.slice(0, 60)}`);
    assert.ok(PAGES.some((p) => p.path === `/guides/${slug}`), `${slug} stays an indexable, self-canonical page`);
  }
});
