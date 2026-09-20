const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(stored = '{}') {
  const memory = new Map([['apex-learning-library-v1', stored]]);
  const storage = {getItem:key => memory.get(key),setItem:(key,value) => memory.set(key,value)};
  const context = {window:{},Date,Math};
  vm.createContext(context);
  for (const file of ['data.js','lesson-content.js','catalog.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context);
  const courses = context.window.LMSData.courses;
  return {courses, storage, create:context.window.createLearningCatalog, catalog:context.window.createLearningCatalog(courses,storage)};
}
test('Enrolled and bookmarked courses have independent membership', () => {
  const {catalog}=setup();
  assert.equal(catalog.select({page:'learning'}).length,4);
  assert.equal(catalog.select({page:'browse'}).length,8);
  assert.ok(!catalog.select({page:'learning'}).some(c=>c.id==='course-105'));
  assert.ok(catalog.select({page:'learning',filter:'saved'}).some(c=>c.id==='course-105'));
});
test('Search, category and level compose; filters cannot leak other courses',()=>{
  const {catalog}=setup();
  const found=catalog.select({query:'research',category:'UI/UX & Design',level:'Beginner'});
  assert.equal(found.length,1);assert.equal(found[0].id,'course-106');
  assert.equal(catalog.select({query:'research',category:'Engineering & AI'}).length,0);
  assert.equal(catalog.select({query:'nothing matching'}).length,0);
  const sorted=catalog.select({sort:'rating'});assert.ok(sorted.every((c,i)=>i===0||sorted[i-1].rating>=c.rating));
});
test('Enrollment and save toggles persist across catalog recreation',()=>{
  const {catalog,create,courses,storage}=setup();
  assert.equal(catalog.enroll('course-106'),true);assert.equal(catalog.save('course-106'),true);
  const restored=create(courses,storage);const state=restored.state(courses.find(c=>c.id==='course-106'));
  assert.equal(state.enrolled,true);assert.equal(state.saved,true);assert.equal(state.status,'not-started');
  assert.equal(restored.select({page:'learning',filter:'not-started'}).length,1);
  restored.save('course-106');assert.equal(restored.state(courses.find(c=>c.id==='course-106')).saved,false);
  assert.equal(restored.select({page:'learning'}).length,5);
});
test('Invalid storage and unavailable storage do not prevent learning',()=>{
  const {catalog,create,courses}=setup('{bad json');assert.equal(catalog.select().length,8);
  const blocked=create(courses,{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert.equal(blocked.enroll('course-106'),false);assert.equal(blocked.state(courses.find(c=>c.id==='course-106')).enrolled,true);
  assert.equal(blocked.enroll('unknown'),false);
});
test('Progress agrees with available lessons and completed courses',()=>{
  const {catalog,courses}=setup();assert.equal(catalog.state(courses[0]).progress,29);
  assert.equal(catalog.state(courses[2]).progress,100);
  courses[0].modules[1].lessons[0].completed=true;assert.equal(catalog.state(courses[0]).progress,43);
});

test('Completion, resume position and notes survive reload without crossing courses',()=>{
  const {catalog,courses,storage}=setup();
  catalog.complete('course-101','les-103');
  catalog.visit('course-101','les-104');
  catalog.saveNote('course-101','les-103','A note with <tags> and \"quotes\"');
  const context={window:{},Date,Math};vm.createContext(context);
  for(const file of ['data.js','lesson-content.js','catalog.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  const restored=context.window.createLearningCatalog(context.window.LMSData.courses,storage);
  const first=context.window.LMSData.courses[0];
  assert.equal(restored.state(first).progress,43);
  assert.equal(restored.resume(first).id,'les-104');
  assert.equal(restored.recentCourse().id,'course-101');
  assert.equal(restored.note('course-101','les-103'),'A note with <tags> and "quotes"');
  assert.equal(restored.note('course-102','les-103'),null);
  assert.equal(restored.complete('course-101','les-201'),false);
});
test('Completion is idempotent, final lesson yields 100%, and unenrolled courses cannot complete',()=>{
  const {catalog,courses}=setup();const course=courses[0];
  catalog.lessons(course).forEach(lesson=>catalog.complete(course.id,lesson.id));
  catalog.complete(course.id,'les-103');assert.equal(catalog.state(course).progress,100);
  assert.equal(catalog.state(course).status,'completed');
  assert.equal(catalog.complete('course-106','course-106-lesson-1'),false);
  catalog.enroll('course-106');assert.equal(catalog.complete('course-106','course-106-lesson-1'),true);
});
test('Empty notes remain empty after recreation and blocked storage keeps notes in memory',()=>{
  const {catalog,create,courses,storage}=setup();
  catalog.saveNote('course-101','les-103','');assert.equal(create(courses,storage).note('course-101','les-103'),'');
  const blocked=create(courses,null);assert.equal(blocked.saveNote('course-101','les-103','hello'),false);assert.equal(blocked.note('course-101','les-103'),'hello');
});
