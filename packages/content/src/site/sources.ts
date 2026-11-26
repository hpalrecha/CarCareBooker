/**
 * Word-for-word lookups into the approved copy modules that plain Node can import (they have no
 * imports of their own). Each lookup throws when the source text is gone, so a page can never
 * silently keep a question or section the source no longer has.
 *
 * landing-pages.ts, bike-landing-copy.ts and blog-posts.ts import their neighbours without a
 * file extension, which plain Node cannot resolve; copy from those is carried into the page files
 * verbatim, with the source line named beside it.
 */
import { SEO_PAGES, type SeoPage } from "../seo-pages.ts";
import { FAQ_GROUPS } from "../faq-page.ts";
import type { FaqItem } from "./types.ts";

export function seoPage(slug: string): SeoPage {
  const p = SEO_PAGES.find((x) => x.slug === slug);
  if (!p) throw new Error(`seo-pages.ts has no page ${slug}`);
  return p;
}

/** One FAQ from a SEO_PAGES entry, by its exact question. */
export function seoFaq(slug: string, question: string): FaqItem {
  const f = seoPage(slug).faqs.find((x) => x.question === question);
  if (!f) throw new Error(`seo-pages.ts ${slug} has no FAQ "${question}"`);
  return { q: f.question, a: f.answer };
}

/** One FAQ from the /faq hub (faq-page.ts), by group id and exact question. */
export function hubFaq(groupId: string, question: string): FaqItem {
  const g = FAQ_GROUPS.find((x) => x.id === groupId);
  const f = g?.items.find((x) => x.question === question);
  if (!f) throw new Error(`faq-page.ts group ${groupId} has no FAQ "${question}"`);
  return { q: f.question, a: f.answer };
}
