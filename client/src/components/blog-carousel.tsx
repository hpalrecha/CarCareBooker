import { Link } from "wouter";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { resolveServiceImage, type ServiceRecord } from "@/lib/canonical-services";
import type { BlogPost } from "@/lib/blog-posts";

/**
 * Genuine articles from the blog, shown on a landing page.
 *
 * PURPOSE, so this does not drift into decoration: it gives a visitor who is not ready to
 * book something useful to do that keeps them on the site, and it links the landing page
 * to real editorial content — which is worth more to both the reader and to search than a
 * page that only shouts.
 *
 * WHAT IT IS NOT. Not a "Latest Posts" widget, not a testimonial section in disguise, and
 * not padded. There are three real articles; this shows up to three real articles. If the
 * blog grows, `relevantPosts()` starts choosing rather than simply returning everything.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * DESKTOP vs MOBILE, with one piece of markup.
 *
 * A three-column grid above 720px; below it, the same grid becomes a horizontal
 * scroll-snap track. There is no JavaScript carousel, no library, no autoplay and no
 * dots — CSS scroll-snap gives native momentum scrolling, keyboard support and
 * accessibility for free, and a JS carousel would ship weight to reimplement all three
 * worse. Cards stay real links throughout, so they are keyboard-reachable in both modes.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Images come from the live service record each post nominates (`imageServiceSlug`), the
 * same mechanism the blog index uses — so article imagery follows whatever the admin sets
 * on that service and no separate asset has to be maintained here.
 */

interface BlogCarouselProps {
  posts: BlogPost[];
  /** Live catalogue rows, keyed by slug, for post imagery. */
  bySlug: Map<string, ServiceRecord>;
  heading?: string;
  intro?: string;
}

export default function BlogCarousel({
  posts,
  bySlug,
  heading = "Learn more about vehicle protection",
  intro,
}: BlogCarouselProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="section blogc-section" aria-labelledby="blogc-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="blogc-h" data-testid="text-blog-heading">
            {heading}
          </h2>
          {intro && <p>{intro}</p>}
        </div>

        {/*
          role="list" is restored explicitly: the scroll-snap styles below set
          `display: flex` on mobile, and several browsers drop implicit list semantics
          from a <ul> whose display is not list-item. Without this a screen reader would
          announce three orphaned links instead of "list, 3 items".
        */}
        <ul className="blogc" role="list" data-testid="blog-carousel">
          {posts.map((post) => {
            const image = resolveServiceImage(bySlug.get(post.imageServiceSlug));
            return (
              <li className="blogc-item" key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="blogc-card"
                  data-testid={`link-blog-${post.slug}`}
                >
                  {image && (
                    <ImageWithFallback
                      className="blogc-img"
                      src={image}
                      // Describes the article, not the photograph — the image is
                      // illustrative, and repeating the service name here would be
                      // keyword padding in an alt attribute.
                      alt={`Illustration for the article: ${post.title}`}
                      width={480}
                      height={270}
                      loading="lazy"
                    />
                  )}

                  <div className="blogc-body">
                    {post.category && <span className="blogc-cat">{post.category}</span>}
                    <h3 className="blogc-title">{post.title}</h3>
                    {post.excerpt && <p className="blogc-ex">{post.excerpt}</p>}
                    {/*
                      aria-hidden: the whole card is already one link whose accessible name
                      is the article title. A separate "Read more" would be announced as a
                      second, uninformative link to the same place.
                    */}
                    <span className="blogc-more" aria-hidden="true">
                      Read more
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
