/**
 * Apply a .sql file to DATABASE_URL.
 *
 *   node scripts/apply-sql.mjs migrations/manual/2026-09-10-campaign-attribution.sql
 *
 * WHY THIS EXISTS. `npm run db:push` cannot run against this database: drizzle-kit's diff
 * generates `ALTER COLUMN id DROP NOT NULL` on primary-key columns, Postgres rejects it
 * with 42P16, and the push aborts before applying anything it was actually asked to do.
 * Hand-written additive SQL is applied with this instead.
 *
 * SAFETY. This refuses to run a file containing DROP, TRUNCATE or DELETE. That is a
 * deliberate, blunt guard, not a parser: this tool exists to apply additive migrations to
 * a PRODUCTION database from a developer laptop, and the failure it is guarding against is
 * someone pasting the wrong file. If a destructive change is ever genuinely needed, it
 * should be reviewed and run deliberately, not through a convenience script.
 *
 * Credentials are read from .env and never printed. The host is shown, host only, so it is
 * obvious which database is about to be written to.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");

/** Comment-stripped copy, so a word in prose never trips the guard. */
const code = sql
  .split(/\r?\n/)
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");

const forbidden = [/\bDROP\b/i, /\bTRUNCATE\b/i, /\bDELETE\b/i];
for (const re of forbidden) {
  if (re.test(code)) {
    console.error(`REFUSED: ${file} contains ${re.source.replace(/\\b/g, "")}.`);
    console.error("This tool only applies additive migrations. Run destructive SQL deliberately.");
    process.exit(1);
  }
}

const env = Object.fromEntries(
  fs
    .readFileSync(path.resolve(".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""),
    ]),
);

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

// Host only — never the credentials.
let host = "(unparseable)";
try {
  host = new URL(env.DATABASE_URL).host;
} catch {}

const statements = code.split(";").filter((s) => s.trim()).length;
console.log(`applying ${file}`);
console.log(`  ${statements} statements -> ${host}`);

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const result = await pool.query(sql);
  const results = Array.isArray(result) ? result : [result];
  // The file ends with a verification SELECT; show whatever rows came back.
  for (const r of results) {
    if (r?.rows?.length) console.log("\n" + JSON.stringify(r.rows[0], null, 2));
  }
  console.log("\nOK — applied.");
} catch (error) {
  console.error("\nFAILED:", error.message);
  if (error.code) console.error("  code:", error.code);
  // The file is wrapped in BEGIN/COMMIT, so a failure rolls the whole thing back.
  console.error("  The transaction rolled back; the database is unchanged.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
