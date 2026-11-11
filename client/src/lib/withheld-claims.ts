/**
 * Claims withheld from the PPF and ceramic landing pages pending business confirmation, and the one place that
 * enforces the rule for every surface the landing pages draw from the catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY A FILTER AND NOT AN EDIT.
 *
 * The PPF catalogue rows list "Self-healing technology" in `whatIncluded` (Premium: "Enhanced self-healing
 * technology"), and the rows' generated FAQ answers repeat the list ("This package lists: ...; Self-healing
 * technology; ..."). That is business-entered data and it may be accurate, but nothing in this codebase records
 * WHICH film is fitted to a given car, and a protection claim on a page carrying paid traffic is not something to
 * take on trust. The standing instruction is not to claim it until the specific product is confirmed.
 *
 * So it is suppressed HERE, on the landing pages, rather than deleted from the database. Deleting genuine business
 * data to satisfy a display rule would be the wrong direction: the catalogue is the business's record.
 *
 * ONE RULE, EVERY SURFACE. The same pattern drives (1) the visible includes list, (2) the includes list in the
 * server-rendered HTML, (3) the FAQ the page shows, (4) the FAQ in the server-rendered HTML, (5) the FAQPage JSON-LD
 * the server and the page emit, and (6) the Basic and Premium package block. Before this module only (1) and (6)
 * applied it, so the same page showed one thing and its FAQ, snapshot and structured data said another.
 *
 * It only DROPS: an item from a list, or a whole question and answer. It never rewrites wording and never adds a
 * replacement claim.
 *
 * SCOPE, stated plainly: /service/:slug, the booking modal, the nav menu, the brand pages, the home FAQ, the blog and
 * the guide pages are shared components that still show the catalogue or their own copy verbatim. Changing them is a
 * business decision, not a filter. One sentence in the /ppf concept block (campaign-landing.tsx, "A self-healing film
 * absorbs stone chips...") is also page copy, not catalogue data, and is not touched here.
 *
 * TO REMOVE: confirm the film sold supports self-healing, then empty WITHHELD_CLAIM_PATTERNS. It is deliberately one
 * shared constant so there is exactly one place to undo.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * The FAQ filter also applies the approved warranty wording (lib/warranty-wording.ts), which has no imports of its own.
 */
import { neutraliseWarrantyIssuer } from "./warranty-wording";

export const WITHHELD_CLAIM_PATTERNS: RegExp[] = [/self[-\s]?heal/i];

export function isWithheldClaim(text: string): boolean {
  return WITHHELD_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * A catalogue `whatIncluded` list with unconfirmed claims removed.
 *
 * Everything else is passed through untouched — this drops lines, it never rewrites them.
 * Rewriting business copy to be "safer" would be inventing content just as surely as
 * adding a claim would.
 */
export function displayableIncludes(items: unknown): string[] {
  // Takes `unknown` deliberately: ServiceRecord.whatIncluded is typed loosely because it
  // comes back from a JSON API, and this function already validates every element. A
  // narrower signature would only move the cast to the call sites.
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is string => {
    if (typeof item !== "string") return false;
    return !isWithheldClaim(item);
  });
}

/** The generated sentence the PPF rows use to restate their includes list. */
const LIST_SENTENCE = /(This package lists:\s*)([^.]*)(\.)/;

/**
 * An FAQ answer with withheld items removed from the "This package lists: a; b; c." sentence. Any other text is
 * returned unchanged; the caller decides what to do with an answer that still carries a withheld claim.
 */
export function withholdClaimsFromAnswer(answer: string): string {
  return answer.replace(LIST_SENTENCE, (_m, lead: string, list: string, stop: string) => {
    const kept = list.split(";").map((s) => s.trim()).filter((s) => s !== "" && !isWithheldClaim(s));
    return kept.length ? `${lead}${kept.join("; ")}${stop}` : "";
  }).replace(/\s{2,}/g, " ").trim();
}

/**
 * FAQ entries safe to publish on a landing page: the answers cleaned of withheld list items, and any entry whose
 * question or remaining answer still states a withheld claim dropped whole. Entries without a question and an answer
 * are dropped, as everywhere else. Used for what the page shows, the server-rendered FAQ and the FAQPage JSON-LD,
 * so the three cannot disagree.
 */
export function displayableFaqs<T extends { question?: string | null; answer?: string | null }>(
  faqs: ReadonlyArray<T> | null | undefined,
): T[] {
  const out: T[] = [];
  for (const f of Array.isArray(faqs) ? faqs : []) {
    if (typeof f?.question !== "string" || typeof f?.answer !== "string") continue;
    if (!f.question.trim() || !f.answer.trim()) continue;
    // Withheld list items out, then the manufacturer-as-issuer sentence replaced by the approved warranty line.
    const answer = neutraliseWarrantyIssuer(withholdClaimsFromAnswer(f.answer));
    if (!answer || isWithheldClaim(f.question) || isWithheldClaim(answer)) continue;
    out.push(answer === f.answer ? f : { ...f, answer });
  }
  return out;
}
