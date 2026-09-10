/**
 * Split SQL into statements on top-level semicolons only.
 *
 * A plain `.split(';')` was fine while every migration was ALTER TABLE, and it silently
 * became wrong the moment one needed a `DO $$ ... $$` block: the semicolons INSIDE the
 * block are part of its body, and splitting there shatters it into fragments that are
 * each invalid on their own. The failure is loud but the cause is not obvious, so this
 * is worth doing properly rather than avoiding dollar-quoting in migrations forever.
 *
 * Handles the three places a semicolon can legally appear without ending a statement:
 *
 *   'single quoted'      with '' as the escape for a literal quote
 *   "quoted identifier"  with "" likewise
 *   $tag$ dollar $tag$   Postgres dollar-quoting, where the tag may be empty ($$) or
 *                        named ($func$); the closing tag must match the opening one, so
 *                        nested blocks with different tags work correctly
 *
 * Exported for tests — a splitter nobody has exercised is a splitter that eats a
 * migration at exactly the wrong moment.
 */
export function splitStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  while (i < sql.length) {
    const ch = sql[i];

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (inSingle) {
      current += ch;
      i += 1;
      if (ch === "'") {
        if (sql[i] === "'") { current += "'"; i += 1; } // '' escape, stay inside
        else inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      current += ch;
      i += 1;
      if (ch === '"') {
        if (sql[i] === '"') { current += '"'; i += 1; }
        else inDouble = false;
      }
      continue;
    }

    if (ch === "'") { inSingle = true; current += ch; i += 1; continue; }
    if (ch === '"') { inDouble = true; current += ch; i += 1; continue; }

    if (ch === '$') {
      // A dollar-quote tag is $ followed by an optional identifier then another $.
      const match = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i));
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}
