// READ-ONLY: list every ERPNext Appointment whose notes say "payment is pending",
// and cross-check each against the LIVE booking database to see whether it was
// actually paid later. Writes a CSV. Changes nothing in ERP or the database.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';
neonConfig.webSocketConstructor = ws;

const base = 'https://erp.plus91inc.in';
let tok = (process.env.ERPNEXT_TOKEN || '').replace(/^"|"$/g, '').trim();
if (!/^token /i.test(tok)) tok = 'token ' + tok;
const erp = async (u) => (await fetch(base + u, { headers: { Authorization: tok, Accept: 'application/json' } })).json();

const last10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);

const fields = ['name', 'creation', 'status', 'scheduled_time', 'customer_name',
  'customer_phone_number', 'customer_email', 'party', 'customer_details'];

const res = await erp('/api/resource/Appointment?limit_page_length=0&order_by=creation%20desc' +
  '&fields=' + encodeURIComponent(JSON.stringify(fields)) +
  '&filters=' + encodeURIComponent(JSON.stringify([['customer_details', 'like', '%payment is pending%']])));
const appts = res.data || [];
console.log(`ERP appointments flagged "payment is pending": ${appts.length}`);

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const bookings = (await pool.query(`
  SELECT customer_name, customer_phone, appointment_date, appointment_time, amount,
         payment_status, payment_id, razorpay_order_id, erp_document_id,
         to_char(created_at,'YYYY-MM-DD HH24:MI') AS created
    FROM bookings`)).rows;
await pool.end();

const byPhoneDate = new Map();
for (const b of bookings) {
  byPhoneDate.set(`${last10(b.customer_phone)}|${b.appointment_date}`, b);
}

const rows = [];
const tally = { paid: 0, pending: 0, other: 0, nomatch: 0 };

for (const a of appts) {
  const date = (a.scheduled_time || '').slice(0, 10);
  const phone = last10(a.customer_phone_number);
  const b = byPhoneDate.get(`${phone}|${date}`);
  let verdict;
  if (!b) { verdict = 'NO MATCHING BOOKING'; tally.nomatch++; }
  else if (b.payment_status === 'paid') { verdict = 'ACTUALLY PAID LATER'; tally.paid++; }
  else if (b.payment_status === 'pending') { verdict = 'still unpaid'; tally.pending++; }
  else { verdict = `booking status: ${b.payment_status}`; tally.other++; }

  rows.push({
    appointment: a.name,
    erp_created: (a.creation || '').slice(0, 16),
    erp_status: a.status,
    scheduled: a.scheduled_time,
    customer: (a.customer_name || '').trim(),
    phone_last4: phone ? phone.slice(-4) : '',
    lead: a.party || '',
    verdict,
    db_payment_status: b ? b.payment_status : '',
    db_payment_id: b ? (b.payment_id || '') : '',
    db_order_id: b ? (b.razorpay_order_id || '') : '',
    amount: b ? b.amount : '',
  });
}

console.log('\nCROSS-CHECK AGAINST THE LIVE BOOKING DATABASE');
console.log(`  actually paid later : ${tally.paid}`);
console.log(`  still unpaid        : ${tally.pending}`);
console.log(`  other status        : ${tally.other}`);
console.log(`  no matching booking : ${tally.nomatch}`);

const byYear = {};
rows.forEach(r => { const y = r.erp_created.slice(0, 7); byYear[y] = (byYear[y] || 0) + 1; });
console.log('\n  by month created:');
Object.entries(byYear).sort().forEach(([m, n]) => console.log(`    ${m}  ${String(n).padStart(4)}`));

const statuses = {};
rows.forEach(r => { statuses[r.erp_status] = (statuses[r.erp_status] || 0) + 1; });
console.log('\n  by ERP status:', JSON.stringify(statuses));

console.log('\nMOST RECENT 25:');
console.log('  ' + 'Appointment'.padEnd(30) + 'Created'.padEnd(18) + 'Scheduled'.padEnd(21) + 'ERP'.padEnd(9) + 'Verdict');
console.log('  ' + '─'.repeat(112));
rows.slice(0, 25).forEach(r => console.log('  ' +
  r.appointment.slice(0, 29).padEnd(30) + r.erp_created.padEnd(18) +
  String(r.scheduled).slice(0, 19).padEnd(21) + String(r.erp_status).padEnd(9) + r.verdict));

const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const header = Object.keys(rows[0] || {}).join(',');
const csv = [header, ...rows.map(r => Object.values(r).map(csvEsc).join(','))].join('\n');
const out = 'D:/company project/p91-erp-pending-appointments.csv';
fs.writeFileSync(out, csv);
console.log(`\nfull list written to ${out}  (${rows.length} rows)`);
