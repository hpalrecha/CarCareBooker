-- =====================================================================================
-- Offer leads carry the service and slot the customer picked on the offer form.
--
-- ADDITIVE and IDEMPOTENT. Existing leads keep NULL in all three, which the app reads as
-- "no slot chosen yet" (the studio calls to fix one), exactly as before.
-- Apply BEFORE deploying the code that reads these columns:
--     node scripts/run-migration.mjs migrations/manual/2026-10-16-ppf-leads-offer-slot.sql --dry-run
--     node scripts/run-migration.mjs migrations/manual/2026-10-16-ppf-leads-offer-slot.sql
-- (Hand-written because drizzle-kit push does not work against this database.)
-- =====================================================================================

ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS service_id varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS appointment_date varchar;  -- YYYY-MM-DD
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS appointment_time varchar;  -- HH:MM, an hourly slot id
