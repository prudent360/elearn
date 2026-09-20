'use client';

import Link from 'next/link';
import { useLearning } from '@/context/LearningContext';
import { GraduationCap, ArrowRight, Play, Clock3, BookOpen, Trophy, CalendarDays, FileText, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const { data, enrolledCourses } = useLearning();
  const user = data.currentUser;
  const course = data.courses.find(c => c.id === data.continueCourse.id) || data.courses[0];
  if (!course || !enrolledCourses.length) return <section className="surface backend-panel"><h1>Welcome, {user.name}</h1><p>Choose your first course to start learning.</p><Link href="/browse-courses" className="btn btn-primary">Browse courses</Link></section>;
  const lessons = course.modules.flatMap(m => m.lessons);
  const completedCount = lessons.filter(l => l.completed).length;
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const nextLesson = lessons.find(l => !l.completed) || lessons[0];
  const session = data.upcomingLiveClasses[0];

  return (
    <div>
      <section className="welcome-banner" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p>Good to see you again, {user.name.split(' ')[0]}</p>
          <h1 id="welcome-title">Welcome back!</h1>
          <p className="welcome-subtitle">Keep learning. Build something great.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-tile tile-back"></div>
          <div className="art-tile tile-middle"></div>
          <div className="art-tile tile-front">
            <GraduationCap style={{ width: 24, height: 24 }} />
          </div>
          <span className="art-note">
            Small steps.<br />Big progress.
          </span>
        </div>
      </section>

      <div className="overview-grid">
        <section className="surface learning-summary" aria-labelledby="continue-title">
          <div className="section-heading">
            <h2 id="continue-title">Continue Learning</h2>
            <Link href={`/course?id=${course.id}`} className="text-link">
              View Course <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div className="resume-layout">
            <div className="course-art" aria-hidden="true">
              <div className="mini-tile"></div>
              <div className="mini-tile second"></div>
            </div>
            <div className="resume-copy">
              <h3>{course.title}</h3>
              <p>{nextLesson.title}</p>
              <div className="resume-progress">
                <div className="progress-bar-bg" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span>{progress}%</span>
              </div>
              <div className="resume-actions">
                <Link href={`/course?id=${course.id}`} className="btn btn-primary">
                  <Play style={{ width: 14, height: 14 }} /> Resume Lesson
                </Link>
                <span>
                  <Clock3 style={{ width: 14, height: 14 }} /> {nextLesson.duration} lesson
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-stack">
          <Link href={`/course?id=${course.id}`} className="surface stat-card">
            <span className="stat-icon">
              <BookOpen style={{ width: 18, height: 18 }} />
            </span>
            <div>
              <span>Lessons Completed</span>
              <strong>
                {completedCount} <small>/ {lessons.length}</small>
              </strong>
            </div>
          </Link>

          <Link href="/profile" className="surface stat-card">
            <span className="stat-icon">
              <Trophy style={{ width: 18, height: 18 }} />
            </span>
            <div>
              <span>Current Streak</span>
              <strong>
                {user.streakDays} <small>days</small>
              </strong>
            </div>
          </Link>
        </div>
      </div>

      {session && <section className="surface upcoming-summary">
        <div className="section-heading">
          <h2>
            <CalendarDays style={{ width: 18, height: 18 }} /> Upcoming Lesson
          </h2>
          <Link href="/live-classes" className="text-link">
            View Schedule <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        <div className="upcoming-row">
          <span className="stat-icon">
            <FileText style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <h3>{session.title}</h3>
            <p>Live workshop with {session.host}</p>
          </div>
          <Link href="/live-classes" className="schedule-chip">
            <CalendarDays style={{ width: 14, height: 14 }} /> {session.time}
          </Link>
        </div>
      </section>}

      <div className="dashboard-footnote">
        <span>A little progress, every day.</span>
        <Link href="/my-learning">
          Explore your learning <ArrowUpRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  );
}
