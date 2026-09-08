-- Rollback for 2026-09-create-ppf-leads.sql
--
-- ⚠️ DESTRUCTIVE — THIS DELETES CAPTURED CUSTOMER LEADS.
--
-- Unlike the 2026-08 rollback, which only dropped unused columns, this drops a table that
-- holds real enquiries: names, emails and phone numbers submitted by people who asked to be
-- contacted. Once dropped they are unrecoverable, exactly as the pre-migration leads were.
--
-- Before running this, export anything the table holds:
--   \copy (SELECT * FROM ppf_leads ORDER BY created_at) TO 'ppf_leads_backup.csv' CSV HEADER
--
-- There is almost never a reason to run this. Creating the table restores intended behaviour
-- in a build that already expects it; reverting puts the application back to silently
-- discarding every lead. If lead capture needs to stop, disable the form — do not drop the
-- table underneath a running application.
--
-- No other table, column or row is touched.

DROP TABLE IF EXISTS ppf_leads;
