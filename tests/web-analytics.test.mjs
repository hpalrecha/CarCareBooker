import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { classifyClick, pageContext, TAG_IDS } from "../apps/web/lib/track.ts";
import { captureAttribution, ATTRIBUTION_STORAGE_KEY, ATTRIBUTION_TTL_MS } from "../apps/web/lib/attribution.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("tag IDs mirror the live site: the Google Ads tag and Clarity project from apps/admin/index.html, plus P91's own GA4", () => {
  const live = read("apps/admin/index.html");
  assert.equal(TAG_IDS.googleAds, "AW-11467752288");
  assert.match(live, /gtag\('config', 'AW-11467752288'\)/);
  assert.equal(TAG_IDS.clarity, "yezkqr1rwm");
  assert.match(live, /clarity\.ms\/tag\/yezkqr1rwm/);
  assert.equal(TAG_IDS.ga4, "G-D3QRLWNCY5");
});

test("the Just Signs GA4 stream is never referenced by the web app", () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", ".next"].includes(e.name) ? [] : walk(p);
    return /\.(tsx?|mjs|js|json)$/.test(e.name) ? [p] : [];
  });
  for (const f of walk(new URL("../apps/web", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
    assert.doesNotMatch(fs.readFileSync(f, "utf8"), /G-QXEEJ4EK4J/, f);
  }
});

test("the analytics component loads gtag for the Ads tag, configures both IDs, Clarity, lazily, and is in the root layout", () => {
  const src = read("apps/web/components/analytics.tsx");
  assert.match(src, /"use client"/);
  assert.match(src, /from "next\/script"/);
  assert.match(src, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.match(src, /clarity\.ms\/tag\//);
  assert.match(src, /'config'/);
  // Same lazy rule as the live site: after load + 4 s, or the first touch, key press or scroll.
  assert.match(src, /setTimeout\(loadTags, 4000\)/);
  assert.match(src, /pointerdown/);
  assert.match(src, /addEventListener\("click"/, "one delegated click listener");
  assert.match(src, /captureAttribution\(\)/);
  const layout = read("apps/web/app/layout.tsx");
  assert.match(layout, /<Analytics \/>/);
});

test("page context: page_type, service_family and area from the path", () => {
  assert.deepEqual(pageContext("/"), { page_type: "home", service_family: null, area: null });
  assert.deepEqual(pageContext("/services"), { page_type: "services_hub", service_family: null, area: null });
  assert.deepEqual(pageContext("/services/paint-protection-film"), { page_type: "service", service_family: "ppf", area: null });
  assert.deepEqual(pageContext("/services/exterior-detailing/headlight-restoration"), { page_type: "service", service_family: "headlight", area: null });
  assert.deepEqual(pageContext("/services/paint-correction"), { page_type: "service", service_family: "paint-correction", area: null });
  assert.deepEqual(pageContext("/areas/koramangala"), { page_type: "area", service_family: null, area: "koramangala" });
  assert.equal(pageContext("/guides/what-is-ppf").page_type, "guide");
  assert.equal(pageContext("/brands/stek").page_type, "brand");
  assert.equal(pageContext("/contact").page_type, "contact");
});

test("click events: tel -> click_call, wa.me -> click_whatsapp, Book online -> begin_booking with the booked family", () => {
  assert.deepEqual(classifyClick("tel:+917406619191", "/areas/koramangala"),
    { event: "click_call", params: { page_type: "area", service_family: null, area: "koramangala" } });
  assert.deepEqual(classifyClick("https://wa.me/917406619191", "/services/ceramic-coating"),
    { event: "click_whatsapp", params: { page_type: "service", service_family: "ceramic-car", area: null } });
  assert.deepEqual(classifyClick("/service/1-year-bike-ceramic-coating", "/services/ceramic-coating/bike"),
    { event: "begin_booking", params: { page_type: "service", service_family: "ceramic-bike", area: null } });
  assert.deepEqual(classifyClick("https://p91carcare.com/service/ppf-hatchback", "/"),
    { event: "begin_booking", params: { page_type: "home", service_family: "ppf", area: null } });
  assert.equal(classifyClick("/services/ceramic-coating", "/"), null);
  assert.equal(classifyClick("https://example.com/", "/"), null);
});

test("first-touch attribution uses the same localStorage key and record shape the old booking pages read", () => {
  const admin = read("apps/admin/src/lib/attribution.ts");
  assert.match(admin, new RegExp(`const STORAGE_KEY = "${ATTRIBUTION_STORAGE_KEY}"`));
  assert.equal(ATTRIBUTION_STORAGE_KEY, "p91_attribution");
  assert.match(admin, /const TTL_DAYS = 30;/);
  assert.equal(ATTRIBUTION_TTL_MS, 30 * 24 * 60 * 60 * 1000);
  // Every field of the admin Attribution interface is written by the web capture.
  const fields = [...admin.matchAll(/^\s{2}(\w+): string \| null;$/gm)].map((m) => m[1]);
  assert.ok(fields.length >= 9, fields.join());

  const store = new Map();
  const setWindow = (href, referrer = "") => {
    const url = new URL(href);
    globalThis.window = {
      location: { search: url.search, pathname: url.pathname, host: url.host },
      localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
    };
    globalThis.document = { referrer };
  };
  try {
    setWindow("https://p91carcare.com/services/paint-protection-film?utm_source=meta&utm_campaign=ppf_nov&fbclid=abc", "https://l.instagram.com/");
    const a = captureAttribution();
    const stored = JSON.parse(store.get("p91_attribution"));
    for (const f of [...fields, "capturedAt"]) assert.ok(Object.hasOwn(stored, f), `stored record has ${f}`);
    assert.equal(stored.utmSource, "meta");
    assert.equal(stored.utmCampaign, "ppf_nov");
    assert.equal(stored.fbclid, "abc");
    assert.equal(stored.landingPage, "/services/paint-protection-film");
    assert.equal(stored.referrer, "https://l.instagram.com/");
    assert.deepEqual(a, stored);

    // Internal navigation (no campaign signal) never overwrites the ad click.
    setWindow("https://p91carcare.com/areas/koramangala", "https://p91carcare.com/services/paint-protection-film");
    captureAttribution();
    assert.equal(JSON.parse(store.get("p91_attribution")).utmCampaign, "ppf_nov");

    // A new ad click does re-attribute.
    setWindow("https://p91carcare.com/?gclid=g1");
    captureAttribution();
    const again = JSON.parse(store.get("p91_attribution"));
    assert.equal(again.gclid, "g1");
    assert.equal(again.utmCampaign, null);
    assert.equal(again.landingPage, "/");
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});
