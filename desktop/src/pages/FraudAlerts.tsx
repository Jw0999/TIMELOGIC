import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Header';
import { fetchAlerts, resolveAlert, dismissAlert, escalateAlert } from '../services';

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-red-100 text-red-700',
  INVESTIGATING: 'bg-amber-100 text-amber-700',
  ACKNOWLEDGED: 'bg-primary-100 text-primary-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  DISMISSED: 'bg-slate-100 text-slate-500',
};

const SEVERITY_DOT: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-slate-300' };

const FRAUD_EXPLAIN: Record<string, string> = {
  REPEATED_FAILED_SCANS: 'Many failed check-in attempts in a short time — possible tampering or a forced code.',
  PROXY_ATTENDANCE:      'The same network/IP was used by several employees — someone may be checking in for others (buddy-punching).',
  SCREENSHOT_ATTEMPT:    'A screenshot was taken during attendance — the code may be getting reused or shared.',
  DEVICE_CONFLICT:       'A device registered to another employee was used — possible shared-device fraud.',
  WIFI_MISMATCH:         'A check-in was attempted off the company Wi-Fi network.',
};

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
}

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = () => fetchAlerts().then(setAlerts).finally(() => setLoading(false));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const filtered = alerts.filter((a) => filter === 'All' || a.status === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Fraud Alerts" subtitle={`${alerts.filter((a) => a.status === 'NEW').length} new`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2 mb-5">
          {['All', 'NEW', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${filter === s ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <div className="space-y-3">
            {filtered.map((a: any) => (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${a.status === 'NEW' ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOT[a.severity?.toLowerCase()] ?? 'bg-slate-300'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{a.severity?.toUpperCase()}</span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{a.fraudType?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="font-bold text-slate-800">{a.employee?.firstName} {a.employee?.lastName}</p>
                      {/* Live, human-readable explanation of what the alert was about */}
                      <p className="text-sm text-slate-700 mt-0.5 font-medium">{FRAUD_EXPLAIN[a.fraudType] ?? a.description}</p>
                      <p className="text-xs text-slate-400 mt-1">System: {a.description} · {new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                    {a.status === 'NEW' && <>
                      <button onClick={async () => { await escalateAlert(a.id); load(); }} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl"><Eye size={12} />Investigate</button>
                      <button onClick={async () => { await dismissAlert(a.id); load(); }} className="flex items-center gap-1 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-50"><XCircle size={12} />Dismiss</button>
                    </>}
                    {a.status === 'INVESTIGATING' && (
                      <button onClick={async () => { await resolveAlert(a.id, 'Resolved after investigation'); load(); }} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl"><CheckCircle size={12} />Resolve</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-slate-400 py-16">No alerts found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
