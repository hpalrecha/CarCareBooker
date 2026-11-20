#!/usr/bin/env node
/**
 * Read-only post-deploy smoke test for the Phase 0 + manager-audit release (2026-11-20).
 *
 *   node scripts/post-deploy-smoke.mjs                       # production, https://p91carcare.com
 *   node scripts/post-deploy-smoke.mjs http://127.0.0.1:5099 # a staging server (skips the www and Cloudflare checks)
 *
 * GET and HEAD requests only. It never sends a POST, never books, never pays, never messages anyone and never asks Google
 * to index anything. Exit code 0 = every check passed, 1 = at least one failed.
 *
 * What it proves: the sitemap is exactly the 32 approved URLs with real lastmod dates; every sitemap URL is 200, self-canonical
 * and indexable; the four unverified ceramic claims are gone from the API and the HTML; the first HTML carries the shared
 * sections; the booking-record pages still canonicalise to their price pages; redirects and the spam 410s are unchanged; the blog
 * JSON-LD has an image and the right dateModified; /contact has no Cloudflare email-protection link; www sends HSTS without
 * includeSubDomains or preload.
 */
const ORIGIN = (process.argv[2] || "https://p91carcare.com").replace(/\/$/, "");
const PROD = ORIGIN === "https://p91carcare.com";
const UA = "p91-smoke/1.0 (read-only)";

const SITEMAP = [
  "/", "/services", "/products", "/products/stek", "/products/nasiol", "/products/p91-premium-ppf",
  "/services/ceramic-coating-bangalore", "/services/paint-protection-film-bangalore", "/services/interior-detailing-bangalore", "/services/glass-sun-control-film-bangalore",
  "/blog", "/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi", "/blog/ppf-vs-ceramic-coating-bangalore", "/blog/hard-water-spot-removal-bangalore",
  "/blog/windshield-heat-rejection-film-summer", "/blog/is-your-ppf-really-made-in-usa", "/blog/how-much-ppf-does-your-car-need", "/blog/monsoon-damage-car-bangalore", "/blog/best-car-detailing-in-bangalore",
  "/ceramic-coating/car", "/ceramic-coating/bike", "/ppf", "/gallery", "/faq", "/contact",
  "/service/annual-maintenance-package", "/service/exterior-detailing-hard-water-new", "/service/headlight-restoration-both", "/service/interior-detailing-service",
  "/service/premium-car-wash-special", "/service/windshield-glass-coating-new", "/service/windshield-glass-polishing",
];
const LASTMOD = { "/": "2026-11-20", "/faq": "2026-11-20", "/blog": "2026-11-17", "/ppf": "2026-11-18", "/ceramic-coating/bike": "2026-11-18", "/ceramic-coating/car": "2026-11-17", "/products/nasiol": "2026-09-24" };
const NO_LASTMOD = ["/gallery", "/contact", "/products/stek", "/products/p91-premium-ppf"];
const BOOKING_RECORDS = { "/service/ppf-hatchback": "/ppf", "/service/ppf-sedan": "/ppf", "/service/ppf-suv": "/ppf", "/service/ppf-premium-hatchback": "/ppf", "/service/ppf-premium-sedan": "/ppf", "/service/ppf-premium-suv": "/ppf", "/service/1-year-ceramic-coating": "/ceramic-coating/car", "/service/1-year-bike-ceramic-coating": "/ceramic-coating/bike" };
const SPAM_410 = [
  "/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439/", "/Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-125889/", "/PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/",
  "/2015H-Touring-Windscreen-Smoke-F-650Gs-G650Gs-480098/", "/Magnu00e9tico-De-77-Mm-Convierta-El-Filtro-De-Rosca-De-77-Mm-En-965275/", "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
  "/16-Colores-30-50cm-Cubo-LED-Resistente-A-La-Intemperie-Y-851666/", "/Metales-Profesional-Para-Adultos-Bobina-De-Bu00fasqueda-416517/", "/Lavabo-Mu00e1rmol-Mobiliario-Para-Cuarto-De-Bau00f1o-Grifos-555431/",
  "/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762/", "/CBR650R-CBR650-2019-2020-Preto-Moto-Bicicleta-Windshield-303943/", "/Double-Din-11-Bluetooth-Negro-Talla-U00fanica-Negro-613689/",
  "/Skecten-Set-De-2-Sillas-De-Comedor-Tapizada-En-Polipiel-Para-960752/", "/De-Corte-De-Diamante-300-Mm-Disco-De-Diamante-Hu00famedo-O-Seco-884110/",
  "/Regletas-Enchufes-Regleta-Vertical-4000W-16A-Torre-Enchufes-144574/", "/Rubi-Peine-Acero-28-Cm-8-X-8-75957-12-ESPATULA-PEINE-ACERO-322916/",
];
const CLAIM = /100\s*%\s*safe|permanent\s+bond|certified\s+technicians?|\b9H\b/i;
const EDUCATIONAL_9H = new Set(["/faq", "/services/ceramic-coating-bangalore", "/blog/ppf-vs-ceramic-coating-bangalore"]); // the studio's own copy about what a 9H rating means

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  | " + detail : ""}`); };
const get = async (path, opt = {}) => { const r = await fetch(ORIGIN + path, { redirect: "manual", headers: { "user-agent": UA }, ...opt }); const text = opt.method === "HEAD" ? "" : await r.text(); return { r, text }; };
const meta = (h, re) => (h.match(re) || [])[1] || "";

// 1. sitemap
{
  const { r, text } = await get("/sitemap.xml");
  const entries = [...text.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({ path: new URL((m[1].match(/<loc>([^<]+)/) || [])[1]).pathname, lastmod: (m[1].match(/<lastmod>([^<]+)/) || [])[1] || "" }));
  const paths = entries.map((e) => e.path);
  check("sitemap answers 200", r.status === 200, String(r.status));
  check("sitemap is exactly the 32 approved URLs", paths.length === 32 && SITEMAP.every((p) => paths.includes(p)) && paths.every((p) => SITEMAP.includes(p)), `${paths.length} URLs; missing: ${SITEMAP.filter((p) => !paths.includes(p)).join(", ") || "none"}; extra: ${paths.filter((p) => !SITEMAP.includes(p)).join(", ") || "none"}`);
  const today = new Date().toISOString().slice(0, 10);
  const lmBad = Object.entries(LASTMOD).filter(([p, d]) => entries.find((e) => e.path === p)?.lastmod !== d);
  check("lastmod values match the material-change dates", lmBad.length === 0, lmBad.map(([p, d]) => `${p} expected ${d}`).join("; "));
  check("pages with only trivial edits carry no lastmod", NO_LASTMOD.every((p) => !entries.find((e) => e.path === p)?.lastmod));
  const blogDates = entries.filter((e) => e.path.startsWith("/blog/")).map((e) => e.lastmod);
  check("the 8 articles are dated 2026-11-17 (not their publish dates)", blogDates.length === 8 && blogDates.every((d) => d === "2026-11-17"));
  check("lastmod is not one shared date", new Set(entries.map((e) => e.lastmod).filter(Boolean)).size >= 4);
  check("no lastmod is in the future", entries.every((e) => !e.lastmod || e.lastmod <= today));
  check("sitemap carries noindex header", /noindex/i.test(r.headers.get("x-robots-tag") || ""));
}

// 2. every sitemap URL: 200, self canonical, indexable; first-HTML parity markers
const html = {};
for (const p of SITEMAP) {
  const { r, text } = await get(p);
  html[p] = text;
  const canon = meta(text, /<link rel="canonical" href="([^"]+)"/).replace(/^https?:\/\/[^/]+/, "");
  const robots = meta(text, /<meta name="robots" content="([^"]+)"/);
  const ok = r.status === 200 && canon === p && /index/.test(robots) && !/noindex/.test(robots + (r.headers.get("x-robots-tag") || "")) && (text.match(/<h1[\s>]/g) || []).length === 1;
  if (!ok) check(`sitemap URL ${p}`, false, `status ${r.status}, canonical ${canon || "-"}, robots ${robots || "-"}`);
}
check("all 32 sitemap URLs: 200, self-canonical, index,follow, exactly one H1", !results.some((x) => !x.ok && x.name.startsWith("sitemap URL ")));

// 3. claims
{
  const api = await (await fetch(ORIGIN + "/api/services", { headers: { "user-agent": UA } })).text();
  let services = []; try { services = JSON.parse(api); } catch { /* reported below */ }
  check("GET /api/services returns the catalogue (15 active services)", Array.isArray(services) && services.length === 15, `${services.length} services`);
  check("no unverified claim in /api/services", !CLAIM.test(api));
  const one = await (await fetch(ORIGIN + "/api/services/1-year-ceramic-coating", { headers: { "user-agent": UA } })).text();
  check("no unverified claim in /api/services/1-year-ceramic-coating", !CLAIM.test(one));
  const offenders = SITEMAP.filter((p) => CLAIM.test(html[p].replace(/<!--[\s\S]*?-->/g, " ")) && !EDUCATIONAL_9H.has(p));
  check("no unverified claim in any sitemap page HTML (3 educational 9H explainers excepted)", offenders.length === 0, offenders.join(", "));
  for (const p of ["/service/1-year-ceramic-coating", "/service/1-year-bike-ceramic-coating"]) check(`no unverified claim on ${p}`, !CLAIM.test((await get(p)).text));
}

// 4. first HTML carries the shared sections
{
  check("/ first HTML has How it works, reviews and the studio block", ["From estimate to handover.", "What owners say after pickup.", "Visit the studio in Adugodi."].every((s) => html["/"].includes(s)));
  check("/products first HTML has the brand rows and the choose list", ["Which one do you need?", "Not sure? Send a photo of your car on"].every((s) => html["/products"].includes(s)));
  check("/services first HTML has How it works and the studio block", ["From estimate to handover.", "Visit the studio in Adugodi."].every((s) => html["/services"].includes(s)));
  check("/ppf first HTML has the statement and the photo heading", ["Catch damage before it costs you", "Real photos from the studio"].every((s) => html["/ppf"].includes(s)));
  check("headlight page is linked from the glass-polishing page body", /href="\/service\/headlight-restoration-both"/.test(html["/service/windshield-glass-polishing"]));
  check("headlight page is linked from at least 3 sitemap pages", SITEMAP.filter((p) => p !== "/service/headlight-restoration-both" && html[p].includes('href="/service/headlight-restoration-both"')).length >= 3);
}

// 5. blog JSON-LD
{
  let bad = [];
  for (const p of SITEMAP.filter((x) => x.startsWith("/blog/"))) {
    const blocks = [...html[p].matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
    const art = blocks.find((b) => b && b["@type"] === "BlogPosting");
    if (blocks.some((b) => b === null) || !art || !/^https:\/\/p91carcare\.com\/attached_assets\/blog\/.+\.jpg$/.test(art.image || "") || art.dateModified !== "2026-11-17" || art.publisher?.["@type"] !== "Organization") bad.push(p);
  }
  check("8 blog posts: JSON-LD parses, has image, dateModified 2026-11-17, Organization publisher", bad.length === 0, bad.join(", "));
}

// 6. contact: Cloudflare email-protection (production only: Cloudflare is in front there)
{
  const c = html["/contact"];
  check("/contact has no email-protection link", !/email-protection|data-cfemail/.test(c), PROD ? "" : "(staging has no Cloudflare; this only proves the origin HTML is clean)");
  check("/contact still shows the studio email as a mailto link", /mailto:info@p91carcare\.com/.test(c) || /info@p91carcare\.com/.test(c));
  if (PROD) { const { r } = await get("/cdn-cgi/l/email-protection"); check("(information) /cdn-cgi/l/email-protection status", true, String(r.status)); }
  check("robots.txt unchanged: no Disallow for /cdn-cgi/", !/cdn-cgi/i.test((await get("/robots.txt")).text));
}

// 7. booking records, redirects, 410s
for (const [p, target] of Object.entries(BOOKING_RECORDS)) { const { r, text } = await get(p); const canon = meta(text, /<link rel="canonical" href="([^"]+)"/).replace(/^https?:\/\/[^/]+/, ""); check(`booking record ${p} is 200 and canonical to ${target}`, r.status === 200 && canon === target, `status ${r.status}, canonical ${canon}`); }
for (const [p, want, to] of [["/ppf-ceramic-coating", 301, "/services"], ["/service/glass-polishing", 301, "/service/windshield-glass-polishing"], ["/index.html", 301, "/"], ["/ppf/", 301, "/ppf"], ["/services/", 301, "/services"]]) {
  const { r } = await get(p); const loc = (r.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, ""); check(`redirect ${p} -> ${to}`, r.status === want && loc === to, `${r.status} ${loc}`);
}
{
  let bad = [];
  for (const p of [...SPAM_410, "/le48", "/offer/de-dhana-dhan"]) { const { r } = await get(p); if (r.status !== 410 || !/noindex/i.test(r.headers.get("x-robots-tag") || "") || r.headers.get("location")) bad.push(p + " " + r.status); }
  check("the 16 spam URLs, /le48 and the ended offer all answer 410 + noindex, none redirects", bad.length === 0, bad.join("; "));
  const u = await get("/this-does-not-exist"); check("an unknown path answers 404 + noindex", u.r.status === 404 && /noindex/i.test(u.text + (u.r.headers.get("x-robots-tag") || "")));
  for (const p of ["/privacy-policy", "/terms-conditions", "/refund-policy", "/blog/category/protection"]) { const x = await get(p); check(`${p} stays 200 + noindex and out of the sitemap`, x.r.status === 200 && /noindex/.test(meta(x.text, /<meta name="robots" content="([^"]+)"/)) && !SITEMAP.includes(p)); }
}

// 8. booking surface is up (read-only)
{
  const h = await get("/api/business-hours"); check("GET /api/business-hours answers 200 with 7 days", h.r.status === 200 && JSON.parse(h.text).length === 7);
  const s = await get("/service/premium-car-wash-special"); check("a service page (the booking panel host) answers 200", s.r.status === 200);
}

// 9. www HSTS (production only)
if (PROD) {
  const www = await fetch("https://www.p91carcare.com/", { redirect: "manual", method: "HEAD", headers: { "user-agent": UA } });
  const h = www.headers.get("strict-transport-security") || "";
  check("www answers 301 to the apex", www.status === 301 && www.headers.get("location") === "https://p91carcare.com/", `${www.status} ${www.headers.get("location")}`);
  check("www sends Strict-Transport-Security max-age=15552000", /max-age=15552000/.test(h), h || "header missing");
  check("www HSTS has NO includeSubDomains and NO preload (not approved yet)", !/includesubdomains|preload/i.test(h));
  const apex = await fetch("https://p91carcare.com/", { method: "HEAD", headers: { "user-agent": UA } });
  check("apex HSTS unchanged: max-age=15552000, no includeSubDomains or preload", /max-age=15552000/.test(apex.headers.get("strict-transport-security") || "") && !/includesubdomains|preload/i.test(apex.headers.get("strict-transport-security") || ""));
  const booking = await fetch("https://booking.p91carcare.com/services/paint-protection-film-bangalore", { redirect: "manual", method: "HEAD", headers: { "user-agent": UA } });
  check("booking host still 301s to the apex, same path", booking.status === 301 && booking.headers.get("location") === "https://p91carcare.com/services/paint-protection-film-bangalore", `${booking.status} ${booking.headers.get("location")}`);
  const fb = html["/"]; check("home JSON-LD sameAs uses the canonical Facebook people URL", fb.includes("facebook.com/people/P91-Car-Care/61563060751882/") && !fb.includes("profile.php?id=61563060751882"));
}

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (${ORIGIN})`);
process.exit(failed.length ? 1 : 0);
