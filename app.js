/* ==========================================================================
   Apex Workspace LMS - Application Router & Interactive Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.LMSData;
  let activeCourse = data.courses.find(c => c.id === data.continueCourse.id) || data.courses[0];
  let activeLesson = activeCourse.modules[1]?.lessons.find(l => l.active) || activeCourse.modules[0].lessons[0];

  const contentContainer = document.getElementById('app-content');
  const navItems = document.querySelectorAll('[data-view]');

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
    if (event.key === 'Escape') {
      closeNavigation();
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => modal.classList.remove('open'));
      openCmdBtn.focus();
    }
  });

  // Initialize Routing
  function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    
    const labels = {dashboard:'Dashboard', course:'Course Workspace', 'my-learning':'My Learning', community:'Discussions', 'live-classes':'Live Classes', assignments:'Assignments', certificates:'Certificates', profile:'Profile'};
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
        renderCoursePage();
        break;
      case 'my-learning':
        renderMyLearning();
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
    const course = data.courses.find(c => c.id === data.continueCourse.id);
    const lessons = course.modules.flatMap(m => m.lessons);
    const completed = lessons.filter(l => l.completed).length;
    const progress = Math.round(completed / lessons.length * 100);
    const next = lessons.find(l => !l.completed) || lessons[lessons.length - 1];
    const session = data.upcomingLiveClasses[0];
    contentContainer.innerHTML = `
      <section class="welcome-banner" aria-labelledby="welcome-title">
        <div class="welcome-copy"><p>Good to see you again, Alex</p><h1 id="welcome-title">Welcome back!</h1><p class="welcome-subtitle">Keep learning. Build something great.</p></div>
        <div class="welcome-art" aria-hidden="true"><div class="art-tile tile-back"></div><div class="art-tile tile-middle"></div><div class="art-tile tile-front"><i data-lucide="graduation-cap"></i></div><span class="art-note">Small steps.<br>Big progress.</span></div>
      </section>
      <div class="overview-grid">
        <section class="surface learning-summary" aria-labelledby="continue-title">
          <div class="section-heading"><h2 id="continue-title">Continue Learning</h2><a href="#course" class="text-link">View Course <i data-lucide="arrow-right"></i></a></div>
          <div class="resume-layout"><div class="course-art" aria-hidden="true"><div class="mini-tile"><i data-lucide="blocks"></i></div><div class="mini-tile second"></div></div>
            <div class="resume-copy"><h3>${course.title}</h3><p>${next.title}</p><div class="resume-progress"><div class="progress-bar-bg" role="progressbar" aria-label="Course progress" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar-fill" style="width:${progress}%"></div></div><span>${progress}%</span></div><div class="resume-actions"><a href="#course" class="btn btn-primary"><i data-lucide="play"></i> Resume Lesson</a><span><i data-lucide="clock-3"></i> ${next.duration} lesson</span></div></div>
          </div>
        </section>
        <div class="stats-stack"><a href="#course" class="surface stat-card"><span class="stat-icon"><i data-lucide="book-open"></i></span><div><span>Lessons Completed</span><strong>${completed} <small>/ ${lessons.length}</small></strong></div><i data-lucide="chevron-right"></i></a><a href="#profile" class="surface stat-card"><span class="stat-icon"><i data-lucide="trophy"></i></span><div><span>Current Streak</span><strong>${data.currentUser.streakDays} <small>days</small></strong></div><i data-lucide="chevron-right"></i></a></div>
      </div>
      <section class="surface upcoming-summary"><div class="section-heading"><h2><i data-lucide="calendar-days"></i> Upcoming Lesson</h2><a href="#live-classes" class="text-link">View Schedule <i data-lucide="arrow-right"></i></a></div><div class="upcoming-row"><span class="stat-icon"><i data-lucide="file-text"></i></span><div><h3>${session.title}</h3><p>Live workshop with ${session.host}</p></div><a href="#live-classes" class="schedule-chip"><i data-lucide="calendar"></i> ${session.time}</a></div></section>
      <div class="dashboard-footnote"><span>A little progress, every day.</span><a href="#my-learning">Explore your learning <i data-lucide="arrow-up-right"></i></a></div>
    `;
  }

  // 2. COURSE PAGE VIEW
  function renderCoursePage() {
    const course = activeCourse;
    const currentLesson = activeLesson || course.modules[0].lessons[0];
    const savedNotes = data.userNotes[currentLesson.id] || `# Notes for ${currentLesson.title}\n\n- Key insights from this session:\n- `;

    contentContainer.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px;">
            <a href="#my-learning" style="color: var(--accent-primary);">Courses</a> / <span>${course.title}</span>
          </div>
          <h1 style="font-size: 1.4rem; font-weight: 800;">${currentLesson.title}</h1>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" id="prev-lesson-btn"><i data-lucide="chevron-left"></i> Previous</button>
          <button class="btn btn-primary btn-sm" id="complete-next-btn"><i data-lucide="check"></i> Mark Complete & Next</button>
        </div>
      </div>

      <!-- Course Workspace Split View -->
      <div class="course-workspace-layout">
        
        <!-- Left: Module Drawer -->
        <div class="module-drawer">
          <div class="module-drawer-title">
            <span>Course Syllabus</span>
            <span style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 600;">${course.completedLessonsCount || 16}/24 Done</span>
          </div>

          <div class="module-accordion-group">
            ${course.modules.map((mod, mIdx) => `
              <div class="module-accordion-item">
                <div class="module-accordion-header">
                  <span>${mod.title}</span>
                  <i data-lucide="chevron-down" style="width: 14px;"></i>
                </div>
                <div class="lesson-list">
                  ${mod.lessons.map(les => `
                    <button class="lesson-item-btn ${les.id === currentLesson.id ? 'active' : ''}" data-lesson-id="${les.id}">
                      <span class="lesson-status-icon ${les.completed ? 'completed' : ''}">
                        ${les.completed ? '✓' : ''}
                      </span>
                      <span style="flex: 1; truncate">${les.title}</span>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${les.duration}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Video Player & Notebook -->
        <div class="lesson-content-area">
          <div class="video-player-container">
            <video class="custom-video-element" controls poster="${course.thumbnail}">
              <source src="${currentLesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}" type="video/mp4">
              Your browser does not support HTML5 video.
            </video>
          </div>

          <div class="lesson-meta-bar">
            <div>
              <div class="lesson-headline">${currentLesson.title}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">Instructor: ${course.instructor}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" id="bookmark-lesson-btn" title="Save Lesson"><i data-lucide="bookmark"></i> Save</button>
              <button class="btn btn-secondary btn-sm" id="ask-ai-lesson-btn"><i data-lucide="sparkles" style="color: var(--accent-secondary);"></i> Ask Copilot</button>
            </div>
          </div>

          <!-- Bottom Workspace Notebook & Resources -->
          <div class="workspace-tabs-panel">
            <div class="filter-tabs" style="margin-bottom: 16px;">
              <button class="tab-btn active" data-tab="tab-notes">Personal Notes</button>
              <button class="tab-btn" data-tab="tab-resources">Resources & Downloads</button>
              <button class="tab-btn" data-tab="tab-qa">Q&A Discussion</button>
            </div>

            <!-- Tab 1: Notes -->
            <div id="tab-notes" class="tab-pane">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Markdown Notebook • Auto-saved to workspace</span>
                <span id="save-indicator" style="font-size: 0.75rem; color: var(--accent-success);">Saved</span>
              </div>
              <textarea class="notebook-editor-textarea" id="lesson-notes-editor">${savedNotes}</textarea>
            </div>

            <!-- Tab 2: Resources -->
            <div id="tab-resources" class="tab-pane" style="display: none;">
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="file-code" style="color: var(--accent-primary);"></i>
                    <span style="font-size: 0.88rem;">container-queries-starter-lab.zip</span>
                  </div>
                  <button class="btn btn-secondary btn-sm"><i data-lucide="download"></i> Download</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="figma" style="color: #f43f5e;"></i>
                    <span style="font-size: 0.88rem;">Figma-Design-Tokens-Master.fig</span>
                  </div>
                  <button class="btn btn-secondary btn-sm"><i data-lucide="external-link"></i> Open Figma</button>
                </div>
              </div>
            </div>

            <!-- Tab 3: Q&A -->
            <div id="tab-qa" class="tab-pane" style="display: none;">
              <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px;">Have a question about this lesson? Ask instructor Elena or discuss with peers.</p>
              <a href="#community" class="btn btn-outline btn-sm">Jump to Course Discussion Channel</a>
            </div>

          </div>

        </div>

      </div>
    `;

    // Notes auto-save event listener
    const notesEditor = document.getElementById('lesson-notes-editor');
    const saveIndicator = document.getElementById('save-indicator');
    if (notesEditor) {
      notesEditor.addEventListener('input', () => {
        saveIndicator.textContent = 'Saving...';
        saveIndicator.style.color = 'var(--accent-warning)';
        data.userNotes[currentLesson.id] = notesEditor.value;
        setTimeout(() => {
          saveIndicator.textContent = 'Saved';
          saveIndicator.style.color = 'var(--accent-success)';
        }, 600);
      });
    }

    // Switch Lesson Button handlers
    document.querySelectorAll('.lesson-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lId = btn.dataset.lessonId;
        for (const mod of course.modules) {
          const match = mod.lessons.find(l => l.id === lId);
          if (match) {
            activeLesson = match;
            renderCoursePage();
            if (window.lucide) lucide.createIcons();
            break;
          }
        }
      });
    });

    // Mark Complete & Next
    const completeBtn = document.getElementById('complete-next-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        currentLesson.completed = true;
        alert(`Awesome job! Marked "${currentLesson.title}" complete.`);
        renderCoursePage();
        if (window.lucide) lucide.createIcons();
      });
    }

    // Tab switcher inside workspace
    document.querySelectorAll('.tab-btn').forEach(tBtn => {
      tBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
        tBtn.classList.add('active');
        const targetPane = document.getElementById(tBtn.dataset.tab);
        if (targetPane) targetPane.style.display = 'block';
      });
    });

    // AI copilot trigger
    const askAiBtn = document.getElementById('ask-ai-lesson-btn');
    if (askAiBtn) {
      askAiBtn.addEventListener('click', () => {
        document.getElementById('ai-assistant-modal').classList.add('open');
      });
    }
  }

  // 3. MY LEARNING VIEW
  function renderMyLearning() {
    contentContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">My Learning Workspace</h1>
          <p class="page-subtitle">Manage all your enrolled courses, tracked progress, and saved learning paths.</p>
        </div>
      </div>

      <!-- Filter Controls -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div class="filter-tabs">
          <button class="tab-btn active" data-filter="all">All Enrolled (${data.courses.length})</button>
          <button class="tab-btn" data-filter="in-progress">In Progress</button>
          <button class="tab-btn" data-filter="completed">Completed</button>
          <button class="tab-btn" data-filter="saved">Saved Path</button>
        </div>

        <input type="text" id="search-courses-input" placeholder="Search my courses..." style="padding: 8px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.88rem; width: 240px;">
      </div>

      <!-- Courses Grid -->
      <div class="course-grid" id="learning-courses-grid">
        ${renderCourseCardsList(data.courses)}
      </div>
    `;

    // Filter logic
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        let filtered = data.courses;
        if (filter === 'in-progress') filtered = data.courses.filter(c => c.status === 'in-progress');
        if (filter === 'completed') filtered = data.courses.filter(c => c.status === 'completed');
        if (filter === 'saved') filtered = data.courses.filter(c => c.saved);
        
        document.getElementById('learning-courses-grid').innerHTML = renderCourseCardsList(filtered);
        if (window.lucide) lucide.createIcons();
      });
    });
  }

  function renderCourseCardsList(list) {
    if (list.length === 0) {
      return `<div style="grid-column: 1/-1; padding: 48px; text-align: center; color: var(--text-muted);">No courses found matching this filter.</div>`;
    }
    return list.map(course => `
      <div class="workspace-card" style="padding: 0;">
        <img src="${course.thumbnail}" class="course-card-thumb">
        <div class="course-card-body">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="tag-pill indigo">${course.category}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">★ ${course.rating}</span>
          </div>

          <h3 class="course-card-title">${course.title}</h3>

          <div class="instructor-info">
            <img src="${course.instructorAvatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
            <span>${course.instructor}</span>
          </div>

          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Progress</span>
              <span>${course.progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${course.progress}%;"></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-muted);">${course.duration} total</span>
            <a href="#course" class="btn btn-primary btn-sm">
              ${course.progress === 100 ? 'Review' : 'Open Workspace'}
            </a>
          </div>
        </div>
      </div>
    `).join('');
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
  const themeIcon = document.getElementById('theme-icon');
  
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons();
      }
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
      activeCourse = course; activeLesson = lesson;
      if (window.location.hash === '#course') { renderCoursePage(); if (window.lucide) lucide.createIcons(); }
      else window.location.hash = '#course';
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
