'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearning } from '@/context/LearningContext';
import { Lock, Mail, User, Shield, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { updateUserProfile } = useLearning();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (demoEmail: string, demoName: string, demoRole: 'student' | 'instructor' | 'admin', demoAvatar: string, demoHeadline: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.token) {
        try { localStorage.setItem('tekskillup_auth_token', data.token); } catch {}
      }

      updateUserProfile({
        name: data.user.name,
        role: data.user.headline,
        avatar: data.user.avatar
      });

      router.push(demoRole === 'instructor' ? '/instructor' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email, password }
      : { name, email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.token) {
        try { localStorage.setItem('tekskillup_auth_token', data.token); } catch {}
      }

      updateUserProfile({
        name: data.user.name,
        role: data.user.headline,
        avatar: data.user.avatar
      });

      router.push(data.user.role === 'instructor' ? '/instructor' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <div className="surface" style={{ padding: 32, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-logo" style={{ fontSize: '1.4rem', display: 'inline-block', marginBottom: 8 }}>
            Tekskillup Academy
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Welcome Back to Your Workspace' : 'Create Your Learning Account'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to access your enrolled courses and studio.' : 'Join Tekskillup Academy today.'}
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 10 }}>
            🚀 Instant Demo Role Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading}
              onClick={() => handleDemoLogin('alex.morgan@tekskillup.com', 'Alex Morgan', 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'Senior Product Designer & Learner')}
              style={{ justifyContent: 'center' }}
            >
              <GraduationCap style={{ width: 14, height: 14 }} /> Learner (Alex)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading}
              onClick={() => handleDemoLogin('elena@tekskillup.com', 'Elena Rostova', 'instructor', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', 'Principal Design Architect & Instructor')}
              style={{ justifyContent: 'center' }}
            >
              <Shield style={{ width: 14, height: 14 }} /> Instructor (Elena)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                />
                <User style={{ position: 'absolute', left: 12, top: 12, width: 16, height: 16, color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              />
              <Mail style={{ position: 'absolute', left: 12, top: 12, width: 16, height: 16, color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              />
              <Lock style={{ position: 'absolute', left: 12, top: 12, width: 16, height: 16, color: 'var(--text-muted)' }} />
            </div>
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Account Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              >
                <option value="student">Student / Learner</option>
                <option value="instructor">Instructor / Educator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}{' '}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
