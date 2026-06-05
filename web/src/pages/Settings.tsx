import React, { useState } from 'react';
import { Sun, Moon, Monitor, Shield, Bell, User, Save, Crown, AlertTriangle, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { updateProfile, changePassword, resetSystem } from '../services';

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon size={16} className="text-primary-700" />
        </div>
        <h3 className="font-bold text-[15px] text-[var(--text-main)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-[var(--border)]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-main)]">{label}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

const PREFS_KEY = 'superadmin_prefs';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}'); } catch { return {}; }
}

export default function Settings() {
  const { user }            = useAuth();
  const { theme, setTheme } = useTheme();
  const prefs0 = loadPrefs();

  // Profile (persisted to backend)
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName ?? '');
  const [email,     setEmail]     = useState(user?.email ?? '');

  // Preference toggles (persisted to localStorage)
  const [notifEmail, setNotifEmail]   = useState(prefs0.notifEmail ?? true);
  const [notifFraud, setNotifFraud]   = useState(prefs0.notifFraud ?? true);
  const [notifOrg, setNotifOrg]       = useState(prefs0.notifOrg ?? false);
  const [autoLock, setAutoLock]       = useState(prefs0.autoLock ?? true);
  const [screenshotBlock, setScreenshotBlock] = useState(prefs0.screenshotBlock ?? true);

  // Change password
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [pwdMsg, setPwdMsg]   = useState('');

  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  // Danger Zone — full reset
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetSystem();
      alert('System reset complete. Only your Super Admin account remains.');
      setShowReset(false);
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err?.message ?? 'Reset failed.');
    } finally { setResetting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Persist profile to the backend
      await updateProfile({ firstName, lastName, email });
      // 2. Persist UI preferences locally
      localStorage.setItem(PREFS_KEY, JSON.stringify({ notifEmail, notifFraud, notifOrg, autoLock, screenshotBlock }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwdMsg('');
    if (newPwd.length < 8) { setPwdMsg('New password must be at least 8 characters.'); return; }
    if (newPwd !== confPwd) { setPwdMsg('Passwords do not match.'); return; }
    try {
      await changePassword(curPwd, newPwd);
      setPwdMsg('✓ Password updated.');
      setCurPwd(''); setNewPwd(''); setConfPwd('');
    } catch (err: any) { setPwdMsg(err?.message ?? 'Failed to change password.'); }
  };

  const THEMES: { key: Theme; label: string; icon: React.ElementType }[] = [
    { key: 'light',  label: 'Light',  icon: Sun },
    { key: 'dark',   label: 'Dark',   icon: Moon },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  const inputCls = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition placeholder-[var(--text-muted)]';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[var(--text-main)]">Settings</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your platform preferences and configurations.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto flex-shrink-0 ${
              saved ? 'bg-emerald-500 text-white' : 'bg-primary-700 hover:bg-primary-800 text-white shadow-primary-200/30'
            }`}
          >
            <Save size={15} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Profile */}
          <SectionCard title="Profile" icon={User}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                <Crown size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--text-main)] truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-[var(--text-muted)] truncate">{user?.email}</p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mt-1 inline-block">Super Admin</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">First Name</label>
                <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Last Name</label>
                <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Email Address</label>
                <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              </div>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard title="Appearance" icon={Sun}>
            <p className="text-xs text-[var(--text-muted)] mb-4">Choose how the dashboard looks to you.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {THEMES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === key
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-[var(--border)] hover:border-primary-300 bg-[var(--hover-bg)]'
                  }`}
                >
                  <Icon size={20} className={theme === key ? 'text-primary-700' : 'text-[var(--text-muted)]'} />
                  <span className={`text-xs font-bold ${theme === key ? 'text-primary-700' : 'text-[var(--text-muted)]'}`}>{label}</span>
                  {theme === key && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                </button>
              ))}
            </div>

          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" icon={Bell}>
            <Row label="Email Notifications" sub="Receive platform alerts via email">
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </Row>
            <Row label="Fraud Alert Emails" sub="Immediate notification on new fraud alerts">
              <Toggle value={notifFraud} onChange={setNotifFraud} />
            </Row>
            <Row label="New Organization" sub="Notify when a new org is created">
              <Toggle value={notifOrg} onChange={setNotifOrg} />
            </Row>
          </SectionCard>

          {/* Security */}
          <SectionCard title="Platform Security" icon={Shield}>
            <Row label="Auto-Lock on Fraud" sub="Lock sessions when fraud is detected">
              <Toggle value={autoLock} onChange={setAutoLock} />
            </Row>
            <Row label="Screenshot Protection" sub="Block screenshots in employee app">
              <Toggle value={screenshotBlock} onChange={setScreenshotBlock} />
            </Row>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Change Password</p>
              <div className="space-y-2">
                <input className={inputCls} type="password" placeholder="Current password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
                <input className={inputCls} type="password" placeholder="New password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                <input className={inputCls} type="password" placeholder="Confirm new password" value={confPwd} onChange={(e) => setConfPwd(e.target.value)} />
              </div>
              {pwdMsg && <p className={`text-xs mt-2 font-semibold ${pwdMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{pwdMsg}</p>}
              <button onClick={handleChangePassword} disabled={!curPwd || !newPwd} className="mt-3 w-full bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
                Update Password
              </button>
            </div>
          </SectionCard>

          {/* Platform */}
          {/* Danger Zone */}
          <div className="sm:col-span-2">
            <div className="bg-[var(--card-bg)] rounded-2xl border-2 border-red-200 dark:border-red-900/50 p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0"><AlertTriangle size={16} className="text-red-600" /></div>
                <h3 className="font-bold text-[15px] text-red-600">Danger Zone</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)]">Reset All Data</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 sm:max-w-md">Permanently delete <b>every</b> organization, admin, employee, session, attendance record, report and alert. Only your Super Admin login is kept. This cannot be undone.</p>
                </div>
                <button onClick={() => { setResetText(''); setShowReset(true); }}
                  className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                  <Trash2 size={15} /> Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-md shadow-2xl border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="font-bold text-[var(--text-main)]">Reset All Data?</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[var(--text-main)]">This will permanently erase all organizations and their data. <b>Only your Super Admin account remains.</b> There is no undo.</p>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Type <span className="text-red-600">RESET</span> to confirm</label>
                <input value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="RESET" autoFocus
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setShowReset(false)} disabled={resetting} className="px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition text-[var(--text-main)]">Cancel</button>
              <button onClick={handleReset} disabled={resetText !== 'RESET' || resetting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                {resetting ? 'Resetting…' : 'Permanently Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
