// Plan 2b batches C/D: areas, brands, guides, gallery, FAQ, contact, about, legal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PAGES } from "../packages/content/src/site/registry.ts";
import { LEGAL } from "../packages/content/src/site/legal.ts";
import { INDIRANAGAR } from "../packages/content/src/site/areas.ts";
import { GALLERY } from "../packages/content/src/site/gallery.ts";
import { GUIDES } from "../packages/content/src/site/guides.ts";
import { BRANDS } from "../packages/content/src/site/brands.ts";

const paths = new Set(PAGES.map((p) => p.path));

test("every wave 1 page from batches C and D is in the registry", () => {
  for (const p of ["/areas/koramangala", "/areas/hsr-layout", "/areas/indiranagar", "/brands", "/brands/stek", "/brands/nasiol",
    "/brands/p91-premium-ppf", "/guides", "/gallery", "/faq", "/contact", "/about", "/guides/ppf-cost-bangalore", "/guides/what-is-ppf"]) {
    assert.ok(paths.has(p), `missing ${p}`);
  }
  for (const g of GUIDES) assert.ok(paths.has(`/guides/${g.slug}`), `guide ${g.slug} not in the registry`);
  assert.ok(!paths.has("/guides/ppf-koramangala-hsr-layout-shanti-nagar-adugodi"), "the Koramangala post became the area page");
});

test("legal pages are kept out of the registry (noindex, not in the sitemap)", () => {
  for (const l of Object.values(LEGAL)) assert.ok(!paths.has(l.path), `${l.path} must not be in the registry`);
});

test("legal pages carry no rupee figure, and the booking fee reads 'as shown at booking'", () => {
  for (const [k, l] of Object.entries(LEGAL)) assert.doesNotMatch(JSON.stringify(l.blocks), /₹\s?\d|Rs\.?\s?\d/, k);
  assert.match(JSON.stringify(LEGAL.terms.blocks), /booking fee, as shown at booking/);
  assert.match(JSON.stringify(LEGAL.refund.blocks), /booking fee, as shown at booking/);
});

test("the Indiranagar page never implies a branch there", () => {
  const text = JSON.stringify(INDIRANAGAR);
  assert.match(text, /no branch in Indiranagar/);
  assert.doesNotMatch(text, /(our|the) Indiranagar (studio|branch|outlet)|(our|the) studio in Indiranagar/i);
  assert.ok(!INDIRANAGAR.facts.some((f) => f.k === "Studio" && !/not in Indiranagar/.test(f.v)));
});

test("pickup is never 'at cost' or 'available across Bangalore': on request, confirmed on a call", () => {
  for (const p of PAGES) {
    const text = JSON.stringify(p.content);
    assert.doesNotMatch(text, /pickup and drop[^."]*(at (an additional )?cost|available across)/i, p.path);
  }
});

test("gallery, brand and guide photos are verified files in apps/web/public/photos, never third-party clips", () => {
  const photos = [
    ...GALLERY.groups.flatMap((g) => g.photos),
    ...Object.values(BRANDS).map((b) => b.hero),
    ...GUIDES.map((g) => g.image).filter(Boolean),
  ];
  for (const ph of photos) {
    assert.match(ph.src, /^\/photos\/[a-z0-9-]+\.webp$/, ph.src);
    assert.ok(existsSync(new URL(`../apps/web/public${ph.src}`, import.meta.url)), `${ph.src} missing`);
    assert.doesNotMatch(ph.src, /p91-stek-|stek-(blade|film|heat|rear-glass)|steering|gtr|comet|bike-ceramic/, ph.src);
  }
});
