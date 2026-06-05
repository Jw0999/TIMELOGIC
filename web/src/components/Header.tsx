import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Mail, X, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Props { title?: string; subtitle?: string; action?: React.ReactNode }

export default function Header({ action }: Props) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]         = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showNotifs) {
      api.get<any>('/super/notifications').then((r) => setNotifs(r.data ?? [])).catch(() => {});
    }
  }, [showNotifs]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-3.5 bg-[var(--card-bg)] border-b border-[var(--border)] flex-shrink-0">
      {/* Search — grows to fill center (hidden on small screens to free room) */}
      <div className="hidden md:block flex-1 min-w-0 max-w-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task"
            className="w-full pl-9 pr-16 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--border)] px-1.5 py-0.5 rounded">
            ⌘ F
          </kbd>
        </div>
      </div>

      {/* Action slot (Add buttons etc.) */}
      {action && <div className="flex items-center gap-2 min-w-0">{action}</div>}

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
        {/* Mail (hidden on small screens) */}
        <button className="w-9 h-9 hidden sm:flex items-center justify-center rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors">
          <Mail size={17} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors relative">
            <Bell size={17} />
            {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-11 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-xl w-72 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <p className="font-bold text-sm text-[var(--text-main)]">Notifications</p>
                <button onClick={() => setShowNotifs(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={13} /></button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifs.length === 0
                  ? <p className="text-center text-xs text-[var(--text-muted)] py-8">No notifications</p>
                  : notifs.map((n: any, i: number) => (
                    <div key={i} className="px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors">
                      <p className="text-xs font-semibold text-[var(--text-main)]">{n.title ?? n.channel}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{n.message ?? n.content}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border)] ml-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <Crown size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-bold text-[var(--text-main)] leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
