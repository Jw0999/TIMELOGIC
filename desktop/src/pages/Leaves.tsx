import React, { useEffect, useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import Header from '../components/Header';
import { fetchPendingLeaves, approveLeave, rejectLeave } from '../services';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
}

export default function Leaves() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('PENDING');

  const load = () => fetchPendingLeaves().then(setRequests).finally(() => setLoading(false));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const filtered = requests.filter((r) => {
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (filter === 'All' || r.status === filter);
  });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Leave Requests" subtitle={`${requests.filter((r) => r.status === 'PENDING').length} pending`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {['All', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${filter === s ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-700">{r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{r.employee?.firstName} {r.employee?.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{r.leaveType}</span>
                        <span className="text-sm text-slate-600">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</span>
                        <span className="text-sm font-semibold text-slate-700">({r.totalDays}d)</span>
                      </div>
                      {r.reason && <p className="text-sm text-slate-500 mt-1 italic">"{r.reason}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={async () => { await approveLeave(r.id); load(); }} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl"><Check size={13} />Approve</button>
                        <button onClick={async () => { const reason = prompt('Rejection reason:') ?? 'Rejected'; await rejectLeave(r.id, reason); load(); }} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl"><X size={13} />Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-slate-400 py-16">No leave requests found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
