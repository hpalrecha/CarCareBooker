import type { Request, Response, NextFunction } from "express";
import { isSpamProductPath } from "../lib/spam-paths";
import { sendGone } from "../lib/gone-response";

// Foreign spam URLs left over from the domain's previous owner (server/lib/spam-paths.ts) are
// answered 410 Gone + X-Robots-Tag: noindex before anything else runs, with or without a
// trailing slash. Previously only the slash form was handled this early (in trailing-slash.ts);
// the no-slash form reached the SPA catch-all in server/vite.ts, which sent 410 but with the
// 404.html body and no X-Robots-Tag header. Answering here also skips compression, static-file
// lookups and the prerender handlers for traffic that can never be a real page.
//
// GET/HEAD only, so no API or webhook POST can ever be swallowed. Query strings are ignored.
export function goneForSpamPaths(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!isSpamProductPath(req.path)) return next();
  return sendGone(res);
}

/**
 * Pages the studio has removed on purpose. Answered 410 Gone + X-Robots-Tag: noindex, with or without a trailing slash, before
 * any static-file or prerender lookup, so a stale build output can never serve them. 410 (not 404) tells Google the removal is
 * permanent. /offer/de-dhana-dhan: the Dussehra and Diwali offer ended on 8 November 2026 and the page was taken down.
 */
export const REMOVED_PAGES: ReadonlySet<string> = new Set(["/offer/de-dhana-dhan"]);

export function goneForRemovedPages(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const p = req.path.replace(/\/+$/, "").toLowerCase();
  if (!REMOVED_PAGES.has(p)) return next();
  return sendGone(res);
}
