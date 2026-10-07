import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
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
import InstagramReels from "@/components/instagram-reels";
import { REELS_BY_POST } from "@/lib/instagram-reels";
import ParallaxFrame from "@/components/redesign/parallax-frame";
import { useCinematic } from "@/hooks/use-cinematic";
import type { BlogBlock } from "@/lib/blog-posts";
import "@/styles/blog-post.css";

// The same quote dialog the estimate bar opens; loaded on first tap.
const EstimateDialog = lazy(() => import("@/components/mobile-estimate-dialog"));

const WHATSAPP_QUOTE =
  "https://wa.me/917406619191?text=" +
  encodeURIComponent("Hi P91 Car Care, I'd like a PPF quote. My car model is: ");

/** Thin bar at the top of the screen showing how far through the article the reader is. */
function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = target.current;
      if (!el || !bar.current) return;
      const r = el.getBoundingClientRect();
      const total = Math.max(r.height - window.innerHeight, 1);
      const done = Math.min(Math.max(-r.top, 0), total);
      bar.current.style.transform = `scaleX(${(done / total).toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target]);
  return (
    <div className="post-progress" aria-hidden="true">
      <div ref={bar} className="post-progress-bar" />
    </div>
  );
}

/** Splits the body into sections, each starting at an h2. */
function groupSections(body: BlogBlock[]): { title: string; blocks: BlogBlock[] }[] {
  const out: { title: string; blocks: BlogBlock[] }[] = [];
  for (const b of body) {
    if (b.type === "h2") out.push({ title: b.text, blocks: [] });
    else if (out.length) out[out.length - 1].blocks.push(b);
    else out.push({ title: "", blocks: [b] });
  }
  return out;
}

const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

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

  const articleRef = useRef<HTMLElement | null>(null);
  const [estimateOpen, setEstimateOpen] = useState(false);
  // Scroll-linked rise/reveal for [data-cine] elements (hooks/use-cinematic.ts); a no-op under
  // reduced motion, and everything stays visible with no JavaScript.
  useCinematic([slug]);

  if (!post) return <NotFound />;

  const list = Array.isArray(services) ? services : [];
  const bySlug = new Map(list.map((s) => [s.slug, s]));
  const image = post.image?.src ?? resolveServiceImage(bySlug.get(post.imageServiceSlug));

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
  const sections = groupSections(post.body);
  const hasContact = post.body.some((b) => b.type === "contact");
  const square = !!post.image?.square;
  const heroAlt = post.image?.alt ?? `${post.title} — P91 Car Care, Adugodi, Bangalore`;

  const renderBlock = (block: BlogBlock, i: number): ReactNode => {
    switch (block.type) {
      case "h3":
        return <h3 key={i}>{block.text}</h3>;
      case "p": {
        if (block.variant === "warranty") {
          return (
            <aside className="post-warranty" key={i} data-cine="rise" style={stagger(0)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.3 7.5 9.5 4.4-1.2 7.5-5.1 7.5-9.5V6L12 3Z" />
                <path d="m8.8 12.2 2.3 2.3 4.1-4.5" />
              </svg>
              <p><RichText text={block.text} /></p>
            </aside>
          );
        }
        if (block.variant === "price") {
          return (
            <aside className="post-price" key={i} data-cine="rise" style={stagger(0)}>
              <p><RichText text={block.text} /></p>
              <div className="post-price-cta">
                <button type="button" className="cta-lg" onClick={() => setEstimateOpen(true)} data-testid="button-post-estimate">
                  Get Free Estimate
                </button>
                <a className="post-textlink" href={WHATSAPP_QUOTE} target="_blank" rel="noopener noreferrer" data-testid="link-post-whatsapp">
                  WhatsApp your car model
                </a>
              </div>
            </aside>
          );
        }
        return (
          <p key={i} className={block.variant === "lead" ? "post-lead" : undefined}>
            <RichText text={block.text} />
          </p>
        );
      }
      case "ul": {
        if (block.variant === "areas") {
          return (
            <ul className="post-areas" key={i}>
              {block.items.map((item, j) => (
                <li key={j} data-cine="rise" style={stagger(j)}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.variant === "services") {
          return (
            <ul className="post-services" key={i}>
              {block.items.map((item, j) => (
                <li key={j} data-cine="rise" style={stagger(j)}>
                  {block.tags?.[j] && <span className="post-tag" aria-hidden="true">{block.tags[j]}</span>}
                  <span className="post-service-text"><RichText text={item} /></span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}><RichText text={item} /></li>
            ))}
          </ul>
        );
      }
      case "ol":
        return (
          <ol className="post-questions" key={i}>
            {block.items.map((item, j) => (
              <li key={j} data-cine="rise" style={stagger(j)}>
                <span className="post-q-text"><RichText text={item} /></span>
              </li>
            ))}
          </ol>
        );
      case "table":
        return (
          <div className="post-compare" key={i} data-cine="rise" style={stagger(0)}>
            <table aria-label={block.caption} role="table">
              <thead>
                <tr role="row">
                  {block.head.map((h, j) => (
                    <th key={j} scope="col" role="columnheader">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} role="row">
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" role="rowheader"><RichText text={cell} /></th>
                      ) : (
                        <td key={j} role="cell" data-label={block.head[j]}><RichText text={cell} /></td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "faq":
        return (
          <div className="post-faq" key={i}>
            {block.items.map((f, j) => (
              <details key={j} className="post-faq-item" data-cine="rise" style={stagger(j)}>
                <summary>
                  <h3>{f.q}</h3>
                  <svg className="post-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        );
      case "contact":
        return (
          <address className="post-contact" key={i} data-testid="post-contact">
            <div className="post-contact-row">
              <b>Address</b>
              <a href={block.mapsHref} target="_blank" rel="noopener noreferrer">{block.address}</a>
            </div>
            <div className="post-contact-row">
              <b>Call</b>
              <a href={block.phoneHref}>{block.phone}</a>
            </div>
            <Link href={block.bookHref} className="cta-lg post-contact-book" data-testid="link-post-book">
              {block.bookLabel}
            </Link>
          </address>
        );
      case "carousel":
        return (
          <SlideCarousel key={i} dir={block.dir} caption={block.caption} slides={block.slides} testId={`carousel-${block.dir}`} />
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
  };

  return (
    <div className="p91x min-h-screen post-page">
      <ReadingProgress target={articleRef} />
      <SiteHeader overHero />
      <main id="main">
        <article ref={articleRef}>
          <header className={"post-hero" + (square ? " post-hero--square" : "")}>
            <div className="wrap post-wrap">
              <nav className="crumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span>
                <Link href="/blog">Blog</Link> <span>/</span>
                <span>{post.category}</span>
              </nav>
              <div className="post-hero-grid">
                <div className="post-hero-copy">
                  <div className="post-meta">
                    <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                    <i className="dot" />
                    <span>{post.readMinutes} min read</span>
                    <i className="dot" />
                    <span>{post.category}</span>
                  </div>
                  <h1 className="post-h1" data-testid="text-post-title">{post.title}</h1>
                  <p className="post-intro">{post.lede}</p>
                </div>
                {image && (
                  <ParallaxFrame as="figure" className="post-hero-media" strength={0.07}>
                    <ImageWithFallback
                      src={image}
                      alt={heroAlt}
                      width={square ? 1600 : 1200}
                      height={square ? 1600 : 675}
                      sizes={square ? "(min-width: 980px) 520px, 100vw" : "(min-width: 980px) 640px, 100vw"}
                      priority
                      data-testid="img-post-hero"
                    />
                  </ParallaxFrame>
                )}
              </div>
            </div>
          </header>

          {sections.map((sec, si) => {
            const isCta = sec.blocks.some((b) => b.type === "contact");
            return (
              <section
                key={si}
                className={"post-sec" + (isCta ? " post-sec--cta" : "") + (sec.title ? "" : " post-sec--intro")}
                aria-labelledby={sec.title ? `post-h-${si}` : undefined}
              >
                <div className="wrap post-wrap post-sec-grid">
                  {sec.title && (
                    <div className="post-sec-head" data-cine="rise" style={stagger(0)}>
                      <span className="post-sec-n" aria-hidden="true">{String(si + 1).padStart(2, "0")}</span>
                      <h2 id={`post-h-${si}`}>{sec.title}</h2>
                    </div>
                  )}
                  <div className="post-sec-body prose">{sec.blocks.map(renderBlock)}</div>
                </div>
              </section>
            );
          })}

          {/* The studio's own reels on this article's subject (lib/instagram-reels.ts).
              Posts without a matching reel render nothing here. */}
          <div className="wrap post-wrap">
            <InstagramReels reels={REELS_BY_POST[post.slug] ?? []} heading="Watch it on Instagram" variant="inline" className="my-10" />
          </div>

          {!hasContact && (
            <div className="wrap post-wrap">
              <div className="article-cta">
                <div>
                  <h3>Ready to book?</h3>
                  <p>Pick a service and hold a slot. The balance is settled at the studio in Adugodi.</p>
                </div>
                <div className="article-cta-btns">
                  <a className="cta-ghost" href="tel:+917406619191">74066 19191</a>
                </div>
              </div>
            </div>
          )}

          {others.length > 0 && (
            <section className="post-more" aria-labelledby="post-more-h">
              <div className="wrap post-wrap">
                <h2 id="post-more-h" className="post-more-h">Keep reading</h2>
                <ol className="post-more-list">
                  {others.map((o, j) => (
                    <li key={o.slug} data-cine="rise" style={stagger(j)}>
                      <Link href={`/blog/${o.slug}`} data-testid={`link-other-post-${o.slug}`}>
                        <span className="post-more-cat">{o.category}</span>
                        <span className="post-more-title">{o.title}</span>
                        <span className="post-more-arrow" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}
        </article>
      </main>

      {estimateOpen && (
        <Suspense fallback={null}>
          <EstimateDialog open={estimateOpen} onOpenChange={setEstimateOpen} />
        </Suspense>
      )}
      <SiteFooter />
    </div>
  );
}
