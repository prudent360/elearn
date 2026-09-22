'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export default function Administration() {
  const { account, api } = useLearning();
  const [users, setUsers] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { try { const [people, events] = await Promise.all([api('admin/users'), api('admin/audit')]); setUsers(people); setAudit(events); if(account.permissions.includes('manage_roles')){const result=await api('admin/roles');setRoles(result.roles);setPermissionOptions(result.permissions);} } catch (issue) { setError(String(issue)); } }
  useEffect(() => { if (account.permissions.includes('manage_users')) void load(); }, [account.permissions]);
  async function update(id: string, values: unknown) { setBusy(true); setError(''); try { await api(`admin/users/${id}`, 'PATCH', values); await load(); } catch (issue) { setError(String(issue)); } finally { setBusy(false); } }
  async function createRole(event: React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('admin/roles','POST',{name:newRoleName,permissions:selectedPermissions});setNewRoleName('');setSelectedPermissions([]);await load()}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  async function assignRole(id:string,roleId:string,checked:boolean){const person=users.find(user=>user.id===id);if(!person)return;setBusy(true);setError('');try{await api(`admin/users/${id}/roles`,'PUT',{roleIds:checked?[...person.roleIds,roleId]:person.roleIds.filter((value:string)=>value!==roleId)});await load()}catch(issue){setError(String(issue))}finally{setBusy(false)}}
  if (!account.permissions.includes('manage_users')) return <section className="surface backend-panel"><h1>Administrator access required</h1></section>;
  const active = users.filter(user => !user.disabled).length;
  const staff = users.filter(user => user.role !== 'learner' && !user.disabled).length;
  const visible=users.filter(user=>(user.name+' '+user.email).toLowerCase().includes(search.toLowerCase()));
  return <div>
    <div className="page-header"><div><p className="library-eyebrow">ACCESS & GOVERNANCE</p><h1 className="page-title">Administration</h1><p className="page-subtitle">Control who can teach and administer the academy. Billing plans never change security roles.</p></div></div>
    {error && <p role="alert" className="backend-error">{error}</p>}
    <div className="admin-metrics"><article className="surface"><UsersRound/><div><strong>{active}</strong><span>active accounts</span></div></article><article className="surface"><UserCog/><div><strong>{staff}</strong><span>instructors & admins</span></div></article><article className="surface"><ShieldCheck/><div><strong>{roles.length+3}</strong><span>available roles</span></div></article></div>
    <label className="backend-search">Search users<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Name or email" /></label>
    <section className="surface backend-panel"><div className="section-heading"><div><h2>People and access</h2><p>Assign system roles and additional permissions to each account.</p></div></div><div className="admin-table"><div className="admin-table-head"><span>Person</span><span>Membership</span><span>Role</span><span>Account</span></div>{visible.map(user => <div className="admin-user-row" key={user.id}><div><span className="sidebar-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div><span className="admin-plan">{user.billing?.plan || 'free'}</span><label><span className="sr-only">Role for {user.name}</span><select value={user.role} disabled={busy || account.role!=='admin' || user.id === account.id} onChange={event => void update(user.id, { role: event.target.value })}>{['learner','instructor','admin'].map(role => <option key={role}>{role}</option>)}</select></label><button className="btn btn-secondary" disabled={busy || user.id === account.id} onClick={() => void update(user.id, { disabled: !user.disabled })}>{user.disabled ? 'Enable' : 'Disable'}</button>{account.permissions.includes('manage_roles')&&user.id!==account.id&&<div className="role-assignment">{roles.map(role=><label key={role.id}><input type="checkbox" checked={user.roleIds?.includes(role.id)||false} disabled={busy} onChange={event=>void assignRole(user.id,role.id,event.target.checked)}/>{role.name}</label>)}</div>}</div>)}</div>{visible.length===0&&<p>No users match your search.</p>}</section>
    {account.permissions.includes('manage_roles')&&<section className="surface backend-panel"><h2>Roles &amp; permissions</h2><p>Create a role and choose exactly what it can access.</p><form onSubmit={event=>void createRole(event)}><label>Role name<input required maxLength={80} value={newRoleName} onChange={event=>setNewRoleName(event.target.value)}/></label><div className="role-permissions">{permissionOptions.filter(permission=>account.permissions.includes(permission)).map(permission=><label key={permission}><input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={event=>setSelectedPermissions(current=>event.target.checked?[...current,permission]:current.filter(value=>value!==permission))}/>{permission.replaceAll('_',' ')}</label>)}</div><button className="btn btn-primary" disabled={busy}>Create role</button></form><div className="role-list">{roles.map(role=><div key={role.id}><strong>{role.name}</strong><small>{role.permissions.map((permission:string)=>permission.replaceAll('_',' ')).join(', ')||'No permissions'}</small></div>)}</div></section>}
    <section className="surface backend-panel"><h2>Recent access changes</h2>{audit.length === 0 && <p>No administrative changes yet.</p>}{audit.map(event => <div className="backend-row" key={event.id}><span><strong>{event.name}</strong> · {event.action}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</section>
  </div>;
}
