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

/**
 * Ceramic-coating claims the owner asked to hide on 2026-11-20 because nothing documents them: "100% safe",
 * "permanent bond" and "certified technicians". "9H" is hidden too, because the owner said to keep it only if it is
 * documented and no document exists in the repository or the catalogue. (The educational pages that explain what a "9H"
 * rating does and does not mean are the studio's own guidance, not a product claim, and are not filtered.)
 *
 * Same rule as the self-healing filter above: this only DROPS. A list item goes, an FAQ entry goes whole, a sentence goes
 * from a paragraph. Nothing is reworded and nothing is added. The database rows are not edited; the public service
 * endpoints, the server-rendered HTML and the pages apply this on the way out (withholdUnverifiedClaims below).
 *
 * TO RESTORE A CLAIM: document it (certificate, test report, manufacturer sheet), then delete its pattern here.
 */
export const UNVERIFIED_CLAIM_PATTERNS: RegExp[] = [/100\s*%\s*safe/i, /permanent\s+bond/i, /certified\s+technicians?/i, /\b9H\b/];

export function isUnverifiedClaim(text: string): boolean {
  return UNVERIFIED_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

export function isWithheldClaim(text: string): boolean {
  return WITHHELD_CLAIM_PATTERNS.some((pattern) => pattern.test(text)) || isUnverifiedClaim(text);
}

/** A paragraph without the sentences (and parentheses) that state an unverified claim. Other sentences are untouched. */
export function withholdUnverifiedFromProse(text: string): string {
  if (typeof text !== "string" || !isUnverifiedClaim(text)) return text;
  const noParens = text.replace(/\s*\([^)]*\)/g, (m) => (isUnverifiedClaim(m) ? "" : m));
  return noParens
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !isUnverifiedClaim(sentence))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface ClaimFields {
  description?: string | null;
  whyChoose?: string | null;
  heroSubtitle?: string | null;
  metaDescription?: string | null;
  whatIncluded?: unknown;
  process?: unknown;
  faq?: unknown;
}

/**
 * A catalogue record with the unverified claims dropped from every customer-facing field. Returns the SAME object when
 * nothing needed dropping. Pure: it never writes to the database; the admin endpoints are not routed through it.
 */
export function withholdUnverifiedClaims<T extends ClaimFields>(service: T): T;
export function withholdUnverifiedClaims<T extends ClaimFields>(service: T | null | undefined): T | null | undefined;
export function withholdUnverifiedClaims<T extends ClaimFields>(service: T | null | undefined): T | null | undefined {
  if (!service || typeof service !== "object") return service;
  const out: Record<string, unknown> = { ...service };
  let changed = false;
  for (const key of ["description", "whyChoose", "metaDescription"] as const) {
    const v = service[key];
    if (typeof v === "string" && isUnverifiedClaim(v)) {
      out[key] = withholdUnverifiedFromProse(v);
      changed = true;
    }
  }
  // A subtitle is one phrase, not sentences: a claim in it means the whole line goes.
  if (typeof service.heroSubtitle === "string" && isUnverifiedClaim(service.heroSubtitle)) {
    out.heroSubtitle = "";
    changed = true;
  }
  if (Array.isArray(service.whatIncluded)) {
    const kept = service.whatIncluded.filter((i) => typeof i !== "string" || !isUnverifiedClaim(i));
    if (kept.length !== service.whatIncluded.length) {
      out.whatIncluded = kept;
      changed = true;
    }
  }
  if (Array.isArray(service.process)) {
    const all = service.process as Array<Record<string, unknown>>;
    const steps = all.filter((st) => !(typeof st?.title === "string" && isUnverifiedClaim(st.title)));
    const cleaned = steps.map((st) =>
      typeof st?.description === "string" && isUnverifiedClaim(st.description)
        ? { ...st, description: withholdUnverifiedFromProse(st.description) }
        : st,
    );
    if (steps.length !== all.length || cleaned.some((st, i) => st !== steps[i])) {
      out.process = cleaned;
      changed = true;
    }
  }
  if (Array.isArray(service.faq)) {
    const all = service.faq as Array<Record<string, unknown>>;
    const kept = all.filter(
      (f) => !(typeof f?.question === "string" && isUnverifiedClaim(f.question)) && !(typeof f?.answer === "string" && isUnverifiedClaim(f.answer)),
    );
    if (kept.length !== all.length) {
      out.faq = kept;
      changed = true;
    }
  }
  return changed ? (out as T) : service;
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

/** A catalogue FAQ that is about one package: it names the package, or its answer says "this package". */
const PACKAGE_SPECIFIC_FAQ = /\bP91 PPF (?:Basic|Premium)\b|\bthis package\b/i;

/**
 * For a page that sells several packages (/ppf: Basic and Premium, three body types each), only the FAQs that
 * are true of every package. The catalogue row behind the page's default body type carries FAQs written for that
 * one package ("What does P91 PPF Basic - Hatchback cover?", "This package lists..."); showing those on the general
 * page tells the customer, and Google, that the page is about a hatchback. The package and its figures are already
 * shown, from the live rows, in the package comparison and the selector.
 */
export function generalPackageFaqs<T extends { question?: string | null; answer?: string | null }>(
  faqs: ReadonlyArray<T> | null | undefined,
): T[] {
  return (Array.isArray(faqs) ? faqs : []).filter(
    (f) => !PACKAGE_SPECIFIC_FAQ.test(`${f?.question ?? ""} ${f?.answer ?? ""}`),
  );
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
