import type { Request, Response, NextFunction } from "express";

export const CANONICAL_ORIGIN = "https://p91carcare.com";

// One canonical host (SEO audit). The app used to answer identically on www.p91carcare.com and
// booking.p91carcare.com, so every page had extra live copies; Google indexed
// booking.p91carcare.com/services/paint-protection-film-bangalore instead of the main-domain page.
//
// - www.p91carcare.com: every request is 301'd, exactly as before.
// - booking.p91carcare.com: only GET/HEAD outside /api/ are 301'd. A 301 turns a POST into a GET
//   (and most webhook senders do not follow redirects at all), so a payment webhook or any API
//   caller still pointed at booking. must keep getting a real response from the app.
//
// Cloudflare-safe and loop-safe: matches exact production hostnames only (never local dev's
// "localhost:5000" or any other deploy target's host), compares case-insensitively with any
// ":port" removed, and always redirects to the fixed https://p91carcare.com origin rather than
// trusting req.protocol (which can read "http" behind a proxy that already terminated TLS). The
// target host never matches a redirecting host, so no loop is reachable.
//
// Pure: returns the Location to 301 to, or null to fall through.
export function canonicalHostRedirect(
  method: string,
  host: string | undefined,
  originalUrl: string,
): string | null {
  if (!host) return null;
  const hostname = host.trim().toLowerCase().replace(/:\d+$/, "");

  if (hostname === "www.p91carcare.com") {
    return `${CANONICAL_ORIGIN}${originalUrl}`;
  }

  if (hostname === "booking.p91carcare.com") {
    if (method !== "GET" && method !== "HEAD") return null;
    const path = originalUrl.split("?")[0];
    if (path === "/api" || path.startsWith("/api/")) return null;
    return `${CANONICAL_ORIGIN}${originalUrl}`;
  }

  return null;
}

export function canonicalHost(req: Request, res: Response, next: NextFunction) {
  const location = canonicalHostRedirect(req.method, req.headers.host, req.originalUrl);
  if (location) return res.redirect(301, location);
  next();
}
