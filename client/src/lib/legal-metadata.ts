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
/**
 * The company name and current year for the copyright line.
 *
 * The footer rendered the current year while the legal pages hardcoded "© 2025", so the
 * same page could show two different years. This is the single source for all of them.
 * Unlike "Last updated", a copyright year is meant to track the present, so computing it
 * is correct here — it makes no claim about when the document was revised.
 */
export const COMPANY_NAME = "Plus Nine One Inc";

export function copyrightYear(): number {
  return new Date().getFullYear();
}

export const LEGAL_LAST_UPDATED = {
  /**
   * 2026-08-10. Section 7 (Cookies and Tracking) was rewritten: it claimed the site did
   * not use advertising cookies, while Google Ads conversion tracking and remarketing
   * were live and setting _gcl_au and a doubleclick.net cookie. This is a genuine
   * content revision, so the date moves. (Previously 1 August 2026, from the content and
   * legal review that covered this page.)
   */
  privacyPolicy: "10 August 2026",

  /**
   * 2026-08-10. The true historical revision date for these two pages could not be
   * determined — they had never carried a fixed date, only a live-rendered one — so this
   * records the date the dates themselves were corrected. The wording of the policies was
   * not altered.
   */
  termsConditions: "10 August 2026",
  refundPolicy: "10 August 2026",
} as const;
