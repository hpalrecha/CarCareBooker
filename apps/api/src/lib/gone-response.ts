import type { Response } from "express";

/**
 * The permanent-removal response for foreign spam URLs (server/lib/spam-paths.ts).
 *
 * 410 Gone, `Content-Type: text/html` and `X-Robots-Tag: noindex`, as the technical-SEO brief
 * specifies ("HTTP/1.1 410 Gone / Content-Type: text/html"). The body was plain text ("Gone"); the
 * status is what Google acts on, so this only aligns the response with the brief. The page is minimal
 * on purpose: no app shell, no scripts, no links, nothing that could be read as content, and a
 * noindex meta repeating the header for clients that look at HTML rather than headers.
 *
 * Shared by gone-paths.ts (early middleware) and trailing-slash.ts (slash form) so the two can never
 * answer differently.
 */
export const GONE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="robots" content="noindex"><title>410 Gone</title></head>' +
  "<body><h1>410 Gone</h1><p>This page has been permanently removed.</p></body></html>";

export function sendGone(res: Response) {
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(410).type("text/html").send(GONE_HTML);
}
