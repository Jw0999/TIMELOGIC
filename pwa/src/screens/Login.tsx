import { useState } from "react";
import { LogIn, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Enter your email or employee code and password.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await login(identifier.trim(), password);
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Login failed.");
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-[#e9eefb] placeholder-[#6b7ca3] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/30";

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-3xl bg-white shadow-lg">
            <img src="/icon-192.png" alt="TimeLogic" className="h-16 w-16 object-contain" />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[#9aabce]">Sign in to mark your attendance</p>
        </div>

        <form onSubmit={submit} className="card p-5">
          <label className="mb-1.5 block text-xs font-semibold text-[#9aabce]">
            Email or Employee Code
          </label>
          <input
            className={input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@company.com"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
          />

          <label className="mb-1.5 mt-4 block text-xs font-semibold text-[#9aabce]">Password</label>
          <div className="relative">
            <input
              className={input}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7ca3]"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="mt-3 text-[13px] font-medium text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_36px_-12px_rgba(37,99,235,0.8)] active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[#6b7ca3]">
          <ShieldCheck size={13} className="text-sky" />
          This phone becomes your registered device.
        </p>
      </div>
    </div>
  );
}
