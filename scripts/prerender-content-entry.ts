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
