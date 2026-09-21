'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export default function Administration() {
  const { account, api } = useLearning();
  const [users, setUsers] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { try { const [people, events] = await Promise.all([api('admin/users'), api('admin/audit')]); setUsers(people); setAudit(events); } catch (issue) { setError(String(issue)); } }
  useEffect(() => { if (account.role === 'admin') void load(); }, [account.role]);
  async function update(id: string, values: unknown) { setBusy(true); setError(''); try { await api(`admin/users/${id}`, 'PATCH', values); await load(); } catch (issue) { setError(String(issue)); } finally { setBusy(false); } }
  if (account.role !== 'admin') return <section className="surface backend-panel"><h1>Administrator access required</h1></section>;
  const active = users.filter(user => !user.disabled).length;
  const staff = users.filter(user => user.role !== 'learner' && !user.disabled).length;
  return <div>
    <div className="page-header"><div><p className="library-eyebrow">ACCESS & GOVERNANCE</p><h1 className="page-title">Administration</h1><p className="page-subtitle">Control who can teach and administer the academy. Billing plans never change security roles.</p></div></div>
    {error && <p role="alert" className="backend-error">{error}</p>}
    <div className="admin-metrics"><article className="surface"><UsersRound/><div><strong>{active}</strong><span>active accounts</span></div></article><article className="surface"><UserCog/><div><strong>{staff}</strong><span>instructors & admins</span></div></article><article className="surface"><ShieldCheck/><div><strong>3</strong><span>permission levels</span></div></article></div>
    <section className="surface backend-panel"><div className="section-heading"><div><h2>People and access</h2><p>Learners consume courses. Instructors manage their own courses. Administrators manage the whole academy.</p></div></div><div className="admin-table"><div className="admin-table-head"><span>Person</span><span>Membership</span><span>Role</span><span>Account</span></div>{users.map(user => <div className="admin-user-row" key={user.id}><div><span className="sidebar-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div><span className="admin-plan">{user.billing?.plan || 'free'}</span><label><span className="sr-only">Role for {user.name}</span><select value={user.role} disabled={busy || user.id === account.id} onChange={event => void update(user.id, { role: event.target.value })}>{['learner','instructor','admin'].map(role => <option key={role}>{role}</option>)}</select></label><button className="btn btn-secondary" disabled={busy || user.id === account.id} onClick={() => void update(user.id, { disabled: !user.disabled })}>{user.disabled ? 'Enable' : 'Disable'}</button></div>)}</div></section>
    <section className="surface backend-panel"><h2>Recent access changes</h2>{audit.length === 0 && <p>No administrative changes yet.</p>}{audit.map(event => <div className="backend-row" key={event.id}><span><strong>{event.name}</strong> · {event.action}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</section>
  </div>;
}
