import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, type ServiceRecord } from "@/lib/canonical-services";
import {
  BLOG_POSTS,
  blogCategories,
  categoryFromSlug,
  categorySlug,
  categoryDescription,
  categoryTitle,
  formatPostDate,
  BLOG_INDEX_TITLE,
  BLOG_INDEX_DESCRIPTION,
  postsInCategory,
  postsNewestFirst,
  type BlogPost,
} from "@/lib/blog-posts";

/**
 * Blog index and category listings.
 *
 * Serves two routes: /blog and /blog/category/:categorySlug. One component because the
 * page is identical apart from which posts it lists and what its h1 says — two components
 * would drift, and the category page is the one that would rot, being the less-visited.
 *
 * LAYOUT. Asymmetric by design: the newest post takes a wide 1.35fr image against a 1fr
 * text column, and everything else falls into a three-up grid. A uniform grid gives every
 * post equal weight, which is the opposite of what an editorial index is for.
 *
 * CATEGORIES ARE LINKS, NOT STATE. Each one is a real URL that can be crawled, shared and
 * indexed. A JS-only filter over a single /blog page would leave the site with exactly one
 * indexable listing however much gets written — which defeats the point of the hub.
 *
 * Purely presentational: it reads the post list from lib/blog-posts.ts and resolves each
 * thumbnail from the live service record the post names, so artwork follows whatever the
 * admin uploads. No store, checkout or admin code is involved.
 */
export default function BlogIndex() {
  const params = useParams();
  const categoryParam = params.categorySlug;
  const category = categoryParam ? categoryFromSlug(categoryParam) : undefined;

  const { data: services } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  // An unknown category slug is a 404, not an empty listing. An empty page that returns
  // 200 is a soft 404: it gets indexed, ranks for nothing, and hides the typo.
  const unknownCategory = Boolean(categoryParam && !category);

  const posts = category ? postsInCategory(category) : postsNewestFirst();
  const [featured, ...rest] = posts;
  const categories = blogCategories();

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));
  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;
  const path = category ? `/blog/category/${categorySlug(category)}` : "/blog";

  const title = category ? categoryTitle(category) : BLOG_INDEX_TITLE;
  const description = category ? categoryDescription(category) : BLOG_INDEX_DESCRIPTION;

  useSeoMeta({
    title,
    description,
    image: "/Car Care (4)_1753951564515.png",
    canonicalPath: path,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${origin}${path}`,
        name: category ? `${category} guides` : "Guides from the studio",
        description,
        url: `${origin}${path}`,
        publisher: { "@type": "AutoRepair", name: "P91 Car Care", "@id": `${origin}/#business` },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          description: p.excerpt,
          datePublished: p.date,
          dateModified: p.updated || p.date,
          url: `${origin}/blog/${p.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
          ...(category
            ? [{ "@type": "ListItem", position: 3, name: category, item: `${origin}${path}` }]
            : []),
        ],
      },
    ],
  });

  if (unknownCategory) return <NotFound />;

  const imageFor = (post: BlogPost) => resolveServiceImage(bySlug.get(post.imageServiceSlug));

  return (
    <div className="p91x p91x-editorial min-h-screen">
      <SiteHeader />

      <div className="ed-wrap">
        <header className="ed-masthead">
          <nav className="ed-meta" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <i className="ed-dot" aria-hidden="true" />
            {category ? <Link href="/blog">Blog</Link> : <span>Blog</span>}
            {category && <i className="ed-dot" aria-hidden="true" />}
            {category && <span>{category}</span>}
          </nav>

          <span className="ed-kicker">From the studio</span>
          {/* Exactly one h1 per page, and it changes with the listing so a category page
              is not a duplicate of /blog with different cards. */}
          <h1 data-testid="text-blog-title">
            {category ? `${category} guides` : "Guides from the studio"}
          </h1>
          <p>
            {category
              ? `Everything we have written on ${category.toLowerCase()}, for Bangalore conditions.`
              : "Straight answers to what customers ask us most, written for Bangalore traffic, water and weather."}
          </p>
        </header>

        {/* A real <nav>: every category is a URL. */}
        <nav className="ed-cats" aria-label="Guide categories">
          <Link
            href="/blog"
            className="ed-cat"
            aria-current={!category ? "page" : undefined}
            data-testid="link-category-all"
          >
            All guides
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/blog/category/${categorySlug(c)}`}
              className="ed-cat"
              aria-current={category === c ? "page" : undefined}
              data-testid={`link-category-${categorySlug(c)}`}
            >
              {c}
            </Link>
          ))}
        </nav>

        {featured && (
          <article className="ed-featured ed-rise">
            <Link
              href={`/blog/${featured.slug}`}
              className="ed-featured-img"
              tabIndex={-1}
              aria-hidden="true"
            >
              <ImageWithFallback
                src={imageFor(featured)}
                alt=""
                width={1200}
                height={750}
                sizes="(min-width: 880px) 640px, 100vw"
                priority
              />
            </Link>
            <div>
              <div className="ed-meta">
                <span className="ed-kicker">{featured.category}</span>
                <i className="ed-dot" aria-hidden="true" />
                <time dateTime={featured.date}>{formatPostDate(featured.date)}</time>
                <i className="ed-dot" aria-hidden="true" />
                <span>{featured.readMinutes} min read</span>
              </div>
              <h2>
                {/* The heading carries the link, so the accessible name of the control is
                    the headline itself. The image above is aria-hidden and unfocusable
                    precisely so this is the ONE link to the article, not the second of
                    two identical ones. */}
                <Link href={`/blog/${featured.slug}`} data-testid={`link-featured-${featured.slug}`}>
                  {featured.title}
                </Link>
              </h2>
              <p>{featured.lede || featured.excerpt}</p>
              <span className="ed-read">Read the guide →</span>
            </div>
          </article>
        )}

        <h2 className="sr-only">
          {category ? `More ${category.toLowerCase()} guides` : "All guides"}
        </h2>

        {rest.length > 0 ? (
          <div className="ed-grid">
            {rest.map((post) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="ed-card"
                  data-testid={`card-post-${post.slug}`}
                >
                  <div className="ed-card-img">
                    <ImageWithFallback
                      src={imageFor(post)}
                      alt=""
                      width={800}
                      height={533}
                      sizes="(min-width: 940px) 360px, (min-width: 620px) 50vw, 100vw"
                      loading="lazy"
                    />
                  </div>
                  <div className="ed-meta">
                    <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                    <i className="ed-dot" aria-hidden="true" />
                    <span>{post.readMinutes} min read</span>
                    <i className="ed-dot" aria-hidden="true" />
                    <span>{post.category}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="ed-read">Read guide →</span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          featured && (
            <p className="ed-empty">
              That is the only guide in this category so far.{" "}
              <Link href="/blog">Browse everything</Link>.
            </p>
          )
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
