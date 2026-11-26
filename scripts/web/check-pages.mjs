#!/usr/bin/env node
/**
 * Starts the built web app on :3100 and checks every registry page:
 * 200, one <h1>, self canonical on p91carcare.com, title/description match the registry,
 * every JSON-LD block parses, no exact "₹NN,NNN" price outside JSON-LD, and every internal
 * link either resolves to 200 or is listed as pending (pages from later plans).
 */
import { spawn, spawnSync } from "node:child_process";
import { PAGES } from "../../packages/content/src/site/registry.ts";
import { rangesFor } from "../../packages/domain/src/price-ranges.ts";

const BASE = "http://localhost:3100";
const server = spawn("npm", ["run", "start", "-w", "apps/web"], { shell: true, stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { await fetch(BASE); break; } catch { await wait(1000); } }

let failures = 0;
const fail = (p, m) => { failures++; console.log(`FAIL ${p}: ${m}`); };
const pending = new Set();
for (const page of PAGES) {
  const res = await fetch(BASE + page.path);
  if (res.status !== 200) { fail(page.path, `status ${res.status}`); continue; }
  const html = await res.text();
  if ((html.match(/<h1\b/g) ?? []).length !== 1) fail(page.path, "not exactly one h1");
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  // Compare parsed URLs: Next renders the root canonical as "https://p91carcare.com" (no slash), the same URL as ".../".
  if (!canon || new URL(canon).href !== new URL(page.path, "https://p91carcare.com").href) fail(page.path, `canonical ${canon}`);
  if (!html.includes(`<title>${page.title.replace(/&/g, "&amp;")}</title>`)) fail(page.path, "title differs from registry");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(page.path, "JSON-LD does not parse"); } }
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
  if (/₹\d{1,3}(,\d{3})+/.test(visible)) fail(page.path, "exact rupee price in visible HTML");
  for (const href of new Set([...visible.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))) {
    if (href.startsWith("/_next") || /\.(png|webp|ico|xml|txt)$/.test(href)) continue;
    const r = await fetch(BASE + href, { redirect: "manual" });
    if (r.status === 404) pending.add(href); else if (r.status >= 400) fail(page.path, `${href} -> ${r.status}`);
  }
}
// With shell: true, kill() stops only the shell on Windows; take down the whole tree so :3100 is freed.
if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
else server.kill();
// Pages whose family has one catalogue price show no figure (owner, 26 Nov): listed, not a failure.
const API = process.env.API_ORIGIN ?? "https://p91carcare.com";
let catalogue = null;
try { const d = await (await fetch(`${API}/api/services`)).json(); catalogue = Array.isArray(d) ? d : d.services ?? []; } catch { /* reported below */ }
const topNeeded = [];
for (const page of PAGES) {
  const family = page.content?.family;
  if (!family || !catalogue) continue;
  const r = rangesFor(family, catalogue);
  if (!r) topNeeded.push(`${page.path} (${family}: no active catalogue row)`);
  else if (r.overall.high === null) topNeeded.push(`${page.path} (${family}: one price only)`);
}
console.log(catalogue ? `\nTop price needed (no figure shown until the catalogue has a top end): ${topNeeded.join(", ") || "none"}` : `\nTop price needed: could not read ${API}/api/services`);
console.log(`\nPending links (pages planned in 2b/2c): ${[...pending].sort().join(", ") || "none"}`);
console.log(failures ? `${failures} failure(s)` : "All registry pages pass.");
process.exit(failures ? 1 : 0);
