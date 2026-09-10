-- Campaign attribution on bookings and ppf_leads, plus a customer confirmation token.
--
-- ADDITIVE AND BACKWARD-COMPATIBLE. Every column is nullable with no default, nothing
-- existing is altered or dropped, and no row is rewritten. The currently-deployed build
-- ignores these columns entirely, so this is safe to apply BEFORE the code deploy — and
-- it must be, because the new code writes to them.
--
-- Written as explicit DDL rather than `drizzle-kit push` on purpose, matching
-- 2026-08-add-integration-tracking.sql: push diffs the whole schema against the live
-- database and can propose DROPs for anything not in schema.ts.
--
-- Idempotent — safe to re-run.
--
-- Rollback: see 2026-09-add-attribution-and-confirmation-token.rollback.sql

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
-- `source` is derived server-side from the campaign parameters (see
-- server/lib/attribution.ts deriveSource) and is never taken from the request body.
-- Reporting groups by it, so a client-settable value would be a client-settable report.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source              varchar,
  ADD COLUMN IF NOT EXISTS utm_source          varchar,
  ADD COLUMN IF NOT EXISTS utm_medium          varchar,
  ADD COLUMN IF NOT EXISTS utm_campaign        varchar,
  ADD COLUMN IF NOT EXISTS utm_content         varchar,
  ADD COLUMN IF NOT EXISTS utm_term            varchar,
  ADD COLUMN IF NOT EXISTS fbclid              varchar,
  ADD COLUMN IF NOT EXISTS gclid               varchar,
  ADD COLUMN IF NOT EXISTS landing_page        varchar,
  ADD COLUMN IF NOT EXISTS referrer            varchar,
  ADD COLUMN IF NOT EXISTS confirmation_token  varchar;

-- ---------------------------------------------------------------------------
-- ppf_leads
-- ---------------------------------------------------------------------------
-- `channel` rather than `source`: ppf_leads.source already exists and means something
-- different (which FORM produced the lead — landing_page or exit_intent). Reusing that
-- name for the campaign channel would silently reinterpret every existing row.
ALTER TABLE ppf_leads
  ADD COLUMN IF NOT EXISTS channel       varchar,
  ADD COLUMN IF NOT EXISTS utm_source    varchar,
  ADD COLUMN IF NOT EXISTS utm_medium    varchar,
  ADD COLUMN IF NOT EXISTS utm_campaign  varchar,
  ADD COLUMN IF NOT EXISTS utm_content   varchar,
  ADD COLUMN IF NOT EXISTS utm_term      varchar,
  ADD COLUMN IF NOT EXISTS fbclid        varchar,
  ADD COLUMN IF NOT EXISTS gclid         varchar,
  ADD COLUMN IF NOT EXISTS landing_page  varchar,
  ADD COLUMN IF NOT EXISTS referrer      varchar;

-- ---------------------------------------------------------------------------
-- Confirmation token lookup
-- ---------------------------------------------------------------------------
-- UNIQUE, not just an index. The token is a bearer credential: it is the ONLY thing
-- proving the holder may read that booking. A collision would show one customer another
-- customer's appointment, so the database refuses to store a duplicate rather than
-- trusting the generator to never repeat.
--
-- Postgres treats NULLs as distinct in a unique index, so existing rows — which all have
-- NULL here — do not collide with each other and the index applies only to real tokens.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_confirmation_token
  ON bookings (confirmation_token);

-- Reporting reads. Both are written once and read repeatedly by the admin dashboard.
CREATE INDEX IF NOT EXISTS idx_bookings_source       ON bookings (source);
CREATE INDEX IF NOT EXISTS idx_bookings_utm_campaign ON bookings (utm_campaign);

-- ---------------------------------------------------------------------------
-- NO BACKFILL, deliberately.
--
-- Attribution for a booking taken before this migration does not exist and cannot be
-- reconstructed — the parameters were never recorded. Defaulting historical rows to
-- 'direct' would be inventing data: those bookings would then be indistinguishable from
-- genuinely direct ones, and every "how did this campaign perform" query would silently
-- include months of traffic that predates the campaign.
--
-- NULL means "not measured". 'direct' means "measured, and there was no campaign". The
-- distinction matters as soon as anyone divides one by the other.
-- ---------------------------------------------------------------------------
