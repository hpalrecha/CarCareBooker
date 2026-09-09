/**
 * Category and vehicle derivation for the service catalogue.
 *
 * The redesign prototype presented services under category tabs (Interior, Exterior,
 * Coating, PPF, Glass, Restoration, Packages) and a vehicle filter (Hatchback, Sedan,
 * SUV, Bike). The production `services` table has NO category or vehicle column, and
 * this migration deliberately does not add one — see the decision not to widen the
 * schema for the redesign.
 *
 * So the taxonomy is DERIVED from the live record instead of stored. Two consequences
 * that matter, and that the prototype's hardcoded array could not offer:
 *
 *   1. A service the admin adds later is classified automatically. Nothing has to be
 *      registered in the frontend for it to appear under the right tab.
 *   2. Nothing can be hidden by a classification miss. `deriveCategory` falls back to
 *      "Other", never to null, and "All" is the default tab — so an unrecognised
 *      service is always reachable. Dropping a bookable service from the grid would
 *      cost real revenue, so the failure mode is deliberately "shows up under All"
 *      rather than "silently absent".
 *
 * Matching runs on the slug, which is stable and admin-controlled, and falls back to
 * the title. Both are lowercased; the title fallback matters because several live
 * titles carry trailing spaces and inconsistent casing ("Partial PPF (sedan)   ").
 *
 * Rule ORDER is significant and load-bearing:
 *   - Packages first, so "annual-maintenance-package" is not caught by /detail/.
 *   - Glass before Coating, so "windshield-glass-coating-new" is Glass, not Coating.
 *   - Interior before Exterior, so "interior-detailing-service" is not caught by
 *     /detail/ in the Exterior rule.
 * Changing the order will silently re-bucket live services. There is a test that pins
 * the classification of all 17 production slugs — run it after any edit here.
 */

export type ServiceCategory =
  | "Interior"
  | "Exterior"
  | "Coating"
  | "PPF"
  | "Glass"
  | "Restoration"
  | "Packages"
  | "Other";

/** "car" means the service fits any car regardless of size, so it shows for every car filter. */
export type ServiceVehicle = "car" | "hatchback" | "sedan" | "suv" | "bike";

/** Tab order in the UI. "All" is prepended by the component, and "Other" is only shown
 *  when something actually lands in it. */
export const CATEGORY_ORDER: ServiceCategory[] = [
  "Interior",
  "Exterior",
  "Coating",
  "PPF",
  "Glass",
  "Restoration",
  "Packages",
  "Other",
];

export const VEHICLE_FILTERS: { key: ServiceVehicle | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hatchback", label: "Hatchback" },
  { key: "sedan", label: "Sedan" },
  { key: "suv", label: "SUV" },
  { key: "bike", label: "Bike" },
];

const CATEGORY_RULES: [RegExp, ServiceCategory][] = [
  [/annual|package/, "Packages"],
  [/ppf|paint[-\s]?protection/, "PPF"],
  // "windsheild" is a live production spelling — two service slugs use it. Do not
  // "fix" it here; the slug is what the database actually holds.
  [/windshield|windsheild|glass|sun[-\s]?control|suncontrol|tint|film/, "Glass"],
  [/ceramic|coating/, "Coating"],
  [/headlight|restoration/, "Restoration"],
  [/interior/, "Interior"],
  [/exterior|polish|wash|detail/, "Exterior"],
];

const VEHICLE_RULES: [RegExp, ServiceVehicle][] = [
  [/bike|motorcycle|motorbike/, "bike"],
  [/hatchback/, "hatchback"],
  [/sedan/, "sedan"],
  [/\bsuv\b/, "suv"],
];

/** Slug preferred, title as fallback; both normalised to lowercase with spaces as hyphens. */
function haystack(service: { slug?: string | null; title?: string | null }): string {
  const slug = (service.slug ?? "").trim().toLowerCase();
  const title = (service.title ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  return `${slug} ${title}`;
}

export function deriveCategory(service: { slug?: string | null; title?: string | null }): ServiceCategory {
  const h = haystack(service);
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(h)) return category;
  }
  return "Other";
}

export function deriveVehicle(service: { slug?: string | null; title?: string | null }): ServiceVehicle {
  const h = haystack(service);
  for (const [pattern, vehicle] of VEHICLE_RULES) {
    if (pattern.test(h)) return vehicle;
  }
  return "car";
}

/**
 * A car-sized filter keeps every generic "car" service visible, because a service that
 * fits any car also fits a hatchback. Only "bike" is exclusive — bike work is not
 * relevant to a car owner, and car work is not relevant to a bike owner.
 */
export function fitsVehicle(service: { slug?: string | null; title?: string | null }, filter: ServiceVehicle | "all"): boolean {
  if (filter === "all") return true;
  const v = deriveVehicle(service);
  if (filter === "bike") return v === "bike";
  return v === filter || v === "car";
}

/** Free-text search across the fields a customer would actually type. */
export function matchesQuery(
  service: { title?: string | null; description?: string | null; slug?: string | null },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [service.title, service.description, service.slug, deriveCategory(service)];
  return fields.some((f) => (f ?? "").toString().toLowerCase().includes(q));
}
