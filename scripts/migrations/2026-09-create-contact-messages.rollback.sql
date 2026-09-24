-- Rollback for 2026-09-create-contact-messages.sql
--
-- DESTRUCTIVE: deletes every stored contact message (names, emails, phone numbers, text).
-- Export first:  \copy (SELECT * FROM contact_messages ORDER BY created_at) TO 'contact_messages_backup.csv' CSV HEADER
-- Reverting the table under a running build that expects it makes the form answer "please call us".

DROP TABLE IF EXISTS contact_messages;
