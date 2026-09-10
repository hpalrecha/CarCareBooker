/**
 * Phase 2D — landing-page content rules.
 *
 *   npm run test:integration
 *
 * The browser audit proves the pages render and price correctly. This pins the rules that
 * are easy to break later with a well-meaning edit:
 *
 *   no price, discount or category->price map may enter the frontend
 *   no withheld claim may reach an ad page
 *   the blog carousel uses only real posts and never pads
 *   every campaign route the ads point at actually exists and is prerendered
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  LANDING_PAGES,
  getLandingPage,
  relevantPosts,
  displayableIncludes,
} from "../client/src/lib/landing-pages.ts";
import { BLOG_POSTS } from "../client/src/lib/blog-posts.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(repoRoot, p), "utf8");

describe("the three ad destinations exist and are distinct", () => {
  test("exactly the three routes the advertisements point at", () => {
    assert.deepEqual(
      LANDING_PAGES.map((p) => p.path).sort(),
      ["/ceramic-coating/bike", "/ceramic-coating/car", "/ppf"],
    );
  });

  test("each is registered as a route", () => {
    const app = read("client/src/App.tsx");
    for (const p of LANDING_PAGES) {
      assert.ok(app.includes(`path="${p.path}"`), `${p.path} must be routed`);
    }
  });

  test("each is in the sitemap", () => {
    const routes = read("server/routes.ts");
    for (const p of LANDING_PAGES) {
      assert.ok(routes.includes(`loc: "${p.path}"`), `${p.path} must be in the sitemap`);
    }
  });

  test("titles and descriptions are unique and within search limits", () => {
    const titles = LANDING_PAGES.map((p) => p.title);
    const descriptions = LANDING_PAGES.map((p) => p.description);
    assert.equal(new Set(titles).size, titles.length, "no two pages share a title");
    assert.equal(new Set(descriptions).size, descriptions.length, "no two share a description");
    for (const p of LANDING_PAGES) {
      assert.ok(p.title.length <= 62, `${p.path} title too long (${p.title.length})`);
      assert.ok(p.description.length <= 165, `${p.path} description too long (${p.description.length})`);
      assert.ok(p.h1 && p.h1.length > 8, `${p.path} needs a real h1`);
    }
  });

  test("does not compete head-on with the existing informational SEO pages", () => {
    // /services/paint-protection-film-bangalore and /services/ceramic-coating-bangalore
    // already target the general intent. These pages target price/package intent, so the
    // titles must not be duplicates of each other.
    const seo = read("client/src/lib/seo-pages.ts");
    for (const p of LANDING_PAGES) {
      assert.ok(!seo.includes(`title:\n      "${p.title}"`), "title collides with an SEO page");
      assert.ok(!seo.includes(`title: "${p.title}"`), `${p.path} title collides with an SEO page`);
    }
  });
});

describe("NO pricing may live in the frontend", () => {
  const files = [
    "client/src/lib/landing-pages.ts",
    "client/src/pages/campaign-landing.tsx",
    "client/src/components/vehicle-selector.tsx",
  ];

  test("no rupee figures are hardcoded", () => {
    // The prototype this replaced carried its own sample prices and they were WRONG —
    // ceramic coating at ₹14,999 against a real ₹5,999.
    for (const f of files) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const hits = src.match(/₹\s?[\d,]{3,}/g) ?? [];
      assert.deepEqual(hits, [], `${f} must not contain a price literal`);
    }
  });

  test("no category-to-price mapping exists", () => {
    const src = read("client/src/lib/landing-pages.ts");
    // A category names a SLUG. Any numeric price field beside it would be a second
    // pricing authority.
    assert.ok(!/price\s*:\s*['"\d]/.test(src), "no price field on a category option");
    for (const p of LANDING_PAGES) {
      for (const c of p.categories ?? []) {
        assert.ok(c.serviceSlug, "a category selects a catalogue slug");
        assert.ok(!("price" in c), "a category carries no price of its own");
      }
    }
  });

  test("every named catalogue slug is a real production slug", () => {
    // Guards against a typo silently producing a page with no price.
    const REAL = new Set([
      "1-year-ceramic-coating", "1-year-bike-ceramic-coating",
      "ppf-hatchback", "ppf-sedan", "ppf-suv",
    ]);
    for (const p of LANDING_PAGES) {
      if (p.primaryServiceSlug) assert.ok(REAL.has(p.primaryServiceSlug), `${p.primaryServiceSlug} unknown`);
      for (const c of p.categories ?? []) assert.ok(REAL.has(c.serviceSlug), `${c.serviceSlug} unknown`);
    }
  });

  test("a page names EITHER one service OR selectable categories, never both", () => {
    for (const p of LANDING_PAGES) {
      const hasPrimary = Boolean(p.primaryServiceSlug);
      const hasCategories = Boolean(p.categories?.length);
      assert.ok(hasPrimary !== hasCategories, `${p.path} must pick exactly one pricing shape`);
    }
  });
});

describe("no invented or withheld claims", () => {
  const sources = [
    "client/src/lib/landing-pages.ts",
    "client/src/pages/campaign-landing.tsx",
    "client/src/components/vehicle-selector.tsx",
    "client/src/components/blog-carousel.tsx",
  ];

  test("none of the Phase 1 claims return in any wording", () => {
    const forbidden = [
      /\b4\.9\b/, /200\+/, /500\+/, /100\+/,
      /biggest/i, /\bno\.?\s?1\b/i, /#1\b/,
      /best (in|warranty|value|ppf|price)/i,
      /verified reviews/i, /happy customers/i,
    ];
    for (const f of sources) {
      // Comments explaining WHY a claim was removed are allowed; only rendered copy is not.
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const re of forbidden) {
        assert.ok(!re.test(src), `${f} must not contain ${re}`);
      }
    }
  });

  test("no page claims the SERVICE is free", () => {
    const forbidden = [/free ceramic coating/i, /free\s+ppf/i, /pay nothing/i, /pay remainder/i];
    for (const f of sources) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const re of forbidden) assert.ok(!re.test(src), `${f} must not contain ${re}`);
    }
  });

  test("self-healing is filtered out of catalogue includes", () => {
    // The PPF catalogue rows genuinely list "Self-healing technology". Until the specific
    // film is confirmed, it must not appear on a page carrying paid traffic.
    const includes = [
      "Full body PPF coverage",
      "Self-healing technology",
      "5-year warranty",
      "Stone chip protection",
    ];
    const shown = displayableIncludes(includes);
    assert.ok(!shown.some((i) => /self[-\s]?heal/i.test(i)), "self-healing is withheld");
    assert.equal(shown.length, 3, "everything else passes through untouched");
    assert.deepEqual(shown, ["Full body PPF coverage", "5-year warranty", "Stone chip protection"]);
  });

  test("the filter drops lines, it never rewrites them", () => {
    const original = ["Machine paint correction", "Iron remover treatment"];
    assert.deepEqual(displayableIncludes(original), original);
  });

  test("bad input yields an empty list rather than throwing", () => {
    for (const bad of [null, undefined, "not-an-array", 42, {}]) {
      assert.deepEqual(displayableIncludes(bad), []);
    }
    assert.deepEqual(displayableIncludes([1, null, "ok"]), ["ok"], "non-strings dropped");
  });

  test("PPF suppresses duration; ceramic does not", () => {
    // Full PPF carries 2/3/4 in a MINUTES column — almost certainly days, mis-entered.
    assert.equal(getLandingPage("/ppf").hideDuration, true);
    assert.ok(!getLandingPage("/ceramic-coating/car").hideDuration);
    assert.ok(!getLandingPage("/ceramic-coating/bike").hideDuration);
  });

  test("no FAQ content is authored in the frontend", () => {
    // FAQs come from services.faq or the section does not render. Full PPF has none.
    const src = read("client/src/lib/landing-pages.ts");
    assert.ok(!/\bfaqs?\s*:\s*\[/i.test(src), "no FAQ array is written here");
  });
});

describe("bike copy is genuinely motorcycle-specific", () => {
  const bike = getLandingPage("/ceramic-coating/bike");
  const car = getLandingPage("/ceramic-coating/car");

  test("it is not car copy with the noun swapped", () => {
    const bikeText = bike.benefits.map((b) => b.title + " " + b.body).join(" ");
    const carText = car.benefits.map((b) => b.title + " " + b.body).join(" ");
    for (const b of bike.benefits) {
      assert.ok(!carText.includes(b.body), `"${b.title}" is duplicated from the car page`);
    }
    // Things only a motorcycle has.
    for (const term of [/tank/i, /fairing/i, /chain/i]) {
      assert.ok(term.test(bikeText), `bike copy should mention ${term}`);
    }
  });

  test("it uses motorcycle language in its headline and metadata", () => {
    assert.match(bike.h1, /motorcycle/i);
    assert.match(bike.title, /bike|motorcycle/i);
    assert.ok(!/\bcar\b/i.test(bike.h1), "the bike h1 does not say car");
  });

  test("it invents no technical claim", () => {
    const text = bike.benefits.map((b) => b.body).join(" ");
    for (const re of [/\d+\s*%/, /\d+h\b/i, /guaranteed/i, /lasts \d+/i]) {
      assert.ok(!re.test(text), `bike copy must not assert ${re}`);
    }
  });
});

describe("blog carousel uses only real posts", () => {
  test("never returns more posts than exist", () => {
    for (const p of LANDING_PAGES) {
      const posts = relevantPosts(p);
      assert.ok(posts.length <= BLOG_POSTS.length, "cannot pad beyond the real posts");
      assert.ok(posts.length <= 3, "at most three cards");
    }
  });

  test("every returned post is a real post object", () => {
    const realSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
    for (const p of LANDING_PAGES) {
      for (const post of relevantPosts(p)) {
        assert.ok(realSlugs.has(post.slug), `${post.slug} is a real article`);
        assert.ok(post.title && post.slug, "with a real title and URL");
      }
    }
  });

  test("no duplicates within a carousel", () => {
    for (const p of LANDING_PAGES) {
      const slugs = relevantPosts(p).map((x) => x.slug);
      assert.equal(new Set(slugs).size, slugs.length, `${p.path} repeats a post`);
    }
  });

  test("preferred posts come first where a genuine match exists", () => {
    const ppf = relevantPosts(getLandingPage("/ppf"));
    assert.equal(ppf[0].slug, "ppf-vs-ceramic-coating-bangalore", "the PPF article leads on /ppf");
  });

  test("a page with no genuine match falls back to recent, not to nothing", () => {
    // No motorcycle article exists. Inventing a relevance score over three items would be
    // dressing up a hardcoded list as an algorithm.
    const bike = getLandingPage("/ceramic-coating/bike");
    assert.deepEqual(bike.preferredPostSlugs, [], "no false match is asserted");
    assert.equal(relevantPosts(bike).length, Math.min(3, BLOG_POSTS.length), "still shows articles");
  });

  test("an unknown preferred slug is skipped, not rendered broken", () => {
    const fake = { ...getLandingPage("/ppf"), preferredPostSlugs: ["does-not-exist"] };
    const posts = relevantPosts(fake);
    assert.ok(posts.every((p) => p && p.slug), "no undefined entries");
    assert.equal(posts.length, Math.min(3, BLOG_POSTS.length), "filled from recent");
  });
});

describe("prerender wiring", () => {
  test("landing pages are exported to the prerenderer", () => {
    assert.match(read("scripts/prerender-content-entry.ts"), /LANDING_PAGES/);
  });

  test("the prerenderer emits a route per landing page from that same module", () => {
    // Imported rather than duplicated into STATIC_ROUTES, so the prerendered <head> cannot
    // drift from what useSeoMeta sets — which is why no drift test is needed here.
    const script = read("scripts/prerender.mjs");
    assert.match(script, /for \(const p of LANDING_PAGES\)/);
    const table = script.slice(script.indexOf("const STATIC_ROUTES"), script.indexOf("/** Bundle the TS"));
    for (const p of LANDING_PAGES) {
      assert.ok(!table.includes(`path: "${p.path}"`), `${p.path} must not be duplicated in STATIC_ROUTES`);
    }
  });
});
