CREATE TABLE IF NOT EXISTS instructor_approvals (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT, created_at TEXT NOT NULL);
-- Existing instructor accounts predate this approval workflow and were already trusted by an
-- administrator when the role was granted, so grandfather them in as approved rather than
-- silently revoking their access to course creation. Safe to re-run: server/service.mjs inserts
-- a 'pending' row itself at the moment a *new* promotion happens, and INSERT OR IGNORE here never
-- overwrites a row that already exists, whatever its status.
INSERT OR IGNORE INTO instructor_approvals(user_id,status,reviewed_at,created_at) SELECT id,'approved',datetime('now'),datetime('now') FROM users WHERE role='instructor';
