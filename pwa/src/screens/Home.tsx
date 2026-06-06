import { useCallback, useEffect, useState } from "react";
import {
  LogOut, Check, Clock, Coffee, CalendarDays, Loader2, RefreshCw,
  LogIn as LogInIcon, CircleDot, History as HistoryIcon,
} from "lucide-react";
import { api, type ApiError } from "../services/api";
import { getDeviceId } from "../services/device";
import { PLATFORM } from "../config";
import { useAuth } from "../context/AuthContext";
import CheckInModal from "../components/CheckInModal";
import LeaveModal from "../components/LeaveModal";

interface SessionInfo { sessionId: string; sessionName: string; office?: string; status: string }
interface BreakRec { id: string; breakType: string; startTime: string; endTime: string | null; durationMinutes: number | null }
interface StatusRec {
  id: string; sessionId: string; clockInTime: string | null; clockOutTime: string | null;
  status: string; totalWorkHours: string | null; breakRecords?: BreakRec[];
}
interface HistRec { id: string; date: string; status: string; clockInTime: string | null; clockOutTime: string | null; totalWorkHours: string | null }

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function Home() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<StatusRec | null>(null);
  const [activeBreak, setActiveBreak] = useState<BreakRec | null>(null);
  const [history, setHistory] = useState<HistRec[]>([]);
  const [busy, setBusy] = useState<string>("");
  const [toast, setToast] = useState("");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const load = useCallback(async () => {
    const [s, st, br, hist] = await Promise.allSettled([
      api.get<SessionInfo>("/attendance/current-session"),
      api.get<StatusRec>("/attendance/status"),
      api.get<BreakRec | null>("/breaks/active"),
      api.get<HistRec[]>("/attendance/history"),
    ]);
    setSession(s.status === "fulfilled" ? s.value : null);
    setStatus(st.status === "fulfilled" ? st.value : null);
    setActiveBreak(br.status === "fulfilled" ? br.value : null);
    setHistory(hist.status === "fulfilled" ? (Array.isArray(hist.value) ? hist.value : []) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  async function run(label: string, fn: () => Promise<void>, done?: string) {
    setBusy(label);
    try {
      await fn();
      await load();
      if (done) flash(done);
    } catch (e) {
      flash((e as ApiError).message);
    } finally {
      setBusy("");
    }
  }

  const sid = status?.sessionId ?? session?.sessionId ?? "";
  const checkedIn = !!status?.clockInTime;
  const checkedOut = !!status?.clockOutTime;
  const onBreak = !!activeBreak;

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 size={26} className="spin text-sky" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full max-w-md px-5 pb-10 pt-6">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white">
            <img src="/icon-192.png" alt="" className="h-9 w-9 object-contain" />
          </span>
          <div>
            <p className="text-[15px] font-bold leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[12px] text-[#9aabce]">{user?.organization?.name ?? user?.employeeCode}</p>
          </div>
        </div>
        <button onClick={logout} aria-label="Sign out" className="grid h-10 w-10 place-items-center rounded-xl text-[#9aabce] ring-1 ring-white/10">
          <LogOut size={18} />
        </button>
      </div>

      {/* status card */}
      <div className="card overflow-hidden p-5">
        {checkedIn ? (
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 place-items-center rounded-full ${status?.status === "LATE" ? "bg-amber-400/15" : "bg-emerald-400/15"}`}>
              <Check size={24} className={status?.status === "LATE" ? "text-amber-400" : "text-emerald-400"} />
            </span>
            <div>
              <p className="text-[12px] text-[#9aabce]">{checkedOut ? "Checked out" : "Checked in"}</p>
              <p className="text-xl font-extrabold tracking-tight">
                {status?.status === "LATE" ? "Late" : "Present"}
              </p>
            </div>
            <div className="ml-auto text-right text-[12px] text-[#9aabce]">
              <p>In {fmt(status?.clockInTime ?? null)}</p>
              {checkedOut && <p>Out {fmt(status?.clockOutTime ?? null)}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.05]">
              <CircleDot size={22} className="text-[#9aabce]" />
            </span>
            <div>
              <p className="text-[12px] text-[#9aabce]">Today</p>
              <p className="text-xl font-extrabold tracking-tight">Not checked in</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[12.5px] ring-1 ring-white/10">
          <Clock size={14} className="text-sky" />
          {session ? (
            <span className="text-[#9aabce]">
              Session open · <span className="text-[#e9eefb]">{session.office ?? session.sessionName}</span>
            </span>
          ) : (
            <span className="text-[#9aabce]">No active session. Wait for it to open or for your admin.</span>
          )}
        </div>
      </div>

      {/* primary action */}
      <div className="mt-4">
        {!checkedIn && (
          <button
            disabled={!session || !!busy}
            onClick={() => setShowCheckIn(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[16px] font-bold text-white shadow-[0_16px_44px_-14px_rgba(37,99,235,0.85)] active:scale-[0.99] disabled:opacity-50"
          >
            <LogInIcon size={19} /> Check in
          </button>
        )}
        {checkedIn && !checkedOut && (
          <button
            disabled={!!busy}
            onClick={() => run("out", () => api.post("/attendance/check-out", { sessionId: sid, platform: PLATFORM, deviceId: getDeviceId() }), "Checked out")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.05] py-4 text-[16px] font-bold text-[#e9eefb] ring-1 ring-white/10 active:scale-[0.99] disabled:opacity-60"
          >
            {busy === "out" ? <Loader2 size={19} className="spin" /> : <LogOut size={19} />} Check out
          </button>
        )}
        {checkedOut && (
          <div className="rounded-2xl bg-emerald-400/[0.06] py-4 text-center text-[15px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
            You’re done for today
          </div>
        )}
      </div>

      {/* breaks + leave */}
      {checkedIn && !checkedOut && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {onBreak ? (
            <button
              disabled={!!busy}
              onClick={() => run("break", () => api.post(`/breaks/${activeBreak!.id}/end`, {}), "Break ended")}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-400/15 py-3 text-[14px] font-semibold text-amber-300 ring-1 ring-amber-400/25 active:scale-[0.99]"
            >
              {busy === "break" ? <Loader2 size={16} className="spin" /> : <Coffee size={16} />} End break
            </button>
          ) : (
            <button
              disabled={!!busy}
              onClick={() => run("break", () => api.post("/breaks", { breakType: "SHORT_BREAK" }), "Break started")}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-3 text-[14px] font-semibold text-[#e9eefb] ring-1 ring-white/10 active:scale-[0.99]"
            >
              {busy === "break" ? <Loader2 size={16} className="spin" /> : <Coffee size={16} />} Start break
            </button>
          )}
          <button
            onClick={() => setShowLeave(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-3 text-[14px] font-semibold text-[#e9eefb] ring-1 ring-white/10 active:scale-[0.99]"
          >
            <CalendarDays size={16} /> Request leave
          </button>
        </div>
      )}

      {!checkedIn && (
        <button
          onClick={() => setShowLeave(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-3 text-[14px] font-semibold text-[#e9eefb] ring-1 ring-white/10 active:scale-[0.99]"
        >
          <CalendarDays size={16} /> Request leave
        </button>
      )}

      {/* history */}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#9aabce]">
          <HistoryIcon size={14} /> Recent
        </h2>
        <button onClick={() => load()} aria-label="Refresh" className="text-[#6b7ca3]">
          <RefreshCw size={15} />
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {history.length === 0 && <li className="py-6 text-center text-[13px] text-[#6b7ca3]">No attendance history yet.</li>}
        {history.slice(0, 8).map((h) => (
          <li key={h.id} className="flex items-center justify-between rounded-xl bg-white/[0.025] px-3.5 py-3 ring-1 ring-white/[0.06]">
            <div>
              <p className="text-[13.5px] font-semibold">
                {new Date(h.date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <p className="text-[11.5px] text-[#9aabce]">In {fmt(h.clockInTime)} · Out {fmt(h.clockOutTime)}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${
                h.status === "PRESENT" ? "bg-emerald-400/15 text-emerald-300"
                : h.status === "LATE" ? "bg-amber-400/15 text-amber-300"
                : "bg-white/5 text-[#9aabce]"
              }`}
            >
              {h.status}
            </span>
          </li>
        ))}
      </ul>

      {/* toast */}
      {toast && (
        <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-xl bg-[#11203f] px-4 py-3 text-center text-[13.5px] font-medium text-[#e9eefb] shadow-2xl ring-1 ring-white/10">
          {toast}
        </div>
      )}

      {showCheckIn && session && (
        <CheckInModal
          sessionId={session.sessionId}
          onClose={() => setShowCheckIn(false)}
          onDone={() => { setShowCheckIn(false); load(); flash("Checked in"); }}
        />
      )}
      {showLeave && <LeaveModal onClose={() => setShowLeave(false)} />}
    </div>
  );
}
