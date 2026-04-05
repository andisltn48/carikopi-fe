'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string, role: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('carikopi_token');
    const savedUsername = localStorage.getItem('carikopi_username');
    const savedRole = localStorage.getItem('carikopi_role');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setRole(savedRole ? Number(savedRole) : null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUsername: string, newRole: number) => {
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
    localStorage.setItem('carikopi_token', newToken);
    localStorage.setItem('carikopi_username', newUsername);
    localStorage.setItem('carikopi_role', String(newRole));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setRole(null);
    localStorage.removeItem('carikopi_token');
    localStorage.removeItem('carikopi_username');
    localStorage.removeItem('carikopi_role');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
