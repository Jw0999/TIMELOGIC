import React, { useEffect, useState } from 'react';
import { Plus, X, ChevronDown, ChevronsUpDown } from 'lucide-react';
import PageShell from '../components/PageShell';
import { fetchAllOrgs, addOrgDepartment } from '../services';
import { downloadCSV } from '../utils/csv';

const ORG_COLORS = ['#15803d','#0891b2','#7c3aed','#b45309','#be185d','#0369a1'];
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3 whitespace-nowrap">
    <div className="flex items-center gap-1">{children}<ChevronsUpDown size={11} className="opacity-40"/></div>
  </th>
);

function AddDeptModal({ orgs, onClose, onSaved }: { orgs: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ orgId: orgs[0]?.id ?? '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inp = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder-[var(--text-muted)]';
  const submit = async () => {
    if (!form.orgId) { setError('Select an organization'); return; }
    if (!form.name.trim()) { setError('Department name required'); return; }
    setLoading(true); setError('');
    try { await addOrgDepartment(form.orgId, form.name.trim()); onSaved(); onClose(); }
    catch (err: any) { setError(err?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-md shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text-main)]">Add Department</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Organization *</label>
            <div className="relative">
              <select value={form.orgId} onChange={(e) => setForm((p) => ({...p, orgId: e.target.value}))} className={`${inp} appearance-none pr-8`}>
                <option value="">— Select —</option>
                {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Department Name *</label>
            <input className={inp} value={form.name} onChange={(e) => setForm((p) => ({...p, name: e.target.value}))} placeholder="e.g. Engineering, HR, Finance" onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus/>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition text-[var(--text-main)]">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition disabled:opacity-60">{loading ? 'Adding…' : 'Add Department'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const [orgs,    setOrgs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState(0);

  const load = () => fetchAllOrgs().then(setOrgs).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const allDepts = orgs.flatMap((o: any, oi: number) =>
    (o.departments ?? []).map((d: any) => ({ ...d, orgName: o.name, orgId: o.id, orgColor: ORG_COLORS[oi % ORG_COLORS.length] }))
  );

  const activeOrgs = orgs.filter((o) => (o.departments ?? []).length > 0);

  const filtered = allDepts.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.orgName?.toLowerCase().includes(q);
    const matchTab = tab === 0 || d.orgId === activeOrgs[tab - 1]?.id;
    return matchSearch && matchTab;
  });

  return (
    <>
      <PageShell
        breadcrumb={['Super Admin', 'Departments']}
        title="Departments"
        tabs={[
          { label: 'All', count: allDepts.length },
          ...activeOrgs.slice(0, 4).map((o) => ({ label: o.name, count: (o.departments ?? []).length })),
        ]}
        activeTab={tab} onTabChange={setTab}
        search={search} onSearch={setSearch}
        searchPlaceholder="Search department…"
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm shadow-primary-200/40"><Plus size={14}/>Add Department</button>}
        onExport={() => downloadCSV('departments', filtered.map((d) => ({
          Department: d.name, Organization: d.orgName,
          Manager: d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : '',
          Employees: d._count?.employees ?? 0,
        })))}
      >
        <div className="overflow-y-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--hover-bg)] border-b border-[var(--border)]">
              <tr>
                <TH>ID</TH>
                <TH>Department</TH>
                <TH>Organization</TH>
                <TH>Manager</TH>
                <TH>Employees</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-14">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"/></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-14 text-sm text-[var(--text-muted)]">No departments found</td></tr>
              ) : filtered.map((d, idx) => (
                <tr key={d.id ?? idx} className="hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{String(idx + 1).padStart(5,'0')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: d.orgColor }}>
                        {d.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-main)]">{d.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Department</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{d.orgName}</td>
                  <td className="px-4 py-3">
                    {d.manager ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary-700">{d.manager.firstName?.[0]}{d.manager.lastName?.[0]}</span>
                        </div>
                        <span className="text-sm text-[var(--text-main)]">{d.manager.firstName} {d.manager.lastName}</span>
                      </div>
                    ) : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{d._count?.employees ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageShell>
      {showAdd && orgs.length > 0 && <AddDeptModal orgs={orgs} onClose={() => setShowAdd(false)} onSaved={load}/>}
    </>
  );
}
