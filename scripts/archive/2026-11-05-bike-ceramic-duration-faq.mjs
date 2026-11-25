/**
 * The 1 Year Bike Ceramic Coating catalogue row says in its FAQ that the job takes "6-8 hours ...
 * leave your bike with us for the day". The studio owner says the job takes 36 to 48 hours
 * (2026-11-05), and the row's own duration field is already 2880 minutes (48 h). The page
 * contradicted itself and the owner.
 *
 * This replaces ONLY the answer to "How long does the application process take?" on the bike row.
 * Nothing else is touched. Every other FAQ, the process and the car row are left alone.
 *
 * Safe to re-run: it changes the answer only while it still contains "6-8 hours". Dry-run by
 * default. Pass --apply to commit.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL) to the database to update.');
  process.exit(1);
}

const SLUG = '1-year-bike-ceramic-coating';
const QUESTION = 'How long does the application process take?';
const ANSWER =
  'The complete process takes 36 to 48 hours, including paint preparation, correction, coating ' +
  'application and curing. Plan to leave your bike with us for that time.';

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const { rows } = await pool.query('SELECT id, faq FROM services WHERE slug = $1', [SLUG]);
  if (rows.length !== 1) throw new Error(`Expected exactly one row for ${SLUG}, got ${rows.length}`);
  const faq = Array.isArray(rows[0].faq) ? rows[0].faq : JSON.parse(rows[0].faq || '[]');
  const item = faq.find((f) => f?.question === QUESTION);
  if (!item) throw new Error(`FAQ "${QUESTION}" not found`);
  if (!item.answer.includes('6-8 hours')) {
    console.log('Already updated (answer no longer says 6-8 hours). Nothing to do.');
  } else {
    console.log('BEFORE:', item.answer);
    item.answer = ANSWER;
    console.log('AFTER: ', item.answer);
    if (APPLY) {
      await pool.query('UPDATE services SET faq = $1, updated_at = NOW() WHERE id = $2', [
        JSON.stringify(faq),
        rows[0].id,
      ]);
      console.log('Applied.');
    } else {
      console.log('Dry run. Pass --apply to commit.');
    }
  }
} finally {
  await pool.end();
}
