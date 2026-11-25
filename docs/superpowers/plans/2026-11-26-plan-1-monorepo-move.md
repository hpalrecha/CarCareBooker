# Plan 1: Monorepo layout move (no behaviour change) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `server/`, `client/` and `shared/` into the monorepo layout from the spec (`apps/api`, `apps/admin`, `packages/db`, `packages/domain`, `packages/content`) without changing what the site serves or how it behaves.

**Architecture:** A tested codemod (`scripts/tools/relocate.mjs`) moves files with `git mv` and rewrites every import that points into or out of a moved path, keeping relative imports relative and turning `@shared/*` alias imports into `@p91/<pkg>/*` aliases. Runtime path strings (dirs read with `path.join`) are updated by hand from a fixed list. Equivalence is proven by a dist fingerprint (prerendered HTML and file list before vs after) plus the existing test suite. One root `package.json` stays; npm workspaces arrive in Plan 2 with `apps/web`.

**Tech Stack:** Node 24, npm, TypeScript 5 (tsx, esbuild, vite 5), node:test.

This is plan 1 of 4 for `docs/superpowers/specs/2026-11-25-site-restructure-redesign-design.md`:
1. **This plan:** layout move, no behaviour change.
2. `apps/web` Next.js public site, wave 1 pages (written after this plan merges).
3. Analytics (GTM, Pixel + CAPI, first-touch attribution) and nginx cutover.
4. Phase 2 internals: split `routes.ts` and `storage.ts` by feature, dead code and dependency removal, giant-file splits.

## Global Constraints

- No behaviour change: same routes, same responses, same prerendered HTML (asset hashes aside), same Docker runtime command.
- Baseline before the move (main @ `e88ab2f`, 26 Nov): `node --test "tests/**/*.test.mjs"` = 674 tests, 669 pass, 5 fail (all 5 read a stale `dist/` prerender: BlogPosting publisher, JSON-LD raw space, structural checks, 410 offer page prerender, offer Offer seller). `npx tsc --noEmit` = 34 errors. After every task these numbers must be the same or better, never worse.
- File names: kebab-case. Folder names exactly as below.
- Never run `git push` in this plan except Task 8 Step 6, after the owner says go: a push to `main` deploys production.
- Do not edit `.env`. Do not touch the database.
- Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Target layout after this plan

```
apps/
  api/src/            <- server/            (index.ts, routes.ts, vite.ts, storage.ts, db.ts, lib/, services/, middleware/, types/, replit_integrations/)
  admin/              <- client/            (index.html, public/, src/)  -- still serves public pages until Plan 3 cutover
packages/
  db/src/             <- shared/schema.ts   (schema.ts)
  domain/src/         <- shared/campaign.ts, shared/offer-pricing.ts
  content/src/        <- the client/src/lib modules the server imports, plus what they import (computed in Task 4)
scripts/tools/        relocate.mjs, dist-fingerprint.mjs (new)
```

Aliases after this plan (tsconfig `paths`, vite `resolve.alias`, prerender esbuild `alias`):

| Alias | Target |
|---|---|
| `@/*` | `apps/admin/src/*` |
| `@assets/*` | `attached_assets/*` (unchanged) |
| `@p91/db/*` | `packages/db/src/*` |
| `@p91/domain/*` | `packages/domain/src/*` |
| `@p91/content/*` | `packages/content/src/*` |

`@shared/*` is removed.

---

### Task 1: Branch, baseline fingerprint and the relocate codemod

**Files:**
- Create: `scripts/tools/relocate.mjs`
- Create: `scripts/tools/dist-fingerprint.mjs`
- Create: `tests/tools-relocate.test.mjs`
- Create: `docs/superpowers/plans/baseline/dist-fingerprint.json` (generated)

**Interfaces:**
- Produces: `rewriteSpecifier({ fromFile, spec, moves, aliasRewrites }) => string | null` and `applyMoves({ root, moves, aliasRewrites, dryRun, useGit }) => { moved: string[], edited: string[] }` exported from `scripts/tools/relocate.mjs`. CLI: `node scripts/tools/relocate.mjs <moves.json> [--dry-run]`, where `moves.json` is `{ "moves": [["old/path", "new/path"], ...], "aliasRewrites": { "@shared/schema": "@p91/db/schema" } }` and `aliasRewrites` maps an exact alias prefix to its replacement. `node scripts/tools/dist-fingerprint.mjs <out.json>` writes `{ files: string[], html: { [path]: sha256 } }` for `dist/public`, with `-[A-Za-z0-9_-]{8}\.(js|css)` asset hashes replaced by `-HASH.$1` before hashing.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b refactor/monorepo-layout
```

- [ ] **Step 2: Write the failing codemod test**

`tests/tools-relocate.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { rewriteSpecifier, applyMoves } from "../scripts/tools/relocate.mjs";

const moves = [
  ["server", "apps/api/src"],
  ["shared/schema.ts", "packages/db/src/schema.ts"],
];
const aliasRewrites = { "@shared/schema": "@p91/db/schema" };

test("relative import out of a moved dir is recomputed from the new location", () => {
  const out = rewriteSpecifier({
    fromFile: "server/routes.ts",
    spec: "../client/src/lib/llms-txt",
    moves, aliasRewrites,
  });
  assert.equal(out, "../../../client/src/lib/llms-txt");
});

test("relative import into a moved file is recomputed and keeps its extension style", () => {
  const out = rewriteSpecifier({
    fromFile: "tests/x.test.mjs",
    spec: "../server/lib/rate-limit.ts",
    moves, aliasRewrites,
  });
  assert.equal(out, "../apps/api/src/lib/rate-limit.ts");
});

test("import between two files that move together is left alone", () => {
  const out = rewriteSpecifier({ fromFile: "server/routes.ts", spec: "./storage", moves, aliasRewrites });
  assert.equal(out, null);
});

test("alias import is rewritten through aliasRewrites", () => {
  const out = rewriteSpecifier({ fromFile: "server/db.ts", spec: "@shared/schema", moves, aliasRewrites });
  assert.equal(out, "@p91/db/schema");
});

test("bare package import is never touched", () => {
  const out = rewriteSpecifier({ fromFile: "server/db.ts", spec: "drizzle-orm", moves, aliasRewrites });
  assert.equal(out, null);
});

test("applyMoves moves files and rewrites static, dynamic and side-effect imports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "relocate-"));
  const w = (p, s) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), s); };
  w("server/routes.ts", 'import a from "../client/src/lib/x";\nconst b = await import("../client/src/lib/y");\nimport "./side";\nexport { c } from "@shared/schema";\n');
  w("server/side.ts", "");
  w("tests/t.test.mjs", 'import r from "../server/routes.ts";\n');
  w("shared/schema.ts", "export const c = 1;\n");
  const res = applyMoves({ root, moves, aliasRewrites, dryRun: false, useGit: false });
  assert.ok(fs.existsSync(path.join(root, "apps/api/src/routes.ts")));
  assert.ok(fs.existsSync(path.join(root, "packages/db/src/schema.ts")));
  assert.equal(fs.existsSync(path.join(root, "server")), false);
  const routes = fs.readFileSync(path.join(root, "apps/api/src/routes.ts"), "utf8");
  assert.match(routes, /from "\.\.\/\.\.\/\.\.\/client\/src\/lib\/x"/);
  assert.match(routes, /import\("\.\.\/\.\.\/\.\.\/client\/src\/lib\/y"\)/);
  assert.match(routes, /import "\.\/side"/);
  assert.match(routes, /from "@p91\/db\/schema"/);
  const t = fs.readFileSync(path.join(root, "tests/t.test.mjs"), "utf8");
  assert.match(t, /from "\.\.\/apps\/api\/src\/routes\.ts"/);
  assert.ok(res.edited.length >= 2);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test tests/tools-relocate.test.mjs`
Expected: FAIL, `Cannot find module '.../scripts/tools/relocate.mjs'`.

- [ ] **Step 4: Write the codemod**

`scripts/tools/relocate.mjs`:

```js
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
const SPEC_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bmock\.module\s*\(\s*)(["'])([^"'\n]+)\2/g;

const posix = (p) => p.split(path.sep).join("/");

/** Maps a repo-relative posix path through the moves; returns the same path if unmoved. */
export function mapPath(p, moves) {
  for (const [from, to] of moves) {
    if (p === from) return to;
    if (p.startsWith(from + "/")) return to + p.slice(from.length);
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

export function rewriteSource(src, fromFile, opts) {
  let changed = false;
  const next = src.replace(SPEC_RE, (m, lead, q, spec) => {
    const r = rewriteSpecifier({ fromFile, spec, ...opts });
    if (r === null) return m;
    changed = true;
    return `${lead}${q}${r}${q}`;
  });
  return { next, changed };
}

export function applyMoves({ root, moves, aliasRewrites = {}, dryRun = false, useGit = true }) {
  const files = walk(root);
  const edited = [];
  const pending = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    const { next, changed } = rewriteSource(src, f, { moves, aliasRewrites });
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/tools-relocate.test.mjs`
Expected: 6 tests pass.

- [ ] **Step 6: Write the dist fingerprint tool**

`scripts/tools/dist-fingerprint.mjs`:

```js
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
```

- [ ] **Step 7: Build main and record the baseline fingerprint**

Run:
```bash
npm run build:app
node scripts/tools/dist-fingerprint.mjs docs/superpowers/plans/baseline/dist-fingerprint.json
```
Expected: build succeeds; prints a file count and an html count (about 40+ html).

- [ ] **Step 8: Re-run the unit suite with the fresh dist**

Run: `node --test "tests/**/*.test.mjs" 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: `fail` is 5 or fewer (a fresh build may fix the stale-dist failures). Write the exact pass/fail numbers into `docs/superpowers/plans/baseline/README.md` as the baseline for later tasks, together with `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expected 34).

- [ ] **Step 9: Commit**

```bash
git add scripts/tools tests/tools-relocate.test.mjs docs/superpowers/plans/baseline
git commit -m "chore: add relocate codemod and dist fingerprint for the monorepo move"
```

---

### Task 2: `packages/db` and `packages/domain` (from `shared/`)

**Files:**
- Move: `shared/schema.ts` -> `packages/db/src/schema.ts`
- Move: `shared/campaign.ts` -> `packages/domain/src/campaign.ts`
- Move: `shared/offer-pricing.ts` -> `packages/domain/src/offer-pricing.ts`
- Modify: `tsconfig.json` (`include`, `paths`), `vite.config.ts` (`resolve.alias`), `drizzle.config.ts:9`
- Create: `scripts/tools/moves/02-shared.json`

**Interfaces:**
- Consumes: `scripts/tools/relocate.mjs` CLI (Task 1).
- Produces: aliases `@p91/db/*`, `@p91/domain/*`; `@shared/*` no longer exists.

- [ ] **Step 1: Write the move file**

`scripts/tools/moves/02-shared.json`:

```json
{
  "moves": [
    ["shared/schema.ts", "packages/db/src/schema.ts"],
    ["shared/campaign.ts", "packages/domain/src/campaign.ts"],
    ["shared/offer-pricing.ts", "packages/domain/src/offer-pricing.ts"]
  ],
  "aliasRewrites": {
    "@shared/schema": "@p91/db/schema",
    "@shared/campaign": "@p91/domain/campaign",
    "@shared/offer-pricing": "@p91/domain/offer-pricing"
  }
}
```

- [ ] **Step 2: Dry run and check the edit list**

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/02-shared.json --dry-run`
Expected: `moved 0`, and an `edited` list of about 25 files (server files using `@shared/*`, about 13 client files, tests importing `../shared/*.ts`). No file outside `server/`, `client/`, `tests/`, `scripts/`.

- [ ] **Step 3: Apply**

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/02-shared.json`
Expected: `moved 3`; `shared/` is now empty. Remove it: `git rm -r --cached shared 2>/dev/null; rmdir shared`.

- [ ] **Step 4: Update aliases and config**

In `tsconfig.json` replace the `include` and `paths` blocks with:

```json
  "include": ["client/src/**/*", "server/**/*", "packages/*/src/**/*"],
```

```json
    "paths": {
      "@/*": ["./client/src/*"],
      "@p91/db/*": ["./packages/db/src/*"],
      "@p91/domain/*": ["./packages/domain/src/*"]
    }
```

In `vite.config.ts` replace the alias block with:

```ts
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@p91/db": path.resolve(import.meta.dirname, "packages", "db", "src"),
      "@p91/domain": path.resolve(import.meta.dirname, "packages", "domain", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
```

In `drizzle.config.ts` line 9: `schema: "./packages/db/src/schema.ts",`

- [ ] **Step 5: Check nothing still says `@shared` or `shared/`**

Run: `git grep -nE "@shared/|[\"'/]shared/" -- ':!docs' ':!graphify-out' ':!*.md'`
Expected: no output. Fix any hit by hand (same rewrite rule). Also run `git grep -nE "['\"]shared['\"]" tests scripts` for path segments built with `path.join` (found in practice: `tests/ceramic-timing.test.mjs:131`, `tests/seo-foundation.test.mjs:54` esbuild alias, `tests/lead-forms-and-login.test.mjs:30,115`, `scripts/verify-webhook-integration.ts:11`) and update them.

- [ ] **Step 6: Verify**

Run:
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
node --test "tests/**/*.test.mjs" 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run test:integration 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run build:app && node scripts/tools/dist-fingerprint.mjs /tmp/fp-02.json && node -e "const a=require('./docs/superpowers/plans/baseline/dist-fingerprint.json'),b=require('/tmp/fp-02.json');const d=Object.keys(a.html).filter(k=>a.html[k]!==b.html[k]);console.log('files equal',JSON.stringify(a.files)===JSON.stringify(b.files),'html diffs',d)"
```
Expected: tsc count = baseline (34) or lower; unit and integration pass/fail = baseline; `files equal true html diffs []`.

- [ ] **Step 7: Commit**

```bash
git add -A packages scripts/tools/moves tsconfig.json vite.config.ts drizzle.config.ts server client tests scripts
git commit -m "refactor: move shared/ into packages/db and packages/domain"
```

---

### Task 3: `apps/api` (from `server/`)

**Files:**
- Move: `server/` -> `apps/api/src/`
- Modify: `package.json` scripts (`dev`, `build`, `build:app`), `tsconfig.json` (`include`), `Dockerfile` comments and any `server/` path, `apps/api/src/vite.ts:99` (path to client `index.html`)
- Create: `scripts/tools/moves/03-api.json`

**Interfaces:**
- Consumes: Task 2 aliases.
- Produces: API entry `apps/api/src/index.ts`; bundle still `dist/index.js`.

- [ ] **Step 1: Write the move file**

`scripts/tools/moves/03-api.json`:

```json
{ "moves": [["server", "apps/api/src"]], "aliasRewrites": {} }
```

- [ ] **Step 2: Dry run**

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/03-api.json --dry-run`
Expected: edited list contains the server files that import `../client/src/lib/*` (routes.ts, vite.ts, chatbot-knowledge.ts, service-auto-image.ts, services/chatbot.ts) and about 40 test files importing `../server/...`.

- [ ] **Step 3: Apply**

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/03-api.json`
Expected: `moved 1`.

- [ ] **Step 4: Fix the runtime path in `apps/api/src/vite.ts`**

`server/vite.ts` built the dev `index.html` path from `import.meta.dirname, "..", "client", "index.html"`. Open `apps/api/src/vite.ts` around line 95-100 and change the segments so the path still resolves to `<repo>/client/index.html` from the new location, i.e. `path.resolve(import.meta.dirname, "..", "..", "..", "client", "index.html")`. The production branch reads `dist/public` relative to `process.cwd()` or `import.meta.dirname` of `dist/index.js`; leave it unchanged (the bundle location does not move).

Run: `git grep -n "import.meta.dirname" apps/api/src`
Expected: every hit resolves to the same absolute target as before; adjust each dev-only one by two extra `".."` segments.

- [ ] **Step 5: Update scripts and tsconfig**

In `package.json`:

```json
    "dev": "cross-env NODE_ENV=development tsx --env-file=.env apps/api/src/index.ts",
    "build": "node scripts/optimize-images.mjs && vite build && node scripts/prerender.mjs && esbuild apps/api/src/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "build:app": "vite build && node scripts/prerender.mjs && esbuild apps/api/src/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
```

In `tsconfig.json` `include`: replace `"server/**/*"` with `"apps/api/src/**/*"`.

In `Dockerfile` replace every `server/` path in COPY/RUN lines (comments may keep history but update them too): `git grep -n "server/" Dockerfile .github scripts/*.sh`. Expected: only comments; update them to `apps/api/src/`.

- [ ] **Step 6: Check for leftovers**

Run: `git grep -nE "[\"'(/]server/" -- ':!docs' ':!graphify-out' ':!*.md' ':!apps/api/src/**'`
Expected: no import or path hits (string mentions in test descriptions are fine; review each).

- [ ] **Step 7: Verify (same block as Task 2 Step 6), plus dev boot**

Run the Task 2 Step 6 block. Then:
```bash
timeout 25 npm run dev > /tmp/dev.log 2>&1; grep -iE "serving on|listening|error" /tmp/dev.log | head
```
Expected: same numbers as baseline, `files equal true html diffs []`, and the dev log shows the server listening on 5000 with no import error.

- [ ] **Step 8: Commit**

```bash
git add -A apps scripts/tools/moves package.json tsconfig.json Dockerfile tests client
git commit -m "refactor: move server/ to apps/api/src"
```

---

### Task 4: `packages/content` (client libs the server imports)

**Files:**
- Create: `scripts/tools/content-closure.mjs`
- Create: `scripts/tools/moves/04-content.json` (generated by the closure tool, then reviewed)
- Move: the computed set of `client/src/lib/*.ts` -> `packages/content/src/*.ts`
- Modify: `tsconfig.json` paths, `vite.config.ts` alias, `scripts/prerender.mjs` (esbuild alias at line 172 and any `client/src/lib` path)

**Interfaces:**
- Produces: alias `@p91/content/*`. No file in `apps/api/src` imports from `client/` after this task.

- [ ] **Step 1: Write the closure tool**

`scripts/tools/content-closure.mjs`:

```js
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
  if (spec.startsWith("@/")) base = path.join(ROOT, "client/src", spec.slice(2));
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

const clientRoot = path.join(ROOT, "client") + path.sep;
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
```

- [ ] **Step 2: Generate and review the move list**

Run: `node scripts/tools/content-closure.mjs scripts/tools/moves/04-content.json`
Expected: prints a module count (about 20 to 35) and exit 0. If it exits 1 because the closure reaches a `.tsx`, hook or component, stop and record which import pulls UI code in; split that module (pure data/functions to `packages/content`, UI wrapper stays in the client) in this task before continuing, and re-run.

Open the JSON and confirm `image-manifest.json` is NOT in the list unless the API imports it; if it is, add a matching path change to `scripts/optimize-images.mjs:38`, `scripts/prerender.mjs:45` and `Dockerfile` line 40 in Step 5.

- [ ] **Step 3: Apply**

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/04-content.json`
Expected: every API import of `../../../client/src/lib/X` becomes `../../../packages/content/src/X` (relative), and client files that imported those libs via relative paths are rewritten. Client files that imported them via `@/lib/X` are NOT rewritten by the codemod; fix them in Step 4.

- [ ] **Step 4: Rewrite `@/lib/<moved>` imports in the client to `@p91/content/<moved>`**

Run (Node one-off, no file kept):
```bash
node -e '
const fs=require("fs"),cp=require("child_process");
const moved=require("./scripts/tools/moves/04-content.json").moves.map(m=>m[0].replace(/^client\/src\/lib\//,"").replace(/\.(ts|tsx|json)$/,""));
const files=cp.execSync("git ls-files client/src scripts tests").toString().trim().split("\n").filter(f=>/\.(ts|tsx|mjs)$/.test(f));
let n=0;for(const f of files){let s=fs.readFileSync(f,"utf8"),o=s;for(const m of moved){s=s.split(`"@/lib/${m}"`).join(`"@p91/content/${m}"`).split(`"@/lib/${m}.ts"`).join(`"@p91/content/${m}.ts"`);}if(s!==o){fs.writeFileSync(f,s);n++;}}console.log("rewrote",n)'
```
Expected: prints `rewrote N`.

- [ ] **Step 5: Aliases and prerender**

`tsconfig.json` paths: add `"@p91/content/*": ["./packages/content/src/*"]`.
`vite.config.ts` alias: add `"@p91/content": path.resolve(import.meta.dirname, "packages", "content", "src"),`.
`scripts/prerender.mjs` line 172: change the esbuild alias object to

```js
      alias: {
        "@": path.join(ROOT, "client", "src"),
        "@p91/content": path.join(ROOT, "packages", "content", "src"),
        "@p91/db": path.join(ROOT, "packages", "db", "src"),
        "@p91/domain": path.join(ROOT, "packages", "domain", "src"),
      },
```

Run: `git grep -nE "client/src/lib/(${moved_names})" scripts` — simpler: `git grep -n "client\", \"src\", \"lib\"" scripts` and `git grep -n "client/src/lib" scripts/*.mjs Dockerfile`. Update every hit whose file moved in this task.

- [ ] **Step 6: Prove the API no longer reaches into the client**

Run: `git grep -nE "client/src" apps/api/src`
Expected: no import hits (a comment hit is fine; update it to the new path).

- [ ] **Step 7: Verify (Task 2 Step 6 block + dev boot from Task 3 Step 7)**

Expected: baseline numbers; `files equal true html diffs []`; dev server boots.

- [ ] **Step 8: Commit**

```bash
git add -A packages client apps scripts tests tsconfig.json vite.config.ts
git commit -m "refactor: move server-shared content modules to packages/content"
```

---

### Task 5: `apps/admin` (from `client/`)

**Files:**
- Move: `client/` -> `apps/admin/`
- Modify: `vite.config.ts` (`root`, `@` alias), `tsconfig.json` (`include`, `@/*`), `tailwind.config.ts:5`, `components.json` (`css`), `apps/api/src/vite.ts` (dev `index.html` path from Task 3 Step 4), scripts with runtime `"client"` segments (`scripts/optimize-images.mjs:38,147`, `scripts/prerender.mjs:45,172`, `scripts/fetch-fonts.mjs:23-24`, `scripts/indexnow.mjs:17`, `scripts/make-og-images.mjs:19,52`), `Dockerfile:40`
- Create: `scripts/tools/moves/05-admin.json`

**Interfaces:**
- Produces: alias `@/*` -> `apps/admin/src/*`. Vite output stays `dist/public`.

- [ ] **Step 1: Move file and apply**

`scripts/tools/moves/05-admin.json`:

```json
{ "moves": [["client", "apps/admin"]], "aliasRewrites": {} }
```

Run: `node scripts/tools/relocate.mjs scripts/tools/moves/05-admin.json`
Expected: `moved 1`; tests importing `../client/src/...` now import `../apps/admin/src/...`.

- [ ] **Step 2: Configs**

`vite.config.ts`: `"@": path.resolve(import.meta.dirname, "apps", "admin", "src"),` and `root: path.resolve(import.meta.dirname, "apps", "admin"),`.
`tsconfig.json`: include `"apps/admin/src/**/*"` instead of `"client/src/**/*"`; `"@/*": ["./apps/admin/src/*"]`.
`tailwind.config.ts:5`: `content: ["./apps/admin/index.html", "./apps/admin/src/**/*.{js,jsx,ts,tsx}"],`
`components.json`: `"css": "apps/admin/src/index.css"`.

- [ ] **Step 3: Runtime path strings**

In each script listed under **Files**, replace the `"client"` path segment with `"apps", "admin"` (for `path.join(ROOT, "client", ...)`) or `apps/admin` (for string paths). In `apps/api/src/vite.ts` make the dev `index.html` path `path.resolve(import.meta.dirname, "..", "..", "admin", "index.html")`. In `Dockerfile:40` change both sides to `apps/admin/src/lib/image-manifest.json`.

Run: `git grep -nE "[\"'(/ ]client[\"'/]" -- ':!docs' ':!graphify-out' ':!*.md' ':!apps/admin/**'`
Expected: no path hits left (prose in comments is fine if updated).

- [ ] **Step 4: Verify (Task 2 Step 6 block + dev boot), then compare the image manifest path**

Also run `node scripts/optimize-images.mjs` once and confirm it writes `apps/admin/src/lib/image-manifest.json` and `git status` shows no new file under a `client/` folder.
Expected: baseline numbers; `files equal true html diffs []`; dev server serves `http://localhost:5000/` with HTTP 200.

- [ ] **Step 5: Commit**

```bash
git add -A apps scripts tests vite.config.ts tsconfig.json tailwind.config.ts components.json Dockerfile
git commit -m "refactor: move client/ to apps/admin"
```

---

### Task 6: Root tidy-up (docs and one-off scripts)

**Files:**
- Move: `REPORT.md`, `replit.md`, `whatsapp-templates.md`, `MOBILE-PERFORMANCE-PLAN.md` -> `docs/archive/`
- Move: `P91-InStore-Catalogue.pdf` -> `docs/reference/`
- Delete: `cookies.txt` (check first that it holds no live session: if it contains a non-expired admin cookie, delete it anyway and say so in the commit; it must not be in git)
- Move: one-off data scripts in `scripts/` that are not referenced by `package.json`, `Dockerfile`, `.github/` or `scripts/*.sh` -> `scripts/archive/`

**Interfaces:** none.

- [ ] **Step 1: List scripts that nothing references**

Run:
```bash
for f in scripts/*.mjs scripts/*.ts; do b=$(basename "$f"); if ! git grep -q "$b" -- package.json Dockerfile .github scripts/*.sh scripts/*.mjs ':!'"$f"; then echo "$f"; fi; done
```
Expected: a list of about 30-40 one-off scripts. Keep `optimize-images.mjs`, `prerender.mjs`, `prerender-content-entry.ts`, `fetch-fonts.mjs`, `indexnow.mjs`, `make-og-images.mjs`, `post-deploy-smoke.mjs` and anything under `scripts/tools/` even if listed.

- [ ] **Step 2: Move them and the root docs**

```bash
mkdir -p scripts/archive docs/archive docs/reference
# for each file printed in Step 1 except the keep-list:
git mv scripts/<file> scripts/archive/<file>
git mv REPORT.md replit.md whatsapp-templates.md MOBILE-PERFORMANCE-PLAN.md docs/archive/
git mv P91-InStore-Catalogue.pdf docs/reference/
git rm --cached cookies.txt 2>/dev/null; rm -f cookies.txt
grep -qx "cookies.txt" .gitignore || echo "cookies.txt" >> .gitignore
```

- [ ] **Step 3: Verify**

Run the Task 2 Step 6 block. Tests that import an archived script (for example `../scripts/lib/...`) must still pass; if one fails, move that script back.
Expected: baseline numbers.

- [ ] **Step 4: Commit**

```bash
git add -A scripts docs .gitignore REPORT.md replit.md whatsapp-templates.md MOBILE-PERFORMANCE-PLAN.md P91-InStore-Catalogue.pdf cookies.txt
git commit -m "chore: archive one-off scripts and root documents"
```

---

### Task 7: Docker image equivalence

**Files:**
- Modify: `Dockerfile` only if the build fails.

- [ ] **Step 1: Build the image**

Run: `docker build -t carcarebooker:monorepo .`
Expected: success. If Docker is not available on this machine, push the branch (not `main`) so `.github/workflows/build-image.yml` builds it: `git push -u origin refactor/monorepo-layout`, and check the run with `gh run watch`. A branch push does not deploy.

- [ ] **Step 2: Run it with the real env and smoke-test**

```bash
docker run -d --rm --name ccb-test --env-file .env -p 18099:5000 carcarebooker:monorepo
sleep 8
for u in / /ppf /services /api/services /api/business-hours /sitemap.xml /robots.txt; do printf "%s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:18099$u"; done
docker stop ccb-test
```
Expected: every URL 200. (This reads the production database read-only through public GET endpoints; nothing writes.)

---

### Task 8: Merge and deploy

- [ ] **Step 1: Full verification on the branch**

Run the Task 2 Step 6 block one last time and `git status` (clean).
Expected: baseline numbers or better; fingerprint equal.

- [ ] **Step 2: Update the graph**

Run: `graphify update .`

- [ ] **Step 3: Review**

Run `/code-review` on the branch (or dispatch `superpowers:requesting-code-review`). Fix findings in new commits.

- [ ] **Step 4: Ask the owner**

Tell the owner: tests, fingerprint and Docker smoke results, and that merging to `main` deploys production. Wait for an explicit go.

- [ ] **Step 5: Merge**

```bash
git checkout main && git merge --no-ff refactor/monorepo-layout -m "refactor: monorepo layout (apps/api, apps/admin, packages/db, packages/domain, packages/content)"
```

- [ ] **Step 6: Push (deploys) and watch**

```bash
git push origin main
```
Then watch the deploy health checks (`scripts/auto-deploy.sh` swaps only after `/api/business-hours`, `/api/services`, `/`, `/ppf` pass) and re-run the Task 7 Step 2 URL list against `https://p91carcare.com`.
Expected: all 200.
