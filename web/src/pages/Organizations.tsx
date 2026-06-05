import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, ChevronRight, ChevronsUpDown, Pencil } from 'lucide-react';
import PageShell from '../components/PageShell';
import { fetchAllOrgs, createOrg, updateOrg, deleteOrg, fetchOrgUsers } from '../services';
import { downloadCSV } from '../utils/csv';

const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Logistics','Retail','Manufacturing','Non-profit','Government','Other'];
const PLANS      = ['starter','business','enterprise'];
const TIMEZONES  = ['Africa/Lagos','Africa/Accra','Africa/Nairobi','UTC','America/New_York','Europe/London','Asia/Dubai'];

const PLAN_STYLE: Record<string, { bg: string; text: string }> = {
  starter:    { bg: '#f3f4f6', text: '#374151' },
  business:   { bg: '#dbeafe', text: '#1d4ed8' },
  enterprise: { bg: '#ede9fe', text: '#6d28d9' },
};
const ORG_COLORS = ['#15803d','#0891b2','#7c3aed','#b45309','#be185d','#0369a1'];

interface OrgFormData {
  name: string; industry: string; subscriptionTier: string;
  offices: {
    name: string; address: string; timezone: string; wifiSSID: string;
    openTime: string; closeTime: string; breakMinutes: number;
    graceMinutes: number; lateAfterMinutes: number; gracePenalty: number; latePenalty: number;
    breakStart: string; breakEnd: string;
  }[];
  departments: { name: string; breakStart: string; breakEnd: string }[];
  admin: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string; employeeCode: string };
}
const newOffice = () => ({
  name: '', address: '', timezone: 'Africa/Lagos', wifiSSID: '',
  openTime: '08:00', closeTime: '17:00', breakMinutes: 60,
  graceMinutes: 30, lateAfterMinutes: 90, gracePenalty: 0, latePenalty: 0,
  breakStart: '13:00', breakEnd: '14:00',
});
const defaultForm = (): OrgFormData => ({
  name: '', industry: 'Technology', subscriptionTier: 'starter',
  offices: [{ ...newOffice(), name: 'Main Office' }],
  departments: [{ name: 'Engineering', breakStart: '13:00', breakEnd: '14:00' }],
  admin: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', employeeCode: '' },
});

function OrgModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OrgFormData>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const updateAdmin  = (k: string, v: string) => setForm((p) => ({ ...p, admin: { ...p.admin, [k]: v } }));
  const updateOffice = (i: number, k: string, v: string) => setForm((p) => { const o = [...p.offices]; o[i] = { ...o[i], [k]: v }; return { ...p, offices: o }; });
  const updateDept   = (i: number, k: string, v: string) => setForm((p) => { const d = [...p.departments]; d[i] = { ...d[i], [k]: v }; return { ...p, departments: d }; });
  const inp = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder-[var(--text-muted)]';
  const lbl = 'block text-xs font-semibold text-[var(--text-muted)] mb-1.5';
  const submit = async () => {
    if (form.admin.password !== form.admin.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await createOrg({ name: form.name, industry: form.industry, subscriptionTier: form.subscriptionTier, offices: form.offices, departments: form.departments, admin: { firstName: form.admin.firstName, lastName: form.admin.lastName, email: form.admin.email, password: form.admin.password, employeeCode: form.admin.employeeCode || undefined } });
      onSaved(); onClose();
    } catch (err: any) { setError(err?.message ?? 'Failed to create'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">Add New Organization</h2>
            <div className="flex gap-1 mt-2">{['Org Info','Offices','Departments','Admin Account'].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > i+1 ? 'bg-primary-600 text-white' : step === i+1 ? 'bg-primary-700 text-white' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>{step > i+1 ? '✓' : i+1}</div>
                <span className={`text-xs ${step === i+1 ? 'text-primary-700 font-semibold' : 'text-[var(--text-muted)]'}`}>{s}</span>
                {i < 3 && <ChevronRight size={12} className="text-[var(--text-muted)]" />}
              </div>))}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}
          {step === 1 && <div className="space-y-4"><h3 className="font-bold text-[var(--text-main)] mb-3">Organization Information</h3>
            <div><label className={lbl}>Organization Name *</label><input className={inp} value={form.name} onChange={(e) => setForm((p) => ({...p, name: e.target.value}))} placeholder="e.g. Acme Corp" /></div>
            <div><label className={lbl}>Industry</label><select className={inp} value={form.industry} onChange={(e) => setForm((p) => ({...p, industry: e.target.value}))}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></div>
            <div><label className={lbl}>Plan</label><select className={inp} value={form.subscriptionTier} onChange={(e) => setForm((p) => ({...p, subscriptionTier: e.target.value}))}>{PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></div>
          </div>}
          {step === 2 && <div>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-[var(--text-main)]">Offices, Work Hours & Penalties</h3><button onClick={() => setForm((p) => ({...p, offices: [...p.offices, newOffice()]}))} className="text-xs font-semibold text-primary-600 flex items-center gap-1"><Plus size={12}/>Add</button></div>
            {form.offices.map((o, i) => (<div key={i} className="p-4 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)] space-y-3 mb-3">
              <div className="flex justify-between"><span className="text-xs font-bold text-[var(--text-muted)]">Office {i+1}</span>{form.offices.length > 1 && <button onClick={() => setForm((p) => ({...p, offices: p.offices.filter((_,idx) => idx !== i)}))} className="text-red-500"><X size={13}/></button>}</div>
              <div className="grid grid-cols-2 gap-3"><div><label className={lbl}>Name</label><input className={inp} value={o.name} onChange={(e) => updateOffice(i,'name',e.target.value)} placeholder="HQ Lagos"/></div><div><label className={lbl}>Timezone</label><select className={inp} value={o.timezone} onChange={(e) => updateOffice(i,'timezone',e.target.value)}>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select></div></div>
              <div><label className={lbl}>Address</label><input className={inp} value={o.address} onChange={(e) => updateOffice(i,'address',e.target.value)} placeholder="Full address"/></div>
              {/* Work hours + break — drives check-in / check-out everywhere */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Open Time</label><input className={inp} type="time" value={o.openTime} onChange={(e) => updateOffice(i,'openTime',e.target.value)}/></div>
                <div><label className={lbl}>Close Time</label><input className={inp} type="time" value={o.closeTime} onChange={(e) => updateOffice(i,'closeTime',e.target.value)}/></div>
                <div><label className={lbl}>Break (min)</label><input className={inp} type="number" min={0} value={o.breakMinutes} onChange={(e) => updateOffice(i,'breakMinutes',e.target.value)}/></div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">Check-in opens at <b>Open Time</b> and the session auto-closes at <b>Close Time</b>. Employees use these exact times to clock in/out.</p>

              {/* Lateness grace + penalties (salary deductions) */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Lateness & Penalties</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Grace (min, no penalty)</label><input className={inp} type="number" min={0} value={o.graceMinutes} onChange={(e) => updateOffice(i,'graceMinutes',e.target.value)}/></div>
                  <div><label className={lbl}>Late after (min from open)</label><input className={inp} type="number" min={0} value={o.lateAfterMinutes} onChange={(e) => updateOffice(i,'lateAfterMinutes',e.target.value)}/></div>
                  <div><label className={lbl}>Penalty after grace (₦)</label><input className={inp} type="number" min={0} value={o.gracePenalty} onChange={(e) => updateOffice(i,'gracePenalty',e.target.value)}/></div>
                  <div><label className={lbl}>Late penalty (₦)</label><input className={inp} type="number" min={0} value={o.latePenalty} onChange={(e) => updateOffice(i,'latePenalty',e.target.value)}/></div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Deducted from salary. On-time within grace = ₦0. After grace = grace penalty. After "late after" = marked LATE + late penalty.</p>
              </div>

              {/* Break window */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Break Window</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Break Start</label><input className={inp} type="time" value={o.breakStart} onChange={(e) => updateOffice(i,'breakStart',e.target.value)}/></div>
                  <div><label className={lbl}>Break End</label><input className={inp} type="time" value={o.breakEnd} onChange={(e) => updateOffice(i,'breakEnd',e.target.value)}/></div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Employees can only take breaks within this window — prevents cheating the system.</p>
              </div>

              <div><label className={lbl}>Company WiFi (SSID) — this office's own network</label><input className={inp} value={o.wifiSSID} onChange={(e) => updateOffice(i,'wifiSSID',e.target.value)} placeholder="e.g. Acme_Office_5G"/><p className="text-[11px] text-[var(--text-muted)] mt-1">Employees must be on this exact network to check in. Leave blank to set later in Security Settings.</p></div>
            </div>))}
          </div>}
          {step === 3 && <div>
            <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-[var(--text-main)]">Departments</h3><button onClick={() => setForm((p) => ({...p, departments: [...p.departments, {name:'', breakStart:'13:00', breakEnd:'14:00'}]}))} className="text-xs font-semibold text-primary-600 flex items-center gap-1"><Plus size={12}/>Add</button></div>
            <p className="text-xs text-[var(--text-muted)] mb-4">Each department sets its own break window. Employees inherit it from their department.</p>
            {form.departments.map((d, i) => (
              <div key={i} className="flex gap-2 items-end mb-3">
                <div className="flex-1"><label className={lbl}>Department {i+1}</label><input className={inp} value={d.name} onChange={(e) => updateDept(i, 'name', e.target.value)} placeholder="e.g. Engineering"/></div>
                <div className="w-28"><label className={lbl}>Break Start</label><input className={inp} type="time" value={d.breakStart} onChange={(e) => updateDept(i, 'breakStart', e.target.value)}/></div>
                <div className="w-28"><label className={lbl}>Break End</label><input className={inp} type="time" value={d.breakEnd} onChange={(e) => updateDept(i, 'breakEnd', e.target.value)}/></div>
                {form.departments.length > 1 && <button onClick={() => setForm((p) => ({...p, departments: p.departments.filter((_,idx) => idx !== i)}))} className="text-red-500 pb-2.5"><X size={15}/></button>}
              </div>
            ))}
          </div>}
          {step === 4 && <div className="space-y-4">
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700"><strong>Important:</strong> These credentials are for the Admin Desktop Panel.</div>
            <div className="grid grid-cols-2 gap-4"><div><label className={lbl}>First Name *</label><input className={inp} value={form.admin.firstName} onChange={(e) => updateAdmin('firstName',e.target.value)} placeholder="First name"/></div><div><label className={lbl}>Last Name *</label><input className={inp} value={form.admin.lastName} onChange={(e) => updateAdmin('lastName',e.target.value)} placeholder="Last name"/></div></div>
            <div><label className={lbl}>Email *</label><input className={inp} type="email" value={form.admin.email} onChange={(e) => updateAdmin('email',e.target.value)} placeholder="admin@company.com"/></div>
            <div><label className={lbl}>Admin Code</label><input className={inp} value={form.admin.employeeCode} onChange={(e) => updateAdmin('employeeCode',e.target.value)} placeholder="ADM001"/></div>
            <div className="grid grid-cols-2 gap-4"><div><label className={lbl}>Password *</label><input className={inp} type="password" value={form.admin.password} onChange={(e) => updateAdmin('password',e.target.value)} placeholder="Min 8 chars"/></div><div><label className={lbl}>Confirm *</label><input className={inp} type="password" value={form.admin.confirmPassword} onChange={(e) => updateAdmin('confirmPassword',e.target.value)} placeholder="Repeat"/></div></div>
          </div>}
        </div>
        <div className="flex justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={() => step > 1 ? setStep(step-1) : onClose()} className="px-4 py-2 border border-[var(--border)] text-[var(--text-main)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition">{step === 1 ? 'Cancel' : 'Back'}</button>
          {step < 4
            ? <button onClick={() => { if (step===1 && !form.name.trim()) { setError('Name required'); return; } setError(''); setStep(step+1); }} className="px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition">Continue</button>
            : <button onClick={submit} disabled={loading} className="px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition disabled:opacity-60">{loading ? 'Creating...' : 'Create Organization'}</button>}
        </div>
      </div>
    </div>
  );
}

function UsersModal({ org, onClose }: { org: any; onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchOrgUsers(org.id).then(setUsers).finally(() => setLoading(false)); }, [org.id]);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div><h2 className="font-bold text-[var(--text-main)]">{org.name}</h2><p className="text-xs text-[var(--text-muted)]">All users</p></div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"/></div>
            : users.length === 0 ? <p className="text-center py-10 text-sm text-[var(--text-muted)]">No users</p>
            : users.map((u: any) => (
              <div key={u.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-primary-700">{u.firstName?.[0]}{u.lastName?.[0]}</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[var(--text-main)]">{u.firstName} {u.lastName}</p><p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p></div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
              </div>
            ))}
        </div>
        <div className="px-5 py-3 border-t border-[var(--border)]"><p className="text-xs text-[var(--text-muted)]">{users.length} users total</p></div>
      </div>
    </div>
  );
}

function EditOrgModal({ org, onClose, onSaved }: { org: any; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState(org.name ?? '');
  const [industry, setIndustry] = useState(org.industry ?? 'Technology');
  const [tier, setTier]       = useState(org.subscriptionTier ?? 'starter');
  const [offices, setOffices] = useState<any[]>(() => (org.offices ?? []).map((o: any) => ({
    id: o.id, name: o.name ?? '', address: o.address ?? '', timezone: o.timezone ?? 'Africa/Lagos',
    wifiSSID: o.wifiSSID ?? '', openTime: o.openTime ?? '08:00', closeTime: o.closeTime ?? '17:00',
    breakMinutes: o.breakMinutes ?? 60,
    graceMinutes: o.graceMinutes ?? 30, lateAfterMinutes: o.lateAfterMinutes ?? 90,
    gracePenalty: o.gracePenalty ?? 0, latePenalty: o.latePenalty ?? 0,
    breakStart: o.breakStart ?? '13:00', breakEnd: o.breakEnd ?? '14:00',
  })));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inp = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';
  const lbl = 'block text-xs font-semibold text-[var(--text-muted)] mb-1.5';
  const updOffice = (i: number, k: string, v: any) => setOffices((p) => { const a = [...p]; a[i] = { ...a[i], [k]: v }; return a; });

  const save = async () => {
    setLoading(true); setError('');
    try {
      await updateOrg(org.id, { name, industry, subscriptionTier: tier, offices });
      onSaved(); onClose();
    } catch (err: any) { setError(err?.message ?? 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div><h2 className="text-lg font-bold text-[var(--text-main)]">Edit Organization</h2><p className="text-xs text-[var(--text-muted)]">Changes apply across the backend and all apps</p></div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Organization Name</label><input className={inp} value={name} onChange={(e) => setName(e.target.value)}/></div>
            <div><label className={lbl}>Plan</label><select className={inp} value={tier} onChange={(e) => setTier(e.target.value)}>{PLANS.map((p) => <option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}</select></div>
          </div>
          <div><label className={lbl}>Industry</label><select className={inp} value={industry} onChange={(e) => setIndustry(e.target.value)}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></div>

          <h3 className="font-bold text-[var(--text-main)] pt-2">Offices, Work Hours & WiFi</h3>
          {offices.map((o, i) => (
            <div key={o.id} className="p-4 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Office Name</label><input className={inp} value={o.name} onChange={(e) => updOffice(i,'name',e.target.value)}/></div>
                <div><label className={lbl}>Timezone</label><select className={inp} value={o.timezone} onChange={(e) => updOffice(i,'timezone',e.target.value)}>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div><label className={lbl}>Address</label><input className={inp} value={o.address} onChange={(e) => updOffice(i,'address',e.target.value)}/></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Open Time</label><input className={inp} type="time" value={o.openTime} onChange={(e) => updOffice(i,'openTime',e.target.value)}/></div>
                <div><label className={lbl}>Close Time</label><input className={inp} type="time" value={o.closeTime} onChange={(e) => updOffice(i,'closeTime',e.target.value)}/></div>
                <div><label className={lbl}>Break (min)</label><input className={inp} type="number" min={0} value={o.breakMinutes} onChange={(e) => updOffice(i,'breakMinutes',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Grace (min, no penalty)</label><input className={inp} type="number" min={0} value={o.graceMinutes} onChange={(e) => updOffice(i,'graceMinutes',e.target.value)}/></div>
                <div><label className={lbl}>Late after (min from open)</label><input className={inp} type="number" min={0} value={o.lateAfterMinutes} onChange={(e) => updOffice(i,'lateAfterMinutes',e.target.value)}/></div>
                <div><label className={lbl}>Penalty after grace (₦)</label><input className={inp} type="number" min={0} value={o.gracePenalty} onChange={(e) => updOffice(i,'gracePenalty',e.target.value)}/></div>
                <div><label className={lbl}>Late penalty (₦)</label><input className={inp} type="number" min={0} value={o.latePenalty} onChange={(e) => updOffice(i,'latePenalty',e.target.value)}/></div>
                <div><label className={lbl}>Break Start</label><input className={inp} type="time" value={o.breakStart} onChange={(e) => updOffice(i,'breakStart',e.target.value)}/></div>
                <div><label className={lbl}>Break End</label><input className={inp} type="time" value={o.breakEnd} onChange={(e) => updOffice(i,'breakEnd',e.target.value)}/></div>
              </div>
              <div><label className={lbl}>Company WiFi (SSID)</label><input className={inp} value={o.wifiSSID} onChange={(e) => updOffice(i,'wifiSSID',e.target.value)} placeholder="Leave blank to disable WiFi check"/></div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition text-[var(--text-main)]">Cancel</button>
          <button onClick={save} disabled={loading} className="px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition disabled:opacity-60">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3 whitespace-nowrap ${className}`}>
    <div className="flex items-center gap-1">{children}<ChevronsUpDown size={11} className="opacity-40"/></div>
  </th>
);

export default function Organizations() {
  const [orgs,    setOrgs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [viewOrg, setViewOrg] = useState<any>(null);
  const [editOrg, setEditOrg] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState(0);

  const load = () => fetchAllOrgs().then(setOrgs).finally(() => setLoading(false));
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, []);

  const visible = orgs.filter((o) => o.id !== 'platform-org');
  const filtered = visible.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.name?.toLowerCase().includes(q) || o.industry?.toLowerCase().includes(q);
    const matchTab = tab === 0 || (tab === 1 && o.subscriptionTier === 'starter') || (tab === 2 && o.subscriptionTier === 'business') || (tab === 3 && o.subscriptionTier === 'enterprise');
    return matchSearch && matchTab;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}"? All data will be deleted.`)) return;
    setDeleting(id);
    try { await deleteOrg(id); load(); } catch (err: any) { alert(err?.message ?? 'Failed'); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <PageShell
        breadcrumb={['Super Admin', 'Organizations']}
        title="Organizations"
        tabs={[
          { label: 'All', count: visible.length },
          { label: 'Starter',    count: visible.filter((o) => o.subscriptionTier === 'starter').length },
          { label: 'Business',   count: visible.filter((o) => o.subscriptionTier === 'business').length },
          { label: 'Enterprise', count: visible.filter((o) => o.subscriptionTier === 'enterprise').length },
        ]}
        activeTab={tab} onTabChange={setTab}
        search={search} onSearch={setSearch}
        searchPlaceholder="Search organization…"
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm shadow-primary-200/40"><Plus size={14}/>Add Organization</button>}
        onExport={() => downloadCSV('organizations', filtered.map((o) => ({
          Name: o.name, Industry: o.industry ?? '', Plan: o.subscriptionTier ?? '',
          Users: o._count?.users ?? 0, Offices: o._count?.offices ?? 0, Departments: o._count?.departments ?? 0,
          Created: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '',
        })))}
      >
        {/* Table header */}
        <div className="overflow-y-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--hover-bg)] border-b border-[var(--border)]">
              <tr>
                <TH>ID</TH>
                <TH className="min-w-[200px]">Organization</TH>
                <TH>Industry</TH>
                <TH>Plan</TH>
                <TH>Users</TH>
                <TH>Offices</TH>
                <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"/></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14">
                  <p className="text-sm font-semibold text-[var(--text-muted)]">No organizations found</p>
                </td></tr>
              ) : filtered.map((o, idx) => {
                const ps = PLAN_STYLE[o.subscriptionTier] ?? PLAN_STYLE.starter;
                const color = ORG_COLORS[idx % ORG_COLORS.length];
                return (
                  <tr key={o.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{String(idx + 1).padStart(5,'0')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
                          {o.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-main)]">{o.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">Since {new Date(o.createdAt ?? Date.now()).getFullYear()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{o.industry ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: ps.bg, color: ps.text }}>{o.subscriptionTier}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{o._count?.users ?? 0}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{o._count?.offices ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewOrg(o)} className="text-sm font-semibold text-primary-700 hover:text-primary-900 transition-colors">View</button>
                        <button onClick={() => setEditOrg(o)} title="Edit" className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-primary-700 transition-colors"><Pencil size={13}/></button>
                        {o.id !== 'platform-org' && (
                          <button onClick={() => handleDelete(o.id, o.name)} disabled={deleting === o.id}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50">
                            <X size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageShell>
      {showAdd && <OrgModal onClose={() => setShowAdd(false)} onSaved={load}/>}
      {viewOrg  && <UsersModal org={viewOrg} onClose={() => setViewOrg(null)}/>}
      {editOrg  && <EditOrgModal org={editOrg} onClose={() => setEditOrg(null)} onSaved={load}/>}
    </>
  );
}
