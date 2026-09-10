import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import RichText from "@/components/redesign/rich-text";
import SlideCarousel from "@/components/redesign/slide-carousel";
import { ImageWithFallback } from "@/components/image-with-fallback";
import NotFound from "@/pages/not-found";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { resolveServiceImage, type ServiceRecord } from "@/lib/canonical-services";
import { getPost, formatPostDate, BLOG_POSTS, BLOG_AUTHOR } from "@/lib/blog-posts";

/**
 * A single blog article, in the approved redesign.
 *
 * Presentational and routing only — no store, checkout, payment or admin code is touched.
 * The article body is rendered from structured blocks, which is what allows the strict
 * h1 -> h2 -> h3 cascade and the contextual links into the service pages.
 *
 * BlogPosting schema carries an ABSOLUTE image URL, because a root-relative path is not
 * valid in structured data — Google resolves it against schema.org, not the site. The
 * image itself comes from the live service record the post names.
 *
 * An unknown slug renders the existing 404 rather than an empty article shell.
 */
export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

  const { data: services } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  if (!post) return <NotFound />;

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));
  const image = resolveServiceImage(bySlug.get(post.imageServiceSlug));

  const origin = typeof window === "undefined" ? "https://p91carcare.com" : window.location.origin;
  const absoluteImage = image
    ? image.startsWith("http")
      ? image
      : `${origin}${image.startsWith("/") ? "" : "/"}${image}`
    : `${origin}/Car Care (4)_1753951564515.png`;

  useSeoMeta({
    title: post.seoTitle,
    description: post.excerpt,
    image,
    canonicalPath: `/blog/${post.slug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${origin}/blog/${post.slug}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${origin}/blog/${post.slug}` },
      headline: post.title,
      description: post.excerpt,
      articleSection: post.category,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      author: { "@type": "Organization", name: BLOG_AUTHOR, url: origin },
      publisher: {
        "@type": "AutoRepair",
        "@id": `${origin}/#business`,
        name: "P91 Car Care",
        logo: { "@type": "ImageObject", url: `${origin}/Car Care (4)_1753951564515.png` },
      },
      image: absoluteImage,
      url: `${origin}/blog/${post.slug}`,
      inLanguage: "en-IN",
    },
  });

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug);

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <article className="section">
        <div className="wrap narrow">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span>
            <Link href="/blog">Blog</Link> <span>/</span>
            <span>{post.category}</span>
          </nav>

          <div className="post-meta" style={{ marginBottom: 12 }}>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <i className="dot" />
            <span>{post.readMinutes} min read</span>
            <i className="dot" />
            <span>{post.category}</span>
          </div>

          <h1 className="article-h1" data-testid="text-post-title">{post.title}</h1>
          <p className="article-lede">{post.lede}</p>

          {image && (
            <ImageWithFallback
              className="article-hero"
              src={image}
              alt={`${post.title} — P91 Car Care, Indiranagar, Bangalore`}
              width={1200}
              height={300}
              data-testid="img-post-hero"
            />
          )}

          <div className="prose">
            {post.body.map((block, i) => {
              switch (block.type) {
                case "h2":
                  return <h2 key={i}>{block.text}</h2>;
                case "h3":
                  return <h3 key={i}>{block.text}</h3>;
                case "p":
                  return (
                    <p key={i}>
                      <RichText text={block.text} />
                    </p>
                  );
                case "ul":
                  return (
                    <ul key={i}>
                      {block.items.map((item, j) => (
                        <li key={j}>
                          <RichText text={item} />
                        </li>
                      ))}
                    </ul>
                  );
                case "carousel":
                  return (
                    <SlideCarousel
                      key={i}
                      dir={block.dir}
                      caption={block.caption}
                      slides={block.slides}
                      testId={`carousel-${block.dir}`}
                    />
                  );
                case "cta":
                  return (
                    <div className="inline-cta" key={i}>
                      <p>{block.text}</p>
                      <Link href="/services" className="cta-lg" data-testid={`link-inline-cta-${i}`}>
                        {block.label}
                      </Link>
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>

          <div className="article-cta">
            <div>
              <h3>Ready to book?</h3>
              <p>Pick a service and hold a slot. The balance is settled at the studio in Indiranagar.</p>
            </div>
            <div className="article-cta-btns">
              <Link href="/services" className="cta-lg" data-testid="link-post-book">Book a service</Link>
              <a className="cta-ghost" href="tel:+917406619191">74066 19191</a>
            </div>
          </div>

          {others.length > 0 && (
            <>
              <h2 className="more-h">More guides</h2>
              <div className="mini-grid">
                {others.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="mini" data-testid={`link-other-post-${p.slug}`}>
                    <b>{p.category}</b>
                    <span>{p.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
