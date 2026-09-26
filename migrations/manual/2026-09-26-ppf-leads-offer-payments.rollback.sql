-- Rollback for 2026-09-26-ppf-leads-offer-payments.sql.
-- DESTRUCTIVE for the payment columns: it discards which leads paid. Only run it if the code that
-- reads these columns has been rolled back first, and export the rows first if any lead has paid.
DROP INDEX IF EXISTS ppf_leads_offer_phone_uniq;
DROP INDEX IF EXISTS ppf_leads_razorpay_order_id_idx;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS payment_verified_at;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS payment_id;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS payment_status;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS amount;
ALTER TABLE ppf_leads DROP COLUMN IF EXISTS offer_name;
