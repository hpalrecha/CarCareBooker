/**
 * esbuild entry for scripts/prerender.mjs.
 *
 * Re-exports the content the prerenderer needs from the SAME modules the app renders, so a
 * title or description cannot drift between the page and its prerendered <head>. Importing
 * the .ts files directly from a plain .mjs script is not possible, hence this one-line
 * bundle target.
 *
 * Every export added here is one fewer string duplicated in STATIC_ROUTES — and that
 * duplication has already caused one real defect (/contact shipped a prerendered title
 * that differed from the one the component set).
 *
 * Not shipped to the browser and not part of the client graph.
 */
export { blogPostingSchema } from "@/lib/blog-schema";
export {
  BLOG_AUTHOR,
  BLOG_POSTS,
  BLOG_INDEX_TITLE,
  BLOG_INDEX_DESCRIPTION,
  blogCategories,
  categorySlug,
  categoryTitle,
  categoryDescription,
  postsInCategory,
} from "@p91/content/blog-posts";
export { SEO_PAGES } from "@p91/content/seo-pages";
export { LANDING_PAGES } from "@p91/content/landing-pages";
export { BRAND_PAGES } from "@p91/content/brand-pages";

// Phase 1 SEO/GEO: static page copy (shared with the components) and the builders that
// bake each page's real content into the initial HTML.
export { STATIC_SEO_PAGES, SERVICES_SEO, OFFER_SEO, currentOfferSeo } from "@p91/content/static-seo";
export {
  staticPageContent,
  contactPageContent,
  galleryPageContent,
  landingServiceExtras,
  faqPageSchema,
  homePageContent,
  productsPageContent,
  seoGuideContent,
  blogPostContent,
  blogListContent,
  landingPageContent,
  brandPageContent,
  faqPageContent,
  injectRootContent,
} from "@p91/content/crawlable-content";
export { homeFaqSchema } from "@p91/content/home-faq";
export { faqHubSchema } from "@p91/content/faq-page";
export { localBusinessSchema } from "@p91/content/local-business";
export { festivalOfferSchema } from "@/lib/offer-schema";
export { canonicalPathFor } from "@p91/content/canonical-overrides";
