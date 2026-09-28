-- Rollback for 2026-09-28-create-chatbot-knowledge.sql
--
-- DESTRUCTIVE: deletes every staff-added knowledge entry.
-- Export first:  \copy (SELECT * FROM chatbot_knowledge ORDER BY created_at) TO 'chatbot_knowledge_backup.csv' CSV HEADER
-- Reverting the table under a running build that expects it makes the admin Knowledge Hub
-- tab and every /api/chat request that queries it 500.

DROP TABLE IF EXISTS chatbot_knowledge;
