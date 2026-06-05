import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props { label: string; value: string | number; icon: LucideIcon; color: string; bgColor: string; sub?: string }

export default function StatCard({ label, value, icon: Icon, color, bgColor, sub }: Props) {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgColor} mb-3`}>
        <Icon size={17} className={color} />
      </div>
      <p className="text-2xl font-black text-[var(--text-main)] mb-0.5 leading-none">{value}</p>
      <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}
