'use client';

import { useState } from 'react';
import { useLearning } from '@/context/LearningContext';
import { User, Bell, Globe, Shield, Save, CheckCircle2 } from 'lucide-react';

const avatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
];

export default function SettingsPage() {
  const {
    data, api, logout,
    updateUserProfile,
    notificationSettings,
    updateNotificationSettings,
    workspaceSettings,
    updateWorkspaceSettings
  } = useLearning();

  const user = data.currentUser;

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'workspace' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [avatar, setAvatar] = useState(user.avatar);

  // Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!await updateUserProfile({ name, role, avatar }))return;
    showToast('Profile information updated successfully!');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      alert('Please fill out password fields');
      return;
    }
    if (newPass !== confirmPass) {
      alert('New passwords do not match');
      return;
    }
    try { await api('auth/password','POST',{currentPassword:currentPass,password:newPass}); await logout(); } catch(error) { alert(error instanceof Error?error.message:'Unable to update password.'); return; }
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    showToast('Security settings and password updated!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="library-eyebrow">ACCOUNT & PREFERENCES</p>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your learner profile, notifications, workspace preferences, and security settings.</p>
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--accent-success)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999
          }}
        >
          <CheckCircle2 style={{ width: 18, height: 18 }} />
          {toastMessage}
        </div>
      )}

      {/* Settings Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Navigation Sidebar */}
        <div className="surface" style={{ padding: 12, borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'profile', label: 'Profile Information', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'workspace', label: 'Workspace & Region', icon: Globe },
              { id: 'security', label: 'Security & Password', icon: Shield }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="surface" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Profile Information</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                This information will be displayed on your certificates, community threads, and learner profile.
              </p>

              {/* Avatar Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                  Avatar Image
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={avatar}
                    alt="Preview avatar"
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(preset)}
                        style={{
                          padding: 0,
                          border: avatar === preset ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          background: 'none'
                        }}
                      >
                        <img src={preset} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Professional Headline</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save style={{ width: 16, height: 16 }} /> Save Profile
                </button>
              </div>
            </form>
          )}

          {/* 2. Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Notification Preferences</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                Choose which notifications and email digests you would like to receive.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    key: 'emailDigest',
                    title: 'Weekly Learning Digest',
                    desc: 'Summary of your study hours, completed lessons, and weekly streak.'
                  },
                  {
                    key: 'assignmentGraded',
                    title: 'Assignment Feedback Alerts',
                    desc: 'Get notified when an instructor or peer grades your submitted project.'
                  },
                  {
                    key: 'liveClassReminders',
                    title: 'Live Workshop Reminders',
                    desc: 'Receive reminders 30 minutes before masterclasses and live Q&A sessions.'
                  },
                  {
                    key: 'communityReplies',
                    title: 'Community Replies & Upvotes',
                    desc: 'Get notified when someone responds to your thread or upvotes your post.'
                  }
                ].map(item => {
                  const val = notificationSettings[item.key as keyof typeof notificationSettings];
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{item.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if(!await updateNotificationSettings({ [item.key]: !val }))return;
                          showToast('Notification preferences updated');
                        }}
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 99,
                          background: val ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 3,
                            left: val ? 25 : 3,
                            transition: 'left 0.2s'
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Workspace Tab */}
          {activeTab === 'workspace' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Workspace & Region Settings</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                Configure your timezone, interface language, and layout density preferences.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Timezone
                  </label>
                  <select
                    value={workspaceSettings.timezone}
                    onChange={async e => {
                      if(!await updateWorkspaceSettings({ timezone: e.target.value }))return;
                      showToast('Timezone updated');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="UTC-5 (Eastern Standard Time)">UTC-5 (Eastern Standard Time)</option>
                    <option value="UTC+0 (Greenwich Mean Time)">UTC+0 (Greenwich Mean Time / London)</option>
                    <option value="UTC+1 (West Africa Time)">UTC+1 (West Africa Time / Lagos)</option>
                    <option value="UTC+8 (Singapore / China Standard)">UTC+8 (Singapore / China Standard)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Interface Language
                  </label>
                  <select
                    value={workspaceSettings.language}
                    onChange={async e => {
                      if(!await updateWorkspaceSettings({ language: e.target.value }))return;
                      showToast('Language updated');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="French (Français)">French (Français)</option>
                    <option value="Spanish (Español)">Spanish (Español)</option>
                    <option value="German (Deutsch)">German (Deutsch)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Interface Density
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['comfortable', 'compact'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={async () => {
                          if(!await updateWorkspaceSettings({ density: d as any }))return;
                          showToast(`Density set to ${d}`);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          background: workspaceSettings.density === d ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: workspaceSettings.density === d ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontWeight: workspaceSettings.density === d ? 700 : 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {d} Mode
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Security & Password</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                Update your account password and manage two-factor authentication.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440, marginBottom: 28 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPass}
                    onChange={e => setCurrentPass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>Two-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Add an extra layer of security using an authenticator app.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert('Two-factor authentication is not configured yet.');
                  }}
                  className={`btn ${twoFactor ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  Not configured
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save style={{ width: 16, height: 16 }} /> Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
