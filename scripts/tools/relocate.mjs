#!/usr/bin/env node
/**
 * Moves files/dirs and rewrites every import that crosses a moved boundary.
 *
 *   node scripts/tools/relocate.mjs moves.json [--dry-run]
 *
 * moves.json: { "moves": [["old", "new"], ...],
 *               "aliasRewrites": { "@shared/schema": "@p91/db/schema" } }
 *
 * Relative specifiers stay relative and keep their extension style. Alias specifiers are
 * rewritten only through aliasRewrites (exact prefix match), so "@/..." inside the client
 * keeps working as long as the alias target is updated in vite/tsconfig.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "attached_assets", "uploads", "graphify-out", ".cache"]);
// The codemod and its own test carry example specifiers as data; never rewrite them.
const SKIP_FILES = new Set(["scripts/tools/relocate.mjs", "tests/tools-relocate.test.mjs"]);
const SPEC_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bmock\.module\s*\(\s*|\bnew\s+URL\s*\(\s*)(["'])([^"'\n]+)\2/g;
// Any quoted string; used only with repoPathStrings, to move repo-relative paths such as
// read('server/routes.ts') or ['client/src', 'server'] in tests and scripts.
const STR_RE = /(["'`])([A-Za-z0-9_@-][^"'`\n]*)\1/g;

const posix = (p) => p.split(path.sep).join("/");

/** Maps a repo-relative posix path through the moves; returns the same path if unmoved. */
export function mapPath(p, moves) {
  for (const [from, to] of moves) {
    if (p === from) return to;
    if (p.startsWith(from + "/")) return to + p.slice(from.length);
    // An extensionless specifier ("../shared/schema") naming a moved file ("shared/schema.ts").
    const ext = path.posix.extname(from);
    if (ext && p === from.slice(0, -ext.length)) return to.slice(0, -path.posix.extname(to).length);
  }
  return p;
}

function relSpec(fromFileNew, targetNew) {
  let r = posix(path.posix.relative(path.posix.dirname(fromFileNew), targetNew));
  if (!r.startsWith(".")) r = "./" + r;
  return r;
}

/**
 * Returns the rewritten specifier, or null when nothing changes.
 * fromFile is the repo-relative posix path BEFORE the move.
 */
export function rewriteSpecifier({ fromFile, spec, moves, aliasRewrites = {} }) {
  for (const [a, b] of Object.entries(aliasRewrites)) {
    if (spec === a || spec.startsWith(a + "/")) return b + spec.slice(a.length);
  }
  if (!spec.startsWith("./") && !spec.startsWith("../")) return null;
  const targetOld = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  const fromNew = mapPath(fromFile, moves);
  const targetNew = mapPath(targetOld, moves);
  if (fromNew === fromFile && targetNew === targetOld) return null;
  const next = relSpec(fromNew, targetNew);
  return next === spec ? null : next;
}

function walk(root, dir = "", out = []) {
  for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const rel = dir ? `${dir}/${ent.name}` : ent.name;
    if (ent.isDirectory()) walk(root, rel, out);
    else if (SRC_EXT.test(ent.name) && !SKIP_FILES.has(rel)) out.push(rel);
  }
  return out;
}

export function rewriteSource(src, fromFile, { repoPathStrings = false, ...opts }) {
  let changed = false;
  let next = src.replace(SPEC_RE, (m, lead, q, spec) => {
    const r = rewriteSpecifier({ fromFile, spec, ...opts });
    if (r === null) return m;
    changed = true;
    return `${lead}${q}${r}${q}`;
  });
  if (repoPathStrings) {
    next = next.replace(STR_RE, (m, q, str) => {
      const mapped = mapPath(str, opts.moves);
      if (mapped === str) return m;
      changed = true;
      return `${q}${mapped}${q}`;
    });
  }
  return { next, changed };
}

export function applyMoves({ root, moves, aliasRewrites = {}, dryRun = false, useGit = true }) {
  const files = walk(root);
  const edited = [];
  const pending = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    // Tests and scripts build paths from repo-relative strings; app code never does.
    const repoPathStrings = /^(tests|scripts)\//.test(f);
    const { next, changed } = rewriteSource(src, f, { moves, aliasRewrites, repoPathStrings });
    if (changed) { pending.push([f, next]); edited.push(mapPath(f, moves)); }
  }
  const moved = [];
  if (!dryRun) {
    for (const [from, to] of moves) {
      const abs = path.join(root, to);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      if (useGit) execFileSync("git", ["mv", from, to], { cwd: root, stdio: "inherit" });
      else fs.renameSync(path.join(root, from), abs);
      moved.push(`${from} -> ${to}`);
    }
    for (const [f, next] of pending) fs.writeFileSync(path.join(root, mapPath(f, moves)), next);
  }
  return { moved, edited };
}

if (process.argv[1] && process.argv[1].split(path.sep).join("/").endsWith("scripts/tools/relocate.mjs")) {
  const cfgPath = process.argv[2];
  if (cfgPath) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    const res = applyMoves({ root: process.cwd(), moves: cfg.moves, aliasRewrites: cfg.aliasRewrites ?? {}, dryRun: process.argv.includes("--dry-run") });
    console.log(`moved ${res.moved.length}, edited ${res.edited.length}`);
    for (const e of res.edited) console.log("  edited", e);
  }
}
