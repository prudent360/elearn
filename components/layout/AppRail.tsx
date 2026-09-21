'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLearning } from '@/context/LearningContext';
import { BookOpen, FileText, Users, LayoutGrid, CircleHelp, LogOut } from 'lucide-react';

export function AppRail() {
  const pathname = usePathname();
  const { logout } = useLearning();

  // Active item detection matching the visual design
  const isBookActive = pathname?.startsWith('/course') || pathname === '/browse-courses' || pathname === '/my-learning';
  const isDocActive = pathname === '/notes' || pathname === '/assignments';
  const isCommunityActive = pathname === '/community' || pathname === '/live-classes';
  const isGridActive = pathname === '/';

  return (
    <nav className="app-rail" aria-label="Main navigation">
      {/* Brand logo at top: purple gradient rounded square */}
      <Link href="/" className="rail-brand-logo" aria-label="Tekskillup Academy">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M7 6.5C7 5.12 8.12 4 9.5 4h5C15.88 4 17 5.12 17 6.5S15.88 9 14.5 9h-5C8.12 9 7 7.88 7 6.5z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M7 17.5c0-1.38 1.12-2.5 2.5-2.5h5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-5c-1.38 0-2.5-1.12-2.5-2.5z"
            fill="white"
            fillOpacity="0.65"
          />
          <circle cx="12" cy="12" r="2.5" fill="white" />
        </svg>
      </Link>

      {/* Main navigation icons */}
      <div className="rail-main-links">
        <Link
          href="/browse-courses"
          className={`rail-item ${isBookActive ? 'active' : ''}`}
          aria-label="Courses"
          data-tooltip="Courses"
        >
          <BookOpen style={{ width: 20, height: 20 }} />
        </Link>

        <Link
          href="/notes"
          className={`rail-item ${isDocActive ? 'active' : ''}`}
          aria-label="Notes & Assignments"
          data-tooltip="Notes"
        >
          <FileText style={{ width: 20, height: 20 }} />
        </Link>

        <Link
          href="/community"
          className={`rail-item ${isCommunityActive ? 'active' : ''}`}
          aria-label="Community"
          data-tooltip="Community"
        >
          <Users style={{ width: 20, height: 20 }} />
        </Link>

        <Link
          href="/"
          className={`rail-item ${isGridActive ? 'active' : ''}`}
          aria-label="Dashboard"
          data-tooltip="Dashboard"
        >
          <LayoutGrid style={{ width: 20, height: 20 }} />
        </Link>
      </div>

      {/* Bottom utility icons: Help and Logout */}
      <div className="rail-bottom-links">
        <Link
          href="/community"
          className="rail-item rail-help"
          aria-label="Help & Support"
          data-tooltip="Help"
        >
          <CircleHelp style={{ width: 20, height: 20 }} />
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          className="rail-item rail-logout"
          aria-label="Sign out"
          data-tooltip="Sign out"
        >
          <LogOut style={{ width: 20, height: 20 }} />
        </button>
      </div>
    </nav>
  );
}
