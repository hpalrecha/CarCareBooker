#!/usr/bin/env node
/**
 * Starts the built web app on :3100 (npm run web:start) and checks, over real HTTP:
 * - every old URL in OLD_URL_REDIRECTS answers 301/308 with Location = its new page, and that page answers 200 (one hop);
 * - the same old URL with a trailing slash also lands on the new page in one hop;
 * - spam slugs, /le48 and /offer/de-dhana-dhan answer 410 with X-Robots-Tag: noindex, slash or not;
 * - a new page with a trailing slash 308s to the slashless path;
 * - /service/* (old booking pages, served by the API container after cutover) is NOT redirected by Next.
 * Run after `npm run web:build`. Exit 1 on any failure.
 */
import { spawn, spawnSync } from "node:child_process";
import { OLD_URL_REDIRECTS } from "../../packages/content/src/site/redirects.ts";

const BASE = "http://localhost:3100";
const server = spawn("npm", ["run", "start", "-w", "apps/web"], { shell: true, stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { await fetch(BASE); break; } catch { await wait(1000); } }

let failures = 0;
let checked = 0;
const fail = (p, m) => { failures++; console.log(`FAIL ${p}: ${m}`); };
const get = (p) => fetch(BASE + p, { redirect: "manual" });
const locationOf = (res) => { const l = res.headers.get("location"); return l ? new URL(l, BASE).pathname : null; };

async function expectRedirect(from, to) {
  checked++;
  const res = await get(from);
  if (res.status !== 301 && res.status !== 308) return fail(from, `status ${res.status}, expected 301/308 -> ${to}`);
  const loc = locationOf(res);
  if (loc !== to) return fail(from, `Location ${loc}, expected ${to}`);
  const end = await get(to);
  if (end.status !== 200) fail(from, `${to} answers ${end.status} (not one hop to a live page)`);
}

async function expectGone(p) {
  checked++;
  const res = await get(p);
  if (res.status !== 410) return fail(p, `status ${res.status}, expected 410`);
  if (res.headers.get("x-robots-tag") !== "noindex") fail(p, "410 without X-Robots-Tag: noindex");
}

const exact = OLD_URL_REDIRECTS.filter((r) => !r.source.includes(":"));
for (const r of exact) {
  await expectRedirect(r.source, r.destination);
  if (r.source !== "/index.html") await expectRedirect(r.source + "/", r.destination);
}
await expectRedirect("/blog/category/anything-else", "/guides");

for (const p of [
  "/le48", "/le48/", "/offer/de-dhana-dhan", "/offer/de-dhana-dhan/",
  "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765", "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
  "/Plegable-Y-Tablero-Werzalit-Malib%C3%BA-Garden-859029",
]) await expectGone(p);

for (const p of ["/services/ceramic-coating/", "/guides/", "/areas/koramangala/"]) await expectRedirect(p, p.slice(0, -1));

for (const p of ["/service/ppf-hatchback", "/service/1-year-ceramic-coating", "/service/premium-car-wash-special"]) {
  checked++;
  const res = await get(p);
  if (res.status >= 300 && res.status < 400) fail(p, `redirected to ${locationOf(res)}; booking pages must stay on the API`);
}

if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
else server.kill();
console.log(`${checked} checks: ${exact.length} old URLs (+ slash forms), 7 gone, 3 slash, 3 booking pages.`);
console.log(failures ? `${failures} failure(s)` : "All redirects and 410s pass.");
process.exit(failures ? 1 : 0);
