-- Rollback for 2026-09-create-campaigns.sql
--
-- Only drops what that migration added. No other table, column or row is touched.
--
-- Run ONLY after reverting the application code. The current build reads the campaigns
-- table on every landing-page request and writes campaign_id / campaign_identifier /
-- vehicle_type on every booking; dropping them under a running deploy breaks booking.
--
-- DATA LOSS, in two places:
--
--   1. Every campaign definition. Re-creating them is manual re-entry.
--   2. The campaign attribution on bookings taken while campaigns were live — which
--      advertisement produced which booking. That cannot be reconstructed from anywhere
--      else; the utm_* columns say what the AD said, these say which campaign the site
--      was actually running.
--
-- Export both first if the ad reporting still matters:
--
--   \copy (SELECT * FROM campaigns) TO 'campaigns-backup.csv' WITH CSV HEADER;
--   \copy (SELECT id, created_at, campaign_id, campaign_identifier, vehicle_type
--            FROM bookings WHERE campaign_identifier IS NOT NULL)
--     TO 'bookings-campaign-backup.csv' WITH CSV HEADER;

DROP INDEX IF EXISTS idx_bookings_campaign_identifier;

ALTER TABLE bookings
  DROP COLUMN IF EXISTS campaign_id,
  DROP COLUMN IF EXISTS campaign_identifier,
  DROP COLUMN IF EXISTS vehicle_type,
  DROP COLUMN IF EXISTS vehicle_category;

-- Indexes and constraints on campaigns go with the table.
DROP TABLE IF EXISTS campaigns;

-- btree_gist is deliberately NOT dropped. It is a database-wide extension that other
-- objects may depend on, and removing something this migration only ensured the presence
-- of — rather than exclusively owned — is out of scope for a rollback.
