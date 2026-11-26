import { test } from "node:test";
import assert from "node:assert/strict";
import { businessSchema, serviceSchema, faqSchema, breadcrumbSchema, BUSINESS_ID } from "../apps/web/lib/schema.ts";

const HOURS = [
  { dayOfWeek: 0, dayName: "Sunday", isOpen: true, openTime: "10:30", cutoffTime: "14:00" },
  { dayOfWeek: 1, dayName: "Monday", isOpen: true, openTime: "10:30", cutoffTime: "16:30" },
  { dayOfWeek: 2, dayName: "Tuesday", isOpen: false, openTime: "10:30", cutoffTime: "16:30" },
];

test("business is an AutoRepair with a stable @id, address, phone and only open days", () => {
  const s = businessSchema(HOURS);
  assert.equal(s["@type"], "AutoRepair");
  assert.equal(s["@id"], BUSINESS_ID);
  assert.equal(s.telephone, "+917406619191");
  assert.equal(s.address.postalCode, "560030");
  assert.equal(s.openingHoursSpecification.length, 2);
  assert.deepEqual(s.areaServed.map((a) => a.name), ["Koramangala", "HSR Layout", "Indiranagar", "Bengaluru"]);
});

test("service carries an AggregateOffer range in INR and points at the business", () => {
  const s = serviceSchema({ name: "Paint protection film", path: "/services/paint-protection-film", description: "d", range: { low: 50000, high: 90000 } });
  assert.equal(s.offers["@type"], "AggregateOffer");
  assert.equal(s.offers.lowPrice, 50000);
  assert.equal(s.offers.highPrice, 90000);
  assert.equal(s.offers.priceCurrency, "INR");
  assert.equal(s.provider["@id"], BUSINESS_ID);
  assert.equal(s.url, "https://p91carcare.com/services/paint-protection-film");
});

test("service without a known range carries no offers", () => {
  const s = serviceSchema({ name: "x", path: "/x", description: "d", range: null });
  assert.equal(s.offers, undefined);
});

test("faq and breadcrumb shapes", () => {
  const f = faqSchema([{ q: "Q?", a: "A." }]);
  assert.equal(f.mainEntity[0].acceptedAnswer.text, "A.");
  const b = breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]);
  assert.equal(b.itemListElement[1].position, 2);
  assert.equal(b.itemListElement[1].item, "https://p91carcare.com/services");
});
