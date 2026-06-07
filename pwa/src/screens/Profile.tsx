import { useEffect, useState } from "react";
import { Mail, IdCard, Users, Clock, Lock, LogOut, Loader2, Sun, Moon, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme, type ThemeMode } from "../context/ThemeContext";
import { FILE_BASE } from "../config";
import { getLeaveBalances, type LeaveBalance } from "../services/data";
import StatusBadge from "../components/StatusBadge";

const THEME_OPTS: [ThemeMode, typeof Sun, string][] = [
  ["light", Sun, "Light"],
  ["dark", Moon, "Dark"],
  ["system", Smartphone, "System"],
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaveBalances().then(setBalances).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!user) return null;
  const faceUrl = user.profileImageUrl ? `${FILE_BASE}${user.profileImageUrl}` : null;

  const info = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: IdCard, label: "Employee Code", value: user.employeeCode ?? "—" },
    { icon: Users, label: "Role", value: user.role },
    { icon: Clock, label: "Shift Type", value: user.shiftType ?? "—" },
  ];

  return (
    <div className="mx-auto min-h-full w-full max-w-md px-5 pb-28 pt-6">
      {/* Avatar */}
      <div className="mb-6 flex flex-col items-center">
        {faceUrl ? (
          <img src={faceUrl} alt="" className="mb-3 h-[88px] w-[88px] rounded-full border-[3px] border-success object-cover" />
        ) : (
          <div className="mb-3 grid h-[88px] w-[88px] place-items-center rounded-full bg-primary shadow-lg">
            <span className="text-[34px] font-extrabold text-white">{user.firstName[0]}{user.lastName[0]}</span>
          </div>
        )}
        <p className="text-[22px] font-extrabold text-ink">{user.firstName} {user.lastName}</p>
        <p className="mb-2.5 mt-1 text-[13px] text-muted">{user.employeeCode ?? user.email}</p>
        <div className="flex gap-2">
          <StatusBadge status={user.status} />
          <span className="rounded-full bg-primary-bg px-2.5 py-1 text-[11px] font-bold text-primary">{user.role}</span>
        </div>
      </div>

      {/* Personal info */}
      <div className="mb-3.5 rounded-[18px] bg-card p-[18px] shadow-sm">
        <p className="text-sm font-bold text-gray700">Personal Information</p>
        <div className="mb-3.5 mt-1 flex items-center gap-1">
          <Lock size={11} className="text-gray400" />
          <span className="text-[11px] text-muted">Profile is managed by your administrator</span>
        </div>
        {info.map((row) => (
          <div key={row.label} className="flex items-center border-b border-line py-2.5 last:border-0">
            <span className="mr-3 grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-primary-bg">
              <row.icon size={18} className="text-primary" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{row.label}</p>
              <p className="mt-px text-sm font-semibold text-ink">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leave balances */}
      <div className="mb-3.5 rounded-[18px] bg-card p-[18px] shadow-sm">
        <p className="mb-2 text-sm font-bold text-gray700">Leave Balances — {new Date().getFullYear()}</p>
        {loading ? (
          <Loader2 size={20} className="spin my-3 text-primary" />
        ) : balances.length === 0 ? (
          <p className="mt-2 text-[13px] italic text-muted">No leave balance data</p>
        ) : (
          balances.map((lb) => (
            <div key={lb.type} className="flex items-center gap-2 border-b border-line py-2 last:border-0">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: lb.color }} />
              <span className="w-[100px] text-xs text-gray600">{lb.label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray100">
                <span className="block h-full rounded-full" style={{ width: `${lb.entitled > 0 ? (lb.remaining / lb.entitled) * 100 : 0}%`, backgroundColor: lb.color }} />
              </span>
              <span className="w-9 text-right text-[11px] text-muted">{lb.remaining}/{lb.entitled}</span>
            </div>
          ))
        )}
      </div>

      {/* Appearance — light / dark / system (matches Android) */}
      <div className="mb-3.5 rounded-[18px] bg-card p-[18px] shadow-sm">
        <p className="mb-3 text-sm font-bold text-gray700">Appearance</p>
        <div className="flex gap-2.5">
          {THEME_OPTS.map(([m, Icon, label]) => {
            const on = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-[1.5px] py-2.5 ${
                  on ? "border-primary bg-primary-bg" : "border-gray200 bg-gray50"
                }`}
              >
                <Icon size={20} className={on ? "text-primary" : "text-gray500"} />
                <span className={`text-[11px] ${on ? "font-bold text-primary" : "font-semibold text-gray600"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => { if (window.confirm("Sign out?")) logout(); }}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-danger-bg p-4 font-bold text-danger"
      >
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  );
}
