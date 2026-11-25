/**
 * Wording of /products that the page and the first HTML response both use (pages/products.tsx and
 * lib/crawlable-content.ts#productsPageContent). Moved here from products.tsx so the crawler snapshot can carry the brand
 * rows, the "Which one do you need?" list and the help line. Wording is unchanged from the live page on 2026-11-20.
 * Relative imports only: scripts/prerender.mjs and apps/api/src/vite.ts bundle this through esbuild.
 */
export const PRODUCTS_HERO = {
  label: "Brands we fit",
  lede: "The film and coating brands we fit, and what each one is for.",
} as const;

/** What each brand is, in the words a customer would use. Keyed by brand page slug. */
export const PRODUCT_KIND: Record<string, string> = {
  stek: "Paint protection film and sun-control film",
  nasiol: "Ceramic coating",
  "p91-premium-ppf": "Our own paint protection film",
};

/** Which job each choice answers. Links go to pages that already exist. */
export const PRODUCT_CHOOSE = [
  { need: "Stone chips and scratches", answer: "Paint protection film. STEK or our own P91 Premium PPF.", href: "/services/paint-protection-film-bangalore", label: "How PPF works" },
  { need: "Easier washing and water beading", answer: "Ceramic coating from Nasiol.", href: "/services/ceramic-coating-bangalore", label: "How ceramic coating works" },
  { need: "A cooler cabin and less glare", answer: "Sun-control film from STEK.", href: "/services/glass-sun-control-film-bangalore", label: "About sun-control film" },
] as const;

export const PRODUCTS_CHOOSE_HEADING = "Which one do you need?";
export const PRODUCTS_HELP_BEFORE = "Not sure? Send a photo of your car on ";
export const PRODUCTS_HELP_LINK = "WhatsApp";
export const PRODUCTS_HELP_AFTER = " and we will tell you what it needs.";
export const PRODUCTS_HELP_HREF = "https://wa.me/917406619191";
