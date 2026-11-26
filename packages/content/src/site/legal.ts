import type { GuideBlock } from "./types.ts";
import { LEGAL_BLOCKS } from "./legal-data.ts";

/**
 * /privacy-policy, /terms-conditions, /refund-policy (Plan 2b Task 5). Text moved unchanged from
 * apps/admin/src/pages/*.tsx by scripts/web/gen-legal.mjs (only the price-list line and rupee amounts changed;
 * see that script's FIXES). noindex, not in the registry, not in the sitemap. Dates from
 * apps/admin/src/lib/legal-metadata.ts (LEGAL_LAST_UPDATED).
 */
export type LegalPage = { path: string; title: string; h1: string; updated: string; blocks: GuideBlock[] };

export const LEGAL: Record<"privacy" | "terms" | "refund", LegalPage> = {
  privacy: { path: "/privacy-policy", title: "Privacy Policy | P91 Car Care", h1: "Privacy Policy", updated: "10 August 2026", blocks: LEGAL_BLOCKS.privacy },
  terms: { path: "/terms-conditions", title: "Terms and Conditions | P91 Car Care", h1: "Terms and Conditions", updated: "10 August 2026", blocks: LEGAL_BLOCKS.terms },
  refund: { path: "/refund-policy", title: "Refund Policy | P91 Car Care", h1: "Refund Policy", updated: "10 August 2026", blocks: LEGAL_BLOCKS.refund },
};

export const COMPANY_NAME = "Plus Nine One Inc";
