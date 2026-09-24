/**
 * Which photograph each service shows — and, just as important, which it does NOT.
 *
 * WHY THIS EXISTS. The catalogue rows in the database point at images that are not P91 work:
 * AI-style renders (attached_assets/services/*.webp — identical model technicians, green-lit
 * studio), stock photos, and a third-party company's photos, all of them captioned on the site
 * as "… at the P91 Car Care studio". Fixing that at the source means editing production rows,
 * which this project does with reviewed --apply scripts, not from the front end. So the
 * front end says, per slug, what the row's `images` should be for display, and everything that
 * reads services (cards, service pages, the booking modal, campaign pages, JSON-LD) gets it
 * through one place: lib/queryClient.ts calls applyRealServiceImages() on the two service GETs.
 * The API and the database are untouched.
 *
 * THE RULE. Every path below is a still taken from P91's own footage or photographs
 * (attached_assets/gallery/, extracted with ffmpeg from the studio's PPF-fitting, ceramic and
 * polishing reels, or the studio's own before photo of a customer car). A slug mapped to [] has
 * NO suitable real image yet: the row then shows no picture at all — a typographic card, a
 * text-led hero, no banner in the booking modal — rather than an invented one.
 *
 * Slugs that are not listed here are left exactly as the database has them. That is the work
 * still to do (glass, headlights, sun-control films, the wash packages, the maintenance
 * package): see the hand-off notes for the list and what real image each one needs.
 *
 * Admin note: for a mapped slug this list wins over whatever the admin panel stores as its
 * images. To use a different photo, change it HERE.
 */

// Studio delivery stills of real customer cars (the studio's own Instagram stories, cropped to the
// car: overlay captions and readable number plates cut out). Luxury / premium vehicles first.
const LUX = {
  rangeRover: "/attached_assets/gallery/p91-lux-range-rover-evoque.webp",
  mercedes: "/attached_assets/gallery/p91-lux-mercedes-gle.webp",
  gtr: "/attached_assets/gallery/p91-lux-nissan-gtr.webp",
  innova: "/attached_assets/gallery/p91-lux-innova-hycross.webp",
  xuv: "/attached_assets/gallery/p91-lux-xuv700.webp",
  bmw: "/attached_assets/gallery/p91-lux-bmw-3-series.webp",
  vellfire: "/attached_assets/gallery/p91-lux-vellfire.webp",
};

const PPF_FITTING = "/attached_assets/gallery/p91-ppf-fitting.webp";
const PPF_FILM_LIFT = "/attached_assets/gallery/p91-ppf-film-lift.webp";
const PPF_EDGE_TRIM = "/attached_assets/gallery/p91-ppf-edge-trim.webp";

// Three real PPF stills for nine PPF rows. Rotated so the three body types within a tier
// differ, and the same body type differs across tiers — the most variety the real assets allow.
// More PPF photographs would let these stop repeating; see the hand-off notes.
const PPF_ROTATION: Record<string, string[]> = {
  a: [LUX.rangeRover, PPF_FILM_LIFT, PPF_EDGE_TRIM, PPF_FITTING],
  b: [LUX.gtr, PPF_EDGE_TRIM, PPF_FITTING, PPF_FILM_LIFT],
  c: [LUX.vellfire, PPF_FITTING, PPF_FILM_LIFT, PPF_EDGE_TRIM],
};

export const REAL_SERVICE_IMAGES: Record<string, string[]> = {
  // ---- PPF ----
  "ppf-hatchback": PPF_ROTATION.a,
  "ppf-sedan": PPF_ROTATION.b,
  "ppf-suv": PPF_ROTATION.c,
  "ppf-premium-hatchback": PPF_ROTATION.b,
  "ppf-premium-sedan": PPF_ROTATION.c,
  "ppf-premium-suv": PPF_ROTATION.a,
  "partial-ppf-hatchback": PPF_ROTATION.c,
  "partial-ppf-sedan": PPF_ROTATION.a,
  "partial-ppf-suv": PPF_ROTATION.b,

  // ---- Ceramic ----
  "1-year-ceramic-coating": [
    LUX.mercedes,
    "/attached_assets/gallery/p91-ceramic-gloss-wipe.webp",
    "/attached_assets/gallery/p91-ceramic-door-finish.webp",
    "/attached_assets/gallery/p91-ceramic-hood-wipe.webp",
  ],

  // ---- Detailing ----
  "exterior-detailing-hard-water-new": [
    "/attached_assets/gallery/p91-exterior-before-orange-hyundai.webp",
    "/attached_assets/about/p91-studio-nasiol-floor-orange-hyundai.webp",
    "/attached_assets/gallery/p91-polish-bonnet-gloss.webp",
  ],
  // ---- STEK sun-control film: stills from the studio's own window-film reel
  // (attached_assets/reels/stek-suncontrol-films-hero.mp4), handheld shop footage with the
  // studio's watermark. Three different stills per page, none shared between the two pages.
  "stek-suncontrol-films": [
    LUX.innova,
    "/attached_assets/gallery/p91-stek-film-squeegee.webp",
    "/attached_assets/gallery/p91-stek-heat-glove.webp",
    "/attached_assets/gallery/p91-stek-blade-trim.webp",
  ],
  "stek-windsheild-suncontrol-films": [
    "/attached_assets/gallery/p91-stek-film-edge.webp",
    "/attached_assets/gallery/p91-stek-rear-glass.webp",
    "/attached_assets/gallery/p91-stek-wall.webp",
  ],
};

/**
 * Services with NO authentic photograph. Since 2026-09-24 (premium/real-image pass) they show NO
 * picture: no AI render, no stock, no third-party image — a typographic layout instead (a depth panel
 * on the /services card, a text-led hero and overview). An entry here overrides whatever image the
 * database row stores; an empty list means "nothing to show". Add real photographs here as they exist.
 */
export const ILLUSTRATIVE_IMAGES: Record<string, string[]> = {
  "premium-car-wash-special": [],
  "annual-car-wash-package": [],
  "annual-maintenance-package": [],
  "headlight-restoration-both": [],
  "interior-detailing-service": [],
  "windshield-glass-coating-new": [],
  "windshield-glass-polishing": [],
  "1-year-bike-ceramic-coating": [],
  "premium-wash-detail": [],
};

/**
 * Services whose picture is an AI render, not a photograph of P91 work. Their alt text says so.
 */
export const ILLUSTRATIVE_SLUGS = new Set<string>([]); // no AI renders are shown any more

/** Alt text for a service picture: honest about what it is. */
export function serviceImageAlt(service: { title: string; slug?: string }): string {
  const title = service.title.trim();
  return service.slug && ILLUSTRATIVE_SLUGS.has(service.slug)
    ? `${title} (illustrative image)`
    : `${title} being carried out at P91 Car Care`;
}

/**
 * The /services/:slug guide pages: sharp, high-resolution pictures instead of whatever the linked
 * service rows carry (which for PPF and ceramic are 720px-wide video frames, stretched full-width
 * they read as blurry). Real studio photographs where a suitable sharp one exists; the realistic
 * AI render (flagged `illustrative`) where none does.
 */
/**
 * Each guide page gets its own hero composition, so the four pages no longer look like one template:
 *   split-light  white ground, picture left in a frame, large title right      (ceramic)
 *   split-dark   charcoal ground, title left, picture right in a frame          (PPF)
 *   banner       light ground, centred title, one wide picture beneath          (sun-control film)
 *   text         no picture: a large centred title on a soft green ground       (interior)
 * A guide with no entry keeps the original full-bleed photo hero. Framing the picture, rather than
 * stretching it edge to edge, also stops these 1000px-wide photos looking blurry on a wide screen.
 */
export type GuideLayout = "split-light" | "split-dark" | "banner" | "text";
export const GUIDE_LAYOUT: Record<string, GuideLayout> = {
  "ceramic-coating-bangalore": "split-light",
  "paint-protection-film-bangalore": "split-dark",
  "glass-sun-control-film-bangalore": "banner",
  "interior-detailing-bangalore": "text",
};

export const GUIDE_IMAGES: Record<string, { hero: string; collage: string[]; illustrative?: boolean }> = {
  "ceramic-coating-bangalore": { hero: LUX.mercedes, collage: [LUX.rangeRover, LUX.innova] },
  "paint-protection-film-bangalore": { hero: LUX.xuv, collage: [LUX.gtr, LUX.vellfire] },
  // Hero: the studio's STEK delivery of a Vellfire (sharper than the BMW frame); collage: its window-film footage.
  "glass-sun-control-film-bangalore": {
    hero: "/attached_assets/gallery/p91-lux-vellfire-wide.webp",
    collage: [
      "/attached_assets/gallery/p91-stek-film-squeegee.webp",
      "/attached_assets/gallery/p91-stek-heat-glove.webp",
      "/attached_assets/gallery/p91-stek-film-edge.webp",
    ],
  },
  // No real interior photograph: text only.
  "interior-detailing-bangalore": { hero: "", collage: [] },
};

/**
 * Hero videos, so these service pages open the way the PPF and ceramic ones do (a real clip
 * playing over the photos). Each is one of the studio's own phone reels in attached_assets/reels/;
 * the polishing reel suits exterior detailing, the window-film reel suits the two STEK sun-control
 * pages. Set for display only, like the images; the record's own heroVideo is left alone.
 */
const HERO_VIDEOS: Record<string, string> = {
  "exterior-detailing-hard-water-new": "/attached_assets/reels/car-polishing-hero.mp4",
  "stek-suncontrol-films": "/attached_assets/reels/stek-suncontrol-films-hero.mp4",
  "stek-windsheild-suncontrol-films": "/attached_assets/reels/stek-suncontrol-films-hero.mp4",
};

/**
 * Other fields on the same records that carry third-party or unverifiable material, blanked
 * for display. Before/after sets that are another company's photographs or web images, gallery
 * images that are the same renders, and a hero video that is a Rickroll.
 */
const CLEARED: Record<string, ("beforeAfter" | "gallery" | "heroVideo")[]> = {
  "1-year-ceramic-coating": ["beforeAfter", "gallery"],
  "1-year-bike-ceramic-coating": ["gallery"],
  "premium-wash-detail": ["beforeAfter", "gallery", "heroVideo"],
};

/**
 * Cards on /services that stay typographic although their SERVICE PAGE has images. Six PPF rows
 * would otherwise show three photographs over and over down the catalogue; the three Basic rows
 * keep a picture, the Premium and Partial rows let the type carry the card.
 */
export const CARD_IMAGE_HIDDEN = new Set<string>([
  "ppf-premium-hatchback", "ppf-premium-sedan", "ppf-premium-suv",
  "partial-ppf-hatchback", "partial-ppf-sedan", "partial-ppf-suv",
]);

/** True for the exact URL shapes that carry a service: the list, or one service by slug. */
function isServiceUrl(url: string): "list" | "one" | null {
  if (url === "/api/services") return "list";
  if (/^\/api\/services\/[^/?#]+$/.test(url)) return "one";
  return null;
}

function withReal<T extends { slug?: string; images?: string[] }>(s: T): T {
  if (!s || !s.slug) return s;
  const real = REAL_SERVICE_IMAGES[s.slug] ?? ILLUSTRATIVE_IMAGES[s.slug];
  const cleared = CLEARED[s.slug];
  const video = HERO_VIDEOS[s.slug];
  if (!real && !cleared && !video) return s;
  const out: any = { ...s };
  if (real) out.images = real;
  if (video) out.heroVideo = video;
  for (const field of cleared ?? []) out[field] = field === "heroVideo" ? "" : [];
  return out;
}

/**
 * Applied to the parsed JSON of the two service GETs and nothing else. Anything that is not
 * a service payload (admin routes, bookings, settings) passes through untouched.
 */
export function applyRealServiceImages(url: string, data: unknown): unknown {
  const kind = isServiceUrl(url);
  if (kind === "list" && Array.isArray(data)) return data.map((s) => withReal(s));
  if (kind === "one" && data && typeof data === "object" && !Array.isArray(data)) return withReal(data as any);
  return data;
}
