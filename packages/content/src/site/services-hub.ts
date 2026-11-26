import type { LinkItem, Photo } from "./types.ts";
import { FAQ_COMPARISON } from "../faq-page.ts";

/**
 * /services hub. Sources:
 * - h1 and lede: SERVICES_SEO (static-seo.ts:55) and apps/admin/src/pages/services.tsx:76-80. "Prices and
 *   availability are live, the same figures you will see at checkout" is dropped (owner, 26 Nov: no prices on the site).
 * - Card lines: SERVICE_GUIDE_LINKS / SERVICE_PRICE_LINKS notes (service-hub-links.ts) and the Home service lines
 *   (site/home.ts), with "live prices" wording dropped.
 * - "Which one do you need?": each row restates one approved line (FAQ_COMPARISON in faq-page.ts, the FAQ group
 *   answers, the service pages); no new claims.
 */
export type HubCard = { href: string; name: string; line: string; family: string | null; photo: Photo | null };
export type HubGroup = { h2: string; intro: string; cards: HubCard[] };

export const SERVICES_HUB = {
  h1: "All services",
  lede: "Pick your vehicle and what it needs. Each service page explains what the job involves and what makes it cost more or less.",
  about: [
    "Everything below is done at the studio in Adugodi, next to Koramangala: paint protection film, ceramic coating, interior and exterior detailing, glass film and headlight restoration.",
    "Every car arrives in a different state, so the work, and what it costs, is set for your car. Send a photo of your car on WhatsApp and we reply with what it needs and a quote.",
  ],
  groups: [
    {
      h2: "Paint protection",
      intro: "A clear urethane layer over your paint, so stone chips, grit and washing marks land on the film instead of the panel underneath.",
      cards: [
        { href: "/services/paint-protection-film", name: "Paint protection film", line: "How PPF works, what it covers, and every package.", family: "ppf", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
        { href: "/services/paint-protection-film/front", name: "Front PPF", line: "Bonnet, front bumper, headlamps and mirrors: the panels that take most stone chips.", family: null, photo: null },
        { href: "/services/paint-protection-film/matte", name: "Matte PPF", line: "Matte film gives a satin or matte look without repainting.", family: null, photo: null },
        { href: "/services/paint-protection-film/bike", name: "Bike PPF", line: "Paint protection film for motorcycles.", family: null, photo: null },
      ],
    },
    {
      h2: "Coating",
      intro: "Designed to enhance gloss, improve water repellency and simplify routine vehicle maintenance.",
      cards: [
        { href: "/services/ceramic-coating", name: "Ceramic coating", line: "What the coating does against borewell water and traffic film.", family: "ceramic-car", photo: { src: "/photos/ceramic-wipe-bonnet.webp", alt: "Applicator block wiping ceramic coating onto a bonnet", width: 720, height: 1280 } },
        { href: "/services/ceramic-coating/bike", name: "Bike ceramic coating", line: "The 1-year coating for motorcycles: tank, fairings and painted panels.", family: "ceramic-bike", photo: null },
      ],
    },
    {
      h2: "Detailing",
      intro: "Interior and exterior treatments designed to clean, restore and maintain your vehicle's appearance.",
      cards: [
        { href: "/services/exterior-detailing", name: "Exterior detailing", line: "Polishing, hard-water spots, headlights.", family: "exterior-detailing", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
        { href: "/services/interior-detailing", name: "Interior detailing", line: "Deep interior cleaning and rejuvenation.", family: "interior-detailing", photo: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 800, height: 1422 } },
        { href: "/services/paint-correction", name: "Paint correction", line: "Polishing to reduce swirl marks, light scratches and surface imperfections.", family: null, photo: null },
        { href: "/services/exterior-detailing/hard-water-spot-removal", name: "Hard water spot removal", line: "Borewell water marks lifted, or polished out when they have etched.", family: null, photo: null },
        { href: "/services/exterior-detailing/headlight-restoration", name: "Headlight restoration", line: "Hazy headlight lenses cleaned and restored.", family: "headlight-restoration", photo: null },
        { href: "/services/car-wash", name: "Car wash", line: "Hand wash and foam, done as detailing prep.", family: "car-wash", photo: null },
        { href: "/services/maintenance-plan", name: "Annual maintenance plan", line: "Washes and detailing sessions spread across the year.", family: "maintenance-plan", photo: null },
      ],
    },
    {
      h2: "Glass",
      intro: "Glass treatments and heat-rejection solutions, subject to applicable vehicle glazing regulations.",
      cards: [
        { href: "/services/sun-control-film", name: "Sun control film", line: "Heat and glare control for the cabin glass.", family: null, photo: null },
        { href: "/services/sun-control-film/windshield-glass-coating", name: "Windshield glass coating", line: "Rain beads up and clears off the windshield.", family: "windshield-glass-coating", photo: null },
      ],
    },
  ] satisfies HubGroup[],
  choose: {
    h2: "Which one do you need?",
    intro: "Start from what bothers you about the car. Many owners do both: film on the panels that take hits, coating over everything.",
    head: ["If you want", "Look at"],
    rows: [
      ["Protection from stone chips and parking scrapes", "Paint protection film"],
      ["More gloss and easier washing", "Ceramic coating"],
      ["Swirl marks, light scratches or dull paint gone", "Paint correction or exterior detailing"],
      ["Borewell water spots off the paint", "Hard water spot removal"],
      ["A clean, fresh cabin", "Interior detailing"],
      ["A cooler cabin and less glare", "Sun control film"],
      ["Rain clearing off the windshield", "Windshield glass coating"],
      ["Clear headlights again", "Headlight restoration"],
    ],
  },
  comparison: FAQ_COMPARISON,
  end: { title: "Not sure which one?", body: "Send a photo of your car on WhatsApp and we will tell you what it needs." },
  links: [
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
    { href: "/faq", label: "PPF and ceramic coating FAQs" },
  ] satisfies LinkItem[],
};
