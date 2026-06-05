import React, { useEffect, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import PageShell from '../components/PageShell';
import { fetchAllOrgs } from '../services';
import { downloadCSV } from '../utils/csv';

const ORG_COLORS = ['#15803d','#0891b2','#7c3aed','#b45309','#be185d','#0369a1'];
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3 whitespace-nowrap">
    <div className="flex items-center gap-1">{children}<ChevronsUpDown size={11} className="opacity-40"/></div>
  </th>
);

export default function Offices() {
  const [orgs,    setOrgs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState(0);

  useEffect(() => { fetchAllOrgs().then(setOrgs).finally(() => setLoading(false)); }, []);

  const allOffices = orgs.flatMap((o: any, oi: number) =>
    (o.offices ?? []).map((off: any) => ({ ...off, orgName: o.name, orgColor: ORG_COLORS[oi % ORG_COLORS.length] }))
  );

  const activeOrgs = orgs.filter((o) => (o.offices ?? []).length > 0);

  const filtered = allOffices.filter((off) => {
    const q = search.toLowerCase();
    const matchSearch = !q || off.name?.toLowerCase().includes(q) || off.orgName?.toLowerCase().includes(q) || off.address?.toLowerCase().includes(q);
    const matchTab = tab === 0 || orgs.find((o) => o.name === off.orgName && tab === activeOrgs.indexOf(o) + 1);
    return matchSearch;
  });

  return (
    <PageShell
      breadcrumb={['Super Admin', 'Offices']}
      title="Office Locations"
      tabs={[
        { label: 'All Offices', count: allOffices.length },
        ...activeOrgs.slice(0, 3).map((o) => ({ label: o.name, count: (o.offices ?? []).length })),
      ]}
      activeTab={tab} onTabChange={setTab}
      search={search} onSearch={setSearch}
      searchPlaceholder="Search office…"
      onExport={() => downloadCSV('offices', filtered.map((o) => ({
        Office: o.name, Organization: o.orgName, Timezone: o.timezone ?? '',
        Address: o.address ?? '', WiFi: o.wifiSSID ?? '', Sessions: o._count?.sessions ?? 0,
      })))}
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--hover-bg)] border-b border-[var(--border)]">
            <tr>
              <TH>ID</TH>
              <TH>Office</TH>
              <TH>Organization</TH>
              <TH>Timezone</TH>
              <TH>Address</TH>
              <TH>Sessions</TH>
              <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-14">
                <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"/></div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-14 text-sm text-[var(--text-muted)]">No offices found</td></tr>
            ) : filtered.map((off, idx) => (
              <tr key={off.id ?? idx} className="hover:bg-[var(--hover-bg)] transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{String(idx + 1).padStart(5,'0')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: off.orgColor }}>
                      {off.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-main)]">{off.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{off.timezone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{off.orgName}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{off.timezone}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] max-w-[180px] truncate">{off.address || '—'}</td>
                <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{off._count?.sessions ?? 0}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"/>Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
