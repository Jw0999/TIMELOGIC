import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, getToken } from '../services/api';

interface AdminUser {
  id: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  orgId: string;
  status: string;
}

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get<{ success: boolean; data: AdminUser }>('/auth/me')
        .then((res) => {
          if (res.data) setUser(res.data);
          else setToken(null);
        })
        .catch(() => {
          // Token invalid or server down — clear it
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for 401 events emitted by the api client
  useEffect(() => {
    const handler = () => { setUser(null); setLoading(false); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const isEmail = identifier.includes('@');
      const body = isEmail
        ? { email: identifier, password }
        : { employeeCode: identifier, password };

      const res = await api.post<{
        success: boolean;
        data: { accessToken: string; refreshToken: string; user: AdminUser };
      }>('/auth/login', body);

      // Save both tokens
      setToken(res.data.accessToken);                            // persists to localStorage
      localStorage.setItem('refreshToken', res.data.refreshToken);

      setUser(res.data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    }
    setToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
