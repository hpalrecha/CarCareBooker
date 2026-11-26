/**
 * The one approved way to describe the warranty on PPF and ceramic work.
 *
 * ─────────────────────────────────────────────────
 * WHAT IS KNOWN, AND WHAT IS NOT.
 *
 * Known (catalogue): each PPF package lists a warranty period: 5 years for the three Basic rows, 7 years for the three
 * Premium rows. The studio also hands over written warranty terms with the car.
 *
 * NOT known to this codebase: WHO issues the warranty, what it covers, what it excludes, or what it guarantees. Older copy
 * said it was "the film or coating manufacturer's". For P91's own film line there is no recorded manufacturer, and for the
 * other brands the studio has not confirmed that the manufacturer issues it, so that statement is not made. The wording
 * below says only what is known.
 *
 * Replaced everywhere it was PPF-related customer-facing copy on the site. Brand pages (STEK, Nasiol) and the blog are
 * NOT changed by this module; they are listed for the studio in the review report because they are separate content.
 *
 * No imports: the page, the server HTML and the structured-data builders all use it.
 * ─────────────────────────────────────────────────
 */
export const WARRANTY_HANDOVER_LINE = "Written warranty terms provided at handover.";

/** Kept next to the line wherever the old copy had it: it is about the product batch, not the warranty issuer. */
export const WARRANTY_BATCH_LINE = "Ask to see the batch details before work starts.";

/** The catalogue FAQ sentence that names the manufacturer as the issuer ("film", "coating" or "film or coating"). */
const ISSUER_SENTENCE = /Warranty on any job is the (?:film or coating|film|coating) manufacturer(?:'|&#39;|’)s, issued in writing at handover\./g;

/** Replace the "manufacturer's warranty" sentence in a piece of FAQ text. Text without it is returned unchanged. */
export function neutraliseWarrantyIssuer(text: string): string {
  return text.replace(ISSUER_SENTENCE, WARRANTY_HANDOVER_LINE);
}

/** True when a piece of copy still names the manufacturer (or maker) as the warranty's issuer. */
export function impliesManufacturerWarranty(text: string): boolean {
  return /manufacturer(?:'|’|&#39;)?s?\s+(?:written\s+)?warranty|warranty\s+(?:from|card issued by|is)\s+the\s+(?:film|coating|film or coating)\s+(?:manufacturer|maker)|film or coating maker|manufacturer-backed warranty|backed by the manufacturer/i.test(text);
}
