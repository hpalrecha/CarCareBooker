/**
 * Content for the three brand pages (/products/stek, /products/nasiol, /products/p91-premium-ppf).
 *
 * SOURCING RULE. Nothing here is written from imagination. Each statement comes from one of:
 *   - the manufacturer's own official website, read 2026-09-24 (marked "official"),
 *   - wording P91 already publishes on this site (nav menu, service catalogue, landing pages), or
 *   - the fact that P91 fits the product in its Adugodi studio.
 * No technical specification, certification, warranty term, factory or distribution detail appears
 * unless one of those sources states it. In particular, NOTHING in this project or on the site says
 * where or how P91 Premium PPF is manufactured or distributed, so that page says none of it. When
 * the studio supplies that material (and photographs of it), add it here.
 *
 * Images are P91's own studio photographs and reel stills (attached_assets/gallery, /about).
 */
export interface BrandImage {
  src: string;
  alt: string;
  caption: string;
}

export interface BrandPage {
  slug: "stek" | "nasiol" | "p91-premium-ppf";
  name: string;
  /** Short mono label above the name. */
  label: string;
  /** One line under the name. */
  line: string;
  /** Meta title / description. */
  title: string;
  description: string;
  /** "What it is" paragraph(s). */
  about: string[];
  /** What P91 fits, each with the page that books it. */
  fits: { name: string; note: string; href: string }[];
  /** Benefits, concise. */
  benefits: { title: string; body: string }[];
  /** Real images: the first is the hero. */
  images: BrandImage[];
  /** Manufacturer site, for the "full information" link. Omitted for our own brand. */
  official?: { label: string; href: string };
  /** Primary booking link. */
  book: { label: string; href: string };
}

const G = "/attached_assets/gallery/";

export const BRAND_PAGES: BrandPage[] = [
  {
    slug: "stek",
    name: "STEK",
    label: "Brand / STEK",
    line: "Paint protection film and window film, fitted in our Adugodi studio.",
    title: "STEK PPF & Sun Control Film in Bangalore | P91 Car Care",
    description:
      "P91 Car Care fits STEK paint protection film and sun-control window film in Adugodi, Bangalore, backed by the manufacturer's written warranty.",
    about: [
      "STEK India describes itself as a provider of premium paint protection film and window tinting solutions. P91 Car Care fits both at the studio in Adugodi: paint protection film for the body, and sun-control film for the glass.",
      "Warranty on any STEK job is the manufacturer's, issued in writing at handover. Ask to see the batch details before work starts.",
    ],
    fits: [
      { name: "Paint protection film", note: "Full and partial coverage for hatchbacks, sedans and SUVs.", href: "/services/paint-protection-film-bangalore" },
      { name: "Sun-control film, full car", note: "Front, side and rear glass.", href: "/service/stek-suncontrol-films" },
      { name: "Sun-control film, windshield", note: "The windshield only.", href: "/service/stek-windsheild-suncontrol-films" },
    ],
    benefits: [
      { title: "Gloss and matte finishes", body: "Film that keeps the paint as it is, or changes the finish, without touching the original paint." },
      { title: "Self-healing film", body: "Light marks in the film's surface disappear, so the finish stays clean." },
      { title: "Heat and glare control", body: "Sun-control film for the glass: a cooler cabin without changing how the car looks." },
    ],
    images: [
      { src: `${G}p91-lux-nissan-gtr.webp`, alt: "A white Nissan GT-R with a black bonnet in front of a STEK wall in the P91 studio", caption: "Nissan GT-R · STEK PPF" },
      { src: `${G}p91-lux-vellfire.webp`, alt: "A white Toyota Vellfire protected with STEK PPF in the P91 studio", caption: "Toyota Vellfire · STEK PPF" },
      { src: `${G}p91-stek-film-squeegee.webp`, alt: "A hand squeegeeing window film onto a car window during a STEK film fitting", caption: "Window film fitting" },
      { src: `${G}p91-lux-innova-hycross.webp`, alt: "A white Toyota Innova Hycross with STEK ForceShield PPF in the P91 studio", caption: "Innova Hycross · STEK ForceShield" },
    ],
    official: { label: "Visit STEK India", href: "https://stek-india.in/" },
    book: { label: "See PPF at P91", href: "/services/paint-protection-film-bangalore" },
  },
  {
    slug: "nasiol",
    name: "Nasiol",
    label: "Brand / Nasiol",
    line: "Nano-ceramic coating from Turkey, applied in our Adugodi studio.",
    title: "Nasiol Ceramic Coating in Bangalore | P91 Car Care",
    description:
      "P91 Car Care applies Nasiol nano-ceramic coating to cars and motorcycles in Adugodi, Bangalore, with the manufacturer's written warranty.",
    about: [
      "Nasiol is a nano-coating manufacturer from Turkey. Its coatings are made to repel water, oil and stains, and to protect a surface from scratches, UV and chemicals.",
      "P91 Car Care applies Nasiol ceramic coating to cars and motorcycles at the studio. Warranty on any Nasiol job is the manufacturer's, issued in writing at handover.",
    ],
    fits: [
      { name: "Ceramic coating for cars", note: "Paint correction, then a ceramic layer.", href: "/services/ceramic-coating-bangalore" },
      { name: "Ceramic coating for motorcycles", note: "Tank, fairings and painted panels.", href: "/services/ceramic-coating-bangalore" },
    ],
    benefits: [
      { title: "Water and stain repellent", body: "Water beads and rolls off, and dirt has less to hold on to." },
      { title: "Scratch, UV and chemical resistant", body: "A hard surface layer over the paint that takes the daily wear." },
      { title: "Easy to keep clean", body: "A slick surface, so washes are quicker and the gloss lasts." },
    ],
    images: [
      { src: `${G}p91-lux-mercedes-gle.webp`, alt: "A white Mercedes GLE in the P91 studio in front of a Nasiol India wall", caption: "Mercedes GLE · Nasiol ceramic" },
      { src: "/attached_assets/about/p91-studio-nasiol-floor-orange-hyundai.webp", alt: "A finished orange Hyundai hatchback in the P91 studio under linear lights, in front of a Nasiol India wall logo", caption: "Finished hatchback" },
      { src: `${G}p91-ceramic-gloss-wipe.webp`, alt: "A gloved hand wiping a coated panel during a ceramic coating application", caption: "Application" },
      { src: `${G}p91-ceramic-door-finish.webp`, alt: "A hand checking the finish on a white car door after ceramic coating", caption: "Finish check" },
    ],
    official: { label: "Visit Nasiol", href: "https://www.nasiol.in/" },
    book: { label: "See ceramic coating at P91", href: "/services/ceramic-coating-bangalore" },
  },
  {
    slug: "p91-premium-ppf",
    name: "P91 Premium PPF",
    label: "Our own brand / P91 Premium PPF",
    line: "Our own paint protection film line, fitted in-studio.",
    title: "P91 Premium PPF: Our Own Paint Protection Film | P91 Car Care",
    description:
      "P91 Premium PPF is P91 Car Care's own paint protection film line, fitted at the Adugodi studio in Basic, Premium and Partial packages for hatchbacks, sedans and SUVs.",
    about: [
      "P91 Premium PPF is P91 Car Care's own paint protection film line. It is fitted at our Adugodi studio, and it is the film behind the P91 PPF packages.",
      "The packages are Basic, Premium and Partial, each priced for hatchbacks, sedans and SUVs. Current prices and what each one includes are on the PPF page, and they are the same figures used when you book.",
    ],
    fits: [
      { name: "Full-body PPF packages", note: "Basic and Premium, for hatchbacks, sedans and SUVs.", href: "/services/paint-protection-film-bangalore" },
      { name: "Partial PPF packages", note: "The panels that take the most impacts.", href: "/services/paint-protection-film-bangalore" },
    ],
    benefits: [
      { title: "Stone chips hit the film", body: "The bonnet, bumper and mirror backs take low-level impacts on the film instead of the clearcoat." },
      { title: "Self-healing film", body: "Light marks in the film's surface disappear, so the finish stays clean." },
      { title: "Fitted and warranty-backed", body: "Fitted at the studio, with the warranty terms handed over with the car." },
    ],
    images: [
      { src: `${G}p91-lux-range-rover-evoque.webp`, alt: "A white Range Rover Evoque in the P91 studio, protected with P91 Premium PPF", caption: "Range Rover Evoque · P91 Premium PPF" },
      { src: `${G}p91-lux-mg-comet-ev.webp`, alt: "A teal MG Comet EV with a P91 Car Care plate in the P91 studio, fitted with full-body PPF", caption: "MG Comet EV · full-body PPF" },
      { src: `${G}p91-lux-maruti-swift.webp`, alt: "A red Maruti Swift with a P91 Car Care plate in the P91 studio, after P91 PPF", caption: "Maruti Swift · P91 PPF" },
      { src: `${G}p91-ppf-fitting.webp`, alt: "A P91 technician fitting clear paint protection film on the rear door of a black car", caption: "Film fitting" },
    ],
    book: { label: "See P91 PPF packages", href: "/services/paint-protection-film-bangalore" },
  },
];

export function getBrandPage(slug: string | undefined): BrandPage | undefined {
  return BRAND_PAGES.find((b) => b.slug === slug);
}
