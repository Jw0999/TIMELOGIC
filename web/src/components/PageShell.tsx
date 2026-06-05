import React from 'react';
import { Search, Download, ChevronRight } from 'lucide-react';
import Header from './Header';

interface Tab { label: string; count?: number }

interface Props {
  breadcrumb: string[];
  title: string;
  tabs: Tab[];
  activeTab: number;
  onTabChange: (i: number) => void;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  action?: React.ReactNode;
  onExport?: () => void;
  exportLabel?: string;
  children: React.ReactNode;
}

export default function PageShell({
  breadcrumb, title, tabs, activeTab, onTabChange,
  search, onSearch, searchPlaceholder = 'Search…',
  action, onExport, exportLabel = 'Export CSV',
  children,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--page-bg)]">
      <Header action={action} />

      <div className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-2">
          {breadcrumb.map((b, i) => (
            <React.Fragment key={b}>
              <span className={`text-xs font-medium ${i === breadcrumb.length - 1 ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{b}</span>
              {i < breadcrumb.length - 1 && <ChevronRight size={12} className="text-[var(--text-muted)]" />}
            </React.Fragment>
          ))}
        </div>

        {/* Page title */}
        <h1 className="text-2xl font-black text-[var(--text-main)] mb-4">{title}</h1>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => onTabChange(i)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === i
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                  activeTab === i ? 'bg-primary-100 text-primary-700' : 'bg-[var(--hover-bg)] text-[var(--text-muted)]'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search + export row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
            />
          </div>
          {onExport && (
            <button onClick={onExport}
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-sm font-semibold px-4 py-2 rounded-xl transition-colors text-[var(--text-main)]">
              <Download size={14} />
              {exportLabel}
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="flex-1 overflow-hidden bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]">
          {children}
        </div>
      </div>

      {/* bottom padding */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
}
