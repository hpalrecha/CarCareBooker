import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { repoRoot } from "../apps/api/src/lib/repo-root.ts";

const root = path.resolve("/srv/app");

test("from source (apps/api/src) the repo root is three levels up", () => {
  assert.equal(repoRoot(path.join(root, "apps", "api", "src")), root);
});

test("from the bundle (dist/index.js) the repo root is one level up", () => {
  assert.equal(repoRoot(path.join(root, "dist")), root);
});
