/**
 * Downloads Latin-subset woff2 files from Google Fonts and writes self-hosted @font-face
 * CSS. Run once, by hand, when the type system changes:
 *
 *   node scripts/fetch-fonts.mjs
 *
 * NOT part of `npm run build`. The build must not depend on fonts.googleapis.com being
 * reachable — that would make an outage at Google a failed deploy here, which is precisely
 * the coupling this whole change removes. The files are committed instead.
 *
 * WHY SELF-HOST: index.html loaded a render-blocking stylesheet from fonts.googleapis.com,
 * which then referenced fonts.gstatic.com — two extra origins, two DNS+TLS handshakes, all
 * in front of first paint, for 141 KB of fonts on the homepage.
 *
 * WHY LATIN ONLY: Google serves ~10 subsets per family (cyrillic, greek, vietnamese...).
 * The site is English with rupee amounts. Everything else is dropped.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "client", "public", "fonts");
const CSS_OUT = path.join(ROOT, "client", "src", "styles", "fonts.css");

/** A modern desktop UA, or Google returns ttf instead of woff2. */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0.0.0 Safari/537.36";

/**
 * Families and weights.
 *
 * Archivo and IBM Plex Sans are what the live site renders today. Merriweather and Inter
 * are the editorial pair for /blog; they are declared but will not be downloaded by any
 * browser until Phase 2 renders text in them, because @font-face is lazy.
 */
const FAMILIES = [
  { name: "Archivo", weights: [500, 600, 700, 800] },
  { name: "IBM Plex Sans", weights: [400, 500, 600] },
  { name: "Merriweather", weights: [400, 700] },
  { name: "Inter", weights: [400, 500, 600] },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const blocks = [];

  for (const family of FAMILIES) {
    const url =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(family.name).replace(/%20/g, "+") +
      ":wght@" +
      family.weights.join(";") +
      "&display=optional";

    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${family.name}: HTTP ${res.status}`);
    const css = await res.text();

    // Google emits "/* latin */" before each @font-face. Keep only that subset.
    //
    // All four families are served as VARIABLE fonts: requesting wght@500;600;700;800
    // returns four @font-face blocks pointing at ONE file. Naively saving per weight
    // downloaded the identical 34 KB of Archivo four times — 628 KB across the four
    // families where 221 KB covers every weight. So take the first latin block per
    // family and declare a weight RANGE instead.
    const latin = css
      .split("/*")
      .slice(1)
      .filter((c) => c.slice(0, c.indexOf("*/")).trim() === "latin");
    if (!latin.length) throw new Error(`${family.name}: no latin subset returned`);

    const src = /src:\s*url\((https:[^)]+\.woff2)\)/.exec(latin[0])?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(latin[0])?.[1];
    if (!src) throw new Error(`${family.name}: no woff2 url`);

    const seen = new Set(
      latin.map((c) => /src:\s*url\((https:[^)]+\.woff2)\)/.exec(c)?.[1]).filter(Boolean),
    );
    if (seen.size > 1) {
      // A static family would need one file per weight; fail loudly rather than
      // silently shipping only the first.
      throw new Error(`${family.name}: ${seen.size} distinct files — not a variable font`);
    }

    const file = `${slug(family.name)}.woff2`;
    const buf = Buffer.from(
      await (await fetch(src, { headers: { "User-Agent": UA } })).arrayBuffer(),
    );
    await fs.writeFile(path.join(OUT_DIR, file), buf);
    const lo = Math.min(...family.weights);
    const hi = Math.max(...family.weights);
    console.log(
      `  ${String((buf.length / 1024).toFixed(1) + " KB").padStart(9)}  ${file}  ` +
        `(variable ${lo}-${hi}, covers ${family.weights.length} weights)`,
    );

    blocks.push(
      `@font-face {\n` +
        `  font-family: "${family.name}";\n` +
        `  font-style: normal;\n` +
        // A range, not a single value: one variable file renders every weight in it.
        `  font-weight: ${lo} ${hi};\n` +
        // `optional` and not `swap`: swap repaints the text once the webfont lands,
        // moving every line and costing CLS. `optional` gives the font one short
        // window and otherwise keeps the fallback for the whole page view, so a font
        // can never shift layout after paint.
        `  font-display: optional;\n` +
        `  src: url("/fonts/${file}") format("woff2");\n` +
        (range ? `  unicode-range: ${range};\n` : "") +
        `}`,
    );
  }

  const header =
    `/* GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.\n` +
    ` *\n` +
    ` * Self-hosted Latin subsets. Replaces the render-blocking stylesheet from\n` +
    ` * fonts.googleapis.com, which cost two extra origins in front of first paint.\n` +
    ` *\n` +
    ` * font-display: optional throughout. That is a deliberate trade: on a cold cache a\n` +
    ` * first-time visitor may see the fallback for that page view, and in exchange text\n` +
    ` * never re-renders in a different face after paint. Zero font-driven CLS.\n` +
    ` *\n` +
    ` * Merriweather and Inter are declared but unused until the editorial /blog work.\n` +
    ` * A declared @font-face downloads only when something renders in it, so they cost\n` +
    ` * nothing today.\n` +
    ` */\n\n`;

  await fs.writeFile(CSS_OUT, header + blocks.join("\n\n") + "\n");
  console.log(`\n  ${blocks.length} faces -> ${path.relative(ROOT, CSS_OUT)}`);
}

main().catch((e) => {
  console.error("font fetch failed:", e.message);
  process.exit(1);
});
