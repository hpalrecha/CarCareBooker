-- =====================================================================================
-- Paid offers on ppf_leads: the Dussehra & Diwali "De Dhana Dhan" Rs 99 slot payment.
--
-- ADDITIVE and IDEMPOTENT (IF NOT EXISTS throughout). No DROP, no rewrite of existing rows:
-- every existing lead keeps NULL in all of these, which the app reads as "no payment involved".
-- Apply BEFORE deploying the code that reads these columns:
--     node scripts/run-migration.mjs migrations/manual/2026-09-26-ppf-leads-offer-payments.sql --dry-run
--     node scripts/run-migration.mjs migrations/manual/2026-09-26-ppf-leads-offer-payments.sql
-- (Hand-written because drizzle-kit push does not work against this database - see
--  2026-09-10-campaign-attribution.sql.)
-- =====================================================================================

ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS offer_name varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS amount numeric(10, 2);
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS payment_status varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS razorpay_order_id varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS payment_id varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS payment_verified_at timestamp;

-- One lead per customer per offer, enforced by the database (the app normalises the phone first).
-- Ordinary leads have offer_name NULL and are outside this index, so nothing existing can conflict.
CREATE UNIQUE INDEX IF NOT EXISTS ppf_leads_offer_phone_uniq
  ON ppf_leads (offer_name, phone)
  WHERE offer_name IS NOT NULL;

-- confirm-payment and the Razorpay webhook look a lead up by its order id.
CREATE INDEX IF NOT EXISTS ppf_leads_razorpay_order_id_idx
  ON ppf_leads (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
