/**
 * Which pages use the dark studio theme (styles/studio-dark.css): every inner page. The home page, the
 * policy pages, the booking confirmation and the admin stay light. client/index.html repeats this list
 * in a one-line script so the class is on <html> before first paint.
 */
export const DARK_SEGMENTS = ["services", "service", "ppf", "ceramic-coating", "products", "blog", "contact", "gallery"];

export function isDarkRoute(path: string): boolean {
  return DARK_SEGMENTS.includes(path.split("/")[1] ?? "");
}
