import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BOOKING_FAMILIES, BOOKING_LINKS, bookingFor } from "../packages/content/src/site/booking-links.ts";
import { PAGES } from "../packages/content/src/site/registry.ts";

// Old booking records that are active in /api/services (checked 26 Nov 2026).
const ACTIVE_BOOKING_SLUGS = new Set([
  "ppf-hatchback", "ppf-sedan", "ppf-suv", "ppf-premium-hatchback", "ppf-premium-sedan", "ppf-premium-suv",
  "1-year-ceramic-coating", "1-year-bike-ceramic-coating", "interior-detailing-service", "exterior-detailing-hard-water-new",
  "headlight-restoration-both", "windshield-glass-coating-new", "windshield-glass-polishing", "annual-maintenance-package",
  "premium-car-wash-special",
]);

const SERVICE_PAGES = PAGES.filter((p) => p.path.startsWith("/services/"));

test("every booking family points at an active old booking page", () => {
  for (const [family, slug] of Object.entries(BOOKING_FAMILIES)) {
    assert.ok(ACTIVE_BOOKING_SLUGS.has(slug), `${family}: ${slug} is not an active booking record`);
  }
});

test("the plan's family map (Plan 3 Task 2)", () => {
  assert.deepEqual(BOOKING_FAMILIES, {
    ppf: "ppf-hatchback",
    "ceramic-car": "1-year-ceramic-coating",
    "ceramic-bike": "1-year-bike-ceramic-coating",
    interior: "interior-detailing-service",
    exterior: "exterior-detailing-hard-water-new",
    headlight: "headlight-restoration-both",
    "glass-coating": "windshield-glass-coating-new",
    "glass-polishing": "windshield-glass-polishing",
    maintenance: "annual-maintenance-package",
    "car-wash": "premium-car-wash-special",
  });
});

test("every booking link belongs to a real service page", () => {
  const paths = new Set(SERVICE_PAGES.map((p) => p.path));
  for (const path of Object.keys(BOOKING_LINKS)) assert.ok(paths.has(path), path);
});

test("every service page has exactly one Book target: a mapped /service/<slug> or WhatsApp", () => {
  const mapped = new Set(Object.values(BOOKING_FAMILIES).map((s) => `/service/${s}`));
  let online = 0;
  for (const p of SERVICE_PAGES) {
    const b = bookingFor(p.path);
    if (b.online) {
      online++;
      assert.ok(mapped.has(b.href), `${p.path} -> ${b.href}`);
      assert.equal(b.label, "Book online");
      assert.ok(b.family, p.path);
    } else {
      assert.equal(b.href, "https://wa.me/917406619191", p.path);
      assert.equal(b.label, "Book on WhatsApp");
    }
  }
  assert.ok(online >= 9, `${online} pages book online`);
});

test("the main family pages book online", () => {
  for (const [path, href] of [
    ["/services/paint-protection-film", "/service/ppf-hatchback"],
    ["/services/ceramic-coating", "/service/1-year-ceramic-coating"],
    ["/services/ceramic-coating/bike", "/service/1-year-bike-ceramic-coating"],
    ["/services/interior-detailing", "/service/interior-detailing-service"],
    ["/services/exterior-detailing", "/service/exterior-detailing-hard-water-new"],
    ["/services/exterior-detailing/hard-water-spot-removal", "/service/exterior-detailing-hard-water-new"],
    ["/services/exterior-detailing/headlight-restoration", "/service/headlight-restoration-both"],
    ["/services/sun-control-film/windshield-glass-coating", "/service/windshield-glass-coating-new"],
    ["/services/maintenance-plan", "/service/annual-maintenance-package"],
    ["/services/car-wash", "/service/premium-car-wash-special"],
  ]) assert.equal(bookingFor(path).href, href, path);
  assert.equal(bookingFor("/services/sun-control-film").online, false);
});

test("the service template uses bookingFor for both Book buttons and keeps WhatsApp as the secondary", () => {
  const src = fs.readFileSync(new URL("../apps/web/components/templates/service-page.tsx", import.meta.url), "utf8");
  assert.match(src, /bookingFor\(path\)/);
  assert.doesNotMatch(src, /SITE\.book\.href/);
  assert.match(src, /SITE\.whatsapp/);
});
