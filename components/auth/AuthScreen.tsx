'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  setupRequired: boolean;
  mailConfigured: boolean;
  onSignedIn: () => Promise<void>;
}

export function AuthScreen({ setupRequired, mailConfigured, onSignedIn }: AuthScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const payload: Record<string, string> = { email: email.trim(), password };
    if (mode === 'register') payload.name = name.trim();
    if (mode === 'setup') {
      payload.name = name.trim();
      payload.setupToken = setupToken.trim();
    }
    try {
      const res = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      await onSignedIn();
      if (mode !== 'login' && mailConfigured) router.push('/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-split">
      {/* ──── Left Panel: Branding ──── */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-inner">
          {/* Animated orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />

          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h1 className="auth-brand-title">Tekskillup<br />Academy</h1>
            <p className="auth-brand-tagline">
              Build practical skills with guided courses, projects, and instructor feedback.
            </p>

            {/* Feature pills */}
            <div className="auth-features">
              <div className="auth-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Interactive Courses</span>
              </div>
              <div className="auth-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Live Cohort Classes</span>
              </div>
              <div className="auth-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span>Portfolio Projects</span>
              </div>
              <div className="auth-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Verified Certificates</span>
              </div>
            </div>

          </div>

          <p className="auth-brand-footer">© 2026 Tekskillup Academy</p>
        </div>
      </aside>

      {/* ──── Right Panel: Form ──── */}
      <main className="auth-form-panel">
        <div className="auth-form-wrapper">
          {/* Mobile brand (shown only on small screens) */}
          <div className="auth-mobile-brand">
            <div className="auth-brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="auth-mobile-name">Tekskillup Academy</span>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
            {setupRequired && (
              <button
                type="button"
                className={`auth-tab ${mode === 'setup' ? 'active' : ''}`}
                onClick={() => { setMode('setup'); setError(''); }}
              >
                Setup
              </button>
            )}
          </div>

          {/* Heading */}
          <div className="auth-heading">
            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : mode === 'setup'
                ? 'Administrator setup'
                : 'Create your account'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Enter your credentials to access your workspace.'
                : mode === 'setup'
                ? 'Initialize the root admin with your setup token.'
                : 'Start learning with courses built by industry experts.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="auth-form">
            {mode !== 'login' && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                maxLength={254}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="auth-password">Password</label>
                {mode === 'login' && (
                  <Link href="/reset-password" className="auth-link-small">
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="password-input-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? '••••••••' : 'Min. 12 characters'}
                  required
                  minLength={mode === 'login' ? 1 : 12}
                  maxLength={128}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" className="password-visibility" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {mode === 'setup' && (
              <div className="auth-field">
                <label htmlFor="auth-setup-token">Setup Token</label>
                <input
                  id="auth-setup-token"
                  type="password"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="LMS_SETUP_TOKEN value"
                  required
                  autoComplete="off"
                />
              </div>
            )}

            {error && (
              <div role="alert" className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="auth-spinner" />
                  Authenticating…
                </>
              ) : mode === 'login' ? (
                'Sign in →'
              ) : mode === 'setup' ? (
                'Create Administrator'
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          {/* Footer toggle */}
          <p className="auth-switch">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); }}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
