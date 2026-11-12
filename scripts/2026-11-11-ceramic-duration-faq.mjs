/**
 * Corrects the "How long does the application process take?" FAQ answer on the two 1 Year Ceramic Coating catalogue rows.
 * Both say "6-8 hours ... leave your car/bike with us for the day". The studio confirmed (2026-11-11):
 *   car  = "Approx. 36–48+ hours in the studio, depending on the preparation required."
 *   bike = "Approx. 36–48 hours in the studio."
 * The site already applies these in code (client/src/lib/ceramic-timing.ts); this makes the database agree.
 *
 * WHAT IT WRITES (and nothing else):
 *   car  row: faq[5].answer, and duration_text -> "36-48+ hrs"
 *   bike row: faq[5].answer           (duration_text stays NULL)
 * Every other FAQ entry, price, duration, booking amount, timestamp (updated_at included) and column is left exactly as it is.
 *
 * SAFEGUARDS
 *   1. Exact identity: both rows are matched by id AND slug. Anything else aborts.
 *   2. Precondition: faq[5] must be the "How long does the application process take?" entry and its answer must be the old
 *      6-8 hour text (or already the new text). Any other content aborts: it means someone edited the row.
 *   3. One transaction: both rows are updated together or neither is. Rows are locked (FOR UPDATE) while it runs.
 *   4. Snapshot: before any write, both complete rows are saved to secrets/db-backups/ (gitignored). If the file cannot be
 *      written, nothing is updated.
 *   5. Verification inside the transaction: the rows are re-read and compared with the snapshot. Only the permitted fields may
 *      differ, and only to the exact proposed values. Any other difference rolls the transaction back.
 *   6. Rollback: scripts/2026-11-11-ceramic-duration-faq-rollback.mjs restores the changed fields from the snapshot.
 *   7. Credentials are never printed. Errors are reported with any connection string removed.
 *
 * DRY RUN by default: a READ ONLY transaction that prints the plan and writes nothing. Pass --apply to write.
 * Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const QUESTION = 'How long does the application process take?';
const FAQ_INDEX = 5;
const OLD_CLAIM = /6\s*[-–]\s*8\s*(hours|hrs)/i;
const TARGETS = [
  {
    label: 'car',
    id: 'f59283ae-fae1-43a2-a03a-cc0a80cf4a38',
    slug: '1-year-ceramic-coating',
    answer: 'Approx. 36–48+ hours in the studio, depending on the preparation required.',
    durationText: '36-48+ hrs', // the car row's duration_text changes
  },
  {
    label: 'bike',
    id: '9be9a48f-4c6b-4b5a-bf15-3824d7ddfe5b',
    slug: '1-year-bike-ceramic-coating',
    answer: 'Approx. 36–48 hours in the studio.',
    durationText: null, // null = leave the bike row's duration_text untouched (it stays NULL)
  },
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const redact = (text) => String(text).split(DATABASE_URL).join('[database url]').replace(/postgres(ql)?:\/\/\S+/gi, '[database url]');
const fail = (msg) => { throw new Error(msg); };

/** The state each row must have after the update, built from its snapshot. */
function expectedAfter(snapshotRow, target) {
  const faq = structuredClone(snapshotRow.faq);
  faq[FAQ_INDEX].answer = target.answer;
  return { ...snapshotRow, faq, duration_text: target.durationText ?? snapshotRow.duration_text };
}

const SELECT = 'SELECT * FROM services WHERE id = ANY($1::varchar[]) ORDER BY slug FOR UPDATE';

const pool = new Pool({ connectionString: DATABASE_URL });
const client = await pool.connect();
let committed = false;
try {
  await client.query(APPLY ? 'BEGIN' : 'BEGIN READ ONLY');

  // --- 1. identity: the exact two rows -------------------------------------------------------------------------------
  const { rows } = await client.query(APPLY ? SELECT : SELECT.replace(' FOR UPDATE', ''), [TARGETS.map((t) => t.id)]);
  if (rows.length !== TARGETS.length) fail(`Expected ${TARGETS.length} rows by id, got ${rows.length}. Nothing changed.`);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const plan = [];
  for (const t of TARGETS) {
    const row = bySlug.get(t.slug);
    if (!row || row.id !== t.id) fail(`${t.label}: id/slug pair ${t.id} / ${t.slug} not found as expected. Nothing changed.`);
    const faq = Array.isArray(row.faq) ? row.faq : fail(`${t.label}: faq is not an array.`);

    // --- 2. precondition on the FAQ entry ----------------------------------------------------------------------------
    const entry = faq[FAQ_INDEX];
    if (entry?.question !== QUESTION) fail(`${t.label}: faq[${FAQ_INDEX}] is not "${QUESTION}". Nothing changed.`);
    const done = entry.answer === t.answer && (t.durationText === null || row.duration_text === t.durationText);
    if (!done && !OLD_CLAIM.test(String(entry.answer))) fail(`${t.label}: faq[${FAQ_INDEX}] answer is neither the old 6-8 hour text nor the new text. It was edited by someone; not touching it.`);
    plan.push({ t, row, done });
  }

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN (read-only transaction, nothing is written)'}`);
  for (const { t, row, done } of plan) {
    console.log(`\n${t.label}  ${row.slug}  ${row.id}`);
    if (done) { console.log('  already updated, nothing to do.'); continue; }
    console.log(`  faq[${FAQ_INDEX}].answer BEFORE: ${row.faq[FAQ_INDEX].answer}`);
    console.log(`  faq[${FAQ_INDEX}].answer AFTER:  ${t.answer}`);
    console.log(`  duration_text: ${JSON.stringify(row.duration_text)} -> ${JSON.stringify(t.durationText ?? row.duration_text)}`);
    console.log('  everything else unchanged (other FAQ entries, price, duration, updated_at, all columns).');
  }
  const todo = plan.filter((p) => !p.done);
  if (!todo.length) { await client.query('ROLLBACK'); console.log('\nNothing to do.'); process.exit(0); }
  if (!APPLY) { await client.query('ROLLBACK'); console.log('\nDry run only. Pass --apply to write.'); process.exit(0); }

  // --- 4. snapshot of both COMPLETE rows, before any write -------------------------------------------------------------
  const dir = path.join(process.cwd(), 'secrets', 'db-backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `ceramic-duration-faq-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const snapshot = { takenAt: new Date().toISOString(), table: 'services', rows: plan.map((p) => p.row) };
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), { mode: 0o600, flag: 'wx' });
  const written = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (written.rows.length !== plan.length || !written.rows.every((r, i) => same(r, JSON.parse(JSON.stringify(plan[i].row))))) fail('Snapshot file did not read back identical. Nothing changed.');
  console.log(`\nSnapshot written and read back: ${path.relative(process.cwd(), file)}`);

  // --- 3. the writes: answer only (jsonb_set on one path), plus the car's duration_text. updated_at is NOT touched ----------
  for (const { t } of todo) {
    if (t.durationText === null) {
      await client.query(`UPDATE services SET faq = jsonb_set(faq, '{${FAQ_INDEX},answer}', to_jsonb($1::text)) WHERE id = $2 AND slug = $3`, [t.answer, t.id, t.slug]);
    } else {
      await client.query(`UPDATE services SET faq = jsonb_set(faq, '{${FAQ_INDEX},answer}', to_jsonb($1::text)), duration_text = $2 WHERE id = $3 AND slug = $4`, [t.answer, t.durationText, t.id, t.slug]);
    }
  }

  // --- 5/7. re-read and verify against the snapshot, inside the transaction -------------------------------------------
  const after = await client.query(SELECT.replace(' FOR UPDATE', ''), [TARGETS.map((t) => t.id)]);
  if (after.rows.length !== TARGETS.length) fail('Verification: wrong row count. Rolling back.');
  for (const { t, row } of plan) {
    const now = after.rows.find((r) => r.id === t.id);
    const want = expectedAfter(row, t);
    if (!now || !same(JSON.parse(JSON.stringify(now)), JSON.parse(JSON.stringify(want)))) fail(`Verification failed for ${t.label}: the row differs from snapshot in more than the permitted fields. Rolling back.`);
    if (OLD_CLAIM.test(JSON.stringify(now.faq))) fail(`Verification failed for ${t.label}: FAQ still mentions 6-8 hours. Rolling back.`);
  }
  await client.query('COMMIT');
  committed = true;
  console.log('\nCommitted. Verified rows (re-read inside the transaction, compared field by field with the snapshot):');
  for (const r of after.rows) console.log(`  ${r.slug}  duration_text=${JSON.stringify(r.duration_text)}  faq[${FAQ_INDEX}]="${r.faq[FAQ_INDEX].answer}"`);
  console.log(`Rollback: node scripts/2026-11-11-ceramic-duration-faq-rollback.mjs "${path.relative(process.cwd(), file)}" --apply`);
} catch (error) {
  if (!committed) { try { await client.query('ROLLBACK'); } catch { /* connection already gone */ } }
  console.error(`${committed ? 'Error after commit' : 'Aborted, transaction rolled back, no rows changed'}: ${redact(error?.message ?? error)}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
