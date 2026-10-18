import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isSpamProductPath } from "../server/lib/spam-paths.ts";

test("foreign product spam slugs are recognised", () => {
  for (const p of [
    "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765",
    "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
    "/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439",
    "/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762",
    "/Fajas-Lumbares-Ortopu00e9dicas-Farmacia-980412",
    // Search Console crawl stats, 2026-10 (Googlebot still requesting them).
    "/Para-Trompeta-Negro-Guatemala-341053",
    "/Fascitis-Plantar-Alivio-Y-Comodidad-Para-Tus-Pies-685443",
    "/Proscenic-P15-Aspirateur-Balai-Sans-Fil-580W-50Kpa-70Min-341199",
    "/Plegable-Y-Tablero-Werzalit-Malibu00fa-Garden-859029",
    "/Plegable-Y-Tablero-Werzalit-Malib%C3%BA-Garden-859029",
    // 5 and 7 digit ids.
    "/Some-Foreign-Product-Name-12345",
    "/Some-Foreign-Product-Name-1234567/",
  ]) {
    assert.equal(isSpamProductPath(p), true, p);
  }
});

test("the previous owner's /le48 is gone, slash or not, and only that exact path", () => {
  assert.equal(isSpamProductPath("/le48"), true);
  assert.equal(isSpamProductPath("/le48/"), true);
  for (const p of ["/le48x", "/le4", "/blog/le48", "/le48/foo"]) {
    assert.equal(isSpamProductPath(p), false, p);
  }
});

test("no real page of this site matches", () => {
  for (const p of [
    "/", "/services", "/blog", "/ppf", "/contact", "/gallery",
    "/service/ppf-sedan", "/service/1-year-ceramic-coating", "/services/paint-protection-film-bangalore",
    "/blog/ppf-vs-ceramic-coating-bangalore", "/products/p91-premium-ppf",
    "/ceramic-coating/car", "/privacy-policy", "/offer/de-dhana-dhan",
    "/ppf-ceramic-coating", "/booking-confirmation/abc-123-4567",
    "/some-page-12345", "/a-b-1234", "/a-b-c-1234", "/a-b-c-12345678",
    // Every /service/:slug in the live sitemap (2026-10-18).
    "/service/1-year-bike-ceramic-coating", "/service/annual-maintenance-package",
    "/service/exterior-detailing-hard-water-new", "/service/headlight-restoration-both",
    "/service/interior-detailing-service", "/service/ppf-hatchback", "/service/ppf-suv",
    "/service/ppf-premium-hatchback", "/service/ppf-premium-suv", "/service/ppf-premium-sedan",
    "/service/premium-car-wash-special", "/service/windshield-glass-coating-new",
    "/service/windshield-glass-polishing",
    "/booking-confirmation/1a2b3c4d-1111-2222-3333-123456",
  ]) {
    assert.equal(isSpamProductPath(p), false, p);
  }
});

test("no client route and no static sitemap path matches", () => {
  const app = fs.readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
  const routes = fs.readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
  const paths = [
    ...[...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1].replace(/:[A-Za-z]+/g, "sample-slug-12345")),
    ...[...routes.matchAll(/\{\s*loc:\s*"([^"]+)"/g)].map((m) => m[1]),
  ];
  assert.ok(paths.length > 20, `expected the route list, got ${paths.length}`);
  for (const p of paths) assert.equal(isSpamProductPath(p), false, p);
});
