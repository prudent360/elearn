'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RequestReset() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/reset-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to send a reset link.');
      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to send a reset link.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) return (
    <>
      <h1>Check your email</h1>
      <p role="status" className="backend-success">If an account exists for {email}, a password reset link is on its way. The link expires in 1 hour.</p>
      <div className="auth-links"><Link href="/">Back to sign in</Link></div>
    </>
  );

  return (
    <>
      <h1>Reset your password</h1>
      <p>Enter the email address on your account and we&apos;ll send you a link to choose a new password.</p>
      <form onSubmit={submit} className="backend-form">
        <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        {error && <p role="alert" className="backend-error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : 'Send reset link'}</button>
      </form>
      <div className="auth-links"><Link href="/">Back to sign in</Link></div>
    </>
  );
}

function SetNewPassword({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to reset your password.');
      setDone(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to reset your password.');
    } finally {
      setBusy(false);
    }
  }

  if (done) return (
    <>
      <h1>Password updated</h1>
      <p role="status" className="backend-success">Your password has been reset. Sign in with your new password.</p>
      <div className="auth-links"><Link href="/">Sign in</Link></div>
    </>
  );

  return (
    <>
      <h1>Choose a new password</h1>
      <p>At least 6 characters.</p>
      <form onSubmit={submit} className="backend-form">
        <label>New password<input name="password" type="password" required minLength={6} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Confirm new password<input name="confirm" type="password" required minLength={6} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        {error && <p role="alert" className="backend-error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : 'Reset password'}</button>
      </form>
    </>
  );
}

function ResetPassword() {
  const token = useSearchParams().get('token') || '';
  return (
    <section className="surface auth-card">
      <p className="library-eyebrow">TEKSKILLUP ACADEMY</p>
      {token ? <SetNewPassword token={token} /> : <RequestReset />}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-shell">
      <Suspense fallback={<p role="status">Loading…</p>}><ResetPassword /></Suspense>
    </main>
  );
}
