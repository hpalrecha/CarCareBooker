/**
 * Which pages use the dark studio theme (styles/studio-dark.css): every inner page. The home page, the
 * policy pages, the booking confirmation and the admin stay light. apps/admin/index.html repeats this list
 * in a one-line script so the class is on <html> before first paint.
 */
// Empty on purpose: the owner wants white pages with dark green bands, no black-background pages.
// To turn the dark theme back on, list the path segments here AND in the script in apps/admin/index.html.
export const DARK_SEGMENTS: string[] = [];

export function isDarkRoute(path: string): boolean {
  return DARK_SEGMENTS.includes(path.split("/")[1] ?? "");
}
