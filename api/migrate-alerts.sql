-- Chairside — instant alerts on Telegram / WhatsApp (run ONCE, before deploying the new Worker)
--   npx wrangler d1 execute reputation-watch --remote --file=./migrate-alerts.sql
-- Purely additive: creates two new tables, touches nothing that exists.

-- Where each clinic's private-note alerts go, besides the email on the dentist row.
CREATE TABLE IF NOT EXISTS alert_targets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,                 -- clinic
  channel    TEXT NOT NULL,                 -- 'telegram' | 'whatsapp'
  target     TEXT NOT NULL,                 -- telegram chat_id, or WhatsApp number in E.164 (+9955...)
  label      TEXT,                          -- who it is, e.g. "Dr. Nino" / "Manager"
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (slug, channel, target)
);
CREATE INDEX IF NOT EXISTS idx_alert_targets_slug ON alert_targets (slug);

-- One-time codes behind the "connect Telegram" link we send a clinic.
CREATE TABLE IF NOT EXISTS link_codes (
  code       TEXT PRIMARY KEY,
  slug       TEXT NOT NULL,
  label      TEXT,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);
