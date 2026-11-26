export type FaqItem = { q: string; a: string };
export type ProofPhoto = { src: string; alt: string; width: number; height: number; caption: string };
export type PageEntry = {
  path: string;
  title: string;
  description: string;
  lastmod: string;
  changefreq?: "weekly" | "monthly";
  content: unknown;
};
