window.createLearningViews = function ({data, catalog, container, escapeHtml:esc, artwork, notify, onLesson}) {
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };
  const url = (course, lesson) => `#course?id=${course.id}${lesson ? '&lesson=' + lesson.id : ''}`;
  const detailsUrl = course => `#course-details?id=${course.id}`;
  let currentTab = 'overview';
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const courseLink = (course, text) => `<a class="btn btn-primary" href="${url(course, catalog.resume(course))}">${icon('play')}${text}</a>`;
  function progress(course) {
    const state = catalog.state(course);
    const all = catalog.lessons(course);
    return `<div class="study-progress-label"><span>${all.filter(lesson=>lesson.completed).length} of ${all.length} lessons completed</span><strong>${state.progress}%</strong></div><div class="progress-bar-bg" role="progressbar" aria-label="Course progress" aria-valuenow="${state.progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar-fill" style="width:${state.progress}%"></div></div>`;
  }
  function curriculum(course, selected, compact = false) {
    const enrolled = catalog.state(course).enrolled;
    return course.modules.map((module,index)=>`<details class="study-module" ${!compact || module.lessons.some(lesson=>lesson.id===selected?.id) ? 'open' : ''}><summary><span class="module-number">${String(index+1).padStart(2,'0')}</span><span>${esc(module.title.replace(/^Module \d+: /,''))}<small>${module.lessons.length} lessons · ${module.lessons.filter(lesson=>lesson.completed).length} complete</small></span>${icon('chevron-down')}</summary><div class="study-lesson-list">${module.lessons.map(lesson=>`<a class="study-lesson ${lesson.id === selected?.id ? 'selected' : ''}" href="${enrolled ? url(course,lesson) : '#course-details?id='+course.id}" ${lesson.id===selected?.id ? 'aria-current="step"' : ''}><span class="lesson-marker ${lesson.completed ? 'done' : ''}">${icon(lesson.completed ? 'check' : lesson.type==='assignment' ? 'pencil-line' : 'file-text')}</span><span>${esc(lesson.title.replace(/^\d+\.\d+ /,''))}<small>${lesson.type==='assignment' ? 'Practice' : 'Reading'}${lesson.completed ? ' · Completed' : ''}</small></span><span class="lesson-duration">${lesson.duration}</span></a>`).join('')}</div></details>`).join('');
  }
  function missing(message = 'This course could not be found.') {
    container.innerHTML = `<section class="surface library-empty">${icon('book-open')}<h1>Let’s find your next lesson</h1><p>${esc(message)}</p><a class="btn btn-primary" href="#browse-courses">Browse courses</a></section>`;
    icons();
  }
  function details(course) {
    if (!course) return missing();
    const state = catalog.state(course);
    const lessons = catalog.lessons(course);
    container.innerHTML = `<nav class="study-breadcrumb" aria-label="Breadcrumb"><a href="#browse-courses">Browse Courses</a>${icon('chevron-right')}<span>${esc(course.category)}</span></nav>
      <div class="detail-layout"><div class="detail-main">
        <section class="detail-hero"><p class="library-eyebrow">${esc(course.category)} · ${course.level}</p><h1>${esc(course.title)}</h1><p class="detail-description">${esc(course.description)}</p><div class="detail-facts"><span class="rating">${icon('star')}${course.rating.toFixed(1)} course rating</span><span>${icon('clock-3')}${course.duration} planned course</span><span>${icon('book-open')}${lessons.length} sample lessons</span></div><div class="detail-teacher"><span class="teacher-initials">${course.instructor.split(' ').map(word=>word[0]).slice(0,2).join('')}</span><div><span>Learn with</span><strong>${esc(course.instructor)}</strong></div></div></section>
        <nav class="detail-section-links" aria-label="On this page"><button data-scroll="detail-outcomes">Overview</button><button data-scroll="detail-curriculum">Curriculum</button><button data-scroll="detail-instructor">Instructor</button></nav>
        <section class="surface detail-section" id="detail-outcomes"><p class="library-eyebrow">SKILLS YOU CAN PUT TO WORK</p><h2>What you’ll learn</h2><ul class="outcome-list">${course.outcomes.map(item=>`<li>${icon('circle-check')}<span>${esc(item)}</span></li>`).join('')}</ul><div class="detail-requirements"><h3>Before you begin</h3><ul>${course.requirements.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div></section>
        <section class="surface detail-section" id="detail-curriculum"><div class="section-heading"><div><h2>Your learning path</h2><p>${course.modules.length} modules · ${lessons.length} sample lessons</p></div><button id="expand-curriculum" class="text-link">Collapse all</button></div><div class="detail-curriculum">${curriculum(course)}</div>${!state.enrolled ? '<p class="study-hint">Enroll in the preview to open these lessons.</p>' : ''}</section>
        <section class="surface detail-section" id="detail-instructor"><p class="library-eyebrow">A LITTLE GUIDANCE GOES A LONG WAY</p><h2>Meet your instructor</h2><div class="detail-teacher"><span class="teacher-initials">${course.instructor.split(' ').map(word=>word[0]).slice(0,2).join('')}</span><div><strong>${esc(course.instructor)}</strong><span>${esc(course.instructorRole)}</span></div></div><p>Explore ${esc(course.category.toLowerCase())} through focused explanations and practical exercises. Each sample lesson gives you a concept to understand and a small task to make it your own.</p></section>
      </div><aside class="surface enrollment-card" aria-label="Course enrollment">${artwork(course,true)}<div class="enrollment-body"><span class="tag-pill indigo">${state.enrolled ? 'In your learning library' : 'Your next chapter starts here'}</span><h2>${state.enrolled ? state.progress===100 ? 'Ready for a refresher?' : 'Keep your momentum.' : 'Make time for something new.'}</h2>${state.enrolled ? `<div class="enrollment-progress">${progress(course)}</div>${courseLink(course,state.progress===100 ? 'Review course' : state.progress ? 'Continue learning' : 'Start learning')}` : '<button class="btn btn-primary" id="detail-enroll">Enroll & start learning '+icon('arrow-right')+'</button>'}<button class="btn btn-secondary" id="detail-save" aria-pressed="${state.saved}">${icon('bookmark')}${state.saved ? 'Saved to your list' : 'Save for later'}</button><ul class="course-includes"><li>${icon('book-open')}Focused sample lessons</li><li>${icon('notebook-pen')}Your own lesson notebook</li><li>${icon('download')}Downloadable study guides</li><li>${icon('circle-check')}Learn at your own pace</li></ul><p class="study-hint">Frontend demo. Enrollment, progress, and notes are saved in this browser. Full course content and certificates are not issued here.</p></div></aside></div>`;
    document.getElementById('detail-enroll')?.addEventListener('click',()=>{
      const persisted = catalog.enroll(course.id);
      notify(persisted ? 'You’re enrolled. Let’s get started.' : 'Enrolled for this visit. Browser storage is unavailable.');
      window.location.hash = url(course,catalog.resume(course));
    });
    document.getElementById('detail-save').addEventListener('click',()=>{
      const saved = catalog.save(course.id); details(course); document.getElementById('detail-save').focus();
      notify(saved ? catalog.state(course).saved ? 'Course saved to your list.' : 'Course removed from saved.' : 'Updated for this visit. Browser storage is unavailable.');
    });
    container.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>{
      const target=document.getElementById(button.dataset.scroll); target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'}); target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
    }));
    document.getElementById('expand-curriculum').addEventListener('click',event=>{
      const modules=[...container.querySelectorAll('.study-module')]; const shouldOpen=modules.some(module=>!module.open); modules.forEach(module=>{module.open=shouldOpen});event.currentTarget.textContent=shouldOpen ? 'Collapse all' : 'Expand all';
    });
    icons();
  }
  function download(name, content) {
    const blob = new Blob([content],{type:'text/plain;charset=utf-8'});
    const objectUrl=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=objectUrl;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }
  function workspace(course, requestedLessonId) {
    if (!course) return missing();
    if (!catalog.state(course).enrolled) return details(course);
    const lessons=catalog.lessons(course);
    const lesson=requestedLessonId ? lessons.find(item=>item.id===requestedLessonId) : catalog.resume(course);
    if (!lesson) return missing('This lesson is not part of the selected course. Open the course again from your learning library.');
    catalog.visit(course.id,lesson.id);
    onLesson(course,lesson);
    const index=lessons.indexOf(lesson);
    const module=course.modules.find(module=>module.lessons.includes(lesson));
    const state=catalog.state(course);
    container.innerHTML = `<nav class="study-breadcrumb" aria-label="Breadcrumb"><a href="#my-learning">My Learning</a>${icon('chevron-right')}<a href="${detailsUrl(course)}">${esc(course.title)}</a></nav>
      <div class="study-heading"><div><p class="library-eyebrow">${esc(module.title.replace(/^Module \d+: /,''))} · LESSON ${index+1} OF ${lessons.length}</p><h1>${esc(lesson.title.replace(/^\d+\.\d+ /,''))}</h1></div><a class="text-link" href="${detailsUrl(course)}">Course details${icon('arrow-up-right')}</a></div>
      ${state.progress===100 ? `<section class="course-complete" role="status">${icon('party-popper')}<div><strong>You did it. Every lesson, completed.</strong><p>Revisit your notes or find your next course.</p></div><a class="btn btn-secondary btn-sm" href="#browse-courses">Explore courses</a></section>` : ''}
      <div class="study-layout"><div class="study-main">
        <section class="lesson-stage ${course.art}" aria-label="Lesson introduction"><div class="lesson-stage-top"><span>${icon(lesson.type==='assignment'?'pencil-line':'book-open')}${lesson.type==='assignment'?'Guided practice':'Guided reading'}</span><span>${lesson.duration}</span></div><div class="lesson-stage-content"><span class="lesson-stage-icon">${icon(course.symbol)}</span><p class="library-eyebrow">LEARN SOMETHING. MAKE IT YOURS.</p><h2>${esc(lesson.title.replace(/^\d+\.\d+ /,''))}</h2><button class="btn btn-primary" id="read-lesson">${icon('arrow-down')}Read lesson</button></div><div class="lesson-stage-bottom"><span>${esc(course.instructor)}</span><span>Sample lesson · ${index+1} / ${lessons.length}</span></div></section>
        <div class="study-lesson-actions"><div>${lesson.completed ? `<span class="lesson-completed-label">${icon('circle-check')}Lesson completed</span>` : '<span class="study-hint">Small steps, steady progress.</span>'}</div><button class="btn btn-primary" id="complete-lesson" ${lesson.completed && index===lessons.length-1 ? 'disabled' : ''}>${icon('check')}${lesson.completed ? index===lessons.length-1 ? 'Completed' : 'Next lesson' : index===lessons.length-1 ? 'Complete lesson' : 'Complete & continue'}</button></div>
        <section class="surface lesson-panels" id="lesson-reading"><div class="study-tabs" role="tablist" aria-label="Lesson information">${[['overview','Overview'],['notes','My Notes'],['resources','Resources']].map(([key,label])=>`<button role="tab" id="study-tab-${key}" aria-controls="study-panel-${key}" aria-selected="${currentTab===key}" tabindex="${currentTab===key?'0':'-1'}" data-study-tab="${key}">${label}${key==='resources' ? ' <span>1</span>' : ''}</button>`).join('')}</div>
          <div class="study-panel" id="study-panel-overview" role="tabpanel" aria-labelledby="study-tab-overview" tabindex="0" ${currentTab!=='overview'?'hidden':''}><p class="library-eyebrow">THE IDEA</p><h2>Let’s break it down</h2><p>${esc(lesson.overview)}</p><div class="practice-callout"><span>${icon('pencil-line')}</span><div><h3>Make it practical</h3><p>${esc(lesson.exercise)}</p></div></div><h3>Reflect before moving on</h3><p>What would you change in your own project after this lesson? Capture one idea in your notes, then mark the lesson complete when you’re ready.</p><div class="lesson-reflection-actions"><button class="text-link" id="write-reflection">Write a note${icon('arrow-right')}</button><button class="text-link" id="ask-ai-lesson-btn">${icon('sparkles')}Study assistant · demo</button></div></div>
          <div class="study-panel" id="study-panel-notes" role="tabpanel" aria-labelledby="study-tab-notes" tabindex="0" ${currentTab!=='notes'?'hidden':''}><div class="section-heading"><div><h2>Your lesson notebook</h2><p>Capture an idea. Connect it to your own work.</p></div><span id="note-status" role="status">Saved locally</span></div><label class="sr-only" for="study-note">Notes for ${esc(lesson.title)}</label><textarea id="study-note" placeholder="What clicked? What would you like to try?">${esc(catalog.note(course.id,lesson.id) ?? data.userNotes[lesson.id] ?? '')}</textarea><div class="notes-footer"><span>Private to this browser · plain text</span><button class="text-link" id="download-notes">${icon('download')}Export notes</button></div></div>
          <div class="study-panel" id="study-panel-resources" role="tabpanel" aria-labelledby="study-tab-resources" tabindex="0" ${currentTab!=='resources'?'hidden':''}><h2>Take your learning with you</h2><p>A short study guide with this lesson’s explanation and practice prompt.</p><div class="study-resource">${icon('file-text')}<div><strong>Lesson study guide</strong><span>Plain text · available offline after download</span></div><button class="btn btn-secondary btn-sm" id="download-guide">${icon('download')}Download</button></div></div>
        </section><div class="study-bottom-nav">${index>0 ? `<a class="text-link" href="${url(course,lessons[index-1])}">${icon('arrow-left')}Previous lesson</a>` : '<span>First lesson</span>'}${index<lessons.length-1 ? `<a class="text-link" href="${url(course,lessons[index+1])}">Next lesson${icon('arrow-right')}</a>` : `<a class="text-link" href="${detailsUrl(course)}">Back to course${icon('arrow-right')}</a>`}</div>
      </div><aside class="surface study-outline"><div class="study-outline-header"><p class="library-eyebrow">YOUR LEARNING PATH</p><h2>Course content</h2>${progress(course)}</div>${curriculum(course,lesson,true)}<p class="study-hint outline-note">Progress and notes are saved in this browser.</p></aside></div>`;
    function selectTab(key, focus = false) {
      currentTab=key;
      container.querySelectorAll('[data-study-tab]').forEach(button=>{const active=button.dataset.studyTab===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();});
      ['overview','notes','resources'].forEach(id=>{document.getElementById('study-panel-'+id).hidden=id!==key});
    }
    container.querySelectorAll('[data-study-tab]').forEach(button=>{
      button.addEventListener('click',()=>selectTab(button.dataset.studyTab));
      button.addEventListener('keydown',event=>{const keys=['overview','notes','resources'];const position=keys.indexOf(button.dataset.studyTab);if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();selectTab(keys[event.key==='Home'?0:event.key==='End'?2:(position+(event.key==='ArrowRight'?1:2))%3],true);}});
    });
    document.getElementById('read-lesson').addEventListener('click',()=>{selectTab('overview');document.getElementById('lesson-reading').scrollIntoView({block:'start'});document.getElementById('study-panel-overview').focus({preventScroll:true});});
    document.getElementById('write-reflection').addEventListener('click',()=>{selectTab('notes');document.getElementById('study-note').focus();});
    document.getElementById('ask-ai-lesson-btn').addEventListener('click',()=>{document.getElementById('ai-assistant-modal').classList.add('open');document.getElementById('ai-input').focus();});
    const note=document.getElementById('study-note');
    document.getElementById('note-status').textContent=catalog.note(course.id,lesson.id)===null ? 'Ready for your notes' : 'Saved for this browser';
    note.addEventListener('input',()=>{data.userNotes[lesson.id]=note.value;const persisted=catalog.saveNote(course.id,lesson.id,note.value);document.getElementById('note-status').textContent=persisted?'Saved locally':'Saved for this visit only';});
    document.getElementById('download-notes').addEventListener('click',()=>download(`${lesson.id}-notes.txt`,`${course.title}\n${lesson.title}\n\n${note.value}`));
    document.getElementById('download-guide').addEventListener('click',()=>download(`${lesson.id}-study-guide.txt`,`${course.title}\n${lesson.title}\n\n${lesson.overview}\n\nPRACTICE\n${lesson.exercise}\n\nREFLECT\nWhat will you apply in your own work?\n\nFrontend sample curriculum.`));
    document.getElementById('complete-lesson').addEventListener('click',()=>{
      const already=lesson.completed;
      const persisted=already || catalog.complete(course.id,lesson.id);
      notify(persisted ? already?'On to your next lesson.':'Lesson completed. Nice progress!' : 'Completed for this visit. Browser storage is unavailable.');
      if(index<lessons.length-1){window.location.hash=url(course,lessons[index+1]);}else{workspace(course,lesson.id);document.getElementById('complete-lesson').focus();}
    });
    icons();
  }
  return {details,workspace,missing};
};
