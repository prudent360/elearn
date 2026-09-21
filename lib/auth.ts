import { db, UserRecord } from './db';

// Lightweight token generator & verifier for session auth
export function generateToken(user: UserRecord): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string | null | undefined): UserRecord | null {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    const user = db.getUserById(parsed.id);
    return user || null;
  } catch {
    return null;
  }
}

export function getSessionUser(request: Request): UserRecord | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
  }
  // Fallback to demo default user if not passed
  return db.getUserById('user-alex') || null;
}
