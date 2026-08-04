-- Integration tracking columns for the booking -> n8n -> ERPNext flow.
--
-- ADDITIVE AND BACKWARD-COMPATIBLE: every column is nullable, nothing existing is
-- altered or dropped, and no data is rewritten. The currently-deployed build ignores
-- these columns entirely, so this is safe to apply BEFORE the code deploy (and must be,
-- because the new code writes to them).
--
-- Written as explicit DDL rather than `drizzle-kit push` on purpose: push diffs the whole
-- schema against the live database and can propose DROPs for anything not in schema.ts.
--
-- Idempotent — safe to re-run.
--
-- Rollback: see 2026-08-add-integration-tracking.rollback.sql

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_verified_at              timestamp,
  ADD COLUMN IF NOT EXISTS erp_sync_status                  varchar,
  ADD COLUMN IF NOT EXISTS erp_document_type                varchar,
  ADD COLUMN IF NOT EXISTS erp_document_id                  varchar,
  ADD COLUMN IF NOT EXISTS erp_sync_error                   text,
  ADD COLUMN IF NOT EXISTS erp_synced_at                    timestamp,
  ADD COLUMN IF NOT EXISTS erp_sync_attempts                integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS n8n_execution_id                 varchar,
  ADD COLUMN IF NOT EXISTS customer_whatsapp_message_id     varchar,
  ADD COLUMN IF NOT EXISTS internal_notification_message_id varchar;

-- Backfill: mark bookings that reached ERPNext BEFORE the integration broke, so the fixed
-- code never re-sends them and creates duplicate ERP Appointments.
--
-- Cutoff is 2026-07-10 — the n8n migration date. ERP Appointment volumes track booking
-- volumes month-for-month up to that point (Jan 28/138, Feb 104/103, Mar 18/16, Apr 21/21,
-- May 16/13, Jun 11/9), and the last confirmed sync is APMT-Keerthi -3834 on 2026-07-06.
--
-- Everything from 2026-07-10 onward is deliberately left NULL so it stays eligible for
-- recovery. On the live database that is exactly two confirmed-paid bookings, both verified
-- absent from ERPNext:
--   Nawaf            2026-07-16  pay_TEE0v1UxjKv3nB
--   Hari Shankar P A 2026-07-24  pay_THDBEAAgI5C7c8
--
-- Unpaid bookings are left NULL too; the application treats NULL as "not yet synced" and
-- will not act on them on its own.
UPDATE bookings
   SET erp_sync_status = 'synced',
       erp_document_type = 'Appointment'
 WHERE payment_status = 'paid'
   AND erp_sync_status IS NULL
   AND created_at < '2026-07-10';
