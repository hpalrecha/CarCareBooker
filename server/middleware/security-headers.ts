import type { Request, Response, NextFunction } from "express";

/**
 * Baseline response headers every page and API answer should carry. Additive: each one is safe with the
 * Razorpay checkout and the Instagram embeds (both are pages WE frame, not pages framing US), and none of them
 * is a Content-Security-Policy, which stays off on purpose (server/index.ts, Razorpay).
 *
 *   X-Content-Type-Options: nosniff              a file is only ever treated as the type we say it is
 *   Referrer-Policy: strict-origin-when-cross-origin   other sites get the origin, never the full URL
 *                                                (offer and admin URLs, order ids in paths, are not leaked)
 *   X-Frame-Options: SAMEORIGIN                  other sites cannot put our pages, including the payment form
 *                                                and admin, inside a hidden frame (clickjacking)
 *   Strict-Transport-Security (production)       browsers stay on HTTPS; 180 days, and NOT includeSubDomains or
 *                                                preload: other subdomains of the domain are not this app's to commit
 */
export function securityHeaders(isProduction: boolean = process.env.NODE_ENV === "production") {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=15552000");
    next();
  };
}
