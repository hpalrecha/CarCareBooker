/**
 * READ-ONLY reconciliation report: paid bookings vs ERPNext Appointments.
 *
 * Lists bookings whose payment was captured but which have no matching ERP Appointment,
 * so they can be replayed deliberately. It REPLAYS NOTHING, sends no messages, writes
 * nothing to the database and creates nothing in ERP. Every query is a SELECT / GET.
 *
 * Required env (from ../.p91-investigation.env, never committed):
 *   CARCARE_DATABASE_URL  - booking database
 *   ERPNEXT_BASE_URL      - https://erp.plus91inc.in
 *   ERPNEXT_TOKEN         - "<key>:<secret>" (no "token " prefix)
 *
 * Usage:
 *   npx tsx scripts/erp-reconciliation-report.ts [--since YYYY-MM-DD]
 */
import { neon } from '@neondatabase/serverless';

const SINCE = (() => {
  const i = process.argv.indexOf('--since');
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : '2026-07-01';
})();

const dbUrl = process.env.CARCARE_DATABASE_URL;
const erpBase = (process.env.ERPNEXT_BASE_URL || '').replace(/\/$/, '');
const erpToken = (process.env.ERPNEXT_TOKEN || '').replace(/^token\s+/i, '').replace(/^"|"$/g, '');

if (!dbUrl || !erpBase || !erpToken) {
  console.error('Missing CARCARE_DATABASE_URL / ERPNEXT_BASE_URL / ERPNEXT_TOKEN');
  process.exit(1);
}

const maskPhone = (p: string | null) =>
  !p ? '(none)' : String(p).length <= 4 ? '****' : String(p).slice(0, 3) + '***' + String(p).slice(-3);
const maskEmail = (e: string | null) => {
  if (!e) return '(none)';
  const at = String(e).indexOf('@');
  return at < 1 ? '****' : String(e)[0] + '***' + String(e).slice(at);
};
/** Last 10 digits — normalises +91/0 prefixes and spacing for matching. */
const digits10 = (p: string | null | undefined) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

async function erpGet(path: string): Promise<any> {
  const res = await fetch(`${erpBase}${path}`, {
    headers: { Authorization: `token ${erpToken}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`ERP GET ${res.status}`);
  return res.json();
}

async function main() {
  const sql = neon(dbUrl!);

  const bookings = (await sql`
    SELECT id, customer_name, customer_phone, customer_email, amount,
           payment_status, booking_status, payment_id, razorpay_order_id,
           appointment_date, appointment_time, whatsapp_sent, created_at
    FROM bookings
    WHERE created_at >= ${SINCE}
    ORDER BY created_at ASC
  `) as any[];

  console.log(`\nBookings created since ${SINCE}: ${bookings.length}`);
  const byStatus: Record<string, number> = {};
  for (const b of bookings) byStatus[b.payment_status] = (byStatus[b.payment_status] || 0) + 1;
  console.log('By payment_status:', JSON.stringify(byStatus));

  const paid = bookings.filter((b) => b.payment_status === 'paid');
  console.log(`Confirmed-paid in window: ${paid.length}\n`);

  if (paid.length === 0) {
    console.log('Nothing to reconcile.');
    return;
  }

  // Pull ERP Appointments once and match locally (fewer ERP calls, read-only).
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'creation', 'customer_name', 'customer_phone_number', 'status'])
  );
  const appts = (
    await erpGet(
      `/api/resource/Appointment?limit_page_length=500&order_by=creation%20desc&fields=${fields}`
    )
  ).data as any[];
  console.log(`ERP Appointments fetched for matching: ${appts.length}\n`);

  const byPhone = new Map<string, any[]>();
  for (const a of appts) {
    const k = digits10(a.customer_phone_number);
    if (!k) continue;
    if (!byPhone.has(k)) byPhone.set(k, []);
    byPhone.get(k)!.push(a);
  }

  const rows = paid.map((b) => {
    const phoneKey = digits10(b.customer_phone);
    const candidates = byPhone.get(phoneKey) || [];
    // Only count an ERP doc created at/after the booking as evidence of this booking syncing.
    const match = candidates.find((a) => new Date(a.creation) >= new Date(b.created_at));
    const nameMatch =
      !match &&
      appts.find(
        (a) =>
          (a.customer_name || '').trim().toLowerCase() ===
            (b.customer_name || '').trim().toLowerCase() &&
          new Date(a.creation) >= new Date(b.created_at)
      );
    const found = match || nameMatch;
    return {
      bookingId: b.id,
      created: new Date(b.created_at).toISOString().slice(0, 16).replace('T', ' '),
      name: b.customer_name,
      phone: maskPhone(b.customer_phone),
      email: maskEmail(b.customer_email),
      amount: b.amount,
      paymentId: b.payment_id ? String(b.payment_id).slice(0, 10) + '…' : '(none)',
      orderId: b.razorpay_order_id ? String(b.razorpay_order_id).slice(0, 12) + '…' : '(none)',
      whatsapp: b.whatsapp_sent ? 'sent' : 'not sent',
      erp: found ? `FOUND ${found.name}` : 'MISSING',
      matchedBy: match ? 'phone' : nameMatch ? 'name' : '-',
      action: found ? 'none' : 'REPLAY (needs approval)',
    };
  });

  const missing = rows.filter((r) => r.erp === 'MISSING');

  console.log('─'.repeat(120));
  console.log('RECONCILIATION — confirmed-paid bookings (sensitive fields masked)');
  console.log('─'.repeat(120));
  for (const r of rows) {
    console.log(
      `${r.created}  ${r.bookingId.slice(0, 8)}…  ${(r.name || '').padEnd(22).slice(0, 22)} ` +
        `${r.phone.padEnd(11)} ₹${String(r.amount).padEnd(8)} pay=${r.paymentId.padEnd(12)} ` +
        `wa=${r.whatsapp.padEnd(8)} erp=${r.erp.padEnd(28)} ${r.action}`
    );
  }
  console.log('─'.repeat(120));
  console.log(
    `TOTAL paid: ${rows.length} | already in ERP: ${rows.length - missing.length} | MISSING from ERP: ${missing.length}`
  );
  console.log('\nNothing was replayed. No messages sent. No ERP or database writes performed.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
