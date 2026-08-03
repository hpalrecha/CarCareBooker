-- Rollback for 2026-08-add-integration-tracking.sql
--
-- Only drops columns this migration added. No other table, column or row is touched.
-- Run ONLY after reverting the application code — the fixed build writes to these columns.

ALTER TABLE bookings
  DROP COLUMN IF EXISTS payment_verified_at,
  DROP COLUMN IF EXISTS erp_sync_status,
  DROP COLUMN IF EXISTS erp_document_type,
  DROP COLUMN IF EXISTS erp_document_id,
  DROP COLUMN IF EXISTS erp_sync_error,
  DROP COLUMN IF EXISTS erp_synced_at,
  DROP COLUMN IF EXISTS erp_sync_attempts,
  DROP COLUMN IF EXISTS n8n_execution_id,
  DROP COLUMN IF EXISTS customer_whatsapp_message_id,
  DROP COLUMN IF EXISTS internal_notification_message_id;
