import { deriveCategory, deriveVehicle, fitsVehicle } from "../../client/src/lib/service-taxonomy";

/**
 * Best-guess photo for a brand-new service that was created with no image of its own —
 * e.g. through the simplified admin form (title/description/price only, no upload step).
 *
 * Reuses the same category/vehicle derivation the service-filter tabs already use
 * (client/src/lib/service-taxonomy.ts), scored against the fixed set of photos that
 * actually exist in attached_assets/services/ today. A directory scan is deliberately
 * NOT used here: that would silently turn any future unrelated file dropped into that
 * folder (a screenshot, a draft asset) into a candidate service photo. This list is
 * pinned and checked against the real directory by tests/service-auto-image.test.mjs.
 *
 * Wrong is worse than blank — the existing UI already shows a clean branded placeholder
 * for a service with no image, so an unresolved/ambiguous match returns null rather than
 * a guess.
 */
export const IMAGE_DIR = "/attached_assets/services";

export const AUTO_IMAGE_CANDIDATES: string[] = [
  "annual-maintenance-package.webp",
  "bike-ceramic-coating-1-year.webp",
  "car-ceramic-coating-1-year.webp",
  "car-polishing.webp",
  "exterior-detailing-hard-water-spot-removal.webp",
  "headlight-restoration-both-lights.webp",
  "interior-detailing-service.webp",
  "p91-full-ppf-hatchback.webp",
  "p91-full-ppf-sedan.webp",
  "p91-full-ppf-suv.webp",
  "partial-ppf-hatchback.webp",
  "partial-ppf-sedan.webp",
  "partial-ppf-suv.webp",
  "stek-full-car-sun-control-film.webp",
  "stek-windshield-sun-control-film.webp",
  "windshield-glass-coating.webp",
  "windshield-glass-polishing.webp",
];

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

export function deriveAutoImage(service: { title?: string | null; slug?: string | null }): string | null {
  const category = deriveCategory(service);
  if (category === "Other") return null;
  const vehicle = deriveVehicle(service);

  const candidates = AUTO_IMAGE_CANDIDATES.filter((file) => {
    const synthetic = { slug: file.replace(/\.webp$/, "") };
    return deriveCategory(synthetic) === category && fitsVehicle(synthetic, vehicle);
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return `${IMAGE_DIR}/${candidates[0]}`;

  const titleTokens = tokens(`${service.title ?? ""} ${service.slug ?? ""}`);
  const scored = candidates
    .map((file) => {
      const fileTokens = tokens(file.replace(/\.webp$/, ""));
      let overlap = 0;
      fileTokens.forEach((t) => {
        if (titleTokens.has(t)) overlap++;
      });
      return { file, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap);

  if (scored[0].overlap > 0 && scored[0].overlap > scored[1].overlap) {
    return `${IMAGE_DIR}/${scored[0].file}`;
  }
  return null;
}
