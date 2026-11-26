import type { BrandContent, LinkItem, Photo } from "./types.ts";
import { BRAND_PAGES } from "../brand-pages.ts";
import { PRODUCTS_HERO, PRODUCT_KIND, PRODUCT_CHOOSE, PRODUCTS_CHOOSE_HEADING } from "../products-page-data.ts";
import { WARRANTY_HANDOVER_LINE, WARRANTY_BATCH_LINE, impliesManufacturerWarranty } from "../warranty-wording.ts";
import { remapLinks, remapPath } from "./link-map.ts";
import { BRAND_MORE } from "./brand-more.ts";

/**
 * /brands and /brands/<slug> (Plan 2b Task 4), built from BRAND_PAGES (brand-pages.ts:49, :80, :110) and
 * products-page-data.ts. Changes, all mechanical and listed in 2b-review-CD.md:
 * - Every sentence naming the manufacturer as the warranty issuer (brand-pages.ts:55, :58, :86, :89) is replaced
 *   by the approved handover line (warranty-wording.ts).
 * - P91 Premium PPF: "Current prices ... the same figures apply when you book" is cut (no prices on the site).
 * - Links remapped through link-map.ts. Hero photos are verified P91 photos (never attached_assets/gallery/p91-stek-*):
 *   STEK = the Creta, Nasiol = the GLE at the Nasiol wall, P91 Premium PPF = a P91 fitting shot.
 * - "How to check it is genuine" steps are the Home page's genuine-film steps (PPF brands) and the batch line (Nasiol).
 * - 26 Nov 2026 (owner: brand pages to ~800 words): the longer sections, genuine-check intro and FAQs come from brand-more.ts.
 */
const HERO: Record<string, Photo> = {
  stek: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio beside the STEK wall", width: 3420, height: 1925 },
  nasiol: { src: "/photos/gle-nasiol-wall.webp", alt: "White Mercedes-Benz GLE in front of the Nasiol wall in the P91 studio", width: 1084, height: 911 },
  "p91-premium-ppf": { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 },
};

const FILM_GENUINE = [
  "The sealed roll, with the brand label and batch number, shown before work starts.",
  "The exact panels the quote covers, marked on your car.",
  "Written warranty terms with that batch number, at handover.",
];

const USED_IN: Record<string, LinkItem[]> = {
  stek: [
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/services/paint-protection-film/front", label: "Front PPF" },
    { href: "/services/sun-control-film", label: "Sun control film" },
  ],
  nasiol: [
    { href: "/services/ceramic-coating", label: "Ceramic coating for cars" },
    { href: "/services/ceramic-coating/bike", label: "Ceramic coating for bikes" },
  ],
  "p91-premium-ppf": [
    { href: "/services/paint-protection-film", label: "Full-body PPF" },
    { href: "/services/paint-protection-film/front", label: "Front PPF" },
  ],
};

function cleanSentence(s: string): string {
  return s
    .split(/(?<=[.!?])\s+/)
    .map((x) => (impliesManufacturerWarranty(x) || /warranty on any .* is the manufacturer/i.test(x) ? WARRANTY_HANDOVER_LINE : x))
    .filter((x) => !/Current prices|same figures apply when you book/i.test(x))
    .join(" ");
}

export const BRANDS: Record<string, BrandContent> = Object.fromEntries(
  BRAND_PAGES.map((b) => {
    const about = b.about.map(cleanSentence).map((p) => p.replace(/(Written warranty terms provided at handover\.)\s+Ask to see the batch details before work starts\./, `$1 ${WARRANTY_BATCH_LINE}`));
    const content: BrandContent = {
      name: b.name,
      h1: b.slug === "p91-premium-ppf" ? "P91 Premium PPF, our own film line" : `${b.name} at P91 Car Care, Bangalore`,
      line: b.line,
      hero: HERO[b.slug],
      about: about.map(remapLinks),
      // "Partial PPF packages" pointed at the general PPF guide; on the new site partial coverage has its own page.
      fits: b.fits.map((f) => `[${f.name}](${/^Partial/.test(f.name) ? "/services/paint-protection-film/front" : remapPath(f.href)}): ${f.note}`),
      benefits: b.benefits.map((x) => `**${x.title}.** ${x.body}`),
      genuine: b.slug === "nasiol" ? [WARRANTY_BATCH_LINE, WARRANTY_HANDOVER_LINE] : FILM_GENUINE,
      usedIn: USED_IN[b.slug],
      official: b.official ? { href: b.official.href, label: b.official.label } : null,
      ...BRAND_MORE[b.slug],
    };
    return [b.slug, content];
  }),
);

/** /brands hub: PRODUCTS_HERO, PRODUCT_KIND and PRODUCT_CHOOSE (products-page-data.ts:7-26), links remapped. */
export const BRANDS_HUB = {
  h1: "Brands we fit",
  lede: PRODUCTS_HERO.lede,
  intro: [
    "P91 Car Care fits three product lines at the studio in Adugodi: STEK paint protection film and sun-control film, Nasiol nano-ceramic coating, and P91 Premium PPF, the studio's own film line.",
    "A brand on a quote only means something if you can check it on the car. Before film or coating goes on, you can see the product, its brand label and batch details, and at handover you get the written warranty terms. Ask for the exact product line, not just the brand name: one brand can sell several films with different thickness, finish and warranty terms.",
    "Each brand page below explains what the product is, where the studio uses it, and how to check that what goes on your car is genuine.",
  ],
  cards: BRAND_PAGES.map((b) => ({ href: `/brands/${b.slug}`, name: b.name, kind: PRODUCT_KIND[b.slug], line: b.line, photo: HERO[b.slug] })),
  chooseH2: PRODUCTS_CHOOSE_HEADING,
  choose: PRODUCT_CHOOSE.map((c) => ({ need: c.need, answer: c.answer, href: remapPath(c.href), label: c.label })),
  help: "Not sure? Send a photo of your car on WhatsApp and we will tell you what it needs.",
};
