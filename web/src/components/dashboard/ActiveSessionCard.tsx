import React, { useEffect, useState } from 'react';
import { Video, Clock } from 'lucide-react';
import { api } from '../../services/api';

export default function ActiveSessionCard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    api.get<any>('/super/stats').then((r) => {
      setSession(r.data?.activeSession ?? null);
    }).catch(() => {});
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-[var(--text-muted)]" />
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Live Session</p>
      </div>

      {session ? (
        <>
          <p className="text-[17px] font-black text-[var(--text-main)] leading-snug">{session.sessionName}</p>
          <p className="text-sm text-[var(--text-muted)]">
            Started at {session.startTime ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : timeStr}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600">Session Active</span>
          </div>
        </>
      ) : (
        <>
          <p className="text-[17px] font-black text-[var(--text-main)] leading-snug">No Active Session</p>
          <p className="text-sm text-[var(--text-muted)]">Current Time: {timeStr}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs font-semibold text-[var(--text-muted)]">Awaiting session</span>
          </div>
        </>
      )}

      <button className="w-full mt-auto flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
        <Video size={15} />
        {session ? 'View Session' : 'Start Session'}
      </button>
    </div>
  );
}
