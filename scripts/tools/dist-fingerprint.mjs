#!/usr/bin/env node
/** Fingerprints dist/public: file list (asset hashes normalised) and sha256 of every HTML file. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PUB = path.join(ROOT, "dist", "public");
const norm = (s) => s.replace(/-[A-Za-z0-9_-]{8}\.(js|css)/g, "-HASH.$1");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const files = walk(PUB).map((p) => path.relative(PUB, p).split(path.sep).join("/"));
const html = {};
for (const f of files.filter((f) => f.endsWith(".html"))) {
  html[f] = crypto.createHash("sha256").update(norm(fs.readFileSync(path.join(PUB, f), "utf8"))).digest("hex");
}
const out = { files: [...new Set(files.map(norm))].sort(), html };
fs.mkdirSync(path.dirname(process.argv[2]), { recursive: true });
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
console.log(`${out.files.length} files, ${Object.keys(html).length} html`);
