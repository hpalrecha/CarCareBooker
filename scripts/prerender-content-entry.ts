/**
 * esbuild entry for scripts/prerender.mjs.
 *
 * Re-exports the content the prerenderer needs from the SAME modules the app renders, so a
 * post's title or an SEO page's description cannot drift between the page and its
 * prerendered <head>. Importing the .ts files directly from a plain .mjs script is not
 * possible, hence this one-line bundle target.
 *
 * Not shipped to the browser and not part of the client graph.
 */
export { BLOG_POSTS } from "@/lib/blog-posts";
export { SEO_PAGES } from "@/lib/seo-pages";
