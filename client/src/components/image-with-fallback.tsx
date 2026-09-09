import { useState } from "react";
import manifest from "@/lib/image-manifest.json";

// A branded inline SVG placeholder (P91) shown when an image fails to load — so a
// missing/broken asset degrades to a labelled panel instead of a black gap.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'>` +
    `<rect width='800' height='500' fill='#1a1a1a'/>` +
    `<rect x='1' y='1' width='798' height='498' fill='none' stroke='#2f2f2f' stroke-width='2'/>` +
    `<text x='400' y='250' fill='#7ee787' font-family='sans-serif' font-size='40' font-weight='bold' text-anchor='middle'>P91 Car Care</text>` +
    `<text x='400' y='295' fill='#888' font-family='sans-serif' font-size='20' text-anchor='middle'>image coming soon</text>` +
    `</svg>`,
  );

type ManifestEntry = { widths: number[]; w: number; h: number };
const MANIFEST = manifest as Record<string, ManifestEntry>;

/**
 * Find the generated variants for a src, if any.
 *
 * Two URL shapes reach this component, and both had to be handled or the largest images
 * on the site would have been missed:
 *
 *   /attached_assets/<name>          runtime files the server streams from disk. These
 *                                    are what the admin uploads and what the database
 *                                    points at. May carry a cache-busting ?query.
 *   /assets/<base>-<hash>.<ext>      Vite-bundled imports. The content hash is appended
 *                                    at build time, so the name never matches the
 *                                    manifest until it is stripped — and the single
 *                                    heaviest image on the homepage (402.9 KB, displayed
 *                                    at 337x189) is one of these.
 *
 * Returns null for anything else — remote URLs, data: URIs, the placeholder — and the
 * component then renders exactly the plain <img> it always did.
 */
/**
 * Manifest keys are paths relative to attached_assets ("services/car-polishing.webp"),
 * because the same basename exists in more than one directory. A bundled import has no
 * directory to match on, so it is looked up by basename through this index.
 */
const BY_BASENAME: Record<string, string> = {};
for (const key of Object.keys(MANIFEST)) {
  const base = key.split("/").pop() as string;
  // First writer wins. A duplicate basename across directories is ambiguous, and guessing
  // would serve one service's photograph in another's card.
  if (!(base in BY_BASENAME)) BY_BASENAME[base] = key;
}

function findVariants(src: string): { base: string; entry: ManifestEntry } | null {
  if (!src || src.startsWith("data:")) return null;

  const clean = src.split(/[?#]/)[0]; // drop ?v2 cache-busters
  const marker = "/attached_assets/";

  // Runtime asset: everything after /attached_assets/ IS the manifest key.
  const at = clean.indexOf(marker);
  if (at !== -1) {
    let rel: string;
    try {
      rel = decodeURIComponent(clean.slice(at + marker.length));
    } catch {
      return null;
    }
    const entry = MANIFEST[rel];
    if (entry) return { base: rel.replace(/\.[^.]+$/, ""), entry };
    return null;
  }

  // Bundled asset: Vite appends "-<hash>" before the extension, so the name never matches
  // until it is stripped — and the heaviest image on the homepage is one of these.
  let file: string;
  try {
    file = decodeURIComponent(clean.split("/").pop() || "");
  } catch {
    return null;
  }
  if (!file) return null;

  const dehashed = file.replace(/-[A-Za-z0-9_-]{8}(\.[^.]+)$/, "$1");
  for (const candidate of [file, dehashed]) {
    const key = BY_BASENAME[candidate];
    if (key) return { base: key.replace(/\.[^.]+$/, ""), entry: MANIFEST[key] };
  }
  return null;
}

/**
 * `/attached_assets/_opt/<base>-<w>.<fmt>`.
 *
 * Each path SEGMENT is encoded separately: these filenames contain spaces and parentheses
 * ("Car Care (4)_...png"), but `base` may also contain directory separators, and encoding
 * the whole string would turn "services/foo" into "services%2Ffoo" and 404.
 */
function variantUrl(base: string, width: number, format: "avif" | "webp"): string {
  const segments = `${base}-${width}.${format}`.split("/").map(encodeURIComponent);
  return `/attached_assets/_opt/${segments.join("/")}`;
}

function srcSet(base: string, widths: number[], format: "avif" | "webp"): string {
  return widths.map((w) => `${variantUrl(base, w, format)} ${w}w`).join(", ");
}

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt: string; // required — no decorative-only service images
  fallback?: string;
  /**
   * The `sizes` attribute. Without it the browser assumes the image fills the viewport and
   * picks the largest candidate, which would undo the whole point of the ladder. Defaults
   * to 100vw only because that is the safe over-estimate; callers rendering a card should
   * pass something honest like "(min-width: 940px) 360px, 100vw".
   */
  sizes?: string;
  /** Set on the LCP image only. Anything else competing for priority slows it down. */
  priority?: boolean;
};

export function ImageWithFallback({
  src,
  alt,
  fallback = PLACEHOLDER,
  onError,
  sizes = "100vw",
  priority = false,
  ...rest
}: Props) {
  // Remember WHICH src failed rather than a bare boolean. A boolean sticks: once one
  // image errored, the component kept showing the placeholder even after `src` changed
  // to a working image — which matters here because the same card and modal components
  // are reused across services as the user navigates. Comparing against the current src
  // resets the error state automatically, with no effect needed.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;
  const resolved = showFallback ? fallback : (src as string);

  const img = (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      // React does not yet type fetchPriority on all versions; the DOM accepts the
      // lowercase attribute, which is what the browser reads.
      {...(priority ? { fetchpriority: "high" } : {})}
      onError={(e) => {
        if (src && failedSrc !== src) setFailedSrc(src);
        onError?.(e);
      }}
      {...rest}
    />
  );

  // No generated variants (unknown file, sharp skipped at build time, or the placeholder
  // is showing) → the original element, unchanged. This is the fail-soft path: heavier,
  // never broken.
  const variants = showFallback ? null : findVariants(resolved);
  if (!variants) return img;

  const { base, entry } = variants;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(base, entry.widths, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(base, entry.widths, "webp")} sizes={sizes} />
      {img}
    </picture>
  );
}

export const IMAGE_PLACEHOLDER = PLACEHOLDER;
