'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {useLearning} from '@/context/LearningContext';
import { AppRail } from './AppRail';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../modals/CommandPalette';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const {account,logout}=useLearning();
  const [navOpen, setNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div id="app-container" className={navOpen ? 'navigation-open' : ''}>
      <AppRail />
      
      {navOpen && (
        <button
          id="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <Sidebar onClose={() => setNavOpen(false)} />

      <main id="app-main">
        <div className="account-bar"><span>{account.name} · {account.role}</span>{account.role!=='learner'&&<Link href="/instructor">Instructor studio</Link>}{account.role==='admin'&&<Link href="/admin">Administration</Link>}<button onClick={()=>void logout()}>Sign out</button></div>
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
