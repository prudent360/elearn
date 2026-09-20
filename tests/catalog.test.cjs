const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(stored = '{}') {
  const memory = new Map([['apex-learning-library-v1', stored]]);
  const storage = {getItem:key => memory.get(key),setItem:(key,value) => memory.set(key,value)};
  const context = {window:{},Date,Math};
  vm.createContext(context);
  for (const file of ['data.js','catalog.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context);
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
