/**
 * Builds the 1200x630 share images used for og:image / twitter:image (WhatsApp, Facebook, Instagram,
 * LinkedIn and X all crop to about this shape). Run by hand when the artwork changes:
 *
 *     node scripts/make-og-images.mjs
 *
 * Output goes to client/public/og/ and is committed, so the build never depends on this script.
 *
 * Why not reuse the logo PNG or the raw poster: the logo alone tells a shared link nothing, and the
 * 4:5 poster is cropped to a sliver when a platform forces 1.91:1. These are composed for that shape,
 * JPEG at ~100-150 KB (WhatsApp skips previews for very large images).
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "client", "public", "og");
const W = 1200;
const H = 630;
const at = (...p) => path.join(ROOT, ...p);

await fs.mkdir(OUT, { recursive: true });

/** A dark left-to-right fade so text/logo stay readable over a photo. */
const fade = (from, to) =>
  Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">` +
      `<stop offset="0" stop-color="#0b0f0d" stop-opacity="${from}"/><stop offset="1" stop-color="#0b0f0d" stop-opacity="${to}"/>` +
      `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
  );

/** Text panel drawn as SVG (no font files needed: system sans-serif). */
const text = (lines) =>
  Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
      lines
        .map(
          (l) =>
            `<text x="${l.x}" y="${l.y}" font-family="Arial, Helvetica, sans-serif" font-size="${l.size}" font-weight="${l.weight ?? 700}" fill="${l.fill ?? "#ffffff"}">${l.t}</text>`,
        )
        .join("") +
      `</svg>`,
  );

// ---- 1. default: a real studio photo + the logo + what the studio does ----
{
  const photo = await sharp(at("attached_assets", "gallery", "p91-lux-mercedes-gle.webp"))
    .resize(W, H, { fit: "cover", position: "centre" })
    .toBuffer();
  const logo = await sharp(at("client", "public", "Car Care (4)_1753951564515.png"))
    .resize({ height: 150 })
    .toBuffer();
  await sharp(photo)
    .composite([
      { input: fade(0.92, 0.05) },
      { input: logo, left: 64, top: 64 },
      {
        input: text([
          { x: 64, y: 340, size: 58, t: "Car Detailing, PPF &amp;" },
          { x: 64, y: 410, size: 58, t: "Ceramic Coating" },
          { x: 64, y: 480, size: 30, weight: 400, fill: "#cfe9cd", t: "Adugodi, Bangalore" },
          { x: 64, y: 560, size: 30, weight: 700, fill: "#4EB848", t: "Book online in under a minute" },
        ]),
      },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, "og-default.jpg"));
}

// ---- 2. the Diwali offer: the poster itself, full height, on a blurred copy of itself ----
{
  const poster = at("attached_assets", "offers", "de-dhana-dhan-diwali-2026.webp");
  const bg = await sharp(poster).resize(W, H, { fit: "cover", position: "centre" }).blur(28).modulate({ brightness: 0.55 }).toBuffer();
  const fg = await sharp(poster).resize({ height: H - 40 }).toBuffer();
  const meta = await sharp(fg).metadata();
  await sharp(bg)
    .composite([
      { input: fg, left: 56, top: 20 },
      {
        input: text([
          { x: 56 + (meta.width ?? 500) + 56, y: 190, size: 30, weight: 700, fill: "#ffd27a", t: "DUSSEHRA &amp; DIWALI" },
          { x: 56 + (meta.width ?? 500) + 56, y: 270, size: 66, t: "De Dhana Dhan" },
          { x: 56 + (meta.width ?? 500) + 56, y: 335, size: 66, t: "offer" },
          { x: 56 + (meta.width ?? 500) + 56, y: 405, size: 32, weight: 400, fill: "#e6e2f5", t: "Free dash cam, sun film," },
          { x: 56 + (meta.width ?? 500) + 56, y: 447, size: 32, weight: 400, fill: "#e6e2f5", t: "sound damping &amp; ceramic coating" },
          { x: 56 + (meta.width ?? 500) + 56, y: 525, size: 40, fill: "#4EB848", t: "Book your slot for ₹99" },
          { x: 56 + (meta.width ?? 500) + 56, y: 575, size: 24, weight: 400, fill: "#bdb6d8", t: "Valid till 8 November 2026" },
        ]),
      },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, "og-offer-de-dhana-dhan.jpg"));
}

for (const f of await fs.readdir(OUT)) {
  const s = await fs.stat(path.join(OUT, f));
  console.log(f.padEnd(34), Math.round(s.size / 1024) + " KB");
}
