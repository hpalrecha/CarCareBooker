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
export {
  BLOG_POSTS,
  BLOG_INDEX_TITLE,
  BLOG_INDEX_DESCRIPTION,
  blogCategories,
  categorySlug,
  categoryTitle,
  categoryDescription,
  postsInCategory,
} from "@/lib/blog-posts";
export { SEO_PAGES } from "@/lib/seo-pages";
export { LANDING_PAGES } from "@/lib/landing-pages";

// Phase 1 SEO/GEO: static page copy (shared with the components) and the builders that
// bake each page's real content into the initial HTML.
export { STATIC_SEO_PAGES, SERVICES_SEO } from "@/lib/static-seo";
export {
  staticPageContent,
  seoGuideContent,
  blogPostContent,
  blogListContent,
  landingPageContent,
  injectRootContent,
} from "@/lib/crawlable-content";
export { localBusinessSchema } from "@/lib/local-business";
