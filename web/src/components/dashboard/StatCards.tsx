import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface Stat { label: string; value: string | number; note: string; noteIcon: string; green?: boolean }

function StatCard({ label, value, note, noteIcon, green }: Stat) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-2 border ${
      green
        ? 'bg-primary-800 border-primary-700 text-white'
        : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-main)]'
    }`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${green ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{label}</p>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
          green ? 'border-white/30 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'
        }`}>
          <ArrowUpRight size={14} />
        </div>
      </div>
      <p className={`text-4xl font-black leading-none ${green ? 'text-white' : 'text-[var(--text-main)]'}`}>{value}</p>
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${green ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
        <span className="text-base">{noteIcon}</span>
        <span>{note}</span>
      </div>
    </div>
  );
}

interface Props { stats: any }

export default function StatCards({ stats }: Props) {
  const totalOrgs  = stats?.totalOrgs      ?? 0;
  const totalAdmins = stats?.totalAdmins   ?? 0;
  const totalEmp   = stats?.totalUsers     ?? 0;
  const alerts     = stats?.openAlerts     ?? 0;

  const cards: Stat[] = [
    { label: 'Total Organizations', value: totalOrgs,   note: 'All registered orgs', noteIcon: '🏢', green: true },
    { label: 'Total Admins',        value: totalAdmins, note: 'Increased from last month', noteIcon: '📈' },
    { label: 'Total Employees',     value: totalEmp,    note: 'Increased from last month', noteIcon: '📈' },
    { label: 'Open Fraud Alerts',   value: alerts,      note: alerts > 0 ? 'Needs review' : 'All clear', noteIcon: alerts > 0 ? '⚠️' : '✅' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
