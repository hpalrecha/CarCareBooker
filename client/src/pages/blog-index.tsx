import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, type ServiceRecord } from "@/lib/canonical-services";
import { BLOG_POSTS, formatPostDate } from "@/lib/blog-posts";

/**
 * Blog index in the approved redesign.
 *
 * Purely presentational: it reads the post list from lib/blog-posts.ts and resolves each
 * thumbnail from the live service record the post names, so blog artwork follows whatever
 * the admin uploads. No store, checkout or admin code is involved.
 *
 * A `Blog` schema listing the posts is emitted here; each post page emits its own
 * BlogPosting. That split is what Google's documentation recommends over one page
 * claiming to be both a collection and an article.
 */
export default function BlogIndex() {
  const { data: services } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));
  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;

  useSeoMeta({
    title: "Car Care Guides & Detailing Advice | P91 Car Care",
    description:
      "Straight answers on ceramic coating, paint protection film, hard water spots and sun " +
      "control film — written for Bangalore conditions by the P91 Car Care studio.",
    image: "/Car Care (4)_1753951564515.png",
    canonicalPath: "/blog",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${origin}/blog`,
      name: "Guides from the studio",
      description:
        "Detailing and paint-protection guides written for Bangalore traffic, water and weather.",
      url: `${origin}/blog`,
      publisher: { "@type": "AutoRepair", name: "P91 Car Care", "@id": `${origin}/#business` },
      blogPost: BLOG_POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        datePublished: p.date,
        dateModified: p.updated || p.date,
        url: `${origin}/blog/${p.slug}`,
      })),
    },
  });

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <section className="section">
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span> <span>Blog</span>
          </nav>

          <div className="section-head">
            <h1 style={{ fontSize: "clamp(26px,4.6vw,40px)", fontWeight: 800 }}>
              Guides from the studio
            </h1>
            <p>Straight answers to what customers ask us most, written for Bangalore conditions.</p>
          </div>

          <h2 className="sr-only">All guides</h2>
          <div className="blog-grid">
            {BLOG_POSTS.map((post) => {
              const img = resolveServiceImage(bySlug.get(post.imageServiceSlug));
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="post"
                  data-testid={`card-post-${post.slug}`}
                >
                  {img && (
                    <ImageWithFallback
                      src={img}
                      alt={`${post.title} — P91 Car Care, Indiranagar, Bangalore`}
                      width={800}
                      height={200}
                      sizes="(min-width: 940px) 380px, (min-width: 640px) 50vw, 100vw"
                      loading="lazy"
                    />
                  )}
                  <div className="post-body">
                    <div className="post-meta">
                      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                      <i className="dot" />
                      <span>{post.readMinutes} min read</span>
                      <i className="dot" />
                      <span>{post.category}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className="read">Read Guide →</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="article-cta">
            <div>
              <h3>Rather just book?</h3>
              <p>Pick a service and hold a slot. The balance is settled at the studio.</p>
            </div>
            <div className="article-cta-btns">
              <Link href="/services" className="cta-lg" data-testid="link-blog-book">Book a service</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
