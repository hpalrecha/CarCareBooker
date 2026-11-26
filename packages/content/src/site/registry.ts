import type { PageEntry } from "./types.ts";
import { HOME } from "./home.ts";
import { PPF } from "./paint-protection-film.ts";
import { CERAMIC } from "./ceramic-coating.ts";
import { CERAMIC_BIKE } from "./ceramic-coating-bike.ts";
import { SUN_CONTROL_FILM } from "./sun-control-film.ts";
import { INTERIOR } from "./interior-detailing.ts";
import { EXTERIOR } from "./exterior-detailing.ts";
import { SERVICES_HUB } from "./services-hub.ts";
import { PPF_MATTE } from "./ppf-matte.ts";
import { PPF_FRONT } from "./ppf-front.ts";
import { PPF_BIKE } from "./ppf-bike.ts";
import { PAINT_CORRECTION } from "./paint-correction.ts";
import { HEADLIGHT } from "./headlight-restoration.ts";
import { HARD_WATER } from "./hard-water.ts";
import { GLASS_COATING } from "./windshield-glass-coating.ts";
import { MAINTENANCE_PLAN } from "./maintenance-plan.ts";
import { CAR_WASH } from "./car-wash.ts";

export const PAGES: PageEntry[] = [
  {
    path: "/",
    title: "PPF and Ceramic Coating in Bangalore | P91 Car Care",
    description: "STEK paint protection film and Nasiol ceramic coating in Adugodi, next to Koramangala. Real studio work, Google reviews and written warranty terms.",
    lastmod: "2026-11-26",
    changefreq: "weekly",
    content: HOME,
  },
  {
    path: "/services/paint-protection-film",
    title: "Paint Protection Film (PPF) in Bangalore | P91",
    description: "STEK and P91 Premium PPF in Bangalore: what moves the cost, front or full body, the 5-step fitting process, warranty terms and real jobs from our studio.",
    lastmod: "2026-11-26",
    content: PPF,
  },
  {
    path: "/services",
    title: "All Car Detailing Services in Bangalore | P91 Car Care",
    description: "Every P91 Car Care service in one place: PPF, ceramic coating, interior and exterior detailing, glass film and headlight restoration in Adugodi.",
    lastmod: "2026-11-26",
    content: SERVICES_HUB,
  },
  {
    path: "/services/ceramic-coating",
    title: "Ceramic Coating in Bangalore | P91 Car Care",
    description: "Nano-ceramic coating with machine paint correction in Adugodi, Bangalore: what the job includes, studio time, aftercare and how borewell water marks paint.",
    lastmod: "2026-11-26",
    content: CERAMIC,
  },
  {
    path: "/services/ceramic-coating/bike",
    title: "Bike Ceramic Coating in Bangalore | P91 Car Care",
    description: "1-year ceramic coating for motorcycles in Adugodi, Bangalore: tank, fairings and painted panels. What it does, studio time, washing advice and answers.",
    lastmod: "2026-11-26",
    content: CERAMIC_BIKE,
  },
  {
    path: "/services/sun-control-film",
    title: "Sun Control Film in Bangalore | P91 Car Care",
    description: "Heat-rejection sun control film fitted in Adugodi, Bangalore: what VLT, IR and TSER mean, the legal VLT limits, and what the job includes.",
    lastmod: "2026-11-26",
    content: SUN_CONTROL_FILM,
  },
  {
    path: "/services/interior-detailing",
    title: "Car Interior Detailing in Bangalore | P91 Car Care",
    description: "Deep interior cleaning in Adugodi, Bangalore: seat shampoo, dashboard and vents, leather conditioning and odour removal. What is included and how to keep it.",
    lastmod: "2026-11-26",
    content: INTERIOR,
  },
  {
    path: "/services/exterior-detailing",
    title: "Exterior Detailing in Bangalore | P91 Car Care",
    description: "Exterior detailing in Adugodi, Bangalore: decontamination, polishing and hard-water spot removal. What it fixes, what it cannot, and before and after.",
    lastmod: "2026-11-26",
    content: EXTERIOR,
  },
  {
    path: "/services/paint-protection-film/matte",
    title: "Matte PPF in Bangalore | P91 Car Care",
    description: "Matte paint protection film in Adugodi, Bangalore: turn gloss paint satin or protect factory matte paint. Coverage choices, care rules and what to ask.",
    lastmod: "2026-11-26",
    content: PPF_MATTE,
  },
  {
    path: "/services/paint-protection-film/front",
    title: "Front PPF in Bangalore: Partial or Full Front | P91",
    description: "Front PPF in Adugodi, Bangalore: partial front or full front end, where stone chips land, what moves the price and what to ask before agreeing coverage.",
    lastmod: "2026-11-26",
    content: PPF_FRONT,
  },
  {
    path: "/services/paint-protection-film/bike",
    title: "Bike PPF in Bangalore | P91 Car Care",
    description: "Paint protection film for motorcycles in Adugodi, Bangalore: tank and fairing protection, gloss or matte film, film vs coating, and riding with film on.",
    lastmod: "2026-11-26",
    content: PPF_BIKE,
  },
  {
    path: "/services/paint-correction",
    title: "Paint Correction in Bangalore | P91 Car Care",
    description: "Machine paint correction in Adugodi, Bangalore: swirl marks, light scratches and water-spot etching polished out, what it cannot fix, and how to keep it.",
    lastmod: "2026-11-26",
    content: PAINT_CORRECTION,
  },
  {
    path: "/services/exterior-detailing/headlight-restoration",
    title: "Headlight Restoration in Bangalore | P91 Car Care",
    description: "Headlight restoration in Adugodi, Bangalore: yellow, cloudy lenses cleared and sealed with a UV coating. What it fixes, what it cannot, and aftercare.",
    lastmod: "2026-11-26",
    content: HEADLIGHT,
  },
  {
    path: "/services/exterior-detailing/hard-water-spot-removal",
    title: "Hard Water Spot Removal in Bangalore | P91 Car Care",
    description: "Borewell water spots removed in Adugodi, Bangalore: surface deposits washed off, etched spots polished out, and the drying habit that stops them coming back.",
    lastmod: "2026-11-26",
    content: HARD_WATER,
  },
  {
    path: "/services/sun-control-film/windshield-glass-coating",
    title: "Windshield Glass Coating in Bangalore | P91 Car Care",
    description: "Rain-repellent windshield glass coating in Adugodi, Bangalore: how it works, how long it lasts, polishing first, wipers and care for coated glass.",
    lastmod: "2026-11-26",
    content: GLASS_COATING,
  },
  {
    path: "/services/maintenance-plan",
    title: "Annual Car Maintenance Plan in Bangalore | P91",
    description: "A year of car washes, interior and exterior sessions in one booking at P91 Car Care, Adugodi. What the plan includes, who it suits and what it leaves out.",
    lastmod: "2026-11-26",
    content: MAINTENANCE_PLAN,
  },
  {
    path: "/services/car-wash",
    title: "Car Wash in Bangalore: Foam and Hand Wash | P91",
    description: "Hand car wash in Adugodi, Bangalore: foam pre-wash, hand wash, wheels, undercarriage rinse and hand drying. Safe for ceramic-coated and PPF cars.",
    lastmod: "2026-11-26",
    content: CAR_WASH,
  },
];

export function pageFor(path: string): PageEntry {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`no registry entry for ${path}`);
  return p;
}
