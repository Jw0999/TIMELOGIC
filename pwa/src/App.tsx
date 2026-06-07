import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import TabBar, { type TabKey } from "./components/TabBar";
import Login from "./screens/Login";
import Home from "./screens/Home";
import History from "./screens/History";
import Profile from "./screens/Profile";
import Break from "./screens/Break";
import Leave from "./screens/Leave";
import type { BreakType } from "./lib/constants";

type Sub = { kind: "break"; bt: BreakType } | { kind: "leave" } | null;

export default function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>("home");
  const [sub, setSub] = useState<Sub>(null);

  if (loading) {
    return <div className="flex min-h-full items-center justify-center"><Loader2 size={26} className="spin text-primary" /></div>;
  }
  if (!user) return <Login />;

  // Full-screen sub-views (own back button, no tab bar) — like the Android Home stack
  if (sub?.kind === "break") return <Break initial={sub.bt} onBack={() => setSub(null)} />;
  if (sub?.kind === "leave") return <Leave onBack={() => setSub(null)} />;

  return (
    <>
      {tab === "home" && (
        <Home onOpenBreak={(bt) => setSub({ kind: "break", bt })} onOpenLeave={() => setSub({ kind: "leave" })} />
      )}
      {tab === "history" && <History />}
      {tab === "profile" && <Profile />}
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
