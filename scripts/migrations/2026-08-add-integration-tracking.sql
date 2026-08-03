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

-- Backfill: every historical paid booking predates this change and was verified present in
-- ERPNext by scripts/erp-reconciliation-report.ts (0 missing). Marking them 'synced' stops the
-- fixed code from ever re-sending them and creating duplicate ERP Appointments.
--
-- Cutoff is 2026-06-09, i.e. strictly after the last paid booking (Hari, 2026-06-08 02:36).
-- Unpaid bookings are deliberately left NULL — the application treats NULL as "not yet
-- synced" and will not act on them on its own.
UPDATE bookings
   SET erp_sync_status = 'synced',
       erp_document_type = 'Appointment'
 WHERE payment_status = 'paid'
   AND erp_sync_status IS NULL
   AND created_at < '2026-06-09';
