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

test("extensionless import of a moved single file is rewritten", () => {
  const out = rewriteSpecifier({ fromFile: "scripts/verify.ts", spec: "../shared/schema", moves, aliasRewrites });
  assert.equal(out, "../packages/db/src/schema");
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
