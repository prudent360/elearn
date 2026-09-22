-- Tracks which upcoming live classes have already had their reminder email sent, so the
-- notification sweep (see server/service.mjs runNotificationSweep) can run repeatedly without
-- re-sending. One row per class, written once the reminder batch for it goes out.
CREATE TABLE IF NOT EXISTS live_class_reminders (live_class_id TEXT PRIMARY KEY REFERENCES live_classes(id) ON DELETE CASCADE, sent_at TEXT NOT NULL);
-- Tracks the last time each learner received a weekly digest email, so the sweep only sends one
-- per user roughly every 7 days regardless of how often it is invoked.
CREATE TABLE IF NOT EXISTS digest_log (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, sent_at TEXT NOT NULL);
