import { Wifi, Smartphone, Clock, Check, BatteryFull, SignalHigh } from "lucide-react";
import { Logo } from "./Logo";

function VerifyRow({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-line">
      <span className="flex items-center gap-2.5">
        <Icon size={16} className="text-sky" />
        <span className="text-[12.5px] font-medium text-fg">{label}</span>
      </span>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-400/15">
          <Check size={11} />
        </span>
        Verified
      </span>
    </div>
  );
}

/**
 * Premium phone mockup containing a real, miniature TimeLogic check-in screen.
 * Purely presentational; the Hero wraps it with float + parallax motion.
 */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="relative w-[min(290px,82vw)] rounded-[2.6rem] border border-white/10 bg-gradient-to-b from-[#0c1730] to-[#070d1c] p-2.5 shadow-[0_40px_120px_-30px_rgba(2,8,23,0.95),0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* notch */}
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="overflow-hidden rounded-[2.1rem] bg-[#070d1c] ring-1 ring-white/5">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pb-2 pt-3.5 text-[10.5px] font-semibold text-muted">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <SignalHigh size={12} />
              <Wifi size={12} />
              <BatteryFull size={13} />
            </span>
          </div>

          {/* app body */}
          <div className="px-4 pb-6">
            <div className="mb-4 mt-1 flex items-center gap-2">
              <Logo size={22} />
              <div className="leading-tight">
                <p className="text-[12px] font-bold text-fg">Good morning, Amara</p>
                <p className="text-[10px] text-faint">Monday, 09 June</p>
              </div>
            </div>

            {/* present card */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
                  <Check size={22} className="text-emerald-400" />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-emerald-300/80">Checked in</p>
                  <p className="text-lg font-extrabold tracking-tight text-fg">Present</p>
                </div>
                <span className="ml-auto text-right">
                  <p className="text-[10px] text-faint">Time</p>
                  <p className="text-[13px] font-bold text-fg">08:02</p>
                </span>
              </div>
            </div>

            {/* verification stack */}
            <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Verification
            </p>
            <div className="space-y-2">
              <VerifyRow icon={Wifi} label="Company Wi-Fi" />
              <VerifyRow icon={Smartphone} label="Registered device" />
              <VerifyRow icon={Clock} label="On-time window" />
            </div>

            {/* action */}
            <button className="mt-4 w-full rounded-xl bg-white/[0.04] py-2.5 text-[12.5px] font-semibold text-muted ring-1 ring-line">
              Check out at 17:00
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
