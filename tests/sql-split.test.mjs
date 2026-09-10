/**
 * The migration statement splitter.
 *
 *   npm test
 *
 * WHY THIS EXISTS. scripts/run-migration.mjs used to split SQL on every semicolon. That
 * was correct for as long as every migration was ALTER TABLE, and became silently wrong
 * the moment one needed a `DO $$ ... $$` block: the semicolons inside the block belong to
 * its body, so splitting there shatters it into fragments that are each invalid alone.
 *
 * The campaigns migration needs exactly that construct, to add an EXCLUDE constraint only
 * when btree_gist is available. A splitter nobody has exercised is a splitter that eats a
 * migration at the worst possible moment, so it is tested against the real file too.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { splitStatements } from "../scripts/lib/sql-split.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("splitStatements", () => {
  test("splits ordinary statements", () => {
    assert.deepEqual(splitStatements("SELECT 1; SELECT 2;"), ["SELECT 1", "SELECT 2"]);
  });

  test("a trailing statement without a semicolon is not lost", () => {
    assert.deepEqual(splitStatements("SELECT 1; SELECT 2"), ["SELECT 1", "SELECT 2"]);
  });

  test("empty fragments are dropped", () => {
    assert.deepEqual(splitStatements(";;SELECT 1;;"), ["SELECT 1"]);
  });

  test("keeps a dollar-quoted block whole — the bug this fixes", () => {
    const sql = `
DO $$
BEGIN
  RAISE NOTICE 'one; two';
  PERFORM 1;
END $$;
SELECT 'after';
`;
    const out = splitStatements(sql);
    assert.equal(out.length, 2, "the DO block is ONE statement, not four");
    assert.ok(out[0].startsWith("DO $$"));
    assert.ok(out[0].includes("PERFORM 1;"), "inner semicolons are preserved verbatim");
    assert.ok(out[1].startsWith("SELECT 'after'"));
  });

  test("handles named dollar tags, including nesting with a different tag", () => {
    const sql = `DO $outer$ BEGIN EXECUTE $inner$ a; b $inner$; END $outer$; SELECT 2;`;
    const out = splitStatements(sql);
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("$inner$ a; b $inner$"));
  });

  test("semicolons inside string literals do not split", () => {
    const out = splitStatements(`INSERT INTO t VALUES ('a;b'); SELECT 1;`);
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("'a;b'"));
  });

  test("doubled quotes are an escape, not a terminator", () => {
    const out = splitStatements(`SELECT 'it''s; fine'; SELECT 2;`);
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("'it''s; fine'"));
  });

  test("semicolons inside quoted identifiers do not split", () => {
    const out = splitStatements(`CREATE INDEX "weird;name" ON t (a); SELECT 1;`);
    assert.equal(out.length, 2);
    assert.ok(out[0].includes('"weird;name"'));
  });

  test("a lone $ that is not a dollar-quote is left alone", () => {
    const out = splitStatements(`SELECT 5 $ 3; SELECT 1;`);
    assert.equal(out.length, 2);
  });
});

describe("the real migrations still split into whole statements", () => {
  const migrationsDir = path.join(repoRoot, "scripts/migrations");

  const stripComments = (sql) =>
    sql
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");

  for (const file of fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"))) {
    test(`${file} splits without shattering a block`, () => {
      const sql = stripComments(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
      const statements = splitStatements(sql);
      assert.ok(statements.length > 0, "at least one statement");

      for (const stmt of statements) {
        // Balanced dollar-quote tags: an odd count means a block was cut in half.
        const tags = stmt.match(/\$[A-Za-z_][A-Za-z0-9_]*\$|\$\$/g) ?? [];
        const counts = new Map();
        for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
        for (const [tag, n] of counts) {
          assert.equal(n % 2, 0, `${file}: unbalanced ${tag} in a fragment starting "${stmt.slice(0, 40)}"`);
        }
        // A fragment that begins mid-block is the classic symptom.
        assert.ok(!/^(BEGIN|END)\b/i.test(stmt.trim()), `${file}: fragment starts mid-block: "${stmt.slice(0, 40)}"`);
      }
    });
  }

  test("the campaigns migration keeps its DO block intact", () => {
    const sql = stripComments(
      fs.readFileSync(path.join(migrationsDir, "2026-09-create-campaigns.sql"), "utf8"),
    );
    const statements = splitStatements(sql);
    const doBlock = statements.find((s) => s.trim().startsWith("DO $$"));
    assert.ok(doBlock, "the DO block survived as one statement");
    assert.ok(doBlock.includes("btree_gist"), "extension guard present");
    assert.ok(doBlock.includes("campaigns_no_active_overlap"), "constraint present");
    assert.ok(doBlock.trimEnd().endsWith("END $$"), "and it is complete");
  });
});
