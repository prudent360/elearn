'use client';

import { useLearning } from '@/context/LearningContext';
import { Video, Play } from 'lucide-react';

export default function LiveClassesPage() {
  const { data } = useLearning();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Interactive Classes & Workshops</h1>
          <p className="page-subtitle">Join real-time masterclasses, cohort office hours, and access session recordings.</p>
        </div>
      </div>

      <div className="live-calendar-grid">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>Upcoming Live Sessions</h2>

          {data.upcomingLiveClasses.map(session => (
            <div key={session.id} className="live-event-card">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`tag-pill ${session.status === 'starting-soon' ? 'emerald' : 'indigo'}`}>
                    {session.date} • {session.time}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {session.attendees} Attending
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{session.title}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={session.hostAvatar} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{session.host}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <a className="btn btn-primary btn-sm" href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Video style={{ width: 14, height: 14 }} /> Join Session
                </a>

              </div>
            </div>
          ))}

          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 36, marginBottom: 16 }}>
            Past Class Recordings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.pastRecordings.map(rec => (
              <div key={rec.id} className="workspace-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <Play style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{rec.title}</h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {rec.speaker} • {rec.duration} • {rec.views}
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => alert('Loading session recording...')}>
                  Watch Recording
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Sidebar */}
        <div className="workspace-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>September 2026 Schedule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.85rem' }}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <div
                key={day}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: day === 20 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                  color: day === 20 ? '#fff' : 'inherit',
                  fontWeight: day === 20 ? 700 : 400
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
