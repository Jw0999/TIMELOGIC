import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokens } from "../services/api";
import { getDeviceId } from "../services/device";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string | null;
  role: string;
  status: string;
  shiftType?: string;
  profileImageUrl?: string | null;
  organization?: { id: string; name: string };
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on launch
  useEffect(() => {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch(() => tokens.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const isEmail = identifier.includes("@");
    const deviceFingerprint = getDeviceId();
    const body = isEmail
      ? { email: identifier, password, deviceFingerprint }
      : { employeeCode: identifier, password, deviceFingerprint };
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
        "/auth/login",
        body
      );
      tokens.set(data.accessToken, data.refreshToken);
      setUser(data.user);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Login failed" };
    }
  }

  function logout() {
    tokens.clear();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
