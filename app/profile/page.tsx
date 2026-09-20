'use client';

import { useLearning } from '@/context/LearningContext';

export default function ProfilePage() {
  const { data } = useLearning();
  const user = data.currentUser;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Learner Profile & Achievements</h1>
          <p className="page-subtitle">Track your learning velocity, skill stats, and unlocked achievements.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left: Bio Card */}
        <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
          <img src={user.avatar} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', marginBottom: 14 }} alt="" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.name}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{user.role}</div>
          <span className="tag-pill indigo" style={{ marginBottom: 20 }}>{user.level}</span>

          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{user.hoursLearned}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hours</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{user.coursesCompleted}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Completed</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-warning)' }}>{user.streakDays}d</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Streak</div>
            </div>
          </div>
        </div>

        {/* Right: Heatmap & Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Activity Heatmap */}
          <div className="workspace-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Learning Velocity Heatmap</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your completed lesson activity over the last 12 months
            </p>

            <div className="activity-heatmap-grid">
              {user.activityMap.map((lvl, idx) => (
                <div key={idx} className={`heat-cell lvl-${lvl}`}></div>
              ))}
            </div>
          </div>

          {/* Skill Matrix */}
          <div className="workspace-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Acquired Skill Matrix</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {user.skills.map((sk, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{sk.name}</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{sk.level}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${sk.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="workspace-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Unlocked Badges ({user.achievements.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {user.achievements.map(ach => (
                <div key={ach.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem' }}>{ach.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{ach.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ach.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
