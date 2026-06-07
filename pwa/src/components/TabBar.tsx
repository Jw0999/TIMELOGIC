import { Home, Clock, CircleUserRound, type LucideIcon } from "lucide-react";

export type TabKey = "home" | "history" | "profile";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "history", label: "History", icon: Clock },
  { key: "profile", label: "Profile", icon: CircleUserRound },
];

export default function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-stretch border-t border-gray200 bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const on = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <Icon size={24} strokeWidth={on ? 2.4 : 1.8} className={on ? "text-primary" : "text-gray400"} />
            <span className={`text-[11px] font-semibold ${on ? "text-primary" : "text-gray400"}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
