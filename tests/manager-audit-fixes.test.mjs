/**
 * Fixes from the manager's site audit and the sitemap audit (2026-11-20):
 *   - sitemap lastmod values come from real material-change dates, not today and not one shared date
 *   - the studio email is fenced from Cloudflare's email rewriting
 *   - the Facebook link is the URL that answers 200 directly
 *   - the headlight page is linked from more than one other service page
 *   - every blog post's JSON-LD in the first HTML has an image and a dateModified that matches its sitemap date
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import esbuild from "esbuild";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(repoRoot, p), "utf8");
let dates, blog, related, content;
before(async () => {
  const dir = path.join(repoRoot, "node_modules", ".cache");
  fs.mkdirSync(dir, { recursive: true });
  const bundle = async (entry, name) => {
    const out = path.join(dir, name);
    await esbuild.build({ entryPoints: [path.join(repoRoot, entry)], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent", alias: { "@": path.join(repoRoot, "client", "src"), "@p91/content": path.join(repoRoot, "packages", "content", "src"), "@p91/db": path.join(repoRoot, "packages", "db", "src"), "@p91/domain": path.join(repoRoot, "packages", "domain", "src") } });
    return import(pathToFileURL(out).href + "?t=" + Date.now());
  };
  dates = await bundle("packages/content/src/sitemap-dates.ts", "mgr-dates.mjs");
  blog = await bundle("packages/content/src/blog-posts.ts", "mgr-blog.mjs");
  related = await bundle("packages/content/src/service-related-links.ts", "mgr-related.mjs");
  content = await bundle("packages/content/src/crawlable-content.ts", "mgr-content.mjs");
});

test("every lastmod is a real past date in ISO form, and the dates are not all the same", () => {
  const today = new Date().toISOString().slice(0, 10);
  const vals = Object.values(dates.SITEMAP_LASTMOD);
  for (const v of vals) { assert.match(v, /^\d{4}-\d{2}-\d{2}$/); assert.ok(v <= today, v + " is in the future"); }
  assert.ok(new Set(vals).size >= 4, "lastmod values must reflect different change dates, not one shared date");
  assert.ok(!vals.every((v) => v === today), "lastmod must not be set to today for every page");
});

test("pages with only trivial edits carry no lastmod", () => {
  for (const p of ["/products/stek", "/products/p91-premium-ppf", "/gallery", "/contact"]) assert.equal(dates.SITEMAP_LASTMOD[p], undefined, p);
});

test("a post's JSON-LD dateModified equals its sitemap lastmod", () => {
  for (const post of blog.BLOG_POSTS) assert.equal(post.updated || post.date, dates.SITEMAP_LASTMOD["/blog/" + post.slug], post.slug);
});

test("apps/api/src/routes.ts has no typed-in lastmod left", () => {
  const routes = read("apps/api/src/routes.ts");
  const sitemap = routes.slice(routes.indexOf('app.get("/sitemap.xml"'), routes.indexOf("// Service Management Routes"));
  assert.ok(!/lastmod: "\d{4}/.test(sitemap), "dates must come from sitemap-dates.ts");
  assert.match(sitemap, /SITEMAP_LASTMOD\[p\.loc\]/);
  assert.match(sitemap, /serviceItemLastmod\(/);
});

test("a service item's lastmod is the later of the row date and the template date", () => {
  assert.equal(dates.serviceItemLastmod("2026-09-18T07:00:00Z"), dates.SERVICE_TEMPLATE_MODIFIED);
  assert.equal(dates.serviceItemLastmod("2027-01-05T07:00:00Z"), "2027-01-05");
  assert.equal(dates.serviceItemLastmod(null), dates.SERVICE_TEMPLATE_MODIFIED);
});

test("the studio email in the first HTML is fenced from Cloudflare's email rewriting", () => {
  const src = read("packages/content/src/crawlable-content.ts");
  assert.ok(src.includes("<!--email_off-->") && src.includes("<!--/email_off-->"));
  const html = content.contactPageContent({ path: "/contact", title: "t", description: "d", h1: "Contact" });
  assert.match(html, /<!--email_off--><a [^>]*href="mailto:info@p91carcare\.com"[^>]*>info@p91carcare\.com<\/a><!--\/email_off-->/);
});

test("the Facebook link is the canonical people URL", () => {
  assert.match(read("packages/content/src/instagram-reels.ts"), /FACEBOOK_PROFILE_URL = "https:\/\/www\.facebook\.com\/people\/P91-Car-Care\/61563060751882\/"/);
});

test("the headlight page is linked from at least three other service pages", () => {
  const from = Object.entries(related.SERVICE_RELATED).filter(([, r]) => [...r.guides, ...r.products, ...r.posts].some((l) => l.href === "/service/headlight-restoration-both")).map(([slug]) => slug);
  assert.ok(from.length >= 3, "linked from " + from.join(", "));
  assert.ok(!from.includes("headlight-restoration-both"));
});
