import type { PageEntry } from "./types.ts";
import { HOME } from "./home.ts";
import { PPF } from "./paint-protection-film.ts";
import { CERAMIC } from "./ceramic-coating.ts";
import { CERAMIC_BIKE } from "./ceramic-coating-bike.ts";
import { SUN_CONTROL_FILM } from "./sun-control-film.ts";
import { INTERIOR } from "./interior-detailing.ts";
import { EXTERIOR } from "./exterior-detailing.ts";
import { SERVICES_HUB } from "./services-hub.ts";

export const PAGES: PageEntry[] = [
  {
    path: "/",
    title: "PPF and Ceramic Coating in Bangalore | P91 Car Care",
    description: "STEK paint protection film and Nasiol ceramic coating in Adugodi, next to Koramangala. Price ranges by car size, real studio work and written warranty terms.",
    lastmod: "2026-11-26",
    changefreq: "weekly",
    content: HOME,
  },
  {
    path: "/services/paint-protection-film",
    title: "Paint Protection Film (PPF) in Bangalore | P91",
    description: "STEK and P91 Premium PPF in Bangalore: price range by body type, what moves the price, the 5-step fitting process, warranty terms and real jobs from our studio.",
    lastmod: "2026-11-26",
    content: PPF,
  },
  {
    path: "/services",
    title: "Car Detailing Services and Price Ranges | P91 Car Care",
    description: "Every P91 Car Care service with its price range: PPF, ceramic coating, interior and exterior detailing, glass film and headlight restoration in Adugodi.",
    lastmod: "2026-11-26",
    content: SERVICES_HUB,
  },
  {
    path: "/services/ceramic-coating",
    title: "Ceramic Coating in Bangalore | P91 Car Care",
    description: "Nano-ceramic coating with machine paint correction in Adugodi, Bangalore: price range, what the job includes, studio time and how borewell water marks paint.",
    lastmod: "2026-11-26",
    content: CERAMIC,
  },
  {
    path: "/services/ceramic-coating/bike",
    title: "Bike Ceramic Coating in Bangalore | P91 Car Care",
    description: "1-year ceramic coating for motorcycles in Adugodi, Bangalore: tank, fairings and painted panels. Price range, studio time, washing advice and answers.",
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
    description: "Deep interior cleaning in Adugodi, Bangalore: seat shampoo, dashboard and vents, leather conditioning and odour removal. Price range and what is included.",
    lastmod: "2026-11-26",
    content: INTERIOR,
  },
  {
    path: "/services/exterior-detailing",
    title: "Exterior Detailing in Bangalore | P91 Car Care",
    description: "Exterior detailing in Adugodi, Bangalore: decontamination, polishing and hard-water spot removal. Price range, before and after, and when paint needs polishing.",
    lastmod: "2026-11-26",
    content: EXTERIOR,
  },
];

export function pageFor(path: string): PageEntry {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`no registry entry for ${path}`);
  return p;
}
