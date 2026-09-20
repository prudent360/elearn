/* Shared catalog state. Enrollment and bookmarks are local demo preferences. */
window.createLearningCatalog = function (courses, storage) {
  let preferences = {};
  try { const value = JSON.parse(storage.getItem('apex-learning-library-v1') || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) preferences = value; } catch {}
  const lessons = course => (course.modules || []).flatMap(module => module.lessons);
  courses.forEach(course => lessons(course).forEach(lesson => {
    const done = preferences[course.id]?.completed;
    if (Array.isArray(done) && done.includes(lesson.id)) lesson.completed = true;
  }));
  function state(course) {
    const pref = preferences[course.id] || {};
    const enrolled = ['in-progress', 'completed'].includes(course.status) || pref.enrolled === true;
    const items = lessons(course);
    const progress = course.status === 'completed' ? 100 : items.length ? Math.round(items.filter(item => item.completed).length / items.length * 100) : 0;
    return { enrolled, saved: typeof pref.saved === 'boolean' ? pref.saved : Boolean(course.saved), progress, status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started' };
  }
  function update(id, values) {
    if (!courses.some(course => course.id === id)) return false;
    preferences[id] = { ...preferences[id], ...values };
    try { storage.setItem('apex-learning-library-v1', JSON.stringify(preferences)); return true; } catch { return false; }
  }
  return {
    state,
    lessons,
    recentCourse() {
      return courses.filter(course => state(course).enrolled && Number.isFinite(preferences[course.id]?.visitedAt)).sort((a,b) => preferences[b.id].visitedAt - preferences[a.id].visitedAt)[0];
    },
    resume(course) {
      const list = lessons(course);
      const remembered = preferences[course.id]?.lastLesson;
      return list.find(lesson => lesson.id === remembered) || list.find(lesson => !lesson.completed) || list[0];
    },
    visit(id, lessonId) {
      const course = courses.find(course => course.id === id);
      return course && lessons(course).some(lesson => lesson.id === lessonId) ? update(id, {lastLesson:lessonId,visitedAt:Date.now()}) : false;
    },
    complete(id, lessonId) {
      const course = courses.find(course => course.id === id);
      const lesson = course && lessons(course).find(lesson => lesson.id === lessonId);
      if (!lesson || !state(course).enrolled) return false;
      lesson.completed = true;
      return update(id, {completed:lessons(course).filter(item => item.completed).map(item => item.id)});
    },
    note(id, lessonId) { const value = preferences[id]?.notes?.[lessonId]; return typeof value === 'string' ? value : null; },
    saveNote(id, lessonId, text) {
      const course = courses.find(course => course.id === id);
      if (!course || !lessons(course).some(lesson => lesson.id === lessonId)) return false;
      return update(id, {notes:{...preferences[id]?.notes, [lessonId]:text}});
    },
    enroll: id => update(id, { enrolled: true }),
    save(id) { const course = courses.find(item => item.id === id); return course ? update(id, { saved: !state(course).saved }) : false; },
    select({ page = 'browse', query = '', filter = 'all', category = 'all', level = 'all', sort = 'recommended' } = {}) {
      const search = query.toLowerCase().trim();
      const result = courses.filter(course => {
        const current = state(course);
        return (page !== 'learning' || (filter === 'saved' ? current.saved : current.enrolled)) &&
          (filter === 'all' || filter === 'saved' || current.status === filter) &&
          (category === 'all' || course.category === category) && (level === 'all' || course.level === level) &&
          (!search || [course.title, course.category, course.instructor, course.description].join(' ').toLowerCase().includes(search));
      });
      if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
      if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
      return result;
    }
  };
};
