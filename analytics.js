// Tekskillup Academy - Analytics & Learning Insights Module

window.ApexAnalytics = (function() {
  function render(container) {
    const data = window.LMSData;
    const user = data.currentUser;
    const courses = data.courses;

    const totalWeeklyMinutes = user.weeklyStats.reduce((sum, item) => sum + item.minutes, 0);
    const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
    const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);
    const goalPercent = Math.min(100, Math.round((totalWeeklyHours / user.weeklyGoalHours) * 100));
    const maxMinutes = Math.max(...user.weeklyStats.map(s => s.minutes));

    const enrolledCourses = courses.filter(c => c.status === 'in-progress' || c.status === 'completed');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <p class="library-eyebrow">LEARNING VELOCITY & INSIGHTS</p>
          <h1 class="page-title">Analytics Dashboard</h1>
          <p class="page-subtitle">Track your study hours, completion trends, subject distribution, and learning habits.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-secondary" id="analytics-goal-btn">
            <i data-lucide="target"></i> Set Weekly Goal (${user.weeklyGoalHours}h)
          </button>
        </div>
      </div>

      <!-- Overview Stats Cards -->
      <div class="analytics-metrics-grid">
        <div class="surface analytics-metric-card">
          <div class="metric-header">
            <span class="stat-icon"><i data-lucide="clock"></i></span>
            <span class="tag-pill indigo">This Week</span>
          </div>
          <div class="metric-value">${totalWeeklyHours} <small>hrs</small></div>
          <div class="metric-label">Total Study Time</div>
          <div class="metric-footer positive">
            <i data-lucide="trending-up"></i> +2.4h vs last week
          </div>
        </div>

        <div class="surface analytics-metric-card">
          <div class="metric-header">
            <span class="stat-icon mint"><i data-lucide="target"></i></span>
            <span class="tag-pill ${goalPercent >= 100 ? 'emerald' : 'amber'}">${goalPercent}% Goal</span>
          </div>
          <div class="metric-value">${totalWeeklyHours} <small>/ ${user.weeklyGoalHours}h</small></div>
          <div class="metric-label">Weekly Goal Progress</div>
          <div class="progress-bar-bg" style="margin-top: 10px;">
            <div class="progress-bar-fill" style="width: ${goalPercent}%;"></div>
          </div>
        </div>

        <div class="surface analytics-metric-card">
          <div class="metric-header">
            <span class="stat-icon cyan"><i data-lucide="zap"></i></span>
            <span class="tag-pill cyan">Daily Avg</span>
          </div>
          <div class="metric-value">${avgDailyMinutes} <small>mins/day</small></div>
          <div class="metric-label">Daily Average Pace</div>
          <div class="metric-footer positive">
            <i data-lucide="check-circle-2"></i> On track for monthly target
          </div>
        </div>

        <div class="surface analytics-metric-card">
          <div class="metric-header">
            <span class="stat-icon amber"><i data-lucide="flame"></i></span>
            <span class="tag-pill amber">Streak</span>
          </div>
          <div class="metric-value">${user.streakDays} <small>days</small></div>
          <div class="metric-label">Current Active Streak</div>
          <div class="metric-footer amber-text">
            <i data-lucide="flame"></i> Personal Best: 21 days
          </div>
        </div>
      </div>

      <!-- Main Analytics Layout Grid -->
      <div class="analytics-main-grid" style="margin-top: 28px;">
        
        <!-- Left: Weekly Bar Chart & Subject Distribution -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Weekly Bar Chart Visualizer -->
          <div class="workspace-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <h2 style="font-size: 1.1rem; font-weight: 700;">Weekly Study Duration</h2>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Daily minutes spent watching video lessons and completing exercises</p>
              </div>
              <span class="tag-pill indigo">Sep 14 – Sep 20</span>
            </div>

            <div class="weekly-chart-container">
              ${user.weeklyStats.map(stat => {
                const heightPct = Math.round((stat.minutes / (maxMinutes || 1)) * 100);
                const hrs = (stat.minutes / 60).toFixed(1);
                const isPeak = stat.minutes === maxMinutes;
                return `
                  <div class="chart-bar-col">
                    <div class="chart-bar-tooltip">${stat.minutes} mins (${hrs}h)</div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill ${isPeak ? 'peak-bar' : ''}" style="height: ${heightPct}%;"></div>
                    </div>
                    <div class="chart-bar-label">${stat.day}</div>
                    <div class="chart-bar-sublabel">${stat.date.split(' ')[1]}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Subject Distribution Breakdown -->
          <div class="workspace-card">
            <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Subject Time Allocation</h2>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">Cumulative hours invested per learning domain</p>

            <!-- Multi-segment distribution bar -->
            <div class="multi-progress-bar" style="margin-bottom: 20px;">
              ${user.categoryBreakdown.map(cat => `
                <div class="multi-progress-segment" style="width: ${cat.percentage}%; background: ${cat.color};" title="${cat.category}: ${cat.percentage}%"></div>
              `).join('')}
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${user.categoryBreakdown.map(cat => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: ${cat.color}; display: inline-block;"></span>
                    <span style="font-weight: 600;">${cat.category}</span>
                  </div>
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <span style="font-weight: 700;">${cat.hours} hrs</span>
                    <span style="font-size: 0.78rem; color: var(--text-muted); width: 40px; text-align: right;">${cat.percentage}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Right: Course Completion Matrix & Activity Log -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Enrolled Course Completion Progress -->
          <div class="workspace-card">
            <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Course Completion Matrix</h2>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 18px;">Track completion velocity across enrolled subjects</p>

            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${enrolledCourses.map(course => `
                <div style="padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <h4 style="font-size: 0.92rem; font-weight: 700;">${course.title}</h4>
                    <span class="tag-pill ${course.progress === 100 ? 'emerald' : 'indigo'}" style="font-size: 0.7rem;">
                      ${course.progress === 100 ? 'Completed' : course.progress + '%'}
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 8px;">
                    ${course.category} • ${course.duration} planned
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${course.progress}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Learning Sessions Log -->
          <div class="workspace-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h2 style="font-size: 1.1rem; font-weight: 700;">Recent Study Log</h2>
              <span style="font-size: 0.78rem; color: var(--text-muted);">${user.recentSessions.length} recorded</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${user.recentSessions.map(session => `
                <div style="display: flex; items-center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: rgba(99,102,241,0.15); color: var(--accent-primary); display: flex; align-items: center; justify-content: center;">
                      <i data-lucide="play" style="width: 14px;"></i>
                    </div>
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 700;">${session.lessonTitle}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${session.courseTitle} • ${session.date}</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-primary);">${session.duration}</div>
                    <div style="font-size: 0.72rem; color: var(--accent-success); font-weight: 600;">+${session.xp} XP</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>

      <!-- Goal Setter Modal -->
      <div class="modal-backdrop" id="analytics-goal-modal">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="Set Weekly Goal" style="max-width: 440px;">
          <h2 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 8px;">Set Weekly Learning Goal</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Challenge yourself! Set how many hours you plan to study each week.</p>
          
          <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">Weekly Goal (Hours)</label>
          <input type="number" id="goal-hours-input" value="${user.weeklyGoalHours}" min="1" max="50" style="width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-size: 1rem; margin-bottom: 20px;">

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-secondary close-goal-modal">Cancel</button>
            <button class="btn btn-primary" id="save-goal-btn">Save Goal</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }

    // Modal behavior
    const goalModal = document.getElementById('analytics-goal-modal');
    const goalBtn = document.getElementById('analytics-goal-btn');
    const closeBtns = container.querySelectorAll('.close-goal-modal');
    const saveGoalBtn = document.getElementById('save-goal-btn');
    const goalInput = document.getElementById('goal-hours-input');

    if (goalBtn) {
      goalBtn.addEventListener('click', () => goalModal.classList.add('open'));
    }

    closeBtns.forEach(btn => btn.addEventListener('click', () => goalModal.classList.remove('open')));

    if (saveGoalBtn && goalInput) {
      saveGoalBtn.addEventListener('click', () => {
        const val = parseFloat(goalInput.value);
        if (val && val > 0) {
          user.weeklyGoalHours = val;
          goalModal.classList.remove('open');
          render(container);
        }
      });
    }
  }

  return {
    render
  };
})();
