import type { Metadata } from "next";
import { pageFor } from "@p91/content/site/registry";

/** Page metadata from the registry entry: absolute title, description, self canonical, Open Graph. */
export function metadataFor(path: string, image?: string): Metadata {
  const p = pageFor(path);
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, ...(image ? { images: [image] } : {}) },
  };
}
