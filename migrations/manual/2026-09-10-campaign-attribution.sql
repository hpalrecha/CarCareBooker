-- =====================================================================================
-- Campaign attribution, campaigns table and the columns production never received.
--
-- WHY THIS IS HAND-WRITTEN RATHER THAN `npm run db:push`.
--
-- drizzle-kit push aborts against this database with:
--
--     error: column "id" is in a primary key   (42P16, dropconstraint_internal)
--
-- Its diff decides some primary-key column should have NOT NULL dropped, Postgres refuses
-- (a PK column cannot be nullable), and the whole push dies BEFORE applying any of the
-- changes actually wanted. Nothing had been applied when it failed, twice.
--
-- So the changes are written out explicitly. Every statement here is ADDITIVE and
-- IDEMPOTENT — `IF NOT EXISTS` throughout — so running it twice is a no-op and no
-- existing column, constraint or row is touched. There is no DROP anywhere in this file.
--
-- Scope, measured against the production schema dump:
--   bookings    17 columns live, 42 declared in code  -> 25 added below
--   ppf_leads   11 columns live, 21 declared in code  -> 10 added below
--   campaigns   does not exist                        -> created below
--
-- Every added column is NULLABLE or carries a DEFAULT, so existing rows remain valid and
-- no backfill is required.
--
-- Run:  psql "$DATABASE_URL" -f migrations/manual/2026-09-10-campaign-attribution.sql
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- 1. bookings — attribution, campaign snapshot, vehicle, confirmation token
-- -------------------------------------------------------------------------------------

-- First-touch advertising attribution. All nullable: an organic booking has none of them.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_source varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_medium varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_campaign varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_content varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_term varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fbclid varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gclid varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS landing_page varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer varchar;

-- Campaign snapshot. campaign_identifier is stored as a VALUE, not a foreign key, so a
-- campaign that is later renamed or deleted cannot rewrite the history of what a customer
-- was actually shown at the moment they booked.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS campaign_id varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS campaign_identifier varchar;

-- What the customer chose on the landing page: car | bike, and for PPF the body type.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_type varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_category varchar;

-- Unguessable token for the public confirmation page. Without this column the customer
-- confirmation route has nothing to look a booking up by.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_token varchar;

-- Payment verification timestamp.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_verified_at timestamp;

-- ERP sync bookkeeping. erp_sync_error holds a safe summary only — never payloads or
-- tokens — so it can be read in admin without leaking credentials.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_sync_status varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_document_type varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_document_id varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_sync_error text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_synced_at timestamp;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS erp_sync_attempts integer DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS n8n_execution_id varchar;

-- WhatsApp message ids, for correlating a delivery receipt back to its booking.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_whatsapp_message_id varchar;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_notification_message_id varchar;

-- Deliberately NO index on confirmation_token.
--
-- The lookup would benefit from one, but shared/schema.ts does not declare it, and an
-- index that exists in the database but not in the schema is drift that a future
-- `drizzle-kit push` may decide to DROP. The token is 256 bits of randomness on a table
-- of a few thousand rows; a sequential scan is not the bottleneck. Add it to the schema
-- first if it is ever wanted, so both sides agree.

-- -------------------------------------------------------------------------------------
-- 2. ppf_leads — the same attribution, so a lead and a booking from one advertisement
--    can be counted together. `channel` is the derived equivalent of bookings.source.
-- -------------------------------------------------------------------------------------

ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS channel varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS utm_source varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS utm_medium varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS utm_campaign varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS utm_content varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS utm_term varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS fbclid varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS gclid varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS landing_page varchar;
ALTER TABLE ppf_leads ADD COLUMN IF NOT EXISTS referrer varchar;

-- -------------------------------------------------------------------------------------
-- 3. campaigns
--
-- starts_at and ends_at are timestamptz — absolute instants, not wall-clock. The
-- countdown on the landing page is computed against a server-supplied instant so that two
-- phones show the same remaining time even when one has the wrong clock; that only works
-- if the boundary itself is unambiguous.
--
-- ends_at is EXCLUSIVE. The campaign is over AT that instant, not after it.
-- -------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaigns (
  id                varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name              varchar NOT NULL,
  -- Stable machine key, e.g. "ceramic_car_sep". Matches the utm_campaign on the ad, so a
  -- booking's attribution reconciles with its campaign without a fuzzy title match.
  identifier        varchar NOT NULL UNIQUE,
  service_slug      varchar NOT NULL,
  vehicle_type      varchar NOT NULL,          -- car | bike | both
  landing_page      varchar NOT NULL,          -- e.g. /ceramic-coating/car
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,      -- exclusive
  -- Paused campaigns are drafts: invisible to customers, and free to overlap.
  is_active         boolean NOT NULL DEFAULT true,
  offer_type        varchar NOT NULL,          -- free_booking | none
  offer_title       varchar NOT NULL,
  offer_description text,
  cta_text          varchar NOT NULL,
  created_by        varchar,                   -- admins.id
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now()
);

-- Resolution reads by landing page, and by active-window. Both are indexed because both
-- run on every landing-page request.
--
-- The names are DOUBLE-QUOTED so their capitals survive. shared/schema.ts declares them as
-- index("IDX_campaigns_landing_page"), which drizzle creates case-sensitively; an unquoted
-- identifier here would be folded to idx_campaigns_landing_page and drizzle would then see
-- its index as missing and try to create a second one.
CREATE INDEX IF NOT EXISTS "IDX_campaigns_landing_page"
  ON campaigns (landing_page);
CREATE INDEX IF NOT EXISTS "IDX_campaigns_active_window"
  ON campaigns (is_active, starts_at, ends_at);

COMMIT;

-- =====================================================================================
-- Verification. Expect: bookings 42, ppf_leads 21, campaigns 16, campaigns_exists t
-- =====================================================================================
SELECT
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'bookings')  AS bookings_columns,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'ppf_leads') AS ppf_leads_columns,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'campaigns') AS campaigns_columns,
  (SELECT count(*) > 0 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'campaigns') AS campaigns_exists;
