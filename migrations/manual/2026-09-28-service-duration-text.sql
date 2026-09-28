-- =====================================================================================
-- services.duration_text: a free-text turnaround override for the admin dashboard.
--
-- `duration` (integer minutes) cannot express "36-48 hrs" or "2-3 days depending on
-- condition" — several real studio turnaround times are ranges, not a single figure. This
-- column lets the admin set that text directly; NULL keeps today's behaviour exactly
-- (formatServiceTime()'s computed value, or its DURATION_RANGE_OVERRIDES entry).
--
-- ADDITIVE and IDEMPOTENT (IF NOT EXISTS). No DROP, no rewrite of `duration` or any other
-- column. Nullable, no default needed — every existing row keeps NULL, i.e. unchanged
-- display, until explicitly set.
--
-- Hand-written rather than `npm run db:push` — see 2026-09-10-campaign-attribution.sql for
-- why drizzle-kit push aborts against this database.
--
-- Run:  CARCARE_DATABASE_URL="$DATABASE_URL" node scripts/run-migration.mjs migrations/manual/2026-09-28-service-duration-text.sql
-- =====================================================================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_text varchar;
