'use client';

import Link from 'next/link';
import {useLearning} from '@/context/LearningContext';
import { usePathname } from 'next/navigation';
import {
  House,
  CirclePlay,
  Compass,
  NotebookPen,
  ChartNoAxesCombined,
  Award,
  MessagesSquare,
  CalendarDays,
  ClipboardCheck,
  Wrench,
  UserRound,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { account, billing, logout } = useLearning();

  const navItems = [
    { section: 'Learn' },
    { href: '/', label: 'Home', icon: House },
    { href: '/my-learning', label: 'My Learning', icon: CirclePlay },
    { href: '/browse-courses', label: 'Browse Courses', icon: Compass },
    { href: '/notes', label: 'Study Notebook', icon: NotebookPen },
    { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
    { href: '/certificates', label: 'Certificates', icon: Award },
    { section: 'Community', divided: true },
    { href: '/community', label: 'Discussions', icon: MessagesSquare },
    { href: '/live-classes', label: 'Live Classes', icon: CalendarDays },
    { href: '/assignments', label: 'Assignments', icon: ClipboardCheck },
    { section: 'Account & Studio', divided: true },
    ...(account.role !== 'learner' ? [{ href: '/instructor', label: 'Instructor Studio', icon: Wrench }] : []),
    ...(account.role === 'admin' ? [{ href: '/admin', label: 'Administration', icon: ShieldCheck }] : []),
    { href: '/pricing', label: billing.plan === 'pro' ? 'Pro membership' : 'Plans & billing', icon: CreditCard },
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
        <div className="sidebar-account"><span className="sidebar-avatar">{account.name.slice(0,1).toUpperCase()}</span><div><strong>{account.name}</strong><span>{account.role} · {billing.plan}</span></div></div>
        <button className="sidebar-signout" onClick={() => void logout()}><LogOut size={17}/> Sign out</button>
      </div>
    </aside>
  );
}
