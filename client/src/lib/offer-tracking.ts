/**
 * Google-side reporting for a festival offer, kept out of analytics.ts (whose purchase tests
 * strip that file's types by hand). Same rule as there: measurement can never break a page,
 * so every failure is swallowed.
 *
 * GA4's own promotion events, so the standard "Promotions" reports and Google Ads audiences
 * work without custom setup:
 *   view_promotion    -> the popup opened, or the offer section was shown
 *   select_promotion  -> a button or the chip was pressed (`cta` says which)
 * No value and no purchase: nothing is bought here.
 */
export function trackPromotion(args: {
  kind: "view" | "select";
  promotionId: string;
  promotionName: string;
  slot: "popup" | "banner" | "chip" | "page";
  cta?: string;
}): void {
  const event = args.kind === "view" ? "view_promotion" : "select_promotion";
  const params = {
    promotion_id: args.promotionId,
    promotion_name: args.promotionName,
    creative_slot: args.slot,
    cta: args.cta,
  };
  try {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
    if (typeof w.gtag === "function") w.gtag("event", event, params);
  } catch {
    // An ad blocker, a CSP rule, or a missing tag.
  }
}
