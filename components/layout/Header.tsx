'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLearning } from '@/context/LearningContext';
import { Menu, Search, Sun, Moon, ArrowRight, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenNav: () => void;
  onOpenCmd: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/my-learning': 'My Learning',
  '/browse-courses': 'Browse Courses',
  '/notes': 'Study Notebook',
  '/analytics': 'Analytics',
  '/certificates': 'Certificates',
  '/community': 'Discussions',
  '/live-classes': 'Live Classes',
  '/assignments': 'Assignments',
  '/instructor': 'Instructor Studio',
  '/profile': 'Profile',
  '/settings': 'Settings'
};

export function Header({ onOpenNav, onOpenCmd }: HeaderProps) {
  const pathname = usePathname() || '/';
  const { theme, toggleTheme, data } = useLearning();

  let title = pageTitles[pathname];
  if (!title && pathname.startsWith('/course')) {
    title = 'Lesson Workspace';
  }
  if (!title) title = 'Dashboard';

  return (
    <header id="app-header">
      <div className="header-left">
        <button
          id="menu-toggle"
          className="icon-btn"
          aria-label="Open navigation"
          onClick={onOpenNav}
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button>
        <span id="page-label">{title}</span>
      </div>

      <div className="header-right">
        <button
          className="command-search-btn"
          id="open-cmd-btn"
          aria-label="Search lessons"
          onClick={onOpenCmd}
        >
          <Search style={{ width: 16, height: 16 }} />
          <span>Search lessons...</span>
          <kbd>⌘ K</kbd>
        </button>

        <button
          className="icon-btn"
          id="theme-toggle-btn"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: 18, height: 18 }} />
          ) : (
            <Moon style={{ width: 18, height: 18 }} />
          )}
        </button>

        <Link
          href="/settings"
          className="icon-btn"
          aria-label="Account Settings"
        >
          <Settings style={{ width: 18, height: 18 }} />
        </Link>

        <Link
          href="/profile"
          className="user-profile-btn"
          aria-label={`${data.currentUser.name}'s profile`}
        >
          <img
            src={data.currentUser.avatar}
            alt={data.currentUser.name}
            className="avatar-img"
          />
        </Link>

        <Link href="/course?id=course-101" className="btn btn-primary header-continue">
          Continue Learning <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </header>
  );
}
