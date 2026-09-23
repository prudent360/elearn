'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Eye, KeyRound, Pencil, Search, ShieldCheck, Trash2, UserCog, UsersRound } from 'lucide-react';
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
  const [sort, setSort] = useState('newest');
  const [editing, setEditing] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() { try { const [people, events, summary] = await Promise.all([api('admin/users'), api('admin/audit'),api('admin/overview')]); setUsers(people); setAudit(events);setOverview(summary); if(account.permissions.includes('manage_roles')){const result=await api('admin/roles');setRoles(result.roles);setPermissionOptions(result.permissions);} } catch (issue) { setError(String(issue)); } }
  useEffect(() => { if (account.permissions.includes('manage_users')) void load(); }, [account.permissions]);
  async function update(id: string, values: unknown) { setBusy(true); setError(''); try { await api(`admin/users/${id}`, 'PATCH', values); await load(); } catch (issue) { setError(String(issue)); } finally { setBusy(false); } }
  async function createRole(event: React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('admin/roles','POST',{name:newRoleName,permissions:selectedPermissions});setNewRoleName('');setSelectedPermissions([]);await load()}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function assignRole(id:string,roleId:string,checked:boolean){const person=users.find(user=>user.id===id);if(!person)return;const roleIds=checked?[...person.roleIds,roleId]:person.roleIds.filter((value:string)=>value!==roleId);setEditing((current:any)=>current?.id===id?{...current,roleIds}:current);setBusy(true);setError('');try{await api(`admin/users/${id}/roles`,'PUT',{roleIds});await load()}catch(issue){setError(String(issue));setEditing((current:any)=>current?.id===id?{...current,roleIds:person.roleIds}:current)}finally{setBusy(false)}}
  async function reviewInstructor(id:string,status:'approved'|'rejected'){setBusy(true);setError('');setNotice('');try{await api(`admin/users/${id}/instructor-approval`,'PATCH',{status});await load();setNotice(status==='approved'?'Instructor application approved.':'Instructor application rejected.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function loadProgress(id:string){try{const result=await api(`admin/users/${id}/progress`);setProgress(prev=>({...prev,[id]:result}))}catch(issue){setError(String(issue))}}
  async function toggleDetail(id:string){const next=expanded===id?null:id;setExpanded(next);if(next&&!progress[next])await loadProgress(next)}
  async function manualEnroll(id:string,courseId:string){if(!courseId)return;setBusy(true);setError('');setNotice('');try{await api('admin/enrollments','POST',{userId:id,courseId});await loadProgress(id);setNotice('Learner enrolled.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function sendReset(email:string){setBusy(true);setError('');setNotice('');try{await api('auth/reset-request','POST',{email});setNotice(`Password reset email sent to ${email} if that account exists.`)}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function saveUser(event:React.FormEvent){event.preventDefault();if(!editing)return;setBusy(true);setError('');setNotice('');try{await api(`admin/users/${editing.id}`,'PATCH',{name:editing.name,email:editing.email,role:editing.role});setEditing(null);await load();setNotice('User information updated. The user must sign in again.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function deleteUser(user:any){if(!window.confirm(`Delete ${user.name}? This is only allowed when the account has no activity.`))return;setBusy(true);setError('');setNotice('');try{await api(`admin/users/${user.id}`,'DELETE');await load();setNotice('Unused account deleted.')}catch(issue){setError(String(issue))}finally{setBusy(false)}}

  if (!account.permissions.includes('manage_users')) return <section className="surface backend-panel"><h1>Administrator access required</h1></section>;
  const pendingInstructors = users.filter(user => user.role==='instructor' && user.instructorStatus==='pending').length;
  const visible=users.filter(user=>(roleFilter==='all'||user.role===roleFilter)&&(statusFilter==='all'||(statusFilter==='active'?!user.disabled:user.disabled))&&(user.name+' '+user.email).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?Date.parse(a.createdAt)-Date.parse(b.createdAt):Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const canManageInstructors=account.permissions.includes('manage_instructors');
  const canManageStudents=account.permissions.includes('manage_students');
  const enrollableCourses=data.courses||[];

  function UserRows({user}:{user:any}){return <>
    <tr className="transition-colors hover:bg-[var(--bg-card-hover)]">
      <td><div className="admin-user-identity"><span className="sidebar-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.role==='learner'?'student':user.role}</small></span></div></td>
      <td><div className="admin-user-contact"><span>{user.email}</span><small>{user.emailVerified?'Email verified':'Email not verified'}</small></div></td>
      <td><time>{user.createdAt?new Date(user.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'—'}</time></td>
      <td><span className="admin-plan">{user.role==='learner'?'Student':user.role}</span>{user.role==='instructor'&&<div className="admin-instructor-inline"><span className={`instructor-badge instructor-badge-${user.instructorStatus||'pending'}`}>{user.instructorStatus||'pending'}</span>{canManageInstructors&&user.instructorStatus!=='approved'&&<button type="button" disabled={busy} onClick={()=>void reviewInstructor(user.id,'approved')}>Approve</button>}{canManageInstructors&&user.instructorStatus!=='rejected'&&<button type="button" disabled={busy} onClick={()=>void reviewInstructor(user.id,'rejected')}>Reject</button>}</div>}</td>
      <td><span className={`admin-status ${user.disabled?'is-disabled':'is-active'} rounded-md px-2.5 py-1 text-xs font-bold`}>{user.disabled?'Deactivated':'Active'}</span></td>
      <td><div className="admin-actions flex items-center gap-2"><button type="button" title="Edit user" aria-label={`Edit ${user.name}`} disabled={busy} onClick={()=>setEditing({...user})}><Pencil/></button>{canManageStudents&&<button type="button" title="View enrollment and progress" aria-label={`View ${user.name} enrollment and progress`} disabled={busy} onClick={()=>void toggleDetail(user.id)}><Eye/></button>}<button type="button" title="Send password reset" aria-label={`Send password reset to ${user.name}`} disabled={busy} onClick={()=>void sendReset(user.email)}><KeyRound/></button><button type="button" className={user.disabled?'':'danger'} disabled={busy||user.id===account.id} onClick={()=>void update(user.id,{disabled:!user.disabled})}>{user.disabled?'Activate':'Deactivate'}</button><button type="button" className="danger-icon" title="Delete unused account" aria-label={`Delete ${user.name}`} disabled={busy||user.id===account.id} onClick={()=>void deleteUser(user)}><Trash2/></button></div></td>
    </tr>
    {canManageStudents&&expanded===user.id&&<tr className="admin-detail-row"><td colSpan={6}><div className="admin-user-detail"><form className="admin-enroll-form" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const courseId=String(new FormData(form).get('courseId')||'');void manualEnroll(user.id,courseId);form.reset()}}><label>Enroll in course<select name="courseId" required defaultValue=""><option value="" disabled>Choose a course</option>{enrollableCourses.map((course:any)=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label><button className="btn btn-primary" disabled={busy}>Enroll</button></form>{!progress[user.id]&&<p>Loading enrollment detail…</p>}{progress[user.id]&&progress[user.id].enrollments.length===0&&<p>Not enrolled in any course yet.</p>}{progress[user.id]&&progress[user.id].enrollments.map((row:any)=><div className="backend-row" key={row.courseId}><span><strong>{row.courseTitle}</strong> · {row.completedLessons}/{row.totalLessons} lessons · {row.progress}%</span><time>Enrolled {new Date(row.enrolledAt).toLocaleDateString()}</time></div>)}</div></td></tr>}
  </>}

  return <div>
    <div className="page-header"><div><p className="library-eyebrow">ACCESS & GOVERNANCE</p><h1 className="page-title">Users</h1><p className="page-subtitle">Manage registered users, access, enrollment and account status.</p></div></div>
    {error && <p role="alert" className="backend-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {overview&&<><div className="admin-metrics"><article className="surface"><UsersRound/><div><strong>{overview.students}</strong><span>students</span></div></article><article className="surface"><UserCog/><div><strong>{overview.instructors}</strong><span>instructors</span></div></article><article className="surface"><ShieldCheck/><div><strong>{overview.activeCourses} / {overview.courses}</strong><span>published / total courses</span></div></article><article className="surface"><UsersRound/><div><strong>{overview.enrollments}</strong><span>enrollments</span></div></article>{canManageInstructors&&<article className="surface"><UserCog/><div><strong>{pendingInstructors}</strong><span>pending instructor review</span></div></article>}</div><section className="surface backend-panel"><h2>Recent enrollments</h2>{overview.recentEnrollments.length?overview.recentEnrollments.map((item:any,index:number)=><div className="backend-row" key={index}><span><strong>{item.student}</strong> · {item.course}</span><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>):<p>No enrollments yet.</p>}</section></>}
    <section className="surface admin-user-filters my-5 grid grid-cols-1 items-end gap-3 p-5 md:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_220px_170px_170px_auto]">
      <label className="admin-search md:col-span-2 lg:col-span-1"><Search aria-hidden="true"/><span className="sr-only">Search users</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search users by name or email…" /></label>
      <label><span className="sr-only">Sort users</span><select value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest joined</option><option value="oldest">Oldest joined</option><option value="name">Name A–Z</option></select><ChevronDown aria-hidden="true"/></label>
      <label><span>Role</span><select value={roleFilter} onChange={event=>setRoleFilter(event.target.value)}><option value="all">All roles</option><option value="learner">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></label>
      <label><span>Status</span><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">All accounts</option><option value="active">Active</option><option value="disabled">Deactivated</option></select></label>
      <button className="btn btn-secondary" type="button" onClick={()=>{setSearch('');setRoleFilter('all');setStatusFilter('all');setSort('newest')}}>Clear all</button>
    </section>
    <section className="surface admin-users-card overflow-hidden">
      <div className="section-heading px-5 pt-5"><div><h2>Registered users</h2><p>{visible.length} of {users.length} accounts</p></div></div>
      <div className="overflow-x-auto">
        <table className="admin-users-table w-full min-w-[1080px] border-collapse text-left">
          <thead><tr><th>User</th><th>Contact</th><th>Joined</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visible.map(user => <UserRows key={user.id} user={user}/>)}</tbody>
        </table>
      </div>
      {visible.length===0 && <p>No users match your search.</p>}
    </section>
    {account.permissions.includes('manage_roles')&&<section className="surface backend-panel"><h2>Roles &amp; permissions</h2><p>Create a role and choose exactly what it can access.</p><form onSubmit={event=>void createRole(event)}><label>Role name<input required maxLength={80} value={newRoleName} onChange={event=>setNewRoleName(event.target.value)}/></label><div className="role-permissions">{permissionOptions.filter(permission=>account.permissions.includes(permission)).map(permission=><label key={permission}><input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={event=>setSelectedPermissions(current=>event.target.checked?[...current,permission]:current.filter(value=>value!==permission))}/>{permission.replaceAll('_',' ')}</label>)}</div><button className="btn btn-primary" disabled={busy}>Create role</button></form><div className="role-list">{roles.map(role=><div key={role.id}><strong>{role.name}</strong><small>{role.permissions.map((permission:string)=>permission.replaceAll('_',' ')).join(', ')||'No permissions'}</small></div>)}</div></section>}
    <section className="surface backend-panel"><h2>Recent access changes</h2>{audit.length === 0 && <p>No administrative changes yet.</p>}{audit.map(event => <div className="backend-row" key={event.id}><span><strong>{event.name}</strong> · {event.action}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</section>
    {editing&&<div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-5 backdrop-blur-sm" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setEditing(null)}}><section className="surface admin-edit-dialog w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="edit-user-title"><div className="section-heading"><div><p className="library-eyebrow">USER ACCOUNT</p><h2 id="edit-user-title">Edit user</h2></div><button type="button" className="btn btn-secondary" onClick={()=>setEditing(null)}>Close</button></div><form className="backend-form" onSubmit={event=>void saveUser(event)}><label>Full name<input required maxLength={100} value={editing.name} onChange={event=>setEditing({...editing,name:event.target.value})}/></label><label>Email address<input required type="email" maxLength={254} value={editing.email} onChange={event=>setEditing({...editing,email:event.target.value})}/></label><label>System role<select value={editing.role} disabled={account.role!=='admin'||editing.id===account.id} onChange={event=>setEditing({...editing,role:event.target.value})}><option value="learner">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></label>{account.permissions.includes('manage_roles')&&editing.id!==account.id&&roles.length>0&&<fieldset className="admin-modal-roles"><legend>Additional roles</legend>{roles.map(role=><label key={role.id}><input type="checkbox" checked={editing.roleIds?.includes(role.id)||false} disabled={busy} onChange={event=>void assignRole(editing.id,role.id,event.target.checked)}/>{role.name}</label>)}</fieldset>}<p className="page-subtitle">Changing the email or role signs this user out on every device.</p><div className="backend-actions"><button className="btn btn-primary" disabled={busy}>{busy?'Saving…':'Save changes'}</button><button type="button" className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button></div></form></section></div>}
  </div>;
}
