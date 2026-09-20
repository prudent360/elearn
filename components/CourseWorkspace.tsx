'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useLearning } from '@/context/LearningContext';
import {
  ChevronRight,
  BookOpen,
  PencilLine,
  FileText,
  Check,
  ChevronDown,
  Download,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CircleCheck,
  PartyPopper
} from 'lucide-react';

export function CourseWorkspace({id}:{id:string}) {
  const courseId = id;
  const { data, completeLesson, userNotes, saveNote, enrolledCourses, enrollCourse, lastLessons, api, noteStatus } = useLearning();

  const course = data.courses.find(c => c.id === courseId);
  const lessons = course?.modules.flatMap(m => m.lessons) || [];

  const [activeLessonId, setActiveLessonId] = useState<string>(lastLessons[courseId] || lessons[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources'>('overview');

  useEffect(()=>{if(!lessons.some(l=>l.id===activeLessonId))setActiveLessonId(lastLessons[courseId]||lessons[0]?.id||'')},[courseId]);
  useEffect(()=>{if(activeLessonId&&enrolledCourses.includes(courseId))void api('lessons/'+activeLessonId+'/progress','PUT',{completed:false}).catch(()=>{})},[activeLessonId,courseId]);
  if(!course)return <section className="surface backend-panel"><h1>Course not found</h1><Link href="/browse-courses">Browse courses</Link></section>;
  if(!enrolledCourses.includes(courseId))return <section className="surface backend-panel"><h1>{course.title}</h1><p>{course.description}</p><p>{lessons.length} lessons · {course.instructor}</p><button className="btn btn-primary" onClick={()=>void enrollCourse(courseId)}>Enroll in this course</button></section>;
  if(!lessons.length)return <section className="surface backend-panel"><h1>{course.title}</h1><p>This course has no lessons yet.</p></section>;
  const lesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
  const lessonIndex = lessons.indexOf(lesson);
  const currentModule = course.modules.find(m => m.lessons.some(l => l.id === lesson.id)) || course.modules[0];

  const noteText = userNotes[lesson.id] || '';

  const isCourseComplete = lessons.every(l => l.completed);

  return (
    <div>
      <nav className="study-breadcrumb" aria-label="Breadcrumb">
        <Link href="/my-learning">My Learning</Link>
        <ChevronRight style={{ width: 14, height: 14 }} />
        <span>{course.title}</span>
      </nav>

      <div className="study-heading">
        <div>
          <p className="library-eyebrow">
            {currentModule.title.replace(/^Module \d+: /, '')} · LESSON {lessonIndex + 1} OF {lessons.length}
          </p>
          <h1>{lesson.title.replace(/^\d+\.\d+ /, '')}</h1>
        </div>
      </div>

      {isCourseComplete && (
        <section className="course-complete" role="status">
          <PartyPopper style={{ width: 24, height: 24 }} />
          <div>
            <strong>You did it. Every lesson, completed.</strong>
            <p>Revisit your notes or find your next course.</p>
          </div>
          <Link href="/browse-courses" className="btn btn-secondary btn-sm">
            Explore courses
          </Link>
        </section>
      )}

      <div className="study-layout">
        <div className="study-main">
          {/* Stage Card */}
          <section className={`lesson-stage ${course.art}`} aria-label="Lesson introduction">
            <div className="lesson-stage-top">
              <span>
                {lesson.type === 'assignment' ? (
                  <PencilLine style={{ width: 14, height: 14 }} />
                ) : (
                  <BookOpen style={{ width: 14, height: 14 }} />
                )}
                {lesson.type === 'assignment' ? 'Guided practice' : 'Guided reading'}
              </span>
              <span>{lesson.duration}</span>
            </div>
            <div className="lesson-stage-content">
              <p className="library-eyebrow">LEARN SOMETHING. MAKE IT YOURS.</p>
              <h2>{lesson.title.replace(/^\d+\.\d+ /, '')}</h2>
            </div>
            <div className="lesson-stage-bottom">
              <span>{course.instructor}</span>
              <span>
                Sample lesson · {lessonIndex + 1} / {lessons.length}
              </span>
            </div>
          </section>

          <div className="study-lesson-actions">
            <div>
              {lesson.completed ? (
                <span className="lesson-completed-label">
                  <CircleCheck style={{ width: 16, height: 16 }} /> Lesson completed
                </span>
              ) : (
                <span className="study-hint">Small steps, steady progress.</span>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={async () => {
                if(!await completeLesson(course.id, lesson.id))return;
                if (lessonIndex < lessons.length - 1) {
                  setActiveLessonId(lessons[lessonIndex + 1].id);
                }
              }}
            >
              <Check style={{ width: 16, height: 16 }} />
              {lesson.completed
                ? lessonIndex === lessons.length - 1
                  ? 'Completed'
                  : 'Next lesson'
                : lessonIndex === lessons.length - 1
                ? 'Complete lesson'
                : 'Complete & continue'}
            </button>
          </div>

          {lesson.videoUrl && <video controls preload="metadata" src={lesson.videoUrl} style={{width:'100%',borderRadius:12}} aria-label={lesson.title} />}
          {/* Reading Panels */}
          <section className="surface lesson-panels">
            <div className="study-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'notes'}
                className={activeTab === 'notes' ? 'active' : ''}
                onClick={() => setActiveTab('notes')}
              >
                My Notes
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'resources'}
                className={activeTab === 'resources' ? 'active' : ''}
                onClick={() => setActiveTab('resources')}
              >
                Resources <span>1</span>
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="study-panel">
                <p className="library-eyebrow">THE IDEA</p>
                <h2>Let’s break it down</h2>
                <p>{lesson.overview || 'Your instructor has not added a reading for this lesson.'}</p>
                
                <div className="practice-callout">
                  <PencilLine style={{ width: 20, height: 20 }} />
                  <div>
                    <h3>Make it practical</h3>
                    <p>{lesson.exercise || 'Reflect on the lesson and capture your notes.'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="study-panel">
                <div className="section-heading">
                  <div>
                    <h2>Your lesson notebook</h2>
                    <p>Capture an idea. Connect it to your own work.</p>
                  </div>
                  <span className="study-hint">{noteStatus}</span>
                </div>
                <textarea
                  id="study-note"
                  placeholder="What clicked? What would you like to try?"
                  value={noteText}
                  onChange={e => saveNote(lesson.id, e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 160,
                    padding: 12,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="study-panel">
                <h2>Take your learning with you</h2>
                <p>A short study guide with this lesson’s explanation and practice prompt.</p>
                <div className="study-resource" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <FileText style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
                  <div style={{ flex: 1 }}>
                    <strong>Lesson study guide</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Plain text · available offline</div>
                  </div>
                  <a href={`/api/lessons/${lesson.id}/resource`} className="btn btn-secondary btn-sm">
                    <Download style={{ width: 14, height: 14 }} /> Download
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* Bottom Nav */}
          <div className="study-bottom-nav" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            {lessonIndex > 0 ? (
              <button
                className="text-link"
                onClick={() => setActiveLessonId(lessons[lessonIndex - 1].id)}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} /> Previous lesson
              </button>
            ) : (
              <span className="study-hint">First lesson</span>
            )}

            {lessonIndex < lessons.length - 1 ? (
              <button
                className="text-link"
                onClick={() => setActiveLessonId(lessons[lessonIndex + 1].id)}
              >
                Next lesson <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            ) : (
              <Link href="/my-learning" className="text-link">
                Back to course <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            )}
          </div>
        </div>

        {/* Curriculum Sidebar */}
        <aside className="surface study-outline">
          <div className="study-outline-header">
            <p className="library-eyebrow">YOUR LEARNING PATH</p>
            <h2>Course content</h2>
          </div>

          {course.modules.map((mod, mIdx) => (
            <details key={mIdx} className="study-module" open>
              <summary>
                <span className="module-number">{String(mIdx + 1).padStart(2, '0')}</span>
                <span>
                  {mod.title.replace(/^Module \d+: /, '')}
                  <small>{mod.lessons.length} lessons</small>
                </span>
                <ChevronDown style={{ width: 14, height: 14 }} />
              </summary>
              <div className="study-lesson-list">
                {mod.lessons.map(les => (
                  <button
                    key={les.id}
                    className={`study-lesson ${les.id === lesson.id ? 'selected' : ''}`}
                    onClick={() => setActiveLessonId(les.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span className={`lesson-marker ${les.completed ? 'done' : ''}`}>
                      {les.completed ? (
                        <Check style={{ width: 12, height: 12 }} />
                      ) : (
                        <FileText style={{ width: 12, height: 12 }} />
                      )}
                    </span>
                    <span>{les.title.replace(/^\d+\.\d+ /, '')}</span>
                    <span className="lesson-duration">{les.duration}</span>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </aside>
      </div>
    </div>
  );
}
