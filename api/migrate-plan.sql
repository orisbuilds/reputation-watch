-- Chairside — add market + plan to clinics (run ONCE, before deploying the new Worker)
--   npx wrangler d1 execute reputation-watch --remote --file=./migrate-plan.sql
-- Every existing clinic becomes market 'us' + plan 'standard' = English only, exactly as today.
ALTER TABLE dentists ADD COLUMN market TEXT NOT NULL DEFAULT 'us';
ALTER TABLE dentists ADD COLUMN plan   TEXT NOT NULL DEFAULT 'standard';
