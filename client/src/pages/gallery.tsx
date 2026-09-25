import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiInstagram } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import LazyVideo from "@/components/redesign/lazy-video";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { FestivalOfferBanner } from "@/components/festival-offer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { GALLERY_SEO } from "@/lib/static-seo";
import { GALLERY_REELS, INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL, reelEmbedUrl, reelUrl } from "@/lib/instagram-reels";
import { MONSOON_DAMAGE, PPF_COVERAGE, PPF_ORIGIN, PPF_VS_CERAMIC, type Carousel } from "@/lib/carousels";
import type { ServiceRecord } from "@/lib/canonical-services";

/**
 * /gallery: the studio's real footage and photos, current offers, the posts it publishes, and
 * every Instagram reel. Nothing here is stock: the videos are the studio's own reels, the photos
 * are stills from them, the offers are read live from the catalogue, and the post slides are the
 * artwork published on Instagram.
 */

const REEL_VIDEOS = [
  { file: "ppf-car", label: "Paint protection film", note: "Full-body PPF, fitted in the studio" },
  { file: "1-year-ceramic-coating", label: "1-year ceramic coating", note: "Deep gloss that sheds water" },
  { file: "car-polishing", label: "Machine polishing", note: "Swirls and scratches out, gloss back" },
  { file: "stek-suncontrol-films", label: "Sun control film", note: "STEK film, cut and fitted to the glass" },
];

const G = "/attached_assets/gallery/";
const STUDIO_PHOTOS = [
  { src: "p91-lux-range-rover-evoque.webp", alt: "Range Rover Evoque finished at P91 Car Care", tag: "Range Rover Evoque" },
  { src: "p91-ppf-fitting.webp", alt: "Paint protection film being fitted on a car panel", tag: "PPF fitting" },
  { src: "p91-lux-vellfire.webp", alt: "Toyota Vellfire after detailing", tag: "Toyota Vellfire" },
  { src: "p91-ceramic-gloss-wipe.webp", alt: "Ceramic coating gloss being wiped in", tag: "Ceramic coating" },
  { src: "p91-lux-nissan-gtr.webp", alt: "Nissan GT-R protected at P91 Car Care", tag: "Nissan GT-R" },
  { src: "p91-stek-film-squeegee.webp", alt: "STEK film being squeegeed onto a window", tag: "STEK film" },
  { src: "p91-lux-mercedes-gle.webp", alt: "Mercedes GLE detailed at the studio", tag: "Mercedes GLE" },
  { src: "p91-polish-bonnet-gloss.webp", alt: "Bonnet gloss after machine polishing", tag: "Polishing" },
  { src: "p91-lux-mg-comet-ev.webp", alt: "MG Comet EV protected with film", tag: "MG Comet EV" },
  { src: "p91-ppf-vellfire-handover.webp", alt: "Vellfire handover after PPF", tag: "Handover" },
  { src: "p91-lux-xuv700.webp", alt: "Mahindra XUV700 after detailing", tag: "Mahindra XUV700" },
  { src: "p91-stek-heat-glove.webp", alt: "Heat-shaping STEK film at the studio", tag: "STEK film" },
  { src: "p91-lux-innova-hycross.webp", alt: "Toyota Innova Hycross detailed at P91", tag: "Innova Hycross" },
  { src: "p91-interior-steering-detail.webp", alt: "Interior steering wheel detailing", tag: "Interior detail" },
  { src: "p91-lux-bmw-3-series.webp", alt: "BMW 3 Series finished at P91 Car Care", tag: "BMW 3 Series" },
  { src: "p91-ceramic-door-finish.webp", alt: "Ceramic coated door finish", tag: "Ceramic finish" },
].map((p) => ({ ...p, src: G + p.src }));

const POSTS: { title: string; carousel: Carousel }[] = [
  { title: "PPF vs ceramic coating", carousel: PPF_VS_CERAMIC },
  { title: "How much PPF your car needs", carousel: PPF_COVERAGE },
  { title: "Where PPF comes from", carousel: PPF_ORIGIN },
  { title: "Monsoon and your paint", carousel: MONSOON_DAMAGE },
];
const slideSrc = (dir: string, n: number) => `/attached_assets/carousels/${dir}/${String(n + 1).padStart(2, "0")}.jpg`;

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const OPENS_AT: Record<string, string> = {
  "1-year-ceramic-coating": "/services/ceramic-coating-bangalore",
  "1-year-bike-ceramic-coating": "/services/ceramic-coating-bangalore",
};

/** A studio photo for services whose record has no image of its own, so a card is never a blank box. */
function offerImage(s: any): string {
  const own = Array.isArray(s.images) && typeof s.images[0] === "string" && s.images[0] ? s.images[0] : null;
  if (own) return own;
  const slug = String(s.slug);
  if (/glass|windshield/.test(slug)) return G + "p91-stek-rear-glass.webp";
  if (/headlight/.test(slug)) return G + "p91-lux-bmw-3-series.webp";
  if (/wash/.test(slug)) return G + "p91-ceramic-gloss-wipe.webp";
  if (/annual|maintenance/.test(slug)) return G + "p91-lux-mercedes-gle.webp";
  return G + "p91-lux-range-rover-evoque.webp";
}

/** Live discounts from the catalogue: biggest saving first, one card per PPF family. */
function currentOffers(services: ServiceRecord[] | undefined) {
  if (!Array.isArray(services)) return [];
  const seenPpf = new Set<string>();
  return (services as any[])
    .filter((s) => s?.isActive !== false && s.slug !== "premium-wash-detail")
    .map((s) => ({ s, price: Number(s.price), was: Number(s.originalPrice) }))
    .filter((o) => o.was > o.price && o.price > 0)
    .map((o) => ({ ...o, pct: Math.round(((o.was - o.price) / o.was) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .filter((o) => {
      const family = /ppf/i.test(o.s.slug) ? "ppf" : "";
      if (!family) return true;
      if (seenPpf.has(family)) return false;
      seenPpf.add(family);
      return true;
    })
    .slice(0, 6);
}

/** Mounts Instagram's own player only once the tile is near the screen, so 15 embeds don't load at once. */
function ReelEmbed({ id, topic }: { id: string; topic: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setNear(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="gl-embed" data-testid={`reel-embed-${id}`}>
      {near ? (
        <iframe src={reelEmbedUrl({ id } as any)} title={`Instagram reel: ${topic}`} loading="lazy" allowFullScreen />
      ) : (
        <a href={reelUrl({ id } as any)} target="_blank" rel="noopener noreferrer" className="gl-embed-ph">
          <SiInstagram aria-hidden="true" />
          <span>Loading reel…</span>
        </a>
      )}
    </div>
  );
}

export default function Gallery() {
  useSeoMeta({
    title: GALLERY_SEO.title,
    description: GALLERY_SEO.description,
    canonicalPath: "/gallery",
  });
  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });
  const offers = currentOffers(services);
  const [photo, setPhoto] = useState<(typeof STUDIO_PHOTOS)[number] | null>(null);
  const [post, setPost] = useState<(typeof POSTS)[number] | null>(null);

  return (
    <div className="p91x gl-page min-h-screen">
      <SiteHeader />

      <section className="gl-head">
        <div className="wrap gl-head-row">
          <div>
            <p className="ed-label">Gallery</p>
            <h1 className="sv-title">Our work, up close.</h1>
            <p className="sv-lede">
              Real cars, real footage, straight from the studio floor in Adugodi. Follow{" "}
              <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="ed-link">@{INSTAGRAM_HANDLE}</a>{" "}
              for the next one.
            </p>
          </div>
          <nav className="gl-jump" aria-label="On this page">
            <a href="#festival-offer" className="gl-jump-hot">Diwali offer</a>
            <a href="#watch">Watch</a>
            <a href="#offers">Offers</a>
            <a href="#posts">Posts</a>
            <a href="#studio">Studio</a>
            <a href="#reels">All reels</a>
          </nav>
        </div>
      </section>

      <FestivalOfferBanner />

      {/* ---- footage ---- */}
      <section id="watch" className="gl-dark">
        <div className="wrap">
          <div className="gl-sec-head">
            <h2>Watch the work</h2>
            <p>Straight from our reels. Plays as you scroll, no sound.</p>
          </div>
          <div className="gl-videos">
            {REEL_VIDEOS.map((v) => (
              <figure key={v.file} className="gl-video">
                <LazyVideo
                  src={`/attached_assets/reels/${v.file}-hero.mp4`}
                  poster={`/attached_assets/reels/${v.file}-gallery-poster.webp`}
                  testId={`gallery-video-${v.file}`}
                />
                <figcaption>
                  <strong>{v.label}</strong>
                  <span>{v.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---- offers ---- */}
      {offers.length > 0 && (
        <section id="offers" className="gl-light">
          <div className="wrap">
            <div className="gl-sec-head">
              <h2>Running right now</h2>
              <p>Live prices from our booking system, the same ones you pay at checkout.</p>
            </div>
            <div className="gl-offers">
              {offers.map(({ s, price, was, pct }) => {
                const img = offerImage(s);
                return (
                  <a key={s.id} href={OPENS_AT[s.slug] ?? `/service/${s.slug}`} className="gl-offer" data-testid={`offer-${s.slug}`}>
                    <span className="gl-offer-img">
                      <ImageWithFallback src={img} alt={s.title} sizes="(min-width: 900px) 360px, 90vw" width={720} height={450} />
                      <em className="gl-badge">{pct}% off</em>
                    </span>
                    <span className="gl-offer-body">
                      <strong>{s.title}</strong>
                      <span className="gl-price">
                        {rupees(price)} <s>{rupees(was)}</s>
                      </span>
                      <span className="gl-go">Book this →</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---- posts ---- */}
      <section id="posts" className="gl-dark">
        <div className="wrap">
          <div className="gl-sec-head">
            <h2>What we post</h2>
            <p>The guides we publish on Instagram. Tap one to flip through every slide.</p>
          </div>
          <div className="gl-posts">
            {POSTS.map((p) => (
              <button key={p.carousel.dir} type="button" className="gl-post" onClick={() => setPost(p)} data-testid={`post-${p.carousel.dir}`}>
                <img src={slideSrc(p.carousel.dir, 0)} alt={p.carousel.slides[0]} loading="lazy" width={1080} height={1350} />
                <span className="gl-post-cap">
                  <strong>{p.title}</strong>
                  <span>{p.carousel.slides.length} slides</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- studio ---- */}
      <section id="studio" className="gl-light">
        <div className="wrap">
          <div className="gl-sec-head">
            <h2>Inside the studio</h2>
            <p>Cars we have finished, and the work behind them.</p>
          </div>
          <div className="gl-masonry">
            {STUDIO_PHOTOS.map((p) => (
              <button key={p.src} type="button" className="gl-photo" onClick={() => setPhoto(p)}>
                <img src={p.src} alt={p.alt} loading="lazy" />
                <span>{p.tag}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- every reel ---- */}
      <section id="reels" className="gl-dark">
        <div className="wrap">
          <div className="gl-sec-head">
            <h2>Every reel</h2>
            <p>
              Most-liked first. Tap play on any of them, or open{" "}
              <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer">@{INSTAGRAM_HANDLE}</a>.
            </p>
          </div>
          <div className="gl-rail">
            {GALLERY_REELS.map((r) => (
              <ReelEmbed key={r.id} id={r.id} topic={r.topic} />
            ))}
          </div>
        </div>
      </section>

      <section className="gl-cta">
        <div className="wrap">
          <h2>Want your car in here next?</h2>
          <div className="gl-cta-row">
            <a href="/services" className="gl-btn gl-btn-solid">See services and book</a>
            <a href="https://wa.me/917406619191" target="_blank" rel="noopener noreferrer" className="gl-btn">WhatsApp us</a>
          </div>
        </div>
      </section>

      <SiteFooter />

      <Dialog open={photo !== null} onOpenChange={(o) => !o && setPhoto(null)}>
        <DialogContent className="max-w-[min(92vw,720px)] overflow-hidden rounded-2xl border-0 bg-black p-0">
          <DialogTitle className="sr-only">{photo?.alt}</DialogTitle>
          <DialogDescription className="sr-only">Studio photo</DialogDescription>
          {photo && <img src={photo.src} alt={photo.alt} className="max-h-[88vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>

      <Dialog open={post !== null} onOpenChange={(o) => !o && setPost(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[520px] overflow-hidden rounded-2xl border-0 bg-black p-0">
          <DialogTitle className="sr-only">{post?.title}</DialogTitle>
          <DialogDescription className="sr-only">Instagram post slides</DialogDescription>
          {post && (
            <div className="gl-slides">
              {post.carousel.slides.map((alt, i) => (
                <img key={i} src={slideSrc(post.carousel.dir, i)} alt={alt} loading={i < 2 ? "eager" : "lazy"} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
