-- Rollback for 2026-09-add-attribution-and-confirmation-token.sql
--
-- Only drops what that migration added. No other table, column or row is touched.
--
-- Run ONLY after reverting the application code. The current build writes to these
-- columns, and dropping confirmation_token under a running deploy makes every customer
-- confirmation page return "booking not found" — the customer-visible failure this
-- work exists to fix.
--
-- DATA LOSS: dropping these columns discards the campaign attribution collected since
-- the migration was applied. That data cannot be reconstructed from anywhere else — the
-- utm parameters live only here. Export it first if the ad reporting still matters:
--
--   \copy (SELECT id, created_at, source, utm_source, utm_medium, utm_campaign,
--                 utm_content, utm_term, fbclid, gclid, landing_page, referrer
--            FROM bookings WHERE source IS NOT NULL)
--     TO 'bookings-attribution-backup.csv' WITH CSV HEADER;

DROP INDEX IF EXISTS idx_bookings_confirmation_token;
DROP INDEX IF EXISTS idx_bookings_source;
DROP INDEX IF EXISTS idx_bookings_utm_campaign;

ALTER TABLE bookings
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS fbclid,
  DROP COLUMN IF EXISTS gclid,
  DROP COLUMN IF EXISTS landing_page,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS confirmation_token;

ALTER TABLE ppf_leads
  DROP COLUMN IF EXISTS channel,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS fbclid,
  DROP COLUMN IF EXISTS gclid,
  DROP COLUMN IF EXISTS landing_page,
  DROP COLUMN IF EXISTS referrer;
