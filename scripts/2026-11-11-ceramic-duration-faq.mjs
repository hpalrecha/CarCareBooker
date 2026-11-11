/**
 * Corrects the "How long does the application process take?" FAQ answer on the two 1 Year Ceramic Coating catalogue rows.
 * Both say "6-8 hours ... leave your car/bike with us for the day". The studio confirmed (2026-11-11):
 *   car  = "Approx. 36–48+ hours in the studio, depending on the preparation required."
 *   bike = "Approx. 36–48 hours in the studio."
 * The site already applies these in code (client/src/lib/ceramic-timing.ts); this makes the database agree, after which that
 * code path is a no-op. It also sets the car row's duration_text to "36-48+ hrs" (the bike row's duration_text is left as is).
 *
 * Touches ONLY those fields on those two rows. Prices, booking amounts and everything else are left alone.
 * Safe to re-run. DRY RUN by default; pass --apply to write. NOT RUN: it needs approval to change production data.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const APPLY = process.argv.includes('--apply');
const DATABASE_URL = process.env.CARCARE_TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set CARCARE_TARGET_DATABASE_URL (or DATABASE_URL).');
  process.exit(1);
}

const QUESTION = 'How long does the application process take?';
const TARGETS = {
  '1-year-ceramic-coating': { answer: 'Approx. 36–48+ hours in the studio, depending on the preparation required.', durationText: '36-48+ hrs' },
  '1-year-bike-ceramic-coating': { answer: 'Approx. 36–48 hours in the studio.', durationText: null },
};

const pool = new Pool({ connectionString: DATABASE_URL });
try {
  for (const [slug, t] of Object.entries(TARGETS)) {
    const { rows } = await pool.query('SELECT id, faq, duration_text FROM services WHERE slug = $1', [slug]);
    if (rows.length !== 1) throw new Error(`Expected exactly one row for ${slug}, got ${rows.length}`);
    const faq = Array.isArray(rows[0].faq) ? rows[0].faq : JSON.parse(rows[0].faq || '[]');
    const item = faq.find((f) => f?.question === QUESTION);
    if (!item) throw new Error(`${slug}: FAQ "${QUESTION}" not found`);
    const newText = t.durationText ?? rows[0].duration_text;
    if (item.answer === t.answer && newText === rows[0].duration_text) {
      console.log(`${slug}: already updated.`);
      continue;
    }
    console.log(`${slug}\n  BEFORE: ${item.answer}\n  AFTER:  ${t.answer}\n  duration_text: ${rows[0].duration_text} -> ${newText}`);
    item.answer = t.answer;
    if (APPLY) {
      await pool.query('UPDATE services SET faq = $1, duration_text = $2, updated_at = NOW() WHERE id = $3', [JSON.stringify(faq), newText, rows[0].id]);
      console.log('  Applied.');
    }
  }
  if (!APPLY) console.log('Dry run. Pass --apply to commit.');
} finally {
  await pool.end();
}
