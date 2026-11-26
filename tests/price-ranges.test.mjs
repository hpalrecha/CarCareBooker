import { test } from "node:test";
import assert from "node:assert/strict";
import { rangesFor, formatRange } from "../packages/domain/src/price-ranges.ts";

// The live catalogue on 25 Nov 2026 (GET /api/services), trimmed to slug and price.
const ROWS = [
  { slug: "ppf-hatchback", price: "50000.00" }, { slug: "ppf-sedan", price: "60000.00" }, { slug: "ppf-suv", price: "70000.00" },
  { slug: "ppf-premium-hatchback", price: "70000.00" }, { slug: "ppf-premium-sedan", price: "80000.00" }, { slug: "ppf-premium-suv", price: "90000.00" },
  { slug: "1-year-ceramic-coating", price: "7500.00" }, { slug: "1-year-bike-ceramic-coating", price: "3999.00" },
  { slug: "premium-car-wash-special", price: "999.00" }, { slug: "headlight-restoration-both", price: "1499.00" },
  { slug: "old-ppf-row", price: "1.00", isActive: false },
];

test("PPF overall range spans standard to premium", () => {
  assert.deepEqual(rangesFor("ppf", ROWS).overall, { low: 50000, high: 90000 });
});

test("PPF has one range per body type, standard to premium", () => {
  const r = rangesFor("ppf", ROWS).byBody;
  assert.deepEqual(r.hatchback, { low: 50000, high: 70000 });
  assert.deepEqual(r.sedan, { low: 60000, high: 80000 });
  assert.deepEqual(r.suv, { low: 70000, high: 90000 });
});

test("a family with one catalogue price has no top end", () => {
  assert.deepEqual(rangesFor("ceramic-car", ROWS).overall, { low: 7500, high: null });
});

test("inactive rows never count", () => {
  assert.equal(rangesFor("ppf", ROWS).overall.low, 50000);
});

test("unknown family or no rows returns null", () => {
  assert.equal(rangesFor("ppf", []), null);
});

test("formatting uses compact rupees", () => {
  assert.equal(formatRange({ low: 50000, high: 90000 }), "₹50k–90k");
  assert.equal(formatRange({ low: 7500, high: null }), "₹7.5k");
  assert.equal(formatRange({ low: 999, high: 1800 }), "₹999–1.8k");
});
