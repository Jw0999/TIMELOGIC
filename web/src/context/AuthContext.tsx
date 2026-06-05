import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, getToken } from '../services/api';

interface SuperAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  orgId: string;
}

interface AuthCtx {
  user: SuperAdmin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SuperAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.get<{ success: boolean; data: SuperAdmin }>('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ success: boolean; data: { accessToken: string; refreshToken: string; user: SuperAdmin } }>('/auth/login', { email, password });
      setToken(res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    setToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
