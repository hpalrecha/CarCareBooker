import { test } from "node:test";
import assert from "node:assert/strict";
import { isSpamProductPath } from "../server/lib/spam-paths.ts";

test("foreign product spam slugs are recognised", () => {
  for (const p of [
    "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765",
    "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
    "/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439",
    "/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762",
    "/Fajas-Lumbares-Ortopu00e9dicas-Farmacia-980412",
  ]) {
    assert.equal(isSpamProductPath(p), true, p);
  }
});

test("no real page of this site matches", () => {
  for (const p of [
    "/", "/services", "/blog", "/ppf", "/contact", "/gallery",
    "/service/ppf-sedan", "/service/1-year-ceramic-coating", "/services/paint-protection-film-bangalore",
    "/blog/ppf-vs-ceramic-coating-bangalore", "/products/p91-premium-ppf",
    "/ceramic-coating/car", "/privacy-policy", "/offer/de-dhana-dhan",
    "/ppf-ceramic-coating", "/booking-confirmation/abc-123-4567",
    "/some-page-12345", "/a-b-1234", "/a-b-c-1234567",
  ]) {
    assert.equal(isSpamProductPath(p), false, p);
  }
});
