'use client';

import { useState } from 'react';
import { useLearning } from '@/context/LearningContext';
import { Search, Download, BookOpen, FileText } from 'lucide-react';

export default function NotesPage() {
  const { userNotes, data } = useLearning();
  const [search, setSearch] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('les-103');

  const allLessons = data.courses.flatMap(c =>
    c.modules.flatMap(m =>
      m.lessons.map(l => ({ ...l, courseTitle: c.title, courseId: c.id }))
    )
  );

  const notesList = Object.entries(userNotes).map(([lesId, text]) => {
    const l = allLessons.find(item => item.id === lesId);
    return {
      lessonId: lesId,
      text,
      lessonTitle: l?.title || lesId,
      courseTitle: l?.courseTitle || 'General Notes'
    };
  });

  const filtered = notesList.filter(n =>
    n.text.toLowerCase().includes(search.toLowerCase()) ||
    n.lessonTitle.toLowerCase().includes(search.toLowerCase()) ||
    n.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notesList.find(n => n.lessonId === selectedLessonId) || notesList[0] || {
    lessonId: 'les-103',
    text: 'Your lesson notes will appear here after you save them.',
    lessonTitle: 'No notes yet',
    courseTitle: ''
  };

  const handleExport = () => {
    const blob = new Blob([activeNote.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeNote.lessonId}-notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Study Notebook</h1>
          <p className="page-subtitle">Centralized repository for all your course notes, exercise reflections, and study guides.</p>
        </div>
        <button className="btn btn-secondary" disabled={!notesList.length} onClick={handleExport}>
          <Download style={{ width: 16, height: 16 }} /> Export Active Note
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Notes List */}
        <div className="surface" style={{ padding: 16, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type="search"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
            <Search style={{ position: 'absolute', left: 10, top: 10, width: 14, height: 14, color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(note => (
              <button
                key={note.lessonId}
                onClick={() => setSelectedLessonId(note.lessonId)}
                style={{
                  textAlign: 'left',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  background: note.lessonId === selectedLessonId ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: '1px solid',
                  borderColor: note.lessonId === selectedLessonId ? 'var(--accent-primary)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{note.courseTitle}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{note.lessonTitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active Note Preview */}
        <div className="surface" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <div>
              <span className="tag-pill indigo" style={{ fontSize: '0.7rem' }}>{activeNote.courseTitle}</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>{activeNote.lessonTitle}</h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Markdown Plain Text</span>
          </div>

          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {activeNote.text}
          </pre>
        </div>
      </div>
    </div>
  );
}
