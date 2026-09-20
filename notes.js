// Tekskillup Academy - Global Study Notebook Module

window.ApexNotes = (function() {
  function render(container) {
    const data = window.LMSData;
    const userNotes = data ? data.userNotes : {};
    const courses = data ? data.courses : [];

    const noteEntries = Object.entries(userNotes).map(([lessonId, content]) => {
      let lessonTitle = "Lesson Notes";
      let courseTitle = "Workspace Course";

      courses.forEach(c => {
        if (c.modules) {
          c.modules.forEach(m => {
            if (m.lessons) {
              const l = m.lessons.find(item => item.id === lessonId);
              if (l) {
                lessonTitle = l.title;
                courseTitle = c.title;
              }
            }
          });
        }
      });

      return { lessonId, lessonTitle, courseTitle, content };
    });

    container.innerHTML = `
      <div class="page-header">
        <div>
          <p class="library-eyebrow">CENTRAL KNOWLEDGE BASE</p>
          <h1 class="page-title">Study Notebook</h1>
          <p class="page-subtitle">Access, search, and export all personal notes and code snippets saved across your enrolled courses.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="export-notes-btn">
            <i data-lucide="download"></i> Export All Notes (.md)
          </button>
        </div>
      </div>

      <!-- Controls -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <input type="text" id="notes-search-input" placeholder="Search notes & code snippets..." style="padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.88rem; width: 320px;">
        <span style="font-size: 0.82rem; color: var(--text-muted);">${noteEntries.length} Saved Note Entries</span>
      </div>

      <!-- Notes Grid -->
      <div style="display: flex; flex-direction: column; gap: 20px;" id="notes-list-container">
        ${renderNotesList(noteEntries)}
      </div>
    `;

    function renderNotesList(entries) {
      if (entries.length === 0) {
        return `
          <div class="surface" style="padding: 48px; text-align: center; color: var(--text-muted);">
            <i data-lucide="notebook" style="width: 36px; height: 36px; margin-bottom: 8px;"></i>
            <h3>No notes found</h3>
            <p>Write notes inside any lesson workspace and they will automatically appear here!</p>
          </div>
        `;
      }

      return entries.map(entry => `
        <div class="surface" style="padding: 24px; border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="tag-pill indigo" style="font-size: 0.72rem; margin-bottom: 4px;">${entry.courseTitle}</span>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${entry.lessonTitle}</h3>
            </div>
            <a href="#course" class="btn btn-secondary btn-sm"><i data-lucide="arrow-up-right"></i> Open Lesson</a>
          </div>
          <pre style="background: var(--bg-input); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.6; color: var(--text-primary); overflow-x: auto; white-space: pre-wrap;">${escapeHtml(entry.content)}</pre>
        </div>
      `).join('');
    }

    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Search filter
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = noteEntries.filter(n => 
          n.content.toLowerCase().includes(q) || 
          n.lessonTitle.toLowerCase().includes(q) || 
          n.courseTitle.toLowerCase().includes(q)
        );
        document.getElementById('notes-list-container').innerHTML = renderNotesList(filtered);
        if (window.lucide) lucide.createIcons();
      });
    }

    // Export All Notes
    const exportBtn = document.getElementById('export-notes-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        let fullMarkdown = `# Tekskillup Academy Study Notebook\n\nExported on: ${new Date().toLocaleDateString()}\n\n---\n\n`;
        noteEntries.forEach(entry => {
          fullMarkdown += `## ${entry.courseTitle} - ${entry.lessonTitle}\n\n${entry.content}\n\n---\n\n`;
        });

        const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tekskillup_Study_Notes_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  return { render };
})();
