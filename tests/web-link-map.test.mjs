import { test } from "node:test";
import assert from "node:assert/strict";
import { LINK_MAP, remapLinks, remapPath } from "../packages/content/src/site/link-map.ts";

const CASES = [
  ["/ppf", "/services/paint-protection-film"],
  ["/services/paint-protection-film-bangalore", "/services/paint-protection-film"],
  ["/service/ppf-premium-suv", "/services/paint-protection-film"],
  ["/ceramic-coating/car", "/services/ceramic-coating"],
  ["/services/ceramic-coating-bangalore", "/services/ceramic-coating"],
  ["/service/1-year-ceramic-coating", "/services/ceramic-coating"],
  ["/ceramic-coating/bike", "/services/ceramic-coating/bike"],
  ["/service/1-year-bike-ceramic-coating", "/services/ceramic-coating/bike"],
  ["/services/glass-sun-control-film-bangalore", "/services/sun-control-film"],
  ["/service/windshield-glass-coating-new", "/services/sun-control-film/windshield-glass-coating"],
  ["/services/interior-detailing-bangalore", "/services/interior-detailing"],
  ["/service/interior-detailing-service", "/services/interior-detailing"],
  ["/service/exterior-detailing-hard-water-new", "/services/exterior-detailing/hard-water-spot-removal"],
  ["/service/headlight-restoration-both", "/services/exterior-detailing/headlight-restoration"],
  ["/service/windshield-glass-polishing", "/services/exterior-detailing"],
  ["/service/annual-maintenance-package", "/services/maintenance-plan"],
  ["/service/premium-car-wash-special", "/services/car-wash"],
  ["/products", "/brands"],
  ["/products/stek", "/brands/stek"],
  ["/blog", "/guides"],
  ["/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi", "/areas/koramangala"],
  ["/blog/monsoon-damage-car-bangalore", "/guides/monsoon-damage-car-bangalore"],
  ["/blog/category/paint-care", "/guides"],
];

for (const [from, to] of CASES) {
  test(`${from} -> ${to}`, () => {
    assert.equal(remapPath(from), to);
    assert.equal(remapLinks(`[x](${from})`), `[x](${to})`);
  });
}

test("rewrites markdown links inside prose", () => {
  assert.equal(
    remapLinks("see [PPF](/ppf) and [blog](/blog/monsoon-damage-car-bangalore)"),
    "see [PPF](/services/paint-protection-film) and [blog](/guides/monsoon-damage-car-bangalore)",
  );
});

test("rewrites a bare old path in text", () => {
  assert.equal(remapLinks("Prices are on /ppf."), "Prices are on /services/paint-protection-film.");
});

test("an unknown path is left unchanged", () => {
  assert.equal(remapPath("/gallery"), "/gallery");
  assert.equal(remapLinks("[Gallery](/gallery) and [Contact](/contact)"), "[Gallery](/gallery) and [Contact](/contact)");
});

test("a new path is never remapped again", () => {
  for (const to of new Set(Object.values(LINK_MAP))) assert.equal(remapPath(to), to, to);
});
