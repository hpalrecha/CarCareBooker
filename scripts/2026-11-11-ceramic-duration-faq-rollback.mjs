/**
 * Rolls back scripts/2026-11-11-ceramic-duration-faq.mjs from the snapshot file it wrote.
 *
 *   node scripts/2026-11-11-ceramic-duration-faq-rollback.mjs secrets/db-backups/<snapshot>.json          (dry run)
 *   node scripts/2026-11-11-ceramic-duration-faq-rollback.mjs secrets/db-backups/<snapshot>.json --apply
 *
 * Restores ONLY what the update changed, from the snapshot: faq[5].answer on both rows and duration_text on the car row.
 * Any later edit to the other FAQ entries, prices or fields is left alone. One transaction, rows locked, ids and slugs
 * checked against the snapshot, result re-read and verified, rolled back on any mismatch. Dry run by default (read-only
 * transaction). Credentials are never printed.
 * Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to restore.
 */
import fs from 'node:fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const snapshotPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!snapshotPath) { console.error('Usage: rollback.mjs <snapshot.json> [--apply]'); process.exit(1); }
if (!DATABASE_URL) { console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL).'); process.exit(1); }

const FAQ_INDEX = 5;
const ALLOWED = new Set(['1-year-ceramic-coating', '1-year-bike-ceramic-coating']);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plain = (v) => JSON.parse(JSON.stringify(v));
const redact = (text) => String(text).split(DATABASE_URL).join('[database url]').replace(/postgres(ql)?:\/\/\S+/gi, '[database url]');
const fail = (msg) => { throw new Error(msg); };

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
if (snapshot.table !== 'services' || !Array.isArray(snapshot.rows) || snapshot.rows.length !== 2) fail('Not a snapshot written by the ceramic duration script.');
for (const r of snapshot.rows) if (!ALLOWED.has(r.slug) || !Array.isArray(r.faq) || r.faq[FAQ_INDEX]?.question !== 'How long does the application process take?') fail(`Snapshot row ${r.slug} is not as expected.`);

const SELECT = 'SELECT * FROM services WHERE id = ANY($1::varchar[]) ORDER BY slug';
const pool = new Pool({ connectionString: DATABASE_URL });
const client = await pool.connect();
let committed = false;
try {
  await client.query(APPLY ? 'BEGIN' : 'BEGIN READ ONLY');
  const { rows } = await client.query(APPLY ? `${SELECT} FOR UPDATE` : SELECT, [snapshot.rows.map((r) => r.id)]);
  if (rows.length !== snapshot.rows.length) fail('Row count does not match the snapshot. Nothing changed.');

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN (read-only, nothing is written)'}   snapshot taken ${snapshot.takenAt}`);
  const plan = snapshot.rows.map((snap) => {
    const now = rows.find((r) => r.id === snap.id);
    if (!now || now.slug !== snap.slug) fail(`${snap.slug}: id/slug pair not found as in the snapshot. Nothing changed.`);
    if (now.faq?.[FAQ_INDEX]?.question !== snap.faq[FAQ_INDEX].question) fail(`${snap.slug}: faq[${FAQ_INDEX}] is not the same question as in the snapshot. Nothing changed.`);
    console.log(`\n${snap.slug}\n  faq[${FAQ_INDEX}].answer: "${now.faq[FAQ_INDEX].answer}"\n    -> restored to: "${snap.faq[FAQ_INDEX].answer}"\n  duration_text: ${JSON.stringify(now.duration_text)} -> ${JSON.stringify(snap.duration_text)}`);
    return { snap, now };
  });
  if (!APPLY) { await client.query('ROLLBACK'); console.log('\nDry run only. Pass --apply to restore.'); process.exit(0); }

  for (const { snap } of plan) {
    await client.query(`UPDATE services SET faq = jsonb_set(faq, '{${FAQ_INDEX},answer}', to_jsonb($1::text)), duration_text = $2 WHERE id = $3 AND slug = $4`, [snap.faq[FAQ_INDEX].answer, snap.duration_text, snap.id, snap.slug]);
  }
  const after = await client.query(SELECT, [snapshot.rows.map((r) => r.id)]);
  for (const { snap, now } of plan) {
    const got = after.rows.find((r) => r.id === snap.id);
    const wantFaq = structuredClone(now.faq); wantFaq[FAQ_INDEX].answer = snap.faq[FAQ_INDEX].answer;
    if (!got || !same(plain(got), plain({ ...now, faq: wantFaq, duration_text: snap.duration_text }))) fail(`Verification failed for ${snap.slug}. Rolling back.`);
    if (!same(got.faq[FAQ_INDEX], snap.faq[FAQ_INDEX]) || got.duration_text !== snap.duration_text) fail(`Verification failed for ${snap.slug}: not restored to the snapshot values. Rolling back.`);
  }
  await client.query('COMMIT');
  committed = true;
  console.log('\nRestored and verified.');
} catch (error) {
  if (!committed) { try { await client.query('ROLLBACK'); } catch { /* connection already gone */ } }
  console.error(`${committed ? 'Error after commit' : 'Aborted, transaction rolled back, no rows changed'}: ${redact(error?.message ?? error)}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
