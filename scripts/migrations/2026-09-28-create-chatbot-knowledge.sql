-- Create the chatbot_knowledge table.
--
-- WHY: the AI chat widget (server/services/chatbot.ts) builds its system prompt from live
-- data (services, hours, blackout dates) plus a few hand-typed facts in
-- server/lib/chatbot-knowledge.ts. That covers most questions, but anything the bot gets
-- wrong or doesn't know (e.g. "do you fit sun film on bikes?") used to need a code change
-- and a redeploy to fix. This table is the "Knowledge Hub" admin tab: staff add a
-- question/answer pair directly, no code change, no redeploy — server/lib/chatbot-knowledge.ts
-- reads only the ACTIVE rows and folds them into the prompt on every request.
--
-- CODE-FIRST ORDER: apply this BEFORE (or together with) deploying the build that reads
-- from it. storage.getActiveChatbotKnowledge() queries this table directly; a build that
-- runs first against a database with no table would 500 on every /api/chat and every
-- /api/admin/chatbot-knowledge request.
--
-- Column types follow the live conventions (varchar ids defaulting to gen_random_uuid(),
-- timestamps as timestamp without time zone defaulting to now()), so drizzle-kit push sees
-- no drift. Deliberately no extra indexes: the Drizzle schema declares none, and this table
-- is read in full (a handful of rows expected) on every chat request, not looked up by key.
--
-- Idempotent — safe to re-run. Rollback: 2026-09-28-create-chatbot-knowledge.rollback.sql (destructive).

CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id         varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  question   varchar   NOT NULL,
  answer     text      NOT NULL,
  is_active  boolean   NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
