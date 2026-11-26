import { buildPpfPackages } from "@p91/content/ppf-packages";
import type { ServiceRow } from "./api.ts";

/**
 * PPF warranty years, read from the catalogue rows' includes ("5-year warranty") through the same
 * builder the old /ppf page used (warrantyYearsOf per tier). Never typed into copy.
 * Returns e.g. "5 or 7-year", "5-year", or null when the catalogue states none.
 */
export function ppfWarrantyYears(rows: ServiceRow[]): { standard: number | null; premium: number | null; text: string | null } {
  const tiers = buildPpfPackages(rows) ?? [];
  const standard = tiers.find((t) => t.key === "basic")?.warrantyYears ?? null;
  const premium = tiers.find((t) => t.key === "premium")?.warrantyYears ?? null;
  const text = standard && premium && standard !== premium ? `${standard} or ${premium}-year` : standard || premium ? `${standard ?? premium}-year` : null;
  return { standard, premium, text };
}

/** The PPF warranty sentence (owner decision 26 Nov), or null when the catalogue has no years. */
export function ppfWarrantyLine(rows: ServiceRow[]): string | null {
  const { standard, premium } = ppfWarrantyYears(rows);
  if (standard && premium && standard !== premium) return `${standard}-year (standard) or ${premium}-year (premium) written warranty, terms at handover.`;
  const y = standard ?? premium;
  return y ? `${y}-year written warranty, terms at handover.` : null;
}
