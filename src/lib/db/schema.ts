// Database schema. Money is stored as integer cents to avoid floating-point
// rounding errors; the UI formats it back to dollars.
//
// A "gig" is one opportunity as it moves through the pipeline:
//   opportunity → analysed → proposal → in_progress → paid
// Milestones split the agreed price into payable chunks, and every verified
// PayPal capture is recorded in `payments`.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS gigs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'opportunity'
    CHECK (status IN ('opportunity','analysed','proposal','in_progress','paid')),
  analysis_json TEXT,
  analysis_source TEXT CHECK (analysis_source IN ('ai','demo')),
  proposal_json TEXT,
  proposal_source TEXT CHECK (proposal_source IN ('ai','demo','manual')),
  price_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 100),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','paid')),
  paypal_order_id TEXT,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS milestones_gig ON milestones(gig_id, position);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  paypal_order_id TEXT NOT NULL UNIQUE,
  paypal_capture_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payer_name TEXT NOT NULL DEFAULT '',
  payer_email TEXT NOT NULL DEFAULT '',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
