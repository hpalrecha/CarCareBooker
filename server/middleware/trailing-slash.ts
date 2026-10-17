import type { Request, Response, NextFunction } from "express";
import { isSpamProductPath } from "../lib/spam-paths";

// Canonical URLs in this site have no trailing slash (sitemap, <link rel="canonical">). The app
// used to answer /services/ and /services identically at 200, so every page had two live URLs.
// This 301s the slash form to the canonical form.
//
// - GET/HEAD only: a 301 turns a POST into a GET, which would break API and webhook calls.
// - The root "/" is left alone.
// - Foreign spam product slugs (server/lib/spam-paths.ts) are answered 410 right here, slash or not.
//   Search Console reports them WITH the slash; redirecting first made Google follow a 301 to a
//   410 (reported as "Page with redirect") instead of seeing the permanent removal directly.
// - Leading slashes are collapsed to one. "//evil.com/" must not become the Location
//   "//evil.com", which a browser reads as a protocol-relative URL to another host.
// - Only the path is rewritten; the query string is preserved.
export function stripTrailingSlash(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const original = req.originalUrl;
  const queryAt = original.indexOf("?");
  const rawPath = queryAt === -1 ? original : original.slice(0, queryAt);
  const query = queryAt === -1 ? "" : original.slice(queryAt);

  if (rawPath.length <= 1 || !rawPath.endsWith("/")) return next();

  const cleanPath = rawPath.replace(/\/+$/, "").replace(/^\/+/, "/");
  if (cleanPath === "" || cleanPath === "/") return next();

  if (isSpamProductPath(cleanPath)) {
    res.setHeader("X-Robots-Tag", "noindex");
    return res.status(410).type("text/plain").send("Gone");
  }

  return res.redirect(301, cleanPath + query);
}
