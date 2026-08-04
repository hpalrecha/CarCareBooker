import { useState } from "react";

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

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt: string; // required — no decorative-only service images
  fallback?: string;
};

export function ImageWithFallback({ src, alt, fallback = PLACEHOLDER, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? fallback : src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        if (!failed) setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}

export const IMAGE_PLACEHOLDER = PLACEHOLDER;
