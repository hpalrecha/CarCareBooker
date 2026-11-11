/**
 * BlogPosting structured data for one article, shared by the prerenderer (scripts/prerender.mjs, the HTML a
 * crawler without JavaScript reads) and the page (pages/blog-post.tsx, set again after the app loads), so the
 * two cannot drift.
 *
 * THE PUBLISHER IS AN ORGANIZATION, NOT THE BUSINESS ENTITY. Both emitters used to type the publisher
 * "AutoRepair" (a LocalBusiness subtype) and point it at the "#business" id with only a name. On a blog page
 * that node had no address, so validators reported a LocalBusiness with a missing address on every post. The
 * article is the subject of the page; the studio as a place is described, complete and with its confirmed
 * address, on the home page, /contact and the service pages (lib/local-business.ts). Nothing about the business
 * is repeated here: only its name, site address and logo.
 *
 * The logo is the file the site already serves, written with its spaces and parentheses percent-encoded (a raw
 * space is not valid in a URL).
 *
 * Relative imports only: scripts/prerender.mjs bundles this through scripts/prerender-content-entry.ts.
 */

/** The studio logo, URL-encoded. The file is client/public/Car Care (4)_1753951564515.png. */
export const SITE_LOGO_PATH = "/Car%20Care%20(4)_1753951564515.png";

export interface BlogPostingInput {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  updated?: string | null;
}

/**
 * ENTITY IDS. The page and the article are two entities and have two ids: the WebPage is the article's URL (what
 * mainEntityOfPage points at) and the BlogPosting is `<url>#article`. They used to share the URL as their @id, so one
 * id named two types, which structured-data validators report as a conflicting entity on every post.
 */
export function blogPostingId(origin: string, slug: string): string {
  return `${origin}/blog/${slug}#article`;
}

export function blogPostingSchema(
  post: BlogPostingInput,
  origin: string,
  authorName: string,
  /** Absolute image URL. Omitted by the prerenderer, which has never emitted one. */
  image?: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": blogPostingId(origin, post.slug),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${origin}/blog/${post.slug}` },
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: authorName, url: origin },
    publisher: {
      "@type": "Organization",
      name: "P91 Car Care",
      url: origin,
      logo: { "@type": "ImageObject", url: `${origin}${SITE_LOGO_PATH}` },
    },
    ...(image ? { image } : {}),
    url: `${origin}/blog/${post.slug}`,
    inLanguage: "en-IN",
  };
}
