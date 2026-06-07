import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { checkIn, type StatusRec } from "../services/data";
import type { ApiError } from "../services/api";

// Mirrors the Android check-in challenge modal: shows the issued code, the user
// retypes it to confirm a human is present, then submits the check-in.
export default function ChallengeModal({
  sessionId,
  code,
  onClose,
  onDone,
}: {
  sessionId: string;
  code: string;
  onClose: () => void;
  onDone: (rec: any) => void;
}) {
  const [entered, setEntered] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (entered.trim().length !== 6) {
      setError("Type the 6-digit code shown above to confirm it is really you.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await checkIn(sessionId, entered.trim());
      onDone(res as StatusRec & { penalty?: number; status?: string });
    } catch (e) {
      setError((e as ApiError).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 fade-in">
      <div className="w-full max-w-[360px] rounded-[22px] bg-card p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 grid h-[52px] w-[52px] place-items-center rounded-full bg-primary-bg">
          <ShieldCheck size={26} className="text-primary" />
        </div>
        <h2 className="text-lg font-extrabold text-ink">Confirm It's You</h2>
        <p className="mb-4 mt-1 text-[13px] leading-tight text-muted">
          Enter the verification code below to complete check-in.
        </p>

        <div className="mb-3.5 rounded-xl border border-primary-border bg-primary-bg px-6 py-3">
          <span className="text-[30px] font-extrabold tracking-[8px] text-primary">{code}</span>
        </div>

        <input
          value={entered}
          onChange={(e) => setEntered(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoFocus
          placeholder="Enter the 6-digit code"
          className="mb-4 h-[52px] w-full rounded-xl border-[1.5px] border-gray200 bg-gray50 text-center text-lg font-bold tracking-[4px] text-ink outline-none focus:border-primary"
        />

        {error && <p className="mb-3 text-[13px] font-medium text-danger">{error}</p>}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-12 flex-1 rounded-xl border-[1.5px] border-line font-bold text-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex h-12 flex-[2] items-center justify-center rounded-xl bg-primary font-bold text-white disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="spin" /> : "Confirm Check-In"}
          </button>
        </div>
      </div>
    </div>
  );
}
