import { NextResponse, type NextRequest } from "next/server";
import { isGonePath } from "@p91/domain/spam-paths";
import { redirectTarget } from "@p91/content/site/redirects";

/**
 * Runs before every page (Next 16 "proxy", formerly middleware.ts).
 *
 * 1. Spam slugs, /le48 and the ended /offer/de-dhana-dhan answer 410 Gone + X-Robots-Tag: noindex,
 *    slash or not, exactly as the API does today (apps/api/src/lib/gone-response.ts), so Google
 *    sees the removal directly rather than through a redirect.
 * 2. A trailing slash 308s to the slashless path. `skipTrailingSlashRedirect` is on in next.config.ts
 *    so this runs instead of Next's own slash redirect: an old URL with a slash (/ppf/) goes straight
 *    to its new page in one hop instead of /ppf/ -> /ppf -> new page.
 */
const GONE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="robots" content="noindex"><title>410 Gone</title></head>' +
  "<body><h1>410 Gone</h1><p>This page has been permanently removed.</p></body></html>";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isGonePath(pathname)) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const clean = pathname.replace(/\/+$/, "") || "/";
    const to = redirectTarget(clean) ?? clean;
    // Proxy redirects must be absolute; request.url carries the request's host (nginx forwards Host).
    // A plain URL, not nextUrl.clone(): NextURL keeps the original trailing slash when it serialises.
    return NextResponse.redirect(new URL(to + search, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except build assets and files with an extension (images, fonts, sitemap.xml, robots.txt, llms.txt).
  matcher: ["/((?!_next/|.*\\.[A-Za-z0-9]+$).*)"],
};
