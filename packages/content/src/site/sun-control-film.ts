import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq, hubFaq } from "./sources.ts";

/**
 * /services/sun-control-film. Sources (reshaped, not rewritten):
 * - SEO_PAGES[3] "glass-sun-control-film-bangalore" (seo-pages.ts:236): lede, includes, VLT/IR/TSER section, FAQs.
 * - /faq hub group "sun-control-film" (faq-page.ts:296).
 * - Legal-tint section: the figures are the ones Plan 2b sets (CMVR Rule 100); the caution sentences are the
 *   approved FAQ answers.
 * No price range: the catalogue has no active sun control film row yet. No hero photo: the window-film footage
 * in attached_assets is probably another installer's (photo catalogue), so none is used.
 */
const SEO = seoPage("glass-sun-control-film-bangalore");

export const SUN_CONTROL_FILM: ServiceContent = {
  family: null,
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/sun-control-film", label: "Sun control film" },
  ],
  eyebrow: "Heat and glare control · Adugodi",
  h1: "Sun control film in Bangalore",
  shortAnswer:
    "Sun control film is heat-rejection film for the cabin glass. Judge it by its TSER figure, not by how dark it looks, and check the legal VLT limits before it is fitted. It is a different job from windshield glass coating, the rain-repellent treatment, but people usually ask about both. [NEEDS: time in the studio]",
  hero: null,
  rangeNote: "Send a photo of your car on WhatsApp for the price of the film you choose. [NEEDS: a sun control film row in the catalogue, so the price range can be shown]",
  sections: [
    {
      h2: SEO.context.heading,
      paras: SEO.context.paragraphs ?? [],
    },
    {
      h2: "What the law allows",
      paras: [
        "Under Rule 100 of the Central Motor Vehicles Rules, the front and rear glass must let through at least 70% of visible light (VLT), and the side windows at least 50%.",
        "Automotive glazing and aftermarket film are subject to Indian motor vehicle regulations and court directions. A film's visible light transmission rating alone does not prove that installation is legally permitted, so confirm the current rules before you install.",
        "Ask for the VLT figure of the exact film before it is fitted, and keep the spec sheet in the car.",
      ],
    },
    {
      h2: "What the job includes",
      paras: [],
      bullets: SEO.includes.filter((i) => !/rain-repellent/i.test(i)),
    },
  ],
  faq: [
    hubFaq("sun-control-film", "What is the difference between IR rejection and TSER?"),
    seoFaq("glass-sun-control-film-bangalore", "Does darker film mean a cooler cabin?"),
    hubFaq("sun-control-film", "Is automotive sun film legal in Bangalore?"),
    seoFaq("glass-sun-control-film-bangalore", "What does windshield glass coating do?"),
  ],
  related: [
    { href: "/services/sun-control-film/windshield-glass-coating", label: "Windshield glass coating" },
    { href: "/guides/windshield-heat-rejection-film-summer", label: "Windshield heat rejection film: what the numbers mean" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
  ],
  labels: {
    pricesH2: "Sun control film price",
    pricesIntro: "The price depends on the film you choose.",
    faqH2: "Sun control film questions",
  },
};
