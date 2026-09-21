'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useLearning } from '@/context/LearningContext';

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const { account, api, refresh, resendVerification } = useLearning();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits(prev => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits(prev => { const next = [...prev]; for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]; return next; });
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) { setError('Enter the 6-digit code from your email.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await api('auth/verify-email', 'POST', { code });
      await refresh();
      setNotice('Your email address is verified.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'That code is incorrect or has expired.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(''); setNotice('Sending…');
    setNotice(await resendVerification() ? 'A new code was sent. Check your inbox.' : 'Unable to send a new code.');
  }

  if (account.emailVerified) return (
    <main className="auth-shell">
      <section className="surface auth-card">
        <p className="library-eyebrow">TEKSKILLUP ACADEMY</p>
        <h1>Email verified</h1>
        <p role="status" className="backend-success">Your email address, {account.email}, is already verified.</p>
        <div className="auth-links"><Link href="/">Go to Tekskillup Academy</Link></div>
      </section>
    </main>
  );

  return (
    <main className="auth-shell">
      <section className="surface auth-card">
        <p className="library-eyebrow">TEKSKILLUP ACADEMY</p>
        <h1>Verify your email address</h1>
        <p>Enter the 6-digit code we sent to {account.email}. It expires in 15 minutes.</p>
        <form onSubmit={submit} className="backend-form">
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputs.current[index] = el; }}
                value={digit}
                onChange={e => setDigit(index, e.target.value)}
                onKeyDown={e => onKeyDown(index, e)}
                onPaste={onPaste}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                aria-label={`Digit ${index + 1}`}
                style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700 }}
              />
            ))}
          </div>
          {notice && <p role="status" className="backend-success">{notice}</p>}
          {error && <p role="alert" className="backend-error">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Verifying…' : 'Verify email'}</button>
        </form>
        <div className="auth-links">
          <button onClick={() => void handleResend()}>Resend code</button>
          <Link href="/">Skip for now</Link>
        </div>
      </section>
    </main>
  );
}
