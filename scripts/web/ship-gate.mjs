#!/usr/bin/env node
/**
 * Lists every registry page whose content still has a [NEEDS ...] marker: the facts the studio has not supplied yet.
 *
 * Informational only (owner decision 26 Nov 2026, indexing priority): gaps no longer block a page. The templates hide
 * every sentence, item and section that carries a marker (packages/content/src/site/gaps.ts), and `npm run web:check`
 * fails if one reaches the visible HTML. This list is the studio's to-do; it always exits 0.
 */
import { PAGES } from "../../packages/content/src/site/registry.ts";

let pages = 0;
let gaps = 0;
for (const p of PAGES) {
  const hits = [...new Set(JSON.stringify(p.content).match(/\[NEEDS[^\]]*\]/g) ?? [])];
  if (hits.length) { pages++; gaps += hits.length; console.log(`${p.path}\n  ${hits.join("\n  ")}`); }
}
console.log(pages
  ? `\n${gaps} gap(s) on ${pages} page(s), hidden on the site until the studio supplies them (informational, not blocking).`
  : "No content gaps.");
process.exit(0);
