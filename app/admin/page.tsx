'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export default function Administration() {
  const { account, api, data } = useLearning();
  const [users, setUsers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() { try { const [people, events, summary] = await Promise.all([api('admin/users'), api('admin/audit'),api('admin/overview')]); setUsers(people); setAudit(events);setOverview(summary); if(account.permissions.includes('manage_roles')){const result=await api('admin/roles');setRoles(result.roles);setPermissionOptions(result.permissions);} } catch (issue) { setError(String(issue)); } }
  useEffect(() => { if (account.permissions.includes('manage_users')) void load(); }, [account.permissions]);
  async function update(id: string, values: unknown) { setBusy(true); setError(''); try { await api(`admin/users/${id}`, 'PATCH', values); await load(); } catch (issue) { setError(String(issue)); } finally { setBusy(false); } }
  async function createRole(event: React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('admin/roles','POST',{name:newRoleName,permissions:selectedPermissions});setNewRoleName('');setSelectedPermissions([]);await load()}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function assignRole(id:string,roleId:string,checked:boolean){const person=users.find(user=>user.id===id);if(!person)return;setBusy(true);setError('');try{await api(`admin/users/${id}/roles`,'PUT',{roleIds:checked?[...person.roleIds,roleId]:person.roleIds.filter((value:string)=>value!==roleId)});await load()}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function reviewInstructor(id:string,status:'approved'|'rejected'){setBusy(true);setError('');setNotice('');try{await api(`admin/users/${id}/instructor-approval`,'PATCH',{status});await load();setNotice(status==='approved'?'Instructor application approved.':'Instructor application rejected.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function loadProgress(id:string){try{const result=await api(`admin/users/${id}/progress`);setProgress(prev=>({...prev,[id]:result}))}catch(issue){setError(String(issue))}}
  async function toggleDetail(id:string){const next=expanded===id?null:id;setExpanded(next);if(next&&!progress[next])await loadProgress(next)}
  async function manualEnroll(id:string,courseId:string){if(!courseId)return;setBusy(true);setError('');setNotice('');try{await api('admin/enrollments','POST',{userId:id,courseId});await loadProgress(id);setNotice('Learner enrolled.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function sendReset(email:string){setBusy(true);setError('');setNotice('');try{await api('auth/reset-request','POST',{email});setNotice(`Password reset email sent to ${email} if that account exists.`)}catch(issue){setError(String(issue))}finally{setBusy(false)}}

  if (!account.permissions.includes('manage_users')) return <section className="surface backend-panel"><h1>Administrator access required</h1></section>;
  const pendingInstructors = users.filter(user => user.role==='instructor' && user.instructorStatus==='pending').length;
  const visible=users.filter(user=>(roleFilter==='all'||user.role===roleFilter)&&(statusFilter==='all'||(statusFilter==='active'?!user.disabled:user.disabled))&&(user.name+' '+user.email).toLowerCase().includes(search.toLowerCase()));
  const canManageInstructors=account.permissions.includes('manage_instructors');
  const canManageStudents=account.permissions.includes('manage_students');
  const enrollableCourses=data.courses||[];

  return <div>
    <div className="page-header"><div><p className="library-eyebrow">ACCESS & GOVERNANCE</p><h1 className="page-title">Administration</h1><p className="page-subtitle">Control who can teach and administer the academy. Billing plans never change security roles.</p></div></div>
    {error && <p role="alert" className="backend-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {overview&&<><div className="admin-metrics"><article className="surface"><UsersRound/><div><strong>{overview.students}</strong><span>students</span></div></article><article className="surface"><UserCog/><div><strong>{overview.instructors}</strong><span>instructors</span></div></article><article className="surface"><ShieldCheck/><div><strong>{overview.activeCourses} / {overview.courses}</strong><span>published / total courses</span></div></article><article className="surface"><UsersRound/><div><strong>{overview.enrollments}</strong><span>enrollments</span></div></article>{canManageInstructors&&<article className="surface"><UserCog/><div><strong>{pendingInstructors}</strong><span>pending instructor review</span></div></article>}</div><section className="surface backend-panel"><h2>Recent enrollments</h2>{overview.recentEnrollments.length?overview.recentEnrollments.map((item:any,index:number)=><div className="backend-row" key={index}><span><strong>{item.student}</strong> · {item.course}</span><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>):<p>No enrollments yet.</p>}</section></>}
    <div className="backend-search">
      <label>Search users<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Name or email" /></label>
      <label>Role<select value={roleFilter} onChange={event=>setRoleFilter(event.target.value)}><option value="all">All roles</option><option value="learner">Learner</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></label>
      <label>Status<select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">All accounts</option><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
    </div>
    <section className="surface backend-panel">
      <div className="section-heading"><div><h2>People and access</h2><p>Assign system roles and additional permissions to each account.</p></div></div>
      <div className="admin-table">
        <div className="admin-table-head"><span>Person</span><span>Membership</span><span>Role</span><span>Account</span></div>
        {visible.map(user => <div key={user.id}>
          <div className="admin-user-row">
            <div><span className="sidebar-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
            <span className="admin-plan">{user.billing?.plan || 'free'}</span>
            <label><span className="sr-only">Role for {user.name}</span><select value={user.role} disabled={busy || account.role!=='admin' || user.id === account.id} onChange={event => void update(user.id, { role: event.target.value })}>{['learner','instructor','admin'].map(role => <option key={role}>{role}</option>)}</select></label>
            <button className="btn btn-secondary" disabled={busy || user.id === account.id} onClick={() => void update(user.id, { disabled: !user.disabled })}>{user.disabled ? 'Enable' : 'Disable'}</button>
            {account.permissions.includes('manage_roles') && user.id!==account.id && <div className="role-assignment">{roles.map(role=><label key={role.id}><input type="checkbox" checked={user.roleIds?.includes(role.id)||false} disabled={busy} onChange={event=>void assignRole(user.id,role.id,event.target.checked)}/>{role.name}</label>)}</div>}
            {user.role==='instructor' && <div className="role-assignment admin-instructor-status">
              <span className={`instructor-badge instructor-badge-${user.instructorStatus||'pending'}`}>Instructor application: {user.instructorStatus||'pending'}</span>
              {canManageInstructors && user.instructorStatus!=='approved' && <button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void reviewInstructor(user.id,'approved')}>Approve</button>}
              {canManageInstructors && user.instructorStatus!=='rejected' && <button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void reviewInstructor(user.id,'rejected')}>Reject</button>}
            </div>}
            <div className="role-assignment admin-row-actions">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void sendReset(user.email)}>Send password reset</button>
              {canManageStudents && <button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void toggleDetail(user.id)}>{expanded===user.id ? 'Hide enrollment' : 'Enrollment & progress'}</button>}
            </div>
          </div>
          {canManageStudents && expanded===user.id && <div className="admin-user-detail surface">
            <form className="admin-enroll-form" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const courseId=String(new FormData(form).get('courseId')||'');void manualEnroll(user.id,courseId);form.reset()}}>
              <label>Enroll in course<select name="courseId" required defaultValue=""><option value="" disabled>Choose a course</option>{enrollableCourses.map((course:any)=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
              <button className="btn btn-primary" disabled={busy}>Enroll</button>
            </form>
            {!progress[user.id] && <p>Loading enrollment detail…</p>}
            {progress[user.id] && progress[user.id].enrollments.length===0 && <p>Not enrolled in any course yet.</p>}
            {progress[user.id] && progress[user.id].enrollments.map((row:any)=><div className="backend-row" key={row.courseId}><span><strong>{row.courseTitle}</strong> · {row.completedLessons}/{row.totalLessons} lessons · {row.progress}%</span><time>Enrolled {new Date(row.enrolledAt).toLocaleDateString()}</time></div>)}
          </div>}
        </div>)}
      </div>
      {visible.length===0 && <p>No users match your search.</p>}
    </section>
    {account.permissions.includes('manage_roles')&&<section className="surface backend-panel"><h2>Roles &amp; permissions</h2><p>Create a role and choose exactly what it can access.</p><form onSubmit={event=>void createRole(event)}><label>Role name<input required maxLength={80} value={newRoleName} onChange={event=>setNewRoleName(event.target.value)}/></label><div className="role-permissions">{permissionOptions.filter(permission=>account.permissions.includes(permission)).map(permission=><label key={permission}><input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={event=>setSelectedPermissions(current=>event.target.checked?[...current,permission]:current.filter(value=>value!==permission))}/>{permission.replaceAll('_',' ')}</label>)}</div><button className="btn btn-primary" disabled={busy}>Create role</button></form><div className="role-list">{roles.map(role=><div key={role.id}><strong>{role.name}</strong><small>{role.permissions.map((permission:string)=>permission.replaceAll('_',' ')).join(', ')||'No permissions'}</small></div>)}</div></section>}
    <section className="surface backend-panel"><h2>Recent access changes</h2>{audit.length === 0 && <p>No administrative changes yet.</p>}{audit.map(event => <div className="backend-row" key={event.id}><span><strong>{event.name}</strong> · {event.action}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</section>
  </div>;
}
