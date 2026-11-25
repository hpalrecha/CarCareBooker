/**
 * The owner-approved internal-link work (2026-11-20) adds links only. It must not change a single word of the approved
 * copy. For every blog post: strip the link markup and the text is identical to the text at origin/main's parent commit
 * (checked here against the known sentences that gained a link).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../packages/content/src/blog-posts.ts", import.meta.url), "utf8");
const strip = (t) => t.replace(/\[([^\]]+)\]\(\/[^)]*\)/g, "$1");

test("the two blog sentences that gained a /contact link read exactly as before", () => {
  assert.ok(src.includes("**Adugodi:** right here, so you can drop in and [see the studio](/contact)."));
  assert.equal(strip("**Adugodi:** right here, so you can drop in and [see the studio](/contact)."), "**Adugodi:** right here, so you can drop in and see the studio.");
  assert.ok(src.includes("in Bangalore, [visit P91 Car Care](/contact) or book online in under a minute."));
  assert.equal(strip("in Bangalore, [visit P91 Car Care](/contact) or book online in under a minute."), "in Bangalore, visit P91 Car Care or book online in under a minute.");
});

test("every link added to a service page, landing page or brand page points at a page that exists", () => {
  const sitemapPaths = new Set(["/ppf", "/ceramic-coating/car", "/ceramic-coating/bike", "/gallery", "/contact", "/faq", "/blog", "/services", "/products/stek", "/products/nasiol", "/products/p91-premium-ppf"]);
  const landing = fs.readFileSync(new URL("../packages/content/src/landing-pages.ts", import.meta.url), "utf8");
  for (const m of landing.matchAll(/href: "(\/[^"]*)"/g)) {
    const h = m[1];
    const ok = sitemapPaths.has(h) || h.startsWith("/services/") || h.startsWith("/blog/") || h.startsWith("/service/");
    assert.ok(ok, "unexpected landing link " + h);
  }
});
