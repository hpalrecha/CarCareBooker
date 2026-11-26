#!/usr/bin/env node
/**
 * One-off generator (Plan 2b Task 5): BLOG_POSTS -> packages/content/src/site/guides-data.ts.
 *
 * blog-posts.ts imports its neighbours without file extensions, so the plain-Node tests cannot import
 * it. This script (run with tsx) reads it once and writes the guides as plain data: every text field
 * through remapLinks, carousels turned into lists of slide headings, CTA and price/warranty callouts
 * turned into notes, contact blocks into a plain paragraph. The few sentences that break the owner's
 * rules (manufacturer's warranty, prices on the page, online booking, pickup "at cost", same-day
 * service) are replaced through FIXES below, each recorded in 2b-review-CD.md. The script fails if a
 * fix no longer matches or a withheld phrase survives.
 *
 * Run: node --import tsx scripts/web/gen-guides.mjs
 */
import { writeFileSync } from "node:fs";
import { BLOG_POSTS } from "../../packages/content/src/blog-posts.ts";
import { remapLinks } from "../../packages/content/src/site/link-map.ts";
import { impliesManufacturerWarranty, WARRANTY_HANDOVER_LINE } from "../../packages/content/src/warranty-wording.ts";

const SKIP = new Set(["ppf-koramangala-hsr-layout-shanti-nagar-adugodi"]); // became /areas/koramangala

/** [exact source text, replacement, reason] */
export const FIXES = [
  ["Whichever you pick, ask to see the batch details of the film or coating before work starts, and get the manufacturer's warranty in writing at handover.",
   `Whichever you pick, ask to see the batch details of the film or coating before work starts. ${WARRANTY_HANDOVER_LINE}`,
   "manufacturer's warranty (owner: never say it)"],
  ["A manufacturer warranty is only worth the process behind it.",
   "A warranty is only worth the process behind it.",
   "manufacturer warranty wording"],
  ["Bring the car in and we will tell you which panels on YOUR car are actually taking damage, and quote only those. Live prices for hatchback, sedan and SUV are on the PPF page.",
   "Bring the car in and we will tell you which panels on YOUR car are actually taking damage, and quote only those.",
   "no prices on the site"],
  ["Prices at P91 are by body type (hatchback, sedan and SUV) for both partial and full coverage. Pick your body type on the [PPF page](/ppf) and the live price for that combination is shown before you book.",
   "At P91 the quote depends on body type (hatchback, sedan and SUV) and on partial or full coverage. The [PPF page](/ppf) explains what moves it; send a photo on WhatsApp for a quote for your car.",
   "no prices on the site"],
  ["Our [paint protection film page](/services/paint-protection-film-bangalore) sets out what we fit and what it costs.",
   "Our [paint protection film page](/services/paint-protection-film-bangalore) sets out what we fit and what moves the cost.",
   "no prices on the site"],
  ["**A written warranty.** Ask who issues it and what it covers. The strongest warranties come from the film or coating manufacturer and are handed over in writing, with batch details you can see before work starts.",
   "**A written warranty.** Ask who issues it and what it covers, and get it in writing at handover, with batch details you can see before work starts.",
   "manufacturer-issued warranty claim"],
  ["**Convenience.** Easy online booking and pickup and drop service save time, particularly given Bangalore traffic.",
   "**Convenience.** Easy booking and pickup and drop save time, particularly given Bangalore traffic.",
   "no online booking until Plan 2c"],
  ["**Warranty-backed work:** every coating and PPF job comes with a written warranty from the film or coating manufacturer, issued at handover. You can ask to see the batch details before work starts.",
   `**Written warranty terms:** ${WARRANTY_HANDOVER_LINE} You can ask to see the batch details before work starts.`,
   "manufacturer's warranty"],
  ["**Same-day service:** most detailing is finished the day you book.",
   "**Studio times on every service page:** each service page states how long the car stays, read from the studio's own records.",
   "contradicts the catalogue (exterior 12-18 hrs, interior 18-36 hrs)"],
  ["**Pickup and drop:** available across Bangalore at cost.",
   "**Pickup and drop:** on request, confirmed on a call.",
   "pickup wording rule (Plan 2a)"],
  ["**Easy booking:** [book online](/services) in under a minute, or get a free estimate for your car.",
   "**Easy booking:** book on WhatsApp or call, and send a photo of your car for an estimate.",
   "no online booking until Plan 2c"],
  ["The best studio is the one that uses named, reputable products, works in a controlled studio environment, gives a written manufacturer warranty, and is open about pricing and timelines.",
   "The best studio is the one that uses named, reputable products, works in a controlled studio environment, gives written warranty terms, and is open about pricing and timelines.",
   "manufacturer warranty"],
  ["Most standard detailing can be completed the same day. Ceramic coating and PPF take longer because of paint preparation and curing.",
   "It depends on the job: each service page states its studio time. Ceramic coating and PPF take longer because of paint preparation and curing.",
   "same-day claim contradicts the catalogue"],
  ["At P91 Car Care, pickup and drop is available across Bangalore at cost.",
   "At P91 Car Care, pickup and drop is on request. Call or WhatsApp us and we confirm it for your area on the call.",
   "pickup wording rule"],
  ["Once the paint is corrected, a [ceramic coating](/services/ceramic-coating-bangalore) is what stops it coming back. Water beads and rolls off instead of sitting in a flat puddle and evaporating in place.",
   "Once the paint is corrected, a [ceramic coating](/services/ceramic-coating-bangalore) makes some mineral deposits easier to clean, but it cannot fully prevent hard water spotting. Water beads and rolls off instead of sitting in a flat puddle and evaporating in place.",
   "overclaim; approved FAQ wording (faq-page.ts:249), as on the hard-water service page"],
  ["[visit P91 Car Care](/contact) or book online in under a minute.",
   "[visit P91 Car Care](/contact) or book on WhatsApp.",
   "no online booking until Plan 2c"],
];

const used = new Set();
function fix(text) {
  let t = text;
  for (const [from, to] of FIXES) if (t.includes(from)) { t = t.split(from).join(to); used.add(from); }
  t = remapLinks(t);
  // Single-asterisk italics are not part of the RichText marks (**bold** and links only): keep the words.
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2");
  if (impliesManufacturerWarranty(t) || /manufacturer(?:'|’)s warranty|₹\s?\d|in under a minute|at cost\b/i.test(t)) {
    throw new Error(`withheld phrase survives: ${t.slice(0, 160)}`);
  }
  return t;
}

const firstSentence = (s) => (s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s).trim();

function block(b) {
  switch (b.type) {
    case "h2": case "h3": return [{ t: b.type, text: fix(b.text) }];
    case "p": return [{ t: "p", text: fix(b.text), ...(b.variant === "lead" ? { variant: "lede" } : b.variant ? { variant: "note" } : {}) }];
    case "ul": case "ol": return [{ t: b.type, items: b.items.map(fix) }];
    case "faq": return [{ t: "faq", items: b.items.map((i) => ({ q: fix(i.q), a: fix(i.a) })) }];
    case "table": return [{ t: "table", head: b.head.map(fix), rows: b.rows.map((r) => r.map(fix)) }];
    case "cta": return [{ t: "p", variant: "note", text: fix(b.text) }];
    case "carousel": return [{ t: "ul", items: b.slides.slice(1).map((s) => fix(firstSentence(s))) }];
    case "contact": return [{ t: "p", variant: "note", text: `Visit the studio: ${b.address}. Call [${b.phone}](${b.phoneHref}) or [get directions](${b.mapsHref}).` }];
    default: throw new Error(`unknown block ${b.type}`);
  }
}

const out = {};
for (const p of BLOG_POSTS) {
  if (SKIP.has(p.slug)) continue;
  out[p.slug] = {
    title: fix(p.title), seoTitle: p.seoTitle, date: p.date, updated: p.updated ?? null,
    readMinutes: p.readMinutes, excerpt: fix(p.excerpt), lede: fix(p.lede), blocks: p.body.flatMap(block),
  };
}
const unused = FIXES.filter(([from]) => !used.has(from));
if (unused.length) throw new Error(`fixes that no longer match: ${unused.map((u) => u[0].slice(0, 60)).join(" | ")}`);

const header = `/**
 * GENERATED by scripts/web/gen-guides.mjs from BLOG_POSTS (blog-posts.ts). Do not edit by hand:
 * change the source or the FIXES table and re-run \`node --import tsx scripts/web/gen-guides.mjs\`.
 * Links remapped through link-map.ts; carousels are lists of slide headings; the Koramangala post
 * became /areas/koramangala and is not here.
 */
import type { GuideBlock } from "./types.ts";

export type GuideSource = { title: string; seoTitle: string; date: string; updated: string | null; readMinutes: number; excerpt: string; lede: string; blocks: GuideBlock[] };

export const GUIDE_SOURCES: Record<string, GuideSource> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync(new URL("../../packages/content/src/site/guides-data.ts", import.meta.url), header);
console.log(`wrote ${Object.keys(out).length} guides; ${FIXES.length} fixes applied`);
