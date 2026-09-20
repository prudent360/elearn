/* ==========================================================================
   Apex Workspace LMS - Application Router & Interactive Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.LMSData;
  let localPreferences;
  try { localPreferences = window.localStorage; } catch { localPreferences = null; }
  const catalog = window.createLearningCatalog(data.courses, localPreferences);
  const libraryFilters = { learning: {query:'', filter:'all', category:'all', level:'all', sort:'recommended'}, browse: {query:'', filter:'all', category:'all', level:'all', sort:'recommended'} };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let activeCourse = catalog.recentCourse() || data.courses.find(c => c.id === data.continueCourse.id) || data.courses[0];
  let activeLesson = catalog.resume(activeCourse);

  const contentContainer = document.getElementById('app-content');
  const navItems = document.querySelectorAll('[data-view]');
  const learningViews = window.createLearningViews({data, catalog, container:contentContainer, escapeHtml, artwork:courseArtwork, notify:notifyLibrary, onLesson(course, lesson) { activeCourse=course; activeLesson=lesson; }});

  const menuToggle = document.getElementById('menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  function closeNavigation() {
    document.body.classList.remove('navigation-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
  }
  menuToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('navigation-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    if (open) document.querySelector('#app-sidebar a').focus();
  });
  backdrop.addEventListener('click', closeNavigation);
  document.querySelectorAll('#app-sidebar a').forEach(link => link.addEventListener('click', closeNavigation));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('course-preview').open) {
      closeNavigation();
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => modal.classList.remove('open'));
      openCmdBtn.focus();
    }
  });

  // Initialize Routing
  function handleRoute() {
    const [hash = 'dashboard', parameters = ''] = (window.location.hash.slice(1) || 'dashboard').split('?');
    const params = new URLSearchParams(parameters);
    const requestedCourse = params.has('id') ? data.courses.find(course => course.id === params.get('id')) : activeCourse;
    if (hash === 'course' && requestedCourse) {
      activeCourse = requestedCourse;
      activeLesson = params.has('lesson') ? catalog.lessons(activeCourse).find(lesson => lesson.id === params.get('lesson')) : catalog.resume(activeCourse);
    }

    const labels = {dashboard:'Dashboard', course:'Lesson Workspace', 'course-details':'Course Details', 'my-learning':'My Learning', 'browse-courses':'Browse Courses', community:'Discussions', 'live-classes':'Live Classes', assignments:'Assignments', certificates:'Certificates', profile:'Profile'};
    document.getElementById('page-label').textContent = labels[hash] || 'Dashboard';
    document.title = `${labels[hash] || 'Dashboard'} | Apex Learning`;
    closeNavigation();
    // Update Active Nav Item
    navItems.forEach(item => {
      if (item.dataset.view === hash) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });

    // Render Target View
    switch (hash) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'course':
        learningViews.workspace(requestedCourse, params.get('lesson'));
        break;
      case 'course-details':
        learningViews.details(requestedCourse);
        break;
      case 'my-learning':
        renderMyLearning();
        break;
      case 'browse-courses':
        renderLibrary('browse');
        break;
      case 'community':
        renderCommunity();
        break;
      case 'live-classes':
        renderLiveClasses();
        break;
      case 'assignments':
        renderAssignments();
        break;
      case 'certificates':
        renderCertificates();
        break;
      case 'profile':
        renderProfile();
        break;
      default:
        renderDashboard();
    }

    // Re-initialize Lucide Icons for newly injected DOM elements
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  window.addEventListener('hashchange', handleRoute);

  // ==========================================================================
  // VIEW RENDERING FUNCTIONS
  // ==========================================================================

  // 1. DASHBOARD VIEW
  function renderDashboard() {
    const course = activeCourse && catalog.state(activeCourse).enrolled ? activeCourse : data.courses.find(c => c.id === data.continueCourse.id);
    const lessons = course.modules.flatMap(m => m.lessons);
    const completed = lessons.filter(l => l.completed).length;
    const progress = Math.round(completed / lessons.length * 100);
    const next = catalog.resume(course);
    const session = data.upcomingLiveClasses[0];
    contentContainer.innerHTML = `
      <section class="welcome-banner" aria-labelledby="welcome-title">
        <div class="welcome-copy"><p>Good to see you again, Alex</p><h1 id="welcome-title">Welcome back!</h1><p class="welcome-subtitle">Keep learning. Build something great.</p></div>
        <div class="welcome-art" aria-hidden="true"><div class="art-tile tile-back"></div><div class="art-tile tile-middle"></div><div class="art-tile tile-front"><i data-lucide="graduation-cap"></i></div><span class="art-note">Small steps.<br>Big progress.</span></div>
      </section>
      <div class="overview-grid">
        <section class="surface learning-summary" aria-labelledby="continue-title">
          <div class="section-heading"><h2 id="continue-title">Continue Learning</h2><a href="#course-details?id=${course.id}" class="text-link">View Course <i data-lucide="arrow-right"></i></a></div>
          <div class="resume-layout"><div class="course-art" aria-hidden="true"><div class="mini-tile"><i data-lucide="blocks"></i></div><div class="mini-tile second"></div></div>
            <div class="resume-copy"><h3>${course.title}</h3><p>${next.title}</p><div class="resume-progress"><div class="progress-bar-bg" role="progressbar" aria-label="Course progress" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar-fill" style="width:${progress}%"></div></div><span>${progress}%</span></div><div class="resume-actions"><a href="#course?id=${course.id}" class="btn btn-primary"><i data-lucide="play"></i> Resume Lesson</a><span><i data-lucide="clock-3"></i> ${next.duration} lesson</span></div></div>
          </div>
        </section>
        <div class="stats-stack"><a href="#course?id=${course.id}" class="surface stat-card"><span class="stat-icon"><i data-lucide="book-open"></i></span><div><span>Lessons Completed</span><strong>${completed} <small>/ ${lessons.length}</small></strong></div><i data-lucide="chevron-right"></i></a><a href="#profile" class="surface stat-card"><span class="stat-icon"><i data-lucide="trophy"></i></span><div><span>Current Streak</span><strong>${data.currentUser.streakDays} <small>days</small></strong></div><i data-lucide="chevron-right"></i></a></div>
      </div>
      <section class="surface upcoming-summary"><div class="section-heading"><h2><i data-lucide="calendar-days"></i> Upcoming Lesson</h2><a href="#live-classes" class="text-link">View Schedule <i data-lucide="arrow-right"></i></a></div><div class="upcoming-row"><span class="stat-icon"><i data-lucide="file-text"></i></span><div><h3>${session.title}</h3><p>Live workshop with ${session.host}</p></div><a href="#live-classes" class="schedule-chip"><i data-lucide="calendar"></i> ${session.time}</a></div></section>
      <div class="dashboard-footnote"><span>A little progress, every day.</span><a href="#my-learning">Explore your learning <i data-lucide="arrow-up-right"></i></a></div>
    `;
  }

  function renderCoursePage() {
    learningViews.workspace(activeCourse, activeLesson?.id);
  }

  // 3. MY LEARNING VIEW
  function renderMyLearning() { renderLibrary('learning'); }

  function notifyLibrary(message) {
    const toast = document.getElementById('library-announcement');
    toast.textContent = message;
    clearTimeout(notifyLibrary.timer);
    notifyLibrary.timer = setTimeout(() => { toast.textContent = ''; }, 4500);
  }

  function courseArtwork(course, large = false) {
    return `<div class="catalog-art ${course.art || 'violet'} ${large ? 'large' : ''}" aria-hidden="true"><span class="art-orbit"></span><span class="catalog-art-tile"><i data-lucide="${course.symbol || 'layers'}"></i></span><span class="art-dot"></span><span class="art-caption">${escapeHtml(course.category)}</span></div>`;
  }

  function renderLibrary(page) {
    const browse = page === 'browse';
    const options = libraryFilters[page];
    const enrolled = data.courses.filter(course => catalog.state(course).enrolled);
    const completed = enrolled.filter(course => catalog.state(course).status === 'completed').length;
    contentContainer.innerHTML = `
      <div class="page-header library-header"><div><p class="library-eyebrow">${browse ? 'FIND YOUR NEXT CHAPTER' : 'MAKE ROOM FOR GROWTH'}</p><h1 class="page-title">${browse ? 'Browse Courses' : 'My Learning'}</h1><p class="page-subtitle">${browse ? 'A new skill. A fresh perspective. Something just for you.' : 'Pick up where you left off. Your next breakthrough is waiting.'}</p></div><a href="#${browse ? 'my-learning' : 'browse-courses'}" class="btn ${browse ? 'btn-secondary' : 'btn-primary'}"><i data-lucide="${browse ? 'book-open' : 'plus'}"></i>${browse ? 'My Learning' : 'Explore Courses'}</a></div>
      ${browse ? `<section class="catalog-feature"><div><span class="feature-kicker">CURATED FOR CURIOUS MINDS</span><h2>Small steps.<br>Remarkable possibilities.</h2><p>Learn from people who love what they do.<br>Build skills you can put to work.</p><button class="text-link" id="explore-design">Explore design courses <i data-lucide="arrow-right"></i></button></div><div class="feature-art" aria-hidden="true"><span><i data-lucide="sparkles"></i></span><span><i data-lucide="book-open"></i></span><span><i data-lucide="lightbulb"></i></span></div></section>` : `<div class="library-stats"><div class="surface"><span class="stat-icon"><i data-lucide="book-open"></i></span><div><strong>${enrolled.length}</strong><span>Enrolled courses</span></div></div><div class="surface"><span class="stat-icon"><i data-lucide="circle-play"></i></span><div><strong>${enrolled.length - completed}</strong><span>In your learning queue</span></div></div><div class="surface"><span class="stat-icon mint"><i data-lucide="badge-check"></i></span><div><strong>${completed}</strong><span>Courses completed</span></div></div></div>`}
      <section class="library-controls" aria-label="Course filters">
        ${browse ? `<div class="category-pills" aria-label="Course categories">${['all', ...new Set(data.courses.map(course => course.category))].map(category => `<button class="category-pill ${options.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${options.category === category}">${category === 'all' ? 'All courses' : escapeHtml(category)}</button>`).join('')}</div>` : `<div class="library-tabs" aria-label="Learning status">${[['all','All enrolled'],['in-progress','In progress'],['not-started','Not started'],['completed','Completed'],['saved','Saved']].map(([key,label]) => `<button data-library-filter="${key}" class="${options.filter === key ? 'active' : ''}" aria-pressed="${options.filter === key}">${label}</button>`).join('')}</div>`}
        <div class="library-toolbar"><label class="library-search"><i data-lucide="search"></i><input id="library-search" type="search" placeholder="${browse ? 'Find your next course...' : 'Search your courses...'}" aria-label="Search courses" value="${escapeHtml(options.query)}"></label><div class="library-selects">${browse ? `<label>Level<select id="library-level">${['all','Beginner','Intermediate','Advanced'].map(level => `<option value="${level}" ${options.level === level ? 'selected' : ''}>${level === 'all' ? 'All levels' : level}</option>`).join('')}</select></label>` : ''}<label>Sort by<select id="library-sort">${[['recommended','Recommended'],['rating','Highest rated'],['title','Title: A–Z']].map(([value,label]) => `<option value="${value}" ${options.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></div>
      </section>
      <div class="library-results-heading"><p id="library-count" role="status" aria-live="polite"></p><span>${browse ? 'Find your pace. Keep your momentum.' : 'One lesson closer to your goals.'}</span></div>
      <div id="library-grid" class="library-grid"></div>
      <p class="library-local-note">Demo enrollments and saved courses stay in this browser.</p>`;
    function refresh() {
      const list = catalog.select({ page, ...options });
      document.getElementById('library-count').textContent = `${list.length} ${list.length === 1 ? 'course' : 'courses'}${options.query || options.category !== 'all' || options.level !== 'all' ? ' found' : ''}`;
      document.getElementById('library-grid').innerHTML = list.length ? list.map(course => {
        const state = catalog.state(course);
        return `<article class="catalog-card surface">${courseArtwork(course)}<button class="course-bookmark ${state.saved ? 'saved' : ''}" data-save-course="${course.id}" aria-label="${state.saved ? 'Unsave' : 'Save'} ${escapeHtml(course.title)}" aria-pressed="${state.saved}"><i data-lucide="bookmark"></i></button><div class="catalog-card-body"><div class="catalog-card-meta"><span>${course.level}</span><span class="rating"><i data-lucide="star"></i>${course.rating.toFixed(1)}</span></div><h2><button data-preview-course="${course.id}">${escapeHtml(course.title)}</button></h2><p class="catalog-instructor">By ${escapeHtml(course.instructor)}</p>${browse ? `<p class="catalog-description">${escapeHtml(course.description)}</p>` : `<div class="catalog-progress"><div><span>${state.enrolled ? state.progress === 100 ? 'Completed' : state.progress ? 'Keep it going' : 'Ready when you are' : 'Saved for later'}</span><strong>${state.enrolled ? state.progress + '%' : ''}</strong></div><div class="progress-bar-bg" role="progressbar" aria-label="${escapeHtml(course.title)} progress" aria-valuenow="${state.progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar-fill" style="width:${state.progress}%"></div></div></div>`}<div class="catalog-card-footer"><span><i data-lucide="clock-3"></i>${course.duration}</span>${browse || !state.enrolled ? `<button class="btn btn-secondary btn-sm" data-preview-course="${course.id}">${state.enrolled ? 'View course' : 'Explore course'}<i data-lucide="arrow-right"></i></button>` : `<a class="btn ${state.progress === 100 ? 'btn-secondary' : 'btn-primary'} btn-sm" href="#course?id=${course.id}">${state.progress === 100 ? 'Review course' : state.progress ? 'Continue' : 'Start learning'}<i data-lucide="arrow-right"></i></a>`}</div></div></article>`;
      }).join('') : `<section class="surface library-empty"><i data-lucide="search-x"></i><h2>${options.filter === 'saved' && !options.query ? 'Make room for your next interest' : 'No courses found'}</h2><p>${options.filter === 'saved' && !options.query ? 'Save courses using the bookmark on any card.' : 'Try a different search or clear your filters to see more courses.'}</p><button class="btn btn-primary" id="clear-library-filters">Clear filters</button><a class="text-link" href="#browse-courses">Browse all courses</a></section>`;
      document.querySelectorAll('[data-save-course]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.saveCourse;
        const persisted = catalog.save(id);
        refresh();
        document.querySelector(`[data-save-course="${id}"]`)?.focus();
        notifyLibrary(persisted ? catalog.state(data.courses.find(course => course.id === id)).saved ? 'Course saved to your learning list.' : 'Course removed from your saved list.' : 'Updated for this visit. Browser storage is unavailable.');
      }));
      document.querySelectorAll('[data-preview-course]').forEach(button => button.addEventListener('click', () => window.location.hash = '#course-details?id=' + button.dataset.previewCourse));
      document.getElementById('clear-library-filters')?.addEventListener('click', () => { Object.assign(options, {query:'',filter:'all',category:'all',level:'all'}); renderLibrary(page); document.getElementById('library-search').focus(); });
      if (window.lucide) lucide.createIcons();
    }
    document.getElementById('library-search').addEventListener('input', event => { options.query = event.target.value; refresh(); });
    document.getElementById('library-sort').addEventListener('change', event => { options.sort = event.target.value; refresh(); });
    document.getElementById('library-level')?.addEventListener('change', event => { options.level = event.target.value; refresh(); });
    document.querySelectorAll('[data-library-filter], [data-category]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.category) options.category = button.dataset.category; else options.filter = button.dataset.libraryFilter;
      document.querySelectorAll('[data-library-filter], [data-category]').forEach(item => { const active = item.dataset.category ? item.dataset.category === options.category : item.dataset.libraryFilter === options.filter; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
      refresh();
    }));
    document.getElementById('explore-design')?.addEventListener('click', () => { options.category = 'UI/UX & Design'; renderLibrary(page); document.getElementById('library-search').focus(); });
    refresh();
  }

  function openCoursePreview(id, page, trigger) {
    const course = data.courses.find(course => course.id === id);
    const state = catalog.state(course);
    const dialog = document.getElementById('course-preview');
    dialog.innerHTML = `<button class="preview-close icon-btn" aria-label="Close course preview"><i data-lucide="x"></i></button>${courseArtwork(course, true)}<div class="preview-content"><p class="library-eyebrow">${escapeHtml(course.category)} · ${course.level}</p><h2 id="preview-title">${escapeHtml(course.title)}</h2><p class="catalog-instructor">With ${escapeHtml(course.instructor)} · ${course.duration} · ★ ${course.rating.toFixed(1)}</p><p>${escapeHtml(course.description)}</p><div class="preview-note"><i data-lucide="info"></i><span>Frontend preview. Enrollment is saved in this browser.${course.modules?.length ? ' Sample lessons are available.' : ' Lesson content will be added in a later phase.'}</span></div>${state.enrolled ? `<a class="btn btn-primary" id="preview-open" href="#course?id=${course.id}">${state.progress === 100 ? 'Review course' : 'Open course'}<i data-lucide="arrow-right"></i></a>` : '<button class="btn btn-primary" id="preview-enroll">Add to My Learning<i data-lucide="plus"></i></button>'}</div>`;
    dialog.querySelector('.preview-close').onclick = () => dialog.close();
    dialog.querySelector('#preview-open')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('#preview-enroll')?.addEventListener('click', () => {
      const persisted = catalog.enroll(id);
      dialog.close();
      Object.assign(libraryFilters.learning, {query:'',filter:'all',category:'all',level:'all'});
      notifyLibrary(persisted ? 'Added to My Learning. Your next chapter starts here.' : 'Added for this visit. Browser storage is unavailable.');
      if (page === 'learning') renderLibrary(page); else window.location.hash = '#my-learning';
    });
    dialog.onclose = () => { if (trigger.isConnected) trigger.focus(); };
    dialog.onclick = event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } };
    dialog.showModal();
    if (window.lucide) lucide.createIcons();
  }

  // 4. COMMUNITY VIEW
  function renderCommunity() {
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Community & Cohort Discussions</h1>
          <p class="page-subtitle">Exchange ideas, receive project feedback, and collaborate with fellow learners.</p>
        </div>
        <button class="btn btn-primary" id="open-new-thread-btn">
          <i data-lucide="plus-circle"></i> Start New Discussion
        </button>
      </div>

      <div class="community-layout">
        
        <!-- Channels Sidebar -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; padding: 0 8px;">Spaces & Channels</div>
          <div class="channel-list">
            <button class="channel-btn active"><i data-lucide="hash"></i> #ui-ux-design</button>
            <button class="channel-btn"><i data-lucide="hash"></i> #fullstack-cohort</button>
            <button class="channel-btn"><i data-lucide="hash"></i> #announcements</button>
            <button class="channel-btn"><i data-lucide="hash"></i> #career-lounge</button>
          </div>
        </div>

        <!-- Threads Feed -->
        <div>
          ${data.communityThreads.map(thread => `
            <div class="thread-card">
              <button class="upvote-btn" data-thread-id="${thread.id}">
                <i data-lucide="chevron-up" style="width: 16px;"></i>
                <span class="upvote-count">${thread.upvotes}</span>
              </button>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="tag-pill indigo" style="font-size: 0.7rem;">${thread.channel}</span>
                  ${thread.pinned ? `<span class="tag-pill amber" style="font-size: 0.7rem;">📌 Pinned</span>` : ''}
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${thread.timeAgo}</span>
                </div>
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;">${thread.title}</h3>
                <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">${thread.content}</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${thread.authorAvatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;">
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${thread.author}</span>
                  </div>
                  <span style="font-size: 0.8rem; color: var(--accent-primary); font-weight: 600;">💬 ${thread.commentsCount} Comments</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;

    // Upvote animation logic
    document.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const countEl = btn.querySelector('.upvote-count');
        let count = parseInt(countEl.textContent);
        count++;
        countEl.textContent = count;
        btn.style.color = 'var(--accent-primary)';
        btn.style.borderColor = 'var(--accent-primary)';
      });
    });

    // Open New Thread Modal
    const newThreadBtn = document.getElementById('open-new-thread-btn');
    if (newThreadBtn) {
      newThreadBtn.addEventListener('click', () => {
        document.getElementById('new-thread-modal').classList.add('open');
      });
    }
  }

  // 5. LIVE CLASSES VIEW
  function renderLiveClasses() {
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Live Interactive Classes & Workshops</h1>
          <p class="page-subtitle">Join real-time masterclasses, cohort office hours, and access session recordings.</p>
        </div>
      </div>

      <div class="live-calendar-grid">
        
        <!-- Left: Upcoming Schedule -->
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Upcoming Live Sessions</h2>
          
          ${data.upcomingLiveClasses.map(session => `
            <div class="live-event-card">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span class="tag-pill ${session.status === 'starting-soon' ? 'emerald' : 'indigo'}">${session.date} • ${session.time}</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${session.attendees} Attending</span>
                </div>
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">${session.title}</h3>
                
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${session.hostAvatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                  <span style="font-size: 0.85rem; color: var(--text-secondary);">${session.host}</span>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                <button class="btn btn-primary btn-sm" onclick="alert('Launching Live Zoom/WebRTC Room...')">
                  <i data-lucide="video"></i> Join Session
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">+ Add to Calendar</button>
              </div>
            </div>
          `).join('')}

          <!-- Past Recordings -->
          <h2 style="font-size: 1.15rem; font-weight: 700; margin-top: 36px; margin-bottom: 16px;">Past Class Recordings</h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${data.pastRecordings.map(rec => `
              <div class="workspace-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-primary);">
                    <i data-lucide="play"></i>
                  </div>
                  <div>
                    <h4 style="font-size: 0.95rem; font-weight: 700;">${rec.title}</h4>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${rec.speaker} • ${rec.duration} • ${rec.views}</div>
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="alert('Loading session recording...')">Watch Recording</button>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- Right: Weekly Calendar Widget -->
        <div class="workspace-card" style="height: fit-content;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">September 2026 Schedule</h3>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; font-size: 0.85rem;">
            ${Array.from({length: 30}, (_, i) => i + 1).map(day => `
              <div style="padding: 8px; border-radius: 6px; ${day === 20 ? 'background: var(--accent-primary); color: #fff; font-weight: 700;' : 'background: rgba(255,255,255,0.03);'}">
                ${day}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  // 6. PROJECTS & ASSIGNMENTS VIEW
  function renderAssignments() {
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects & Practical Work</h1>
          <p class="page-subtitle">Submit real-world assignments and receive structured peer & instructor feedback.</p>
        </div>
      </div>

      <div class="assignment-board">
        
        <!-- Column 1: To Do -->
        <div class="board-column">
          <div class="column-header">
            <span>TO DO</span>
            <span class="tag-pill" style="font-size: 0.7rem;">1</span>
          </div>
          ${data.assignments.filter(a => a.status === 'to-do').map(asg => renderAssignmentCard(asg)).join('')}
        </div>

        <!-- Column 2: In Review -->
        <div class="board-column">
          <div class="column-header">
            <span>SUBMITTED / IN REVIEW</span>
            <span class="tag-pill amber" style="font-size: 0.7rem;">1</span>
          </div>
          ${data.assignments.filter(a => a.status === 'in-review').map(asg => renderAssignmentCard(asg)).join('')}
        </div>

        <!-- Column 3: Completed & Graded -->
        <div class="board-column">
          <div class="column-header">
            <span>COMPLETED & GRADED</span>
            <span class="tag-pill emerald" style="font-size: 0.7rem;">1</span>
          </div>
          ${data.assignments.filter(a => a.status === 'completed').map(asg => renderAssignmentCard(asg)).join('')}
        </div>

      </div>
    `;
  }

  function renderAssignmentCard(asg) {
    return `
      <div class="workspace-card" style="padding: 16px; margin-bottom: 12px; font-size: 0.88rem;">
        <span class="tag-pill ${asg.status === 'completed' ? 'emerald' : 'indigo'}" style="font-size: 0.7rem; margin-bottom: 8px;">${asg.courseTitle}</span>
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">${asg.title}</h4>
        
        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 12px;">
          ${asg.score ? `Score: <strong style="color: var(--accent-success);">${asg.score}</strong>` : `Due: ${asg.dueDate}`}
        </div>

        ${asg.rubric ? `
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
            ${asg.rubric.map(r => `<div>${r.passed ? '✅' : '⏳'} ${r.item}</div>`).join('')}
          </div>
        ` : ''}

        ${asg.instructorFeedback ? `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 0.75rem; color: var(--text-primary);">
            💬 "${asg.instructorFeedback}"
          </div>
        ` : ''}

        <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 12px; justify-content: center;" onclick="alert('Opening submission modal...')">
          ${asg.status === 'to-do' ? 'Submit Project File' : 'View Submission Details'}
        </button>
      </div>
    `;
  }

  // 7. CERTIFICATES VIEW
  function renderCertificates() {
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Earned Certificates & Credentials</h1>
          <p class="page-subtitle">Official verified certificates for completed learning paths.</p>
        </div>
      </div>

      <div class="cert-grid">
        ${data.certificates.map(cert => `
          <div class="cert-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div class="cert-seal-badge">APX</div>
                <span class="tag-pill emerald" style="font-size: 0.7rem;">Verified Credential</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 800; line-height: 1.3; margin-bottom: 6px;">${cert.title}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); mb-2">${cert.issuedBy}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px;">Issued: ${cert.issueDate} • Grade: ${cert.grade}</div>
            </div>

            <div style="display: flex; flex-wrap: gap: 4px; margin-top: 10px;">
              ${cert.skills.map(s => `<span class="tag-pill" style="font-size: 0.7rem;">${s}</span>`).join(' ')}
            </div>

            <button class="btn btn-primary btn-sm view-cert-btn" data-cert-id="${cert.id}" style="width: 100%; justify-content: center;">
              <i data-lucide="eye"></i> Preview Official Certificate
            </button>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.view-cert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cert = data.certificates.find(c => c.id === btn.dataset.certId);
        openCertificateModal(cert);
      });
    });
  }

  function openCertificateModal(cert) {
    const modal = document.getElementById('cert-preview-modal');
    const container = document.getElementById('cert-frame-container');
    container.innerHTML = `
      <div class="certificate-frame">
        <div style="font-weight: 700; color: #64748b; font-size: 0.9rem; text-transform: uppercase;">Official Certificate of Completion</div>
        <div class="cert-header-title" style="margin-top: 8px;">Apex Learning Workspace</div>
        
        <p style="margin-top: 24px; color: #475569; font-size: 1.1rem;">This is to certify that</p>
        <div class="student-name-cert">${data.currentUser.name}</div>
        <p style="color: #475569; font-size: 1.05rem; max-width: 500px; margin: 0 auto 20px auto;">
          has successfully fulfilled all requirements and passed distinction rubrics for
        </p>
        
        <h3 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${cert.title}</h3>

        <div style="display: flex; justify-content: space-around; border-top: 2px dashed #cbd5e1; padding-top: 24px; margin-top: 24px;">
          <div>
            <div style="font-size: 0.75rem; color: #64748b;">Credential ID</div>
            <div style="font-family: monospace; font-weight: 700;">${cert.credentialId}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #64748b;">Issue Date</div>
            <div style="font-weight: 700;">${cert.issueDate}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 32px;">
          <button class="btn btn-primary btn-sm" onclick="alert('Simulating PDF Certificate download...')">Download PDF</button>
          <button class="btn btn-secondary btn-sm close-modal-btn" data-modal="cert-preview-modal">Close Preview</button>
        </div>
      </div>
    `;
    modal.classList.add('open');

    // Attach close listeners
    container.querySelectorAll('.close-modal-btn').forEach(b => {
      b.addEventListener('click', () => modal.classList.remove('open'));
    });
  }

  // 8. PROFILE VIEW
  function renderProfile() {
    const user = data.currentUser;
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Learner Profile & Achievements</h1>
          <p class="page-subtitle">Track your learning velocity, skill stats, and unlocked achievements.</p>
        </div>
      </div>

      <div class="profile-grid">
        
        <!-- Left: Student Bio Card -->
        <div class="workspace-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; height: fit-content;">
          <img src="${user.avatar}" style="width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-primary); margin-bottom: 14px;">
          <h2 style="font-size: 1.25rem; font-weight: 800;">${user.name}</h2>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">${user.role}</div>
          <span class="tag-pill indigo" style="margin-bottom: 20px;">${user.level}</span>

          <div style="display: flex; justify-content: space-around; width: 100%; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-primary);">${user.hoursLearned}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Hours</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-secondary);">${user.coursesCompleted}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Completed</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-warning);">${user.streakDays}d</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Streak</div>
            </div>
          </div>
        </div>

        <!-- Right: Heatmap & Skills -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- GitHub-style 365-Day Activity Heatmap -->
          <div class="workspace-card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">Learning Velocity Heatmap</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px;">364 active study sessions logged in the last 12 months</p>
            
            <div class="activity-heatmap-grid">
              ${user.activityMap.map(lvl => `<div class="heat-cell lvl-${lvl}"></div>`).join('')}
            </div>
          </div>

          <!-- Skill Matrix -->
          <div class="workspace-card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">Acquired Skill Matrix</h3>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${user.skills.map(sk => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${sk.name}</span>
                    <span style="color: var(--accent-primary); font-weight: 700;">${sk.level}%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${sk.level}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Achievements -->
          <div class="workspace-card">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">Unlocked Badges (${user.achievements.length})</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
              ${user.achievements.map(ach => `
                <div style="display: flex; items-center: gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="font-size: 1.5rem;">${ach.icon}</div>
                  <div>
                    <div style="font-size: 0.85rem; font-weight: 700;">${ach.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${ach.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ==========================================================================
  // GLOBAL MODALS & COMMAND PALETTE
  // ==========================================================================

  // Theme Toggle (Dark / Light persistent)
  const themeBtn = document.getElementById('theme-toggle-btn');
  const THEME_STORAGE_KEY = 'apex-learning-theme-v1';

  function applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme !== 'dark');
    // Look up the icon fresh each time: Lucide replaces the <i data-lucide> element
    // with a new <svg> node on every render, so a cached reference goes stale.
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
  }

  let storedTheme = null;
  try { storedTheme = localPreferences && localPreferences.getItem(THEME_STORAGE_KEY); } catch {}
  if (storedTheme === 'dark' || storedTheme === 'light') applyTheme(storedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
      applyTheme(nextTheme);
      try { localPreferences && localPreferences.setItem(THEME_STORAGE_KEY, nextTheme); } catch {}
    });
  }

  // AI Learning Copilot (simulated assistant — frontend preview, no live model)
  const aiMessages = document.getElementById('ai-messages');
  const aiInput = document.getElementById('ai-input');
  const sendAiBtn = document.getElementById('send-ai-btn');

  function appendAiMessage(text, from) {
    const bubble = document.createElement('div');
    bubble.style.cssText = from === 'user'
      ? 'align-self: flex-end; max-width: 85%; white-space: pre-line; background: var(--accent-primary); color: #fff; padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.88rem;'
      : 'max-width: 85%; white-space: pre-line; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.88rem;';
    bubble.textContent = text;
    aiMessages.appendChild(bubble);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    return bubble;
  }

  function generateAiReply(prompt) {
    const q = prompt.toLowerCase();
    if (q.includes('quiz')) return `Quick practice quiz on "${activeLesson.title}":\n1. What problem does this lesson solve?\n2. Name one key technique it covers.\n3. How would you apply it in a real project?`;
    if (q.includes('summar')) return `Summary of "${activeLesson.title}": it's part of ${activeCourse.title}, focused on ${activeCourse.category.toLowerCase()}. Check the Notes tab in the course workspace for your full breakdown.`;
    if (q.includes('note')) {
      const note = data.userNotes[activeLesson.id];
      return note ? `Here's what's in your notes for this lesson:\n\n${note.slice(0, 220)}${note.length > 220 ? '…' : ''}` : `You don't have saved notes for "${activeLesson.title}" yet — add some from the Notes tab in the course workspace.`;
    }
    if (q.includes('explain') || q.includes('what is') || q.includes('how')) return `Good question. In the context of ${activeCourse.title}, the fastest way to build intuition is usually to break it into smaller, testable pieces. Want a practice quiz on it instead?`;
    return `I'm a simulated copilot in this frontend preview, so I can't reach a live model yet — but ask me to "summarize this lesson", "quiz me", or "explain a concept" and I'll answer using your course data.`;
  }

  function handleAiSend() {
    const text = aiInput.value.trim();
    if (!text) return;
    appendAiMessage(text, 'user');
    aiInput.value = '';
    aiInput.disabled = true;
    sendAiBtn.disabled = true;
    const typingBubble = appendAiMessage('Thinking…', 'bot');
    setTimeout(() => {
      typingBubble.textContent = generateAiReply(text);
      aiInput.disabled = false;
      sendAiBtn.disabled = false;
      aiInput.focus();
    }, 650);
  }

  if (sendAiBtn && aiInput) {
    sendAiBtn.addEventListener('click', handleAiSend);
    aiInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); handleAiSend(); }
    });
  }

  // Command Palette (Cmd + K)
  const cmdModal = document.getElementById('cmd-palette-modal');
  const openCmdBtn = document.getElementById('open-cmd-btn');
  const cmdInput = document.getElementById('cmd-search-input');
  const cmdResults = document.getElementById('cmd-results');

  function toggleCmdPalette() {
    if (cmdModal.classList.contains('open')) {
      cmdModal.classList.remove('open');
    } else {
      cmdModal.classList.add('open');
      cmdInput.value = '';
      renderCmdResults('');
      cmdInput.focus();
    }
  }

  if (openCmdBtn) openCmdBtn.addEventListener('click', toggleCmdPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCmdPalette();
    }
    if (e.key === 'Escape' && cmdModal.classList.contains('open')) {
      cmdModal.classList.remove('open');
    }
  });

  if (cmdInput) {
    cmdInput.addEventListener('input', (e) => {
      renderCmdResults(e.target.value);
    });
  }

  function renderCmdResults(query) {
    const q = query.toLowerCase().trim();
    const items = [
      { text: "Go to Dashboard", icon: "layout-dashboard", action: () => window.location.hash = "#dashboard" },
      { text: "Continue Lesson: Container Queries", icon: "play", action: () => window.location.hash = "#course" },
      { text: "View Enrolled Courses", icon: "compass", action: () => window.location.hash = "#my-learning" },
      { text: "Join Live Workshop Room", icon: "radio", action: () => window.location.hash = "#live-classes" },
      { text: "Open Community Discussions", icon: "message-square", action: () => window.location.hash = "#community" },
      { text: "View Verified Certificates", icon: "award", action: () => window.location.hash = "#certificates" }
    ];

    data.courses.forEach(course => (course.modules || []).forEach(module => module.lessons.forEach(lesson => items.push({text: lesson.title, icon: 'play', action: () => {
      window.location.hash = '#course?id=' + course.id + '&lesson=' + lesson.id;
    }}))));
    const filtered = q ? items.filter(i => i.text.toLowerCase().includes(q)) : items;

    cmdResults.innerHTML = filtered.map((item, idx) => `
      <button type="button" class="cmd-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
        <i data-lucide="${item.icon}" style="width: 16px;"></i>
        <span>${item.text}</span>
      </button>
    `).join('') || '<p class="search-empty">No lessons found. Try another search.</p>';

    if (window.lucide) lucide.createIcons();

    document.querySelectorAll('.cmd-item').forEach((el, idx) => {
      el.addEventListener('click', () => {
        filtered[idx].action();
        cmdModal.classList.remove('open');
      });
    });
  }

  // Close modals on generic close buttons
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.modal;
      const targetModal = document.getElementById(targetId);
      if (targetModal) targetModal.classList.remove('open');
    });
  });

  // Initial Route Run
  handleRoute();
});
