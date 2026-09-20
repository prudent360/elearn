/* Shared catalog state. Enrollment and bookmarks are local demo preferences. */
window.createLearningCatalog = function (courses, storage) {
  let preferences = {};
  try { const value = JSON.parse(storage.getItem('apex-learning-library-v1') || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) preferences = value; } catch {}
  const lessons = course => (course.modules || []).flatMap(module => module.lessons);
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
