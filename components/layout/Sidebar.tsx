'use client';

import Link from 'next/link';
import {useLearning} from '@/context/LearningContext';
import { usePathname } from 'next/navigation';
import {
  House,
  CirclePlay,
  Compass,
  BookOpen,
  NotebookPen,
  ChartNoAxesCombined,
  Award,
  MessagesSquare,
  CalendarDays,
  ClipboardCheck,
  Wrench,
  UserRound,
  Settings
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const {account}=useLearning();

  const navItems = [
    { section: 'Learn' },
    { href: '/', label: 'Home', icon: House },
    { href: '/my-learning', label: 'My Learning', icon: CirclePlay },
    { href: '/browse-courses', label: 'Browse Courses', icon: Compass },
    { href: '/course?id=course-101', label: 'Course Workspace', icon: BookOpen },
    { href: '/notes', label: 'Study Notebook', icon: NotebookPen },
    { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
    { href: '/certificates', label: 'Certificates', icon: Award },
    { section: 'Community', divided: true },
    { href: '/community', label: 'Discussions', icon: MessagesSquare },
    { href: '/live-classes', label: 'Live Classes', icon: CalendarDays },
    { href: '/assignments', label: 'Assignments', icon: ClipboardCheck },
    { section: 'Account & Studio', divided: true },
    { href: '/instructor', label: 'Instructor Studio', icon: Wrench },
    { href: '/profile', label: 'Profile', icon: UserRound },
    { href: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside id="app-sidebar" aria-label="Main navigation">
      <div className="sidebar-header">
        <Link href="/" className="brand-logo" onClick={onClose}>
          Tekskillup<br />Academy
        </Link>
        <span className="workspace-caption">YOUR LEARNING SPACE</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if ('section' in item) {
            return (
              <div
                key={idx}
                className={`nav-section-title ${item.divided ? 'divided' : ''}`}
              >
                {item.section}
              </div>
            );
          }

          if(item.href==='/instructor'&&account.role==='learner')return null;
          const IconComponent = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href.split('?')[0]));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <IconComponent style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="small-brand">
          tekskillup<span> academy</span>
        </span>
        <span className="prototype-label">Next.js App</span>
      </div>
    </aside>
  );
}
