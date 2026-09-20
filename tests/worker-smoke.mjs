import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
function prepare(query){let values=[];return {bind(...args){values=args;return this},async all(){return {results:sql.prepare(query).all(...values)}},async first(){return sql.prepare(query).get(...values)||null},async run(){return sql.prepare(query).run(...values)}}}
const files=new Map();const env={DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}},FILES:{async put(id,body){files.set(id,body)},async get(id){return files.has(id)?{body:files.get(id)}:null},async delete(id){files.delete(id)}},LMS_SETUP_TOKEN:'smoke-test-secret',LMS_ORIGIN:'https://test.example'};
let cookie='';async function call(path,method='GET',body){const response=await worker.fetch(new Request('https://test.example'+path,{method,headers:{cookie,origin:'https://test.example',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}),env);if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return response}
for(const path of ['/','/login/','/instructor/','/admin/','/course/?id=course-101'])assert.equal((await call(path)).status,200);
assert.equal((await call('/api/workspace')).status,401);
assert.equal((await call('/api/auth/setup','POST',{name:'Smoke Admin',email:'smoke@example.com',password:'a smoke test password long',setupToken:'smoke-test-secret'})).status,200);
assert.ok(cookie.startsWith('__Host-lms_session='));
const workspace=await (await call('/api/workspace')).json();assert.ok(workspace.courses.length);assert.equal(workspace.enrolledCourses.length,0);
const course=workspace.courses.find(c=>c.modules.some(m=>m.lessons.length));assert.equal((await call('/api/courses/'+course.id+'/enrollment','POST',{})).status,200);
const lesson=course.modules.flatMap(m=>m.lessons)[0];assert.equal((await call('/api/lessons/'+lesson.id+'/note','PUT',{note:'From the hosted worker'})).status,200);
assert.equal((await (await call('/api/workspace')).json()).userNotes[lesson.id],'From the hosted worker');
const assignment=await (await call('/api/instructor/assignments','POST',{courseId:course.id,title:'File submission',instructions:'Submit a text file'})).json();
const upload=await worker.fetch(new Request('https://test.example/api/assignments/'+assignment.id+'/attachment',{method:'POST',headers:{cookie,origin:'https://test.example','content-type':'text/plain','x-file-name':'notes.txt'},body:'Private attached content'}),env);assert.equal(upload.status,201);const attachment=await upload.json();
assert.equal(await (await call('/api/files/'+attachment.id)).text(),'Private attached content');
assert.equal((await worker.fetch(new Request('https://test.example/api/files/'+attachment.id),env)).status,401);
assert.ok((await call('/api/files/'+attachment.id)).headers.get('content-disposition').startsWith('attachment;'));
assert.equal((await call('/api/auth/register','POST',{name:'Other',email:'other@example.com',password:'another test password long'})).status,200);
assert.equal((await call('/api/files/'+attachment.id)).status,403);
sql.close();console.log('Hosted worker smoke passed: static pages, D1 persistence, secure session cookies, enrollments, notes, and protected file uploads.');
