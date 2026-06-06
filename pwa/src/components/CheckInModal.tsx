import { useEffect, useState } from "react";
import { X, Loader2, Wifi, Check, ShieldAlert } from "lucide-react";
import { api, type ApiError } from "../services/api";
import { getDeviceId } from "../services/device";
import { PLATFORM } from "../config";

type Phase = "checking" | "code" | "submitting" | "blocked";

export default function CheckInModal({
  sessionId,
  onClose,
  onDone,
}: {
  sessionId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [code, setCode] = useState(""); // the code the backend issued
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  // Step 1: verify network (office IP) + get a one-time code
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.post<{ code: string }>("/attendance/check-in/challenge", {
          sessionId,
          platform: PLATFORM,
          deviceId: getDeviceId(),
        });
        if (!alive) return;
        setCode(res.code);
        setPhase("code");
      } catch (e) {
        if (!alive) return;
        setError((e as ApiError).message);
        setPhase("blocked");
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  // Step 2: submit the code to complete check-in
  async function submit() {
    if (entered.trim() !== code) {
      setError("That code does not match. Type the code shown above.");
      return;
    }
    setError("");
    setPhase("submitting");
    try {
      await api.post("/attendance/check-in", {
        sessionId,
        challengeCode: entered.trim(),
        platform: PLATFORM,
        deviceId: getDeviceId(),
      });
      onDone();
    } catch (e) {
      setError((e as ApiError).message);
      setPhase("code");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:items-center">
      <div className="card w-full max-w-sm p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Check in</h2>
          <button onClick={onClose} aria-label="Close" className="text-[#6b7ca3]">
            <X size={20} />
          </button>
        </div>

        {phase === "checking" && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 size={28} className="spin text-sky" />
            <p className="mt-3 text-sm text-[#9aabce]">Verifying you are on the office network…</p>
          </div>
        )}

        {phase === "blocked" && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-red-500/15">
              <ShieldAlert size={26} className="text-red-400" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">Can’t check in</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#9aabce]">{error}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-white/[0.05] py-3 text-sm font-semibold text-[#e9eefb] ring-1 ring-white/10"
            >
              Close
            </button>
          </div>
        )}

        {(phase === "code" || phase === "submitting") && (
          <>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-[12.5px] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
              <Wifi size={14} /> Office network verified
            </div>
            <p className="mt-4 text-[13px] text-[#9aabce]">Your one-time code</p>
            <div className="mt-1 rounded-xl bg-white/[0.04] py-3 text-center text-3xl font-extrabold tracking-[0.3em] text-sky ring-1 ring-white/10">
              {code}
            </div>
            <p className="mt-3 mb-1.5 text-[12.5px] text-[#9aabce]">Type the code to confirm it is you</p>
            <input
              value={entered}
              onChange={(e) => setEntered(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/30"
            />
            {error && <p className="mt-2 text-[13px] font-medium text-red-400">{error}</p>}
            <button
              onClick={submit}
              disabled={phase === "submitting" || entered.length < 6}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:scale-[0.99] disabled:opacity-60"
            >
              {phase === "submitting" ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              {phase === "submitting" ? "Checking in…" : "Confirm check-in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
