-- Create the ppf_leads table.
--
-- WHY THIS EXISTS: the table is defined in shared/schema.ts and the application has always
-- written to it, but it was never created in the production database. Every submission from
-- the PPF/ceramic landing page — the destination the Meta ads point at — therefore failed
-- with `42P01 relation "ppf_leads" does not exist`, was converted to an HTTP 400 by the
-- route handler, and was discarded. The payload is never logged, so those leads are gone.
-- Confirmed on production 2026-09-08: 10 tables present, ppf_leads not among them.
--
-- CODE-FIRST, NOT CODE-AFTER: the deployed build already contains every route and storage
-- method for this table (POST/GET /api/ppf-leads, storage.createPpfLead). Creating the
-- table is sufficient on its own — no rebuild, no container swap, no downtime. Lead capture
-- starts working the moment this commits.
--
-- Column types mirror the live conventions exactly, so drizzle-kit push sees no drift:
-- varchar ids defaulting to gen_random_uuid() (pgcrypto is installed), timestamps as
-- `timestamp without time zone` defaulting to now(). Deliberately no extra indexes — the
-- Drizzle schema declares none, and adding one here would make a later `push` propose
-- dropping it.
--
-- Idempotent — safe to re-run.
--
-- Rollback: see 2026-09-create-ppf-leads.rollback.sql (destructive — read its header first)

CREATE TABLE IF NOT EXISTS ppf_leads (
  id               varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  name             varchar   NOT NULL,
  email            varchar   NOT NULL,
  phone            varchar   NOT NULL,
  vehicle_type     varchar   NOT NULL,
  service_interest varchar   NOT NULL,
  vehicle_model    varchar,
  message          text,
  source           varchar   DEFAULT 'landing_page',
  status           varchar   NOT NULL DEFAULT 'new',
  created_at       timestamp NOT NULL DEFAULT now()
);
