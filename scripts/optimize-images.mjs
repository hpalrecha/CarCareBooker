/**
 * Build-time responsive image generation.
 *
 *   node scripts/optimize-images.mjs          # generate what is missing
 *   node scripts/optimize-images.mjs --force  # regenerate everything
 *
 * WHY THIS EXISTS — measured on the homepage before it was written:
 *
 *   402.9 KB  natural 1200x1788  shown 337x189   (~35x more pixels than displayed)
 *   148.5 KB  natural 1536x1024  shown 337x84
 *   121.8 KB  natural 1600x800   shown 337x84
 *    53.0 KB  natural 1492x1129  shown 45x34     (the logo, requested twice per page)
 *
 * Total image weight was 1231 KB against ~325 KB of JavaScript. The problem is not the
 * format — several of these are already WebP — it is that one size is served to every
 * slot. So this emits a WIDTH LADDER per source image and the component picks with
 * srcset/sizes. AVIF and WebP are emitted too, but the resize is where the bytes are.
 *
 * FAIL-SOFT, DELIBERATELY. sharp is a native binary and the production image is
 * node:20-bookworm-slim; if that binary ever fails to install, this script logs and exits
 * 0 rather than failing the build. `npm run build` runs INSIDE the Docker build, so a
 * non-zero exit here fails `docker build` and there is then no new image to start — the
 * old container keeps serving, but the deploy simply does not happen, silently, over an
 * image optimisation. A missing optimisation must degrade to the original image, never to
 * a blocked release — image-with-fallback.tsx falls back to the untouched `src` whenever a
 * manifest entry is absent, so the site is always correct, sometimes just heavier.
 *
 * Idempotent: an output newer than its source is left alone, so repeat builds are cheap.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(ROOT, "attached_assets");
const OUT_DIR = path.join(SRC_DIR, "_opt");
const MANIFEST = path.join(ROOT, "client", "src", "lib", "image-manifest.json");

/**
 * Widths worth generating.
 *
 * Trimmed from eight to five after the first container build: eight widths x two formats
 * x 155 sources was ~2,400 encodes, which took 1,905 SECONDS and then failed the image
 * export with "no space left on device". Five widths cover every slot the site actually
 * renders — a 96px logo, ~380px cards at 1x and 2x, and the full-bleed hero — and the
 * browser scales between them imperceptibly.
 */
const WIDTHS = [96, 320, 640, 1280, 1600];

/** Above this, a source image is downscaled outright — nothing here is displayed larger. */
const MAX_WIDTH = 1600;

/**
 * Tolerate damaged sources.
 *
 * The single heaviest image on the site (a 5.7 MB studio photograph) is a truncated
 * JPEG: sharp reads its metadata happily and then refuses to decode it with
 * "Invalid SOS parameters for sequential JPEG". Failing on it would leave the one file
 * that most needs optimising as the only file without it. failOn:"none" decodes what is
 * present, which is visually identical here because the damage is at the very end of the
 * scan data.
 */
const SHARP_OPTS = { failOn: "none" };

const SOURCE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const FORCE = process.argv.includes("--force");

function log(...args) {
  console.log("[images]", ...args);
}

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default ?? mod;
  } catch (error) {
    log("sharp is unavailable —", error?.message ?? error);
    log("SKIPPING image optimisation. The build continues and the site will serve the");
    log("original images. This is a performance regression, never a broken deploy.");
    return null;
  }
}

/**
 * Every image under attached_assets, as paths RELATIVE to it ("services/foo.webp").
 *
 * Recursive, and that is the whole point. The first version of this script read only the
 * top level and therefore optimised none of the images the site actually renders: every
 * service photograph is under attached_assets/services/, and the stock library is under
 * attached_assets/stock_images/. It reported a 51 MB saving while leaving the homepage
 * untouched, because the files it processed were the ones nothing links to.
 *
 * Relative paths are also what the manifest is keyed on, so a name that appears in two
 * directories cannot collide.
 */
async function collect(dir, prefix) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "_opt") continue; // never optimise our own output
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await collect(path.join(dir, e.name), rel)));
    } else if (e.isFile() && SOURCE_EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * Narrow the list to images the site can actually render.
 *
 * attached_assets is a 169 MB dumping ground: screenshots, "unnamed_(2)_1765537193656.png",
 * duplicate uploads, files from features that no longer exist. Generating a width ladder
 * for all 155 of them is what made the first container build take 1,905 seconds and then
 * die with "no space left on device" while exporting the layer.
 *
 * Two ways an image reaches a browser, and nothing else counts:
 *
 *   services/ and stock_images/   the service records point at these paths, so they are
 *                                 selected by DATABASE rows this script cannot read.
 *                                 Whitelisted wholesale.
 *   named in client source        a Vite `@assets/...` import. Matching on filename is
 *                                 exact enough here because these names carry upload
 *                                 timestamps and are effectively unique.
 *
 * Anything else is left untouched and served as-is if some path does reach it — the
 * component falls back to the original whenever the manifest has no entry, so a
 * false negative costs bytes, never a broken image.
 */
async function onlyReferenced(files) {
  // carousels/ joins the wholesale list for the same reason as services/: the slides are
  // named 01.jpg .. 11.jpg, which is far too generic to grep the client source for
  // safely — "01.jpg" would match almost anything. They are referenced by directory in
  // blog-posts.ts and built into src paths at render time, so no literal filename exists
  // in the source to find.
  const ALWAYS = ["services/", "stock_images/", "carousels/"];

  // One pass over the client source; the filenames are distinctive enough to grep for.
  let source = "";
  const roots = [path.join(ROOT, "client", "src"), path.join(ROOT, "client", "index.html")];
  const walk = async (p) => {
    let stat;
    try {
      stat = await fs.stat(p);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      for (const e of await fs.readdir(p)) await walk(path.join(p, e));
    } else if (/\.(tsx?|jsx?|css|html)$/.test(p)) {
      source += await fs.readFile(p, "utf8");
    }
  };
  for (const r of roots) await walk(r);

  return files.filter((rel) => {
    if (ALWAYS.some((prefix) => rel.startsWith(prefix))) return true;
    const name = rel.split("/").pop();
    return name ? source.includes(name) : false;
  });
}

/** True when `out` exists and is at least as new as `src`. */
async function isFresh(out, src) {
  if (FORCE || !existsSync(out)) return false;
  try {
    const [o, s] = await Promise.all([fs.stat(out), fs.stat(src)]);
    return o.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

/**
 * Write the manifest. ALWAYS called, including on every failure path.
 *
 * This is load-bearing for the fail-soft promise. The manifest is committed, so if a build
 * without sharp simply returned early, a stale manifest would survive while the variant
 * files it names do not exist — and the component would emit srcset URLs that 404. That is
 * worse than no optimisation: it is broken images. Writing `{}` makes the component fall
 * back to the original `src`, which is the intended degraded state.
 */
async function writeManifest(manifest) {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 0) + "\n");
}

async function main() {
  const sharp = await loadSharp();
  if (!sharp) {
    await writeManifest({});
    log("manifest emptied so the site falls back to original images");
    return;
  }

  if (!existsSync(SRC_DIR)) {
    log("no attached_assets directory; nothing to do");
    await writeManifest({});
    return;
  }
  await fs.mkdir(OUT_DIR, { recursive: true });

  const all = await collect(SRC_DIR, "");
  const files = await onlyReferenced(all);
  log(`${all.length} images on disk, ${files.length} referenced by the site`);

  const manifest = {};
  let generated = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const rel of files) {
    const src = path.join(SRC_DIR, rel);
    let meta;
    try {
      meta = await sharp(src, SHARP_OPTS).metadata();
    } catch (error) {
      // A corrupt or unreadable file must not stop the other 200.
      log(`! ${rel}: unreadable (${error?.message ?? error}) — left as-is`);
      continue;
    }
    if (!meta.width || !meta.height) continue;

    const base = rel.replace(/\.[^.]+$/, "");
    // Never upscale: a 400px source gets no 960px variant, which would be bigger and
    // blurrier than the original.
    const ladder = WIDTHS.filter((w) => w < meta.width).concat(
      meta.width <= MAX_WIDTH ? [meta.width] : [MAX_WIDTH],
    );
    const widths = [...new Set(ladder)].sort((a, b) => a - b);

    const made = [];
    for (const w of widths) {
      for (const format of ["avif", "webp"]) {
        const outName = `${base}-${w}.${format}`;
        const out = path.join(OUT_DIR, outName);
        await fs.mkdir(path.dirname(out), { recursive: true });
        if (await isFresh(out, src)) {
          skipped++;
          continue;
        }
        try {
          const pipeline = sharp(src, SHARP_OPTS).resize({ width: w, withoutEnlargement: true });
          // AVIF is slower to encode but materially smaller; quality tuned so the
          // difference is invisible at these display sizes.
          const buf =
            format === "avif"
              ? await pipeline.avif({ quality: 52, effort: 4 }).toBuffer()
              : await pipeline.webp({ quality: 76 }).toBuffer();
          await fs.writeFile(out, buf);
          generated++;
        } catch (error) {
          log(`! ${outName}: ${error?.message ?? error}`);
        }
      }
      made.push(w);
    }

    if (made.length) {
      manifest[rel] = { widths: made, w: meta.width, h: meta.height };
      try {
        const orig = (await fs.stat(src)).size;
        const largest = path.join(OUT_DIR, `${base}-${made[made.length - 1]}.webp`);
        if (existsSync(largest)) savedBytes += orig - (await fs.stat(largest)).size;
      } catch {}
    }
  }

  await writeManifest(manifest);

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
  log(
    `${files.length} sources · ${generated} generated · ${skipped} already current · ` +
      `largest-variant saving vs originals ${mb(savedBytes)}`,
  );
  log(`manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} entries)`);
}

main().catch(async (error) => {
  // Even an unexpected failure must not break the build.
  log("unexpected failure —", error?.message ?? error);
  try {
    await writeManifest({});
    log("manifest emptied; the site falls back to original images");
  } catch {
    // If even this fails there is nothing safe left to do, and exiting non-zero
    // would fail `docker build` — blocking a release over an image optimisation.
  }
  log("continuing without optimised images");
  process.exit(0);
});
