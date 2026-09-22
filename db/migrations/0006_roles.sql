CREATE TABLE IF NOT EXISTS role_definitions (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_system INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS role_permissions (role_id TEXT NOT NULL REFERENCES role_definitions(id) ON DELETE CASCADE, permission TEXT NOT NULL, PRIMARY KEY(role_id,permission));
CREATE TABLE IF NOT EXISTS user_role_assignments (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id TEXT NOT NULL REFERENCES role_definitions(id) ON DELETE CASCADE, PRIMARY KEY(user_id,role_id));
CREATE INDEX IF NOT EXISTS user_role_assignments_role ON user_role_assignments(role_id);
INSERT OR IGNORE INTO role_definitions(id,name,is_system,created_at) VALUES('admin','Admin',1,datetime('now'));
