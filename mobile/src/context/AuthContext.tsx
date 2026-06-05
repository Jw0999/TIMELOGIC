import React, { createContext, useContext, useState, ReactNode } from 'react';
import { loginApi, logoutApi, AuthUser } from '../services/authService';
import { tokenStore } from '../services/tokenStore';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (identifier: string, password: string) => {
    try {
      const u = await loginApi(identifier.trim(), password);
      setUser(u);
      return { success: true };
    } catch (err: any) {
      tokenStore.clear();
      return { success: false, error: err?.message ?? 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
