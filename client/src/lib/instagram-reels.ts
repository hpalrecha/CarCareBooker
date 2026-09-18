/**
 * The studio's own Instagram reels (@p91carcare), and which pages each one belongs on.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * PROVENANCE. Every entry below was read from its public embed page on 2026-09-17: the
 * account is p91carcare, the embed loads, and `headline` is the reel's OWN caption opening,
 * quoted — not a line written for the site. Nothing here claims more than the reel shows.
 *
 * MAPPING RULE. A reel is attached to a page only when its caption is about that page's
 * service. There is no car-PPF reel among these, so the car PPF pages carry none rather than
 * borrowing the motorcycle one; headlight, glass-coating and interior pages likewise.
 *
 * TO ADD A REEL: copy its id from instagram.com/reel/<id>/, quote the caption's first line,
 * and add its id to the pages it genuinely shows. Replaced the unverified YouTube shorts on
 * /ppf-ceramic-coating, which were not confirmed to be the studio's own work.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export const INSTAGRAM_HANDLE = "p91carcare";
export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/p91carcare/";

export interface InstagramReel {
  id: string;
  /** The caption's opening line, quoted as posted. */
  headline: string;
  /** What the reel shows, in a few plain words — used as the accessible label. */
  topic: string;
  /** ISO date posted. */
  posted: string;
}

export const REELS = {
  ceramicMonsoon: {
    id: "Dc8N-qdDiLm",
    headline: "Monsoon outside. Protection on.",
    topic: "How P91 ceramic coating changes the way water behaves on a car",
    posted: "2026-09-06",
  },
  ceramicWater: {
    id: "DciryBCjLvC",
    headline: "Water tried to stay. Ceramic said no.",
    topic: "Water beading off a ceramic-coated car",
    posted: "2026-08-27",
  },
  bikePpf: {
    id: "DdBlZC_mxWJ",
    headline: "Give your ride the ultimate glow-up!",
    topic: "An Ultraviolette F77 motorcycle: deep wash, polish and high-gloss PPF",
    posted: "2026-09-08",
  },
  windowFilm: {
    id: "DclQq-Pijvy",
    headline: "The sun can follow you. The heat doesn't have to.",
    topic: "Premium window films fitted at the studio",
    posted: "2026-08-28",
  },
  scratchRemoval: {
    id: "DdGUDrkD577",
    headline: "Bring back your car's clean, glossy finish.",
    topic: "Scratch removal and car detailing",
    posted: "2026-09-10",
  },
  phShampoo: {
    id: "DdGu4eKDRw2",
    headline: "Give your ride the care it deserves.",
    topic: "A wash with pH-balanced shampoo for a deep, glossy finish",
    posted: "2026-09-10",
  },
  detailingReset: {
    id: "Dca9mVzAN_9",
    headline: "Your car doesn't need another wash. It needs a reset.",
    topic: "Professional car detailing",
    posted: "2026-08-24",
  },
  rightService: {
    id: "Dc3SH_2EtWO",
    headline: "Good car care shouldn't feel expensive.",
    topic: "Choosing the service your car actually needs",
    posted: "2026-09-04",
  },
  oneLessStress: {
    id: "DcyIoXDj72u",
    headline: "Traffic is stressful enough. Your car shouldn't be.",
    topic: "Protection, detailing and upkeep handled by the studio",
    posted: "2026-09-02",
  },
} satisfies Record<string, InstagramReel>;

/** /service/:slug → reels that show that service. */
export const REELS_BY_SERVICE: Record<string, InstagramReel[]> = {
  "1-year-ceramic-coating": [REELS.ceramicWater, REELS.ceramicMonsoon],
  "1-year-bike-ceramic-coating": [REELS.bikePpf],
  "stek-suncontrol-films": [REELS.windowFilm],
  "stek-windsheild-suncontrol-films": [REELS.windowFilm],
  "car-polishing": [REELS.scratchRemoval],
  "exterior-detailing-hard-water-new": [REELS.phShampoo, REELS.scratchRemoval],
  "annual-maintenance-package": [REELS.detailingReset, REELS.oneLessStress],
};

/** /blog/:slug → reels that illustrate the article's subject. */
export const REELS_BY_POST: Record<string, InstagramReel[]> = {
  "ppf-vs-ceramic-coating-bangalore": [REELS.ceramicWater, REELS.bikePpf],
  "hard-water-spot-removal-bangalore": [REELS.ceramicWater, REELS.phShampoo],
  "windshield-heat-rejection-film-summer": [REELS.windowFilm],
  "monsoon-damage-car-bangalore": [REELS.ceramicMonsoon],
};

/** The /ppf-ceramic-coating page: its protection and coating work. */
export const REELS_FOR_PPF_CERAMIC_PAGE: InstagramReel[] = [
  REELS.ceramicWater,
  REELS.ceramicMonsoon,
  REELS.bikePpf,
  REELS.scratchRemoval,
];

export function reelUrl(reel: InstagramReel): string {
  return `https://www.instagram.com/reel/${reel.id}/`;
}

export function reelEmbedUrl(reel: InstagramReel): string {
  return `https://www.instagram.com/reel/${reel.id}/embed/`;
}
