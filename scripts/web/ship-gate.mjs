#!/usr/bin/env node
/** Lists every registry page whose content still has a [NEEDS ...] marker. Exit 1 if any. */
import { PAGES } from "../../packages/content/src/site/registry.ts";

let blocked = 0;
for (const p of PAGES) {
  const hits = JSON.stringify(p.content).match(/\[NEEDS[^\]]*\]/g) ?? [];
  if (hits.length) { blocked++; console.log(`${p.path}\n  ${[...new Set(hits)].join("\n  ")}`); }
}
console.log(blocked ? `\n${blocked} page(s) blocked from production.` : "All pages clear.");
process.exit(blocked ? 1 : 0);
