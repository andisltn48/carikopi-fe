'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: number | null;
  shopId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string, role: number) => void;
  logout: () => void;
  refreshPrivileges: (authToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshPrivileges = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    const result = await authApi.getPrivilege(activeToken);
    if (result.success && result.data) {
      setRole(result.data.role);
      setUsername(result.data.username);
      setShopId(result.data.shop_id);
      localStorage.setItem('carikopi_role', String(result.data.role));
      localStorage.setItem('carikopi_username', result.data.username);
      localStorage.setItem('carikopi_shop_id', result.data.shop_id);
    }
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem('carikopi_token');
    if (savedToken) {
      setToken(savedToken);
      const savedUsername = localStorage.getItem('carikopi_username');
      const savedRole = localStorage.getItem('carikopi_role');
      const savedShopId = localStorage.getItem('carikopi_shop_id');
      
      if (savedUsername) setUsername(savedUsername);
      if (savedRole) setRole(Number(savedRole));
      if (savedShopId) setShopId(savedShopId);
    }
    setIsLoading(false);
  }, [refreshPrivileges]);

  const login = useCallback((newToken: string, newUsername: string, newRole: number) => {
    setToken(newToken);
    localStorage.setItem('carikopi_token', newToken);
    refreshPrivileges(newToken);
  }, [refreshPrivileges]);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setRole(null);
    setShopId(null);
    localStorage.removeItem('carikopi_token');
    localStorage.removeItem('carikopi_username');
    localStorage.removeItem('carikopi_role');
    localStorage.removeItem('carikopi_shop_id');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        shopId,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshPrivileges,
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
