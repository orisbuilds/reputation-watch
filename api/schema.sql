-- Reputation Watch — D1 database schema
-- Apply with:  npx wrangler d1 execute reputation-watch --file=./schema.sql --remote

CREATE TABLE IF NOT EXISTS dentists (
  slug          TEXT PRIMARY KEY,          -- e.g. "austin-family-dentistry"
  practice_name TEXT NOT NULL,
  doctor_name   TEXT,
  email         TEXT NOT NULL,             -- where complaint alerts are sent
  google_url    TEXT,                      -- their Google review link
  access_token  TEXT NOT NULL,             -- dashboard login secret (issued at provisioning)
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  action     TEXT NOT NULL,                -- 'scan' | 'happy' | 'unhappy'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  message    TEXT NOT NULL,
  name       TEXT,
  contact    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_slug     ON events (slug);
CREATE INDEX IF NOT EXISTS idx_complaints_slug ON complaints (slug);
