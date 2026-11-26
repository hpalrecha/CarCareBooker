import type { PageEntry } from "./types.ts";
import { HOME } from "./home.ts";
import { PPF } from "./paint-protection-film.ts";

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
];

export function pageFor(path: string): PageEntry {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`no registry entry for ${path}`);
  return p;
}
