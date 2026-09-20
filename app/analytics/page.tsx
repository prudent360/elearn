'use client';

import { useState } from 'react';
import { useLearning } from '@/context/LearningContext';
import { Clock, Target, Zap, Flame, TrendingUp, CheckCircle2, Play } from 'lucide-react';

export default function AnalyticsPage() {
  const { data, weeklyGoalHours, setWeeklyGoalHours } = useLearning();
  const user = data.currentUser;
  const courses = data.courses;

  const [modalOpen, setModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(weeklyGoalHours.toString());

  const totalWeeklyMinutes = user.weeklyStats.reduce((sum, item) => sum + item.minutes, 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);
  const goalPercent = Math.min(100, Math.round((parseFloat(totalWeeklyHours) / weeklyGoalHours) * 100));
  const maxMinutes = Math.max(...user.weeklyStats.map(s => s.minutes));

  const enrolledCourses = courses.filter(c => c.status === 'in-progress' || c.status === 'completed');

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="library-eyebrow">LEARNING VELOCITY & INSIGHTS</p>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Track your study hours, completion trends, subject distribution, and learning habits.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(true)}>
            <Target style={{ width: 16, height: 16 }} /> Set Weekly Goal ({weeklyGoalHours}h)
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="analytics-metrics-grid">
        <div className="surface analytics-metric-card">
          <div className="metric-header">
            <span className="stat-icon">
              <Clock style={{ width: 18, height: 18 }} />
            </span>
            <span className="tag-pill indigo">This Week</span>
          </div>
          <div className="metric-value">
            {totalWeeklyHours} <small>hrs</small>
          </div>
          <div className="metric-label">Estimated Lesson Time</div>
          <div className="metric-footer positive">
            <TrendingUp style={{ width: 14, height: 14 }} /> Estimated from completed lesson durations
          </div>
        </div>

        <div className="surface analytics-metric-card">
          <div className="metric-header">
            <span className="stat-icon mint">
              <Target style={{ width: 18, height: 18 }} />
            </span>
            <span className={`tag-pill ${goalPercent >= 100 ? 'emerald' : 'amber'}`}>
              {goalPercent}% Goal
            </span>
          </div>
          <div className="metric-value">
            {totalWeeklyHours} <small>/ {weeklyGoalHours}h</small>
          </div>
          <div className="metric-label">Weekly Goal Progress</div>
          <div className="progress-bar-bg" style={{ marginTop: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${goalPercent}%` }}></div>
          </div>
        </div>

        <div className="surface analytics-metric-card">
          <div className="metric-header">
            <span className="stat-icon cyan">
              <Zap style={{ width: 18, height: 18 }} />
            </span>
            <span className="tag-pill cyan">Daily Avg</span>
          </div>
          <div className="metric-value">
            {avgDailyMinutes} <small>mins/day</small>
          </div>
          <div className="metric-label">Daily Average Pace</div>
          <div className="metric-footer positive">
            <CheckCircle2 style={{ width: 14, height: 14 }} /> On track for monthly target
          </div>
        </div>

        <div className="surface analytics-metric-card">
          <div className="metric-header">
            <span className="stat-icon amber">
              <Flame style={{ width: 18, height: 18 }} />
            </span>
            <span className="tag-pill amber">Streak</span>
          </div>
          <div className="metric-value">
            {user.streakDays} <small>days</small>
          </div>
          <div className="metric-label">Current Active Streak</div>
          <div className="metric-footer amber-text">
            <Flame style={{ width: 14, height: 14 }} /> Personal Best: 21 days
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="analytics-main-grid" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Bar Chart */}
          <div className="workspace-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Weekly Study Duration</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily minutes spent watching video lessons and completing exercises</p>
              </div>
              <span className="tag-pill indigo">Sep 14 – Sep 20</span>
            </div>

            <div className="weekly-chart-container">
              {user.weeklyStats.map((stat, idx) => {
                const heightPct = Math.round((stat.minutes / (maxMinutes || 1)) * 100);
                const hrs = (stat.minutes / 60).toFixed(1);
                const isPeak = stat.minutes === maxMinutes;
                return (
                  <div key={idx} className="chart-bar-col">
                    <div className="chart-bar-tooltip">{stat.minutes} mins ({hrs}h)</div>
                    <div className="chart-bar-track">
                      <div className={`chart-bar-fill ${isPeak ? 'peak-bar' : ''}`} style={{ height: `${heightPct}%` }}></div>
                    </div>
                    <div className="chart-bar-label">{stat.day}</div>
                    <div className="chart-bar-sublabel">{stat.date.split(' ')[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Distribution */}
          <div className="workspace-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Subject Time Allocation</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Cumulative hours invested per learning domain</p>

            <div className="multi-progress-bar" style={{ marginBottom: 20 }}>
              {user.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="multi-progress-segment" style={{ width: `${cat.percentage}%`, background: cat.color }} title={`${cat.category}: ${cat.percentage}%`}></div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {user.categoryBreakdown.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: cat.color, display: 'inline-block' }}></span>
                    <span style={{ fontWeight: 600 }}>{cat.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{cat.hours} hrs</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Completion Matrix */}
          <div className="workspace-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Course Completion Matrix</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18 }}>Track completion velocity across enrolled subjects</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {enrolledCourses.map(course => (
                <div key={course.id} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{course.title}</h4>
                    <span className={`tag-pill ${course.progress === 100 ? 'emerald' : 'indigo'}`} style={{ fontSize: '0.7rem' }}>
                      {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {course.category} • {course.duration} planned
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Study Log */}
          <div className="workspace-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Study Log</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.recentSessions.length} recorded</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user.recentSessions.map(session => (
                <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{session.lessonTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.courseTitle} • {session.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{session.duration}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 600 }}>Completed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Set Weekly Learning Goal</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Challenge yourself! Set how many hours you plan to study each week.</p>
            <input
              type="number"
              value={goalInput}
              min="1"
              max="50"
              onChange={e => setGoalInput(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => { if(await setWeeklyGoalHours(parseFloat(goalInput)))setModalOpen(false); }}>Save Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
