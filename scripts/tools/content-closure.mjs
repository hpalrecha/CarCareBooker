#!/usr/bin/env node
/**
 * Lists every client/src/lib module the API imports, plus the client modules those import,
 * and fails if the closure reaches a React component (.tsx) or a hook, which must not move.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPEC_RE = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g;
const EXTS = ["", ".ts", ".tsx", ".json", "/index.ts"];

function resolveSpec(fromAbs, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, "apps/admin/src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromAbs), spec);
  else return null;
  for (const e of EXTS) if (fs.existsSync(base + e) && fs.statSync(base + e).isFile()) return base + e;
  return null;
}

const seeds = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) seeds.push(p);
  }
})(path.join(ROOT, "apps/api/src"));

const clientRoot = path.join(ROOT, "apps/admin") + path.sep;
const closure = new Set();
const queue = [];
for (const f of seeds) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(SPEC_RE)) {
    const r = resolveSpec(f, m[1]);
    if (r && r.startsWith(clientRoot)) queue.push(r);
  }
}
while (queue.length) {
  const f = queue.pop();
  if (closure.has(f)) continue;
  closure.add(f);
  for (const m of fs.readFileSync(f, "utf8").matchAll(SPEC_RE)) {
    const r = resolveSpec(f, m[1]);
    if (r && r.startsWith(clientRoot)) queue.push(r);
  }
}
const rel = [...closure].map((p) => path.relative(ROOT, p).split(path.sep).join("/")).sort();
const bad = rel.filter((p) => p.endsWith(".tsx") || p.includes("/hooks/") || p.includes("/components/"));
if (bad.length) { console.error("closure reaches UI code:\n  " + bad.join("\n  ")); process.exit(1); }
const moves = rel.map((p) => [p, p.replace(/^client\/src\/lib\//, "packages/content/src/")]);
const outside = moves.filter(([a, b]) => a === b);
if (outside.length) { console.error("closure has files outside client/src/lib:\n  " + outside.map((m) => m[0]).join("\n  ")); process.exit(1); }
fs.writeFileSync(process.argv[2], JSON.stringify({ moves, aliasRewrites: {} }, null, 2));
console.log(`${moves.length} modules`);
