import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq } from "./sources.ts";

/**
 * /services/interior-detailing. Source: SEO_PAGES[2] "interior-detailing-bangalore" (seo-pages.ts:191): lede,
 * includes, the Bangalore section and its 3 FAQs, reshaped onto the service template.
 */
const SEO = seoPage("interior-detailing-bangalore");

export const INTERIOR: ServiceContent = {
  family: "interior-detailing",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
  ],
  eyebrow: "Vacuum · Steam · Fabric and leather · Adugodi",
  h1: "Car interior detailing in Bangalore",
  shortAnswer:
    "Seats shampooed, vents cleared, leather conditioned and the cabin deodorised: a full reset of the space you sit in. At P91 interior detailing costs {range}. Most cars take a few hours, because the upholstery has to dry properly before the car goes back out.",
  hero: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 800, height: 1422 },
  rangeNote: "[NEEDS: what moves the interior detailing price, for example car size or cabin condition]",
  sections: [
    {
      h2: SEO.context.heading,
      paras: SEO.context.paragraphs ?? [],
    },
    {
      h2: "What the job includes",
      paras: [],
      bullets: SEO.includes,
    },
  ],
  faq: [
    seoFaq("interior-detailing-bangalore", "How long does interior detailing take?"),
    seoFaq("interior-detailing-bangalore", "Will it remove smoke or pet odour?"),
    seoFaq("interior-detailing-bangalore", "Are the products safe for leather?"),
  ],
  related: [
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/car-wash", label: "Car wash" },
    { href: "/services/maintenance-plan", label: "Annual maintenance plan" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/gallery", label: "See our work" },
  ],
  labels: {
    faqH2: "Interior detailing questions",
  },
};
