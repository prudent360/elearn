'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLearning } from '@/context/LearningContext';
import {
  Search,
  LayoutDashboard,
  Play,
  Compass,
  Radio,
  MessageSquare,
  ChartNoAxesCombined,
  Award,
  Settings
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { data } = useLearning();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultItems = [
    { text: 'Go to Dashboard', icon: LayoutDashboard, href: '/' },
    { text: 'Continue Lesson: Container Queries', icon: Play, href: '/course?id=course-101' },
    { text: 'View Enrolled Courses', icon: Compass, href: '/my-learning' },
    { text: 'Join Live Workshop Room', icon: Radio, href: '/live-classes' },
    { text: 'Open Community Discussions', icon: MessageSquare, href: '/community' },
    { text: 'View Analytics & Learning Velocity', icon: ChartNoAxesCombined, href: '/analytics' },
    { text: 'View Verified Certificates', icon: Award, href: '/certificates' },
    { text: 'Go to Account Settings', icon: Settings, href: '/settings' }
  ];

  const lessonItems = data.courses.flatMap(c =>
    c.modules.flatMap(m =>
      m.lessons.map(l => ({
        text: `${l.title} (${c.title})`,
        icon: Play,
        href: `/course?id=${c.id}`
      }))
    )
  );

  const allItems = [...defaultItems, ...lessonItems];
  const filtered = query.trim()
    ? allItems.filter(i => i.text.toLowerCase().includes(query.toLowerCase()))
    : defaultItems;

  return (
    <div
      className="modal-backdrop open"
      id="cmd-palette-modal"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog cmd-palette-dialog" role="dialog" aria-modal="true">
        <div className="cmd-input-wrapper">
          <Search style={{ color: 'var(--text-muted)', width: 18, height: 18 }} />
          <input
            type="text"
            className="cmd-input"
            placeholder="Search lessons and pages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <span className="kbd-shortcut" onClick={onClose} style={{ cursor: 'pointer' }}>
            ESC
          </span>
        </div>

        <div className="cmd-results-list">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`cmd-item ${idx === 0 ? 'selected' : ''}`}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                >
                  <IconComp style={{ width: 16, height: 16 }} />
                  <span>{item.text}</span>
                </button>
              );
            })
          ) : (
            <p className="search-empty" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No lessons found. Try another search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
