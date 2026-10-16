-- Rollback for 2026-10-16-ppf-leads-offer-slot.sql.
-- Discards the service and slot each offer lead chose. Roll the code back first.
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS appointment_time;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS appointment_date;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS service_id;
