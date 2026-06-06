import { useState } from "react";
import { X, Loader2, Check, CalendarDays } from "lucide-react";
import { api, type ApiError } from "../services/api";

const TYPES = [
  ["ANNUAL", "Annual"],
  ["SICK", "Sick"],
  ["CASUAL", "Casual"],
  ["MATERNITY", "Maternity"],
  ["PATERNITY", "Paternity"],
  ["COMPASSIONATE", "Compassionate"],
  ["UNPAID", "Unpaid"],
] as const;

export default function LeaveModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [phase, setPhase] = useState<"form" | "saving" | "done">("form");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date can’t be before the start date.");
      return;
    }
    setError("");
    setPhase("saving");
    try {
      await api.post("/leaves", { leaveType, startDate, endDate, reason: reason.trim() });
      setPhase("done");
    } catch (e2) {
      setError((e2 as ApiError).message);
      setPhase("form");
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[15px] text-[#e9eefb] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/30";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:items-center">
      <div className="card w-full max-w-sm p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarDays size={18} className="text-sky" /> Request leave
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-[#6b7ca3]">
            <X size={20} />
          </button>
        </div>

        {phase === "done" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15">
              <Check size={26} className="text-emerald-400" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">Leave requested</p>
            <p className="mt-1.5 text-[13.5px] text-[#9aabce]">
              Your admin will review and approve or reject it.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-white/[0.05] py-3 text-sm font-semibold ring-1 ring-white/10"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9aabce]">Leave type</label>
              <select className={field} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                {TYPES.map(([v, l]) => (
                  <option key={v} value={v} className="bg-card">
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9aabce]">From</label>
                <input type="date" className={field} value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9aabce]">To</label>
                <input type="date" className={field} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9aabce]">Reason</label>
              <textarea
                className={`${field} resize-none`}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain your request"
              />
            </div>
            {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={phase === "saving"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:scale-[0.99] disabled:opacity-70"
            >
              {phase === "saving" ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              {phase === "saving" ? "Submitting…" : "Submit request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
