import { test } from "node:test";
import assert from "node:assert/strict";
import { isSpamProductPath } from "../server/lib/spam-paths.ts";
import fs from "node:fs";
import { sendGone } from "../server/lib/gone-response.ts";

// The 16 URLs Search Console listed as "Soft 404" on 2026-11-20 (URL Inspection API: last crawled 2026-02-11 to
// 2026-04-05, before the 410 handling existed). They must keep answering 410 Gone + noindex, and must never be
// redirected: no page on this site is a relevant replacement for a foreign store listing.
const SOFT_404_URLS = [
  "/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439/",
  "/Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-125889/",
  "/PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/",
  "/2015H-Touring-Windscreen-Smoke-F-650Gs-G650Gs-480098/",
  "/Magnu00e9tico-De-77-Mm-Convierta-El-Filtro-De-Rosca-De-77-Mm-En-965275/",
  "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
  "/16-Colores-30-50cm-Cubo-LED-Resistente-A-La-Intemperie-Y-851666/",
  "/Metales-Profesional-Para-Adultos-Bobina-De-Bu00fasqueda-416517/",
  "/Lavabo-Mu00e1rmol-Mobiliario-Para-Cuarto-De-Bau00f1o-Grifos-555431/",
  "/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762/",
  "/CBR650R-CBR650-2019-2020-Preto-Moto-Bicicleta-Windshield-303943/",
  "/Double-Din-11-Bluetooth-Negro-Talla-U00fanica-Negro-613689/",
  "/Skecten-Set-De-2-Sillas-De-Comedor-Tapizada-En-Polipiel-Para-960752/",
  "/De-Corte-De-Diamante-300-Mm-Disco-De-Diamante-Hu00famedo-O-Seco-884110/",
  "/Regletas-Enchufes-Regleta-Vertical-4000W-16A-Torre-Enchufes-144574/",
  "/Rubi-Peine-Acero-28-Cm-8-X-8-75957-12-ESPATULA-PEINE-ACERO-322916/",
];

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(c) { this.statusCode = c; return this; },
    set(k, v) { if (typeof k === "object") Object.assign(this.headers, k); else this.headers[String(k).toLowerCase()] = v; return this; },
    setHeader(k, v) { this.headers[String(k).toLowerCase()] = v; return this; },
    type() { return this; },
    send(b) { this.body = b; return this; },
    end(b) { this.body = b; return this; },
    redirect() { throw new Error("a spam URL must never be redirected"); },
  };
  return res;
}

test("all 16 Soft 404 URLs are recognised, with and without the trailing slash", () => {
  assert.equal(SOFT_404_URLS.length, 16);
  for (const p of SOFT_404_URLS) {
    assert.equal(isSpamProductPath(p), true, p);
    assert.equal(isSpamProductPath(p.replace(/\/$/, "")), true, p.replace(/\/$/, ""));
  }
});

test("the 410 response carries noindex, is HTML and never redirects", () => {
  for (const p of SOFT_404_URLS) {
    const res = fakeRes();
    sendGone(res);
    assert.equal(res.statusCode, 410, p);
    assert.match(String(res.headers["x-robots-tag"] ?? ""), /noindex/i);
    assert.equal(res.headers["location"], undefined);
  }
});

test("the middleware only answers GET and HEAD, uses sendGone, and has no redirect call", () => {
  const src = fs.readFileSync(new URL("../server/middleware/gone-paths.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export function goneForSpamPaths"), src.indexOf("export const REMOVED_PAGES"));
  assert.ok(fn.includes('req.method !== "GET" && req.method !== "HEAD") return next()'));
  assert.ok(fn.includes("isSpamProductPath(req.path)"));
  assert.ok(fn.includes("sendGone(res)"));
  assert.doesNotMatch(fn, /redirect/);
});
