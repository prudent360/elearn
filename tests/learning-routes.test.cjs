const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function app() {
  const elements=new Map();
  function el(id) {
    if(!elements.has(id)) elements.set(id,{innerHTML:'',value:'',style:{},dataset:{},listeners:{},classList:{add(){},remove(){},contains(){return false},toggle(){return true}},setAttribute(){},focus(){},scrollIntoView(){},querySelectorAll(){return []},addEventListener(k,f){this.listeners[k]=f}});
    return elements.get(id);
  }
  const handlers={};const memory=new Map();const downloads=[];let lastBlob;
  el('body').appendChild=()=>{};
  const context={console,Date,Math,URLSearchParams,Blob,URL:{createObjectURL(blob){lastBlob=blob;return 'blob:sample'},revokeObjectURL(){}},setTimeout(){return 1},clearTimeout(){},window:{location:{hash:''},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},addEventListener(k,f){handlers[k]=f}},document:{createElement(){return {click(){downloads.push({name:this.download,blob:lastBlob})},remove(){}}},body:el('body'),getElementById:el,querySelectorAll(){return []},querySelector:el,addEventListener(k,f){if(k==='DOMContentLoaded')handlers.ready=f}}};
  vm.createContext(context);
  for(const file of ['data.js','lesson-content.js','catalog.js','learning.js','instructor.js','notes.js','analytics.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  handlers.ready();
  const go=route=>{context.window.location.hash='#'+route;handlers.hashchange();return el('app-content').innerHTML};
  return {go,el,context,downloads};
}
test('Analytics dashboard renders metrics and study hours chart',()=>{
  const {go}=app();
  const html=go('analytics');
  assert.ok(html.includes('Analytics Dashboard'));
  assert.ok(html.includes('Weekly Study Duration'));
  assert.ok(html.includes('Weekly Goal Progress'));
  assert.ok(html.includes('Subject Time Allocation'));
});
test('All eight course details render course-specific curriculum and instructor',()=>{
  const {go,context}=app();
  for(const course of context.window.LMSData.courses){const html=go('course-details?id='+course.id);assert.ok(html.includes(course.instructor));assert.ok(html.includes('What you’ll learn'));assert.ok(!html.includes('undefined'));}
});
test('Deep links select the correct lesson and invalid IDs show a recovery page',()=>{
  const {go}=app();
  assert.ok(go('course?id=course-101&lesson=les-104').includes('Subgrid &amp; Complex'));
  assert.ok(go('course?id=course-102&lesson=les-203').includes('Design a resilient learning assistant'));
  assert.ok(go('course?id=missing').includes('could not be found'));
  assert.ok(go('course?id=course-101&lesson=les-201').includes('not part of the selected course'));
});
test('Enrollment leads to first sample lesson, and a course cannot be opened before enrollment',()=>{
  const {go,el,context}=app();
  assert.ok(go('course?id=course-106').includes('Enroll & start learning'));
  el('detail-enroll').listeners.click();assert.ok(context.window.location.hash.includes('course-106-lesson-1'));
  assert.ok(go(context.window.location.hash.slice(1)).includes('Start with a question'));
});
test('Completion advances exactly one lesson and notes are escaped when rendered',()=>{
  const {go,el,context}=app();
  go('course?id=course-101&lesson=les-103');
  el('study-note').value='</textarea><script>bad()</script>';
  el('study-note').listeners.input();
  const html=go('course?id=course-101&lesson=les-103');
  assert.ok(html.includes('&lt;/textarea&gt;&lt;script&gt;bad()&lt;/script&gt;'));
  el('complete-lesson').listeners.click();assert.equal(context.window.location.hash,'#course?id=course-101&lesson=les-104');
  assert.ok(go('course-details?id=course-101').includes('43%'));
});
test('First and final lessons expose the correct navigation boundaries',()=>{
  const {go,el,context}=app();
  assert.ok(go('course?id=course-101&lesson=les-101').includes('First lesson'));
  for(const lesson of context.window.LMSData.courses[0].modules.flatMap(m=>m.lessons)){go('course?id=course-101&lesson='+lesson.id);el('complete-lesson').listeners.click();}
  const html=go('course?id=course-101&lesson=les-107');assert.ok(html.includes('Every lesson, completed'));assert.ok(html.includes('Back to course'));assert.ok(!html.includes('Complete & continue'));
});

test('Resources and note exports contain the selected lesson and actual note text',async()=>{
  const {go,el,downloads}=app();go('course?id=course-101&lesson=les-104');
  el('download-guide').listeners.click();assert.equal(downloads[0].name,'les-104-study-guide.txt');
  const guide=await downloads[0].blob.text();assert.ok(guide.includes('Subgrid lets nested elements'));assert.ok(guide.includes('PRACTICE'));
  el('study-note').value='Try subgrid on the cards.';el('download-notes').listeners.click();
  assert.equal(downloads[1].name,'les-104-notes.txt');assert.ok((await downloads[1].blob.text()).includes('Try subgrid on the cards.'));
});
