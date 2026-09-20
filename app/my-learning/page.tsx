'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLearning } from '@/context/LearningContext';
import { BookOpen, CirclePlay, BadgeCheck, Search, Bookmark, Clock3, ArrowRight, Plus } from 'lucide-react';

export default function MyLearningPage() {
  const { data, savedCourses, toggleSaveCourse } = useLearning();
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'saved'>('all');
  const [query, setQuery] = useState('');

  const enrolled = data.courses.filter(c => c.status === 'in-progress' || c.status === 'completed');
  const completedCount = enrolled.filter(c => c.progress === 100).length;

  let filtered = data.courses.filter(c => {
    if (filter === 'saved') return savedCourses.includes(c.id);
    if (filter === 'in-progress') return c.status === 'in-progress' && c.progress < 100;
    if (filter === 'completed') return c.progress === 100;
    return true;
  });

  if (query.trim()) {
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.instructor.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <div>
      <div className="page-header library-header">
        <div>
          <p className="library-eyebrow">MAKE ROOM FOR GROWTH</p>
          <h1 className="page-title">My Learning</h1>
          <p className="page-subtitle">Pick up where you left off. Your next breakthrough is waiting.</p>
        </div>
        <Link href="/browse-courses" className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> Explore Courses
        </Link>
      </div>

      <div className="library-stats">
        <div className="surface">
          <span className="stat-icon">
            <BookOpen style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <strong>{enrolled.length}</strong>
            <span>Enrolled courses</span>
          </div>
        </div>
        <div className="surface">
          <span className="stat-icon">
            <CirclePlay style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <strong>{enrolled.length - completedCount}</strong>
            <span>In your learning queue</span>
          </div>
        </div>
        <div className="surface">
          <span className="stat-icon mint">
            <BadgeCheck style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <strong>{completedCount}</strong>
            <span>Courses completed</span>
          </div>
        </div>
      </div>

      <section className="library-controls" aria-label="Course filters">
        <div className="library-tabs" aria-label="Learning status">
          {[
            ['all', 'All enrolled'],
            ['in-progress', 'In progress'],
            ['completed', 'Completed'],
            ['saved', 'Saved']
          ].map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="library-toolbar">
          <label className="library-search">
            <Search style={{ width: 16, height: 16 }} />
            <input
              type="search"
              placeholder="Search your courses..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
        </div>
      </section>

      <div className="library-results-heading">
        <p id="library-count" role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} found
        </p>
        <span>One lesson closer to your goals.</span>
      </div>

      <div className="library-grid">
        {filtered.map(course => {
          const isSaved = savedCourses.includes(course.id);
          return (
            <article key={course.id} className="catalog-card surface">
              <div className={`catalog-art ${course.art}`} aria-hidden="true">
                <span className="art-orbit"></span>
                <span className="art-caption">{course.category}</span>
              </div>

              <button
                className={`course-bookmark ${isSaved ? 'saved' : ''}`}
                onClick={() => toggleSaveCourse(course.id)}
                aria-label="Bookmark course"
              >
                <Bookmark style={{ width: 16, height: 16 }} />
              </button>

              <div className="catalog-card-body">
                <div className="catalog-card-meta">
                  <span>{course.level}</span>
                  <span className="rating">★ {course.rating.toFixed(1)}</span>
                </div>
                <h2>
                  <Link href={`/course?id=${course.id}`}>{course.title}</Link>
                </h2>
                <p className="catalog-instructor">By {course.instructor}</p>

                <div className="catalog-progress">
                  <div>
                    <span>
                      {course.progress === 100
                        ? 'Completed'
                        : course.progress
                        ? 'Keep it going'
                        : 'Ready when you are'}
                    </span>
                    <strong>{course.progress}%</strong>
                  </div>
                  <div className="progress-bar-bg" role="progressbar" aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>

                <div className="catalog-card-footer">
                  <span>
                    <Clock3 style={{ width: 14, height: 14 }} /> {course.duration}
                  </span>
                  <Link href={`/course?id=${course.id}`} className="btn btn-primary btn-sm">
                    {course.progress === 100 ? 'Review course' : 'Continue'}{' '}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
