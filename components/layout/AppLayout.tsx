'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {useLearning} from '@/context/LearningContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../modals/CommandPalette';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const {account,resendVerification}=useLearning();
  const pathname=usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');

  async function handleResend() {
    setVerifyNotice('Sending…');
    setVerifyNotice(await resendVerification() ? 'A new code was sent. Check your inbox.' : 'Unable to send a new code.');
  }

  return (
    <div id="app-container" className={navOpen ? 'navigation-open' : ''}>
      {navOpen && (
        <button
          id="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <Sidebar onClose={() => setNavOpen(false)} />

      <main id="app-main">
        {!account.emailVerified && pathname !== '/verify-email' && (
          <div className="verify-banner" role="status">
            <span>{verifyNotice || 'Verify your email address to secure your account.'}</span>
            <Link href="/verify-email">Enter code</Link>
            {!verifyNotice.startsWith('A new code') && <button onClick={() => void handleResend()}>Resend code</button>}
          </div>
        )}
        <Header
          onOpenNav={() => setNavOpen(prev => !prev)}
          onOpenCmd={() => setCmdOpen(true)}
        />

        <div id="app-content" tabIndex={-1}>
          {children}
        </div>
      </main>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
