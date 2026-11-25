-- Advertising campaigns, plus the campaign snapshot and vehicle columns on bookings.
--
-- ADDITIVE AND BACKWARD-COMPATIBLE. A new table, and four nullable columns on bookings.
-- Nothing existing is altered, dropped or rewritten.
--
-- SAFE TO APPLY BEFORE THE CODE DEPLOY, and it MUST be: the booking insert paths write
-- campaign_id, campaign_identifier and the vehicle columns, so deploying the code first makes
-- every booking fail.
--
-- WITH ZERO ROWS IN campaigns, BEHAVIOUR IS UNCHANGED. Campaign resolution returns "no
-- campaign", pricing falls through to the existing free_booking_until rule, and the
-- amount a customer is charged is byte-identical to today. Creating this table cannot
-- change what anybody pays.
--
-- Idempotent — safe to re-run.
--
-- Rollback: see 2026-09-create-campaigns.rollback.sql

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
-- Windows are absolute instants (timestamptz), half-open [starts_at, ends_at).
-- An instant is unambiguous in every timezone, so nothing downstream has to convert.
-- Asia/Kolkata enters the picture exactly once: when a human types a date in admin.
--
-- There is deliberately NO price column. services.price remains the sole authority on
-- what a service costs; a campaign controls the offer STATE only. Two authorities on
-- money is the failure the server-authoritative amount work exists to prevent.
CREATE TABLE IF NOT EXISTS campaigns (
  id                 varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name               varchar NOT NULL,
  identifier         varchar NOT NULL UNIQUE,
  service_slug       varchar NOT NULL,
  vehicle_type       varchar NOT NULL,
  landing_page       varchar NOT NULL,
  starts_at          timestamptz NOT NULL,
  ends_at            timestamptz NOT NULL,
  is_active          boolean NOT NULL DEFAULT true,
  offer_type         varchar NOT NULL,
  offer_title        varchar NOT NULL,
  offer_description  text,
  cta_text           varchar NOT NULL,
  created_by         varchar,
  created_at         timestamp NOT NULL DEFAULT now(),
  updated_at         timestamp NOT NULL DEFAULT now(),

  -- A window that ends before it starts is not a window. Rejected at the storage layer
  -- so no application bug can persist one, and so shared/campaign.ts never has to treat
  -- an inverted range as a live possibility on rows that came from here.
  CONSTRAINT campaigns_window_valid CHECK (ends_at > starts_at),

  -- Closed vocabularies. These drive pricing and page selection; an unrecognised value
  -- would create a silent third behaviour nobody is looking for.
  CONSTRAINT campaigns_offer_type_valid   CHECK (offer_type IN ('free_booking', 'none')),
  CONSTRAINT campaigns_vehicle_type_valid CHECK (vehicle_type IN ('car', 'bike', 'both'))
);

CREATE INDEX IF NOT EXISTS "IDX_campaigns_landing_page"
  ON campaigns (landing_page);
CREATE INDEX IF NOT EXISTS "IDX_campaigns_active_window"
  ON campaigns (is_active, starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Overlap prevention, enforced by the database where possible.
-- ---------------------------------------------------------------------------
-- Two ACTIVE campaigns on the same landing page with overlapping windows would make the
-- displayed offer ambiguous. An EXCLUDE constraint over a tstzrange is the only way to
-- express "no two rows may overlap in time" declaratively, and it needs btree_gist to
-- combine the range test with an equality test on landing_page.
--
-- Wrapped in an exception handler ON PURPOSE. If the extension is unavailable on this
-- host, the migration must still succeed: overlap is ALSO prevented at the API (writes
-- are refused) and resolved deterministically at read time (shared/campaign.ts picks the
-- most recently started and reports the conflict). The database constraint is the
-- strongest of the three guards, not the only one, so its absence degrades the guarantee
-- rather than removing it — and the NOTICE says so out loud instead of failing silently.
--
-- WHERE (is_active): paused campaigns are drafts. An admin must be able to prepare next
-- month's offer while this month's is still running, so drafts are free to overlap.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS btree_gist;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'btree_gist unavailable (%); relying on API + server-side overlap guards', SQLERRM;
    RETURN;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_no_active_overlap'
  ) THEN
    BEGIN
      ALTER TABLE campaigns
        ADD CONSTRAINT campaigns_no_active_overlap
        EXCLUDE USING gist (
          landing_page WITH =,
          tstzrange(starts_at, ends_at, '[)') WITH &&
        ) WHERE (is_active);
      RAISE NOTICE 'campaigns_no_active_overlap enforced by the database';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'could not add campaigns_no_active_overlap (%); API + server guards still apply', SQLERRM;
    END;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- bookings: campaign snapshot + vehicle
-- ---------------------------------------------------------------------------
-- campaign_id joins to the campaign while it exists; campaign_identifier is a SNAPSHOT
-- taken at booking time so the record survives that campaign being edited or deleted.
-- A report run next quarter must give the same answer it gave last quarter.
--
-- NO FOREIGN KEY, deliberately. A cascade — or a SET NULL — would let an admin action
-- rewrite booking history, which is exactly what the snapshot exists to prevent.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS campaign_id          varchar,
  ADD COLUMN IF NOT EXISTS campaign_identifier  varchar,
  ADD COLUMN IF NOT EXISTS vehicle_type         varchar,
  ADD COLUMN IF NOT EXISTS vehicle_category     varchar;

CREATE INDEX IF NOT EXISTS idx_bookings_campaign_identifier
  ON bookings (campaign_identifier);

-- ---------------------------------------------------------------------------
-- NO BACKFILL, deliberately — same reasoning as the attribution migration.
--
-- Bookings taken before campaigns existed have no campaign, and inventing one would make
-- them indistinguishable from bookings a campaign genuinely produced. NULL means "no
-- campaign was running / not measured". It is not a gap to be filled.
-- ---------------------------------------------------------------------------
