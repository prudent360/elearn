'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, FileText, Users, LayoutGrid, UserRound } from 'lucide-react';

export function AppRail() {
  const pathname = usePathname();

  return (
    <nav className="app-rail" aria-label="Workspace shortcuts">
      <Link href="/" className="rail-logo" aria-label="Tekskillup Academy home"></Link>
      <div className="rail-links">
        <Link href="/" className={pathname === '/' ? 'active' : ''} aria-label="Home">
          <House style={{ width: 18, height: 18 }} />
        </Link>
        <Link href="/assignments" className={pathname === '/assignments' ? 'active' : ''} aria-label="Assignments">
          <FileText style={{ width: 18, height: 18 }} />
        </Link>
        <Link href="/community" className={pathname === '/community' ? 'active' : ''} aria-label="Community">
          <Users style={{ width: 18, height: 18 }} />
        </Link>
        <Link href="/my-learning" className={pathname === '/my-learning' ? 'active' : ''} aria-label="My learning">
          <LayoutGrid style={{ width: 18, height: 18 }} />
        </Link>
      </div>
      <Link href="/profile" className="rail-bottom" aria-label="Your profile">
        <UserRound style={{ width: 18, height: 18 }} />
      </Link>
    </nav>
  );
}
