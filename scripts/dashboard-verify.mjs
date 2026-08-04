// READ-ONLY: replicate storage.getAllBookings() exactly as the admin dashboard calls it,
// against the LIVE database, and render the columns the dashboard table shows.
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.CARCARE_LIVE_DATABASE_URL });
const mask = (p) => (!p ? '-' : String(p).slice(0, 4) + '***' + String(p).slice(-3));

try {
  const [{ current_database: db }] = (await pool.query('select current_database()')).rows;
  console.log(`database: ${db}\n`);

  // Exactly what server/storage.ts getAllBookings() issues: no WHERE, no LIMIT, no OFFSET.
  const rows = (await pool.query(`
    SELECT b.*, s.title AS service_title, t.start_time AS slot_start
      FROM bookings b
      LEFT JOIN services   s ON s.id = b.service_id
      LEFT JOIN time_slots t ON t.id = b.time_slot_id
     ORDER BY b.created_at DESC`)).rows;

  console.log(`rows the admin API returns: ${rows.length}   (no WHERE / LIMIT / pagination)`);

  const paid = rows.filter(r => r.payment_status === 'paid');
  const pending = rows.filter(r => r.payment_status === 'pending');
  console.log(`  paid ${paid.length} · pending ${pending.length}`);
  console.log(`  dashboard "Paid Bookings" stat = ${paid.length + rows.filter(r => r.payment_status === 'completed').length}`);

  const show = (list, title, n) => {
    console.log(`\n${title}`);
    console.log('  ' + '─'.repeat(112));
    console.log('  ' + 'Customer'.padEnd(20) + 'Service'.padEnd(34) + 'Appointment'.padEnd(20) +
                'Amount'.padEnd(10) + 'Payment'.padEnd(10) + 'Booking'.padEnd(11) + 'ERP');
    console.log('  ' + '─'.repeat(112));
    for (const b of list.slice(0, n)) {
      const appt = b.appointment_date
        ? `${b.appointment_date} ${b.appointment_time || ''}`.trim()
        : 'To be scheduled';
      console.log('  ' +
        String(b.customer_name || '').slice(0, 19).padEnd(20) +
        String(b.service_title || '(none)').slice(0, 33).padEnd(34) +
        appt.padEnd(20) +
        `Rs ${b.amount}`.padEnd(10) +
        String(b.payment_status).padEnd(10) +
        String(b.booking_status).padEnd(11) +
        (b.erp_document_id || (b.erp_sync_status || '-')));
    }
  };

  show(rows, 'NEWEST 8 ROWS (top of the dashboard table):', 8);
  show(paid, 'NEWEST 6 PAID BOOKINGS:', 6);

  // The two that were invisible
  console.log('\nTHE TWO PREVIOUSLY-MISSING BOOKINGS, WITH FULL DETAIL:');
  for (const name of ['Nawaf', 'Hari Shankar P A']) {
    const b = rows.find(r => r.customer_name === name && r.erp_document_id);
    if (!b) { console.log(`  ${name}: NOT FOUND`); continue; }
    console.log(`\n  ${b.customer_name}`);
    console.log(`     service      : ${b.service_title}`);
    console.log(`     appointment  : ${b.appointment_date} at ${b.appointment_time}`);
    console.log(`     amount       : Rs ${b.amount}`);
    console.log(`     phone / email: ${mask(b.customer_phone)} / ${mask(b.customer_email)}`);
    console.log(`     payment      : ${b.payment_status}   ${b.razorpay_order_id} / ${b.payment_id}`);
    console.log(`     booking      : ${b.booking_status}`);
    console.log(`     whatsapp sent: ${b.whatsapp_sent}`);
    console.log(`     ERP          : ${b.erp_sync_status} -> ${b.erp_document_type} ${b.erp_document_id}`);
    console.log(`     row visible in dashboard list at position ${rows.indexOf(b) + 1} of ${rows.length}`);
  }

  // Would a brand new paid booking be picked up automatically?
  console.log('\nAUTOMATIC PICKUP CHECK (poller eligibility rule):');
  const [{ n: eligible }] = (await pool.query(`
    SELECT count(*)::int n FROM bookings
     WHERE payment_status='paid' AND erp_document_id IS NULL
       AND COALESCE(erp_sync_attempts,0) < 5
       AND (erp_sync_status IS NULL OR erp_sync_status IN ('pending','failed')
            OR (erp_sync_status='processing' AND updated_at < NOW() - INTERVAL '15 minutes'))
       AND razorpay_order_id LIKE 'order_%' AND payment_id LIKE 'pay_%'
       AND created_at >= DATE '2026-07-10'`)).rows;
  console.log(`  rows eligible right now: ${eligible}  (0 = queue drained, nothing outstanding)`);
  const [{ n: unsynced }] = (await pool.query(
    `select count(*)::int n from bookings where payment_status='paid'
      and created_at >= DATE '2026-07-10' and erp_document_id is null`)).rows;
  console.log(`  paid bookings since 2026-07-10 without an ERP id: ${unsynced}`);
} finally {
  await pool.end();
}
