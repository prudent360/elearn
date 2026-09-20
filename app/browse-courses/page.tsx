'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLearning } from '@/context/LearningContext';
import { BookOpen, Search, Bookmark, Clock3, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';

export default function BrowseCoursesPage() {
  const { data, savedCourses, toggleSaveCourse } = useLearning();
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(data.courses.map(c => c.category)))];

  let filtered = data.courses.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (query.trim()) {
      return (
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.instructor.toLowerCase().includes(query.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-header library-header">
        <div>
          <p className="library-eyebrow">FIND YOUR NEXT CHAPTER</p>
          <h1 className="page-title">Browse Courses</h1>
          <p className="page-subtitle">A new skill. A fresh perspective. Something just for you.</p>
        </div>
        <Link href="/my-learning" className="btn btn-secondary">
          <BookOpen style={{ width: 16, height: 16 }} /> My Learning
        </Link>
      </div>

      <section className="catalog-feature">
        <div>
          <span className="feature-kicker">CURATED FOR CURIOUS MINDS</span>
          <h2>Small steps.<br />Remarkable possibilities.</h2>
          <p>Learn from people who love what they do.<br />Build skills you can put to work.</p>
        </div>
        <div className="feature-art" aria-hidden="true">
          <span><Sparkles style={{ width: 18, height: 18 }} /></span>
          <span><BookOpen style={{ width: 18, height: 18 }} /></span>
          <span><Lightbulb style={{ width: 18, height: 18 }} /></span>
        </div>
      </section>

      <section className="library-controls" aria-label="Course filters">
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-pill ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'All courses' : cat}
            </button>
          ))}
        </div>

        <div className="library-toolbar">
          <label className="library-search">
            <Search style={{ width: 16, height: 16 }} />
            <input
              type="search"
              placeholder="Find your next course..."
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
        <span>Find your pace. Keep your momentum.</span>
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
                <p className="catalog-description">{course.description}</p>

                <div className="catalog-card-footer">
                  <span>
                    <Clock3 style={{ width: 14, height: 14 }} /> {course.duration}
                  </span>
                  <Link href={`/course?id=${course.id}`} className="btn btn-primary btn-sm">
                    Explore course <ArrowRight style={{ width: 14, height: 14 }} />
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
