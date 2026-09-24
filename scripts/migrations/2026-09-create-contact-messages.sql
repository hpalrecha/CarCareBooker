-- Create the contact_messages table.
--
-- WHY: POST /api/contact (the "Send us a message" form on /contact) used to only console.log the
-- submission, so no message was ever stored or sent to anyone. This table holds each submission so
-- the studio can read it in the admin panel ("Messages" tab).
--
-- CODE-FIRST ORDER: apply this BEFORE (or together with) deploying the build that writes to it. A
-- build that runs first finds no table, the insert fails, and the form answers "please call us"
-- (the payload is still written to the server log as a fallback).
--
-- Column types follow the live conventions (varchar ids defaulting to gen_random_uuid(),
-- timestamps as timestamp without time zone defaulting to now()), so drizzle-kit push sees no drift.
-- Deliberately no extra indexes: the Drizzle schema declares none.
--
-- Idempotent — safe to re-run. Rollback: 2026-09-create-contact-messages.rollback.sql (destructive).

CREATE TABLE IF NOT EXISTS contact_messages (
  id                    varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  varchar   NOT NULL,
  email                 varchar   NOT NULL,
  phone                 varchar   NOT NULL,
  subject               varchar   NOT NULL,
  message               text      NOT NULL,
  status                varchar   NOT NULL DEFAULT 'new',
  whatsapp_alert_status varchar   NOT NULL DEFAULT 'pending',
  whatsapp_alert_error  text,
  created_at            timestamp NOT NULL DEFAULT now()
);
