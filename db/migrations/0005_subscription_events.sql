CREATE TABLE IF NOT EXISTS subscription_event_watermarks (
  stripe_subscription_id TEXT PRIMARY KEY,
  event_created INTEGER NOT NULL,
  event_id TEXT NOT NULL
);
