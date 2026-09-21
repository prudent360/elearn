CREATE TABLE IF NOT EXISTS email_verifications (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, verified_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS email_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK(kind IN ('verify','reset')), token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS email_tokens_user ON email_tokens(user_id,kind);
