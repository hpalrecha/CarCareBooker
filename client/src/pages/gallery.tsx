import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import InstagramReels from "@/components/instagram-reels";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { GALLERY_REELS, INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL } from "@/lib/instagram-reels";

/**
 * /gallery: every reel the studio has posted on Instagram, most-liked first. Each card shows the
 * caption's own opening line; the Instagram player loads only when a visitor chooses to watch.
 * The reels are P91's own posts (lib/instagram-reels.ts records each id and its quoted caption).
 */
export default function Gallery() {
  useSeoMeta({
    title: "Our Work on Instagram | P91 Car Care Gallery",
    description: "Reels of PPF, ceramic coating and detailing work from the P91 Car Care studio in Adugodi, Bangalore, straight from our Instagram.",
    canonicalPath: "/gallery",
  });
  return (
    <div className="p91x gl-page min-h-screen">
      <SiteHeader />
      <section className="gl-head">
        <div className="wrap">
          <p className="ed-label">Gallery</p>
          <h1 className="sv-title">Our work, on Instagram.</h1>
          <p className="sv-lede">
            Every reel from the studio, the most-liked first. Watch it here, or follow{" "}
            <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="ed-link">@{INSTAGRAM_HANDLE}</a> for the next one.
          </p>
        </div>
      </section>
      <div className="ig-band" data-tone="dark">
        <InstagramReels reels={GALLERY_REELS} heading="All reels" intro={undefined} />
      </div>
      <SiteFooter />
    </div>
  );
}
