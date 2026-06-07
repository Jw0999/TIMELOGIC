import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, CalendarDays } from "lucide-react";
import { LEAVE_TYPES } from "../lib/constants";
import { submitLeave } from "../services/data";
import type { ApiError } from "../services/api";

export default function Leave({ onBack }: { onBack: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [phase, setPhase] = useState<"form" | "saving" | "done">("form");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) { setError("End date can't be before the start date."); return; }
    if (!reason.trim()) { setError("Please add a reason for your request."); return; }
    setError(""); setPhase("saving");
    try {
      await submitLeave({ leaveType, startDate, endDate, reason: reason.trim() });
      setPhase("done");
    } catch (e2) { setError((e2 as ApiError).message); setPhase("form"); }
  }

  const field = "w-full rounded-xl border-[1.5px] border-gray200 bg-gray50 px-3.5 py-3 text-[15px] text-ink outline-none focus:border-primary";

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-success-bg">
          <CheckCircle2 size={30} className="text-success" />
        </span>
        <p className="mt-5 text-xl font-extrabold text-ink">Leave requested</p>
        <p className="mt-2 text-[13.5px] text-muted">Your admin will review and approve or reject it.</p>
        <button onClick={onBack} className="mt-6 w-full rounded-xl bg-primary py-3.5 font-bold text-white">Done</button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full max-w-md">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="rounded-[10px] bg-gray100 p-1.5"><ArrowLeft size={22} className="text-gray700" /></button>
        <p className="flex items-center gap-2 text-[17px] font-bold text-ink"><CalendarDays size={18} className="text-primary" /> Request Leave</p>
        <span className="w-9" />
      </div>

      <form onSubmit={submit} className="space-y-4 px-5 pt-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray700">Leave type</label>
          <select className={field} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            {LEAVE_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray700">From</label>
            <input type="date" className={field} value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray700">To</label>
            <input type="date" className={field} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray700">Reason</label>
          <textarea className={`${field} resize-none`} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly explain your request" />
        </div>
        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
        <button
          type="submit"
          disabled={phase === "saving"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-70"
        >
          {phase === "saving" ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />}
          {phase === "saving" ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
