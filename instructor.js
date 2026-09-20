// Tekskillup Academy - Instructor & Admin Studio Module

window.ApexInstructor = (function() {
  function render(container) {
    const data = window.LMSData;
    const courses = data ? data.courses : [];
    const assignments = data ? data.assignments : [];
    const pendingGrading = assignments.filter(a => a.status === 'in-review');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <p class="library-eyebrow">TEACH & BUILD WORKSPACES</p>
          <h1 class="page-title">Instructor Studio</h1>
          <p class="page-subtitle">Create new courses, manage modules, grade student submissions, and track enrollment metrics.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="open-create-course-btn">
            <i data-lucide="plus-circle"></i> Create New Course
          </button>
        </div>
      </div>

      <!-- Analytics Metric Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div class="surface" style="padding: 20px; border-radius: var(--radius-md);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">ACTIVE LEARNERS</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">4,280</div>
          <div style="font-size: 0.75rem; color: var(--accent-success); margin-top: 4px;">↑ +14% this month</div>
        </div>
        <div class="surface" style="padding: 20px; border-radius: var(--radius-md);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">COURSES PUBLISHED</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-primary); margin-top: 4px;">${courses.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">All active & enrolled</div>
        </div>
        <div class="surface" style="padding: 20px; border-radius: var(--radius-md);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">AVERAGE RATING</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-warning); margin-top: 4px;">4.92 ★</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">From 1,420 student reviews</div>
        </div>
        <div class="surface" style="padding: 20px; border-radius: var(--radius-md);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">SUBMISSIONS TO GRADE</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: ${pendingGrading.length > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'}; margin-top: 4px;">${pendingGrading.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Action required</div>
        </div>
      </div>

      <!-- Split Layout: Instructor Courses & Grading Queue -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px;">
        
        <!-- Courses Management -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h2 style="font-size: 1.15rem; font-weight: 700;">Your Courses</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${courses.length} Courses Active</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${courses.map(course => `
              <div class="surface" style="padding: 20px; border-radius: var(--radius-md); display: flex; gap: 16px; align-items: center;">
                <img src="${course.thumbnail}" style="width: 100px; height: 68px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="tag-pill indigo" style="font-size: 0.7rem;">${course.category}</span>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">★ ${course.rating || 4.9}</span>
                  </div>
                  <h3 style="font-size: 1rem; font-weight: 700;">${course.title}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                    Instructor: ${course.instructor} • ${course.duration}
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm edit-course-btn" data-course-id="${course.id}">
                  <i data-lucide="edit-3"></i> Edit
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Grading Queue Side Panel -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h2 style="font-size: 1.15rem; font-weight: 700;">Grading Queue</h2>
            <span class="tag-pill amber">${pendingGrading.length} Pending</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${pendingGrading.length > 0 ? pendingGrading.map(asg => `
              <div class="surface" style="padding: 16px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-warning);">
                <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 600; margin-bottom: 4px;">${asg.courseTitle}</div>
                <h4 style="font-size: 0.95rem; font-weight: 700;">${asg.title}</h4>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">Submitted by Learner</div>
                <button class="btn btn-primary btn-sm open-grade-btn" data-asg-id="${asg.id}" style="width: 100%; margin-top: 12px; justify-content: center;">
                  <i data-lucide="check-square"></i> Review & Grade
                </button>
              </div>
            `).join('') : `
              <div class="surface" style="padding: 24px; text-align: center; color: var(--text-muted);">
                <i data-lucide="check-circle-2" style="width: 32px; height: 32px; color: var(--accent-success); margin-bottom: 8px;"></i>
                <p>All student submissions have been graded!</p>
              </div>
            `}
          </div>
        </div>

      </div>

      <!-- Create Course Modal -->
      <dialog id="create-course-dialog" style="padding: 28px; border-radius: var(--radius-lg); background: var(--bg-sidebar); border: 1px solid var(--border-subtle); color: var(--text-primary); max-width: 540px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="font-size: 1.2rem; font-weight: 700;">Create New Workspace Course</h3>
          <button class="icon-btn" id="close-create-dialog-btn"><i data-lucide="x"></i></button>
        </div>
        <form id="create-course-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Course Title</label>
            <input type="text" id="new-course-title" required placeholder="e.g. Building Scalable Web Architecture" style="width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--text-primary);">
          </div>
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Category</label>
            <select id="new-course-category" style="width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--text-primary);">
              <option value="UI/UX & Design">UI/UX & Design</option>
              <option value="Engineering & AI">Engineering & AI</option>
              <option value="Product & Strategy">Product & Strategy</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Estimated Duration</label>
            <input type="text" id="new-course-duration" required placeholder="e.g. 12h 45m" style="width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--text-primary);">
          </div>
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Description</label>
            <textarea id="new-course-desc" required rows="3" placeholder="Overview of what students will master..." style="width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--text-primary); resize: vertical;"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px;">
            <button type="button" class="btn btn-secondary" id="cancel-create-course-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Publish Course</button>
          </div>
        </form>
      </dialog>
    `;

    // Initialize Event Handlers
    const createDialog = document.getElementById('create-course-dialog');
    const openCreateBtn = document.getElementById('open-create-course-btn');
    const closeCreateBtn = document.getElementById('close-create-dialog-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-course-btn');
    const createForm = document.getElementById('create-course-form');

    if (openCreateBtn && createDialog) {
      openCreateBtn.addEventListener('click', () => createDialog.showModal());
    }
    if (closeCreateBtn && createDialog) {
      closeCreateBtn.addEventListener('click', () => createDialog.close());
    }
    if (cancelCreateBtn && createDialog) {
      cancelCreateBtn.addEventListener('click', () => createDialog.close());
    }

    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTitle = document.getElementById('new-course-title').value;
        const newCat = document.getElementById('new-course-category').value;
        const newDur = document.getElementById('new-course-duration').value;
        const newDesc = document.getElementById('new-course-desc').value;

        const newCourseObj = {
          id: `course-${Date.now()}`,
          title: newTitle,
          category: newCat,
          instructor: data.currentUser ? data.currentUser.name : "Alex Morgan",
          instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
          thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
          progress: 0,
          status: "saved",
          saved: false,
          rating: 5.0,
          studentsCount: "1",
          duration: newDur,
          description: newDesc,
          modules: [
            {
              title: "Module 1: Workspace Fundamentals",
              lessons: [
                { id: `les-${Date.now()}-1`, title: "1.1 Introduction & Goals", duration: "15m", type: "video", completed: false }
              ]
            }
          ]
        };

        data.courses.unshift(newCourseObj);
        createDialog.close();
        alert(`Success! "${newTitle}" has been published to the Course Catalog.`);
        render(container);
        if (window.lucide) lucide.createIcons();
      });
    }

    // Grade assignment button handler
    document.querySelectorAll('.open-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const asgId = btn.dataset.asgId;
        const asg = data.assignments.find(a => a.id === asgId);
        if (asg) {
          asg.status = 'completed';
          asg.score = '95 / 100';
          asg.instructorFeedback = 'Great token mapping! Distinction awarded.';
          alert(`Assignment "${asg.title}" graded successfully with score 95/100!`);
          render(container);
          if (window.lucide) lucide.createIcons();
        }
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  return { render };
})();
