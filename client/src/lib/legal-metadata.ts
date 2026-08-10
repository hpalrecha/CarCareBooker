/**
 * Static "last updated" dates for the legal pages.
 *
 * These MUST NOT be derived from `new Date()`. Terms & Conditions and the Refund Policy
 * previously rendered `new Date().toLocaleDateString('en-IN')`, so every visitor saw
 * today's date and the page appeared to be revised continuously — a misleading claim
 * about a legal document, and a server/client mismatch waiting to happen.
 *
 * Update the relevant entry ONLY when the page's content is actually revised.
 */
export const LEGAL_LAST_UPDATED = {
  /**
   * Set during the 2026-08-01 content and legal review, which covered this page only.
   */
  privacyPolicy: "1 August 2026",

  /**
   * 2026-08-10. The true historical revision date for these two pages could not be
   * determined — they had never carried a fixed date, only a live-rendered one — so this
   * records the date the dates themselves were corrected. The wording of the policies was
   * not altered.
   */
  termsConditions: "10 August 2026",
  refundPolicy: "10 August 2026",
} as const;
