import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearAuthTokens, getAuthToken, setAuthTokens } from '@/api/http';
import {
  getDataSourceMode,
  setDataSourceMode as saveDataSourceMode,
  STORAGE_KEYS,
} from '@/config';
import { demoAdminUser } from '@/mocks/fixtures';
import type { AppProfile, SessionUser } from '@/types';

type AuthContextType = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  dataSource: 'demo' | 'api';
  setDataSource: (mode: 'demo' | 'api') => void;
  login: (email: string, password?: string) => Promise<void>;
  loginDemoAdmin: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (stored) return JSON.parse(stored);
    } catch {}
    // If initially in demo mode and no user stored, default to demoAdminUser or null
    return null;
  });

  const [dataSource, setDataSourceState] = useState<'demo' | 'api'>(getDataSourceMode());

  const setDataSource = (mode: 'demo' | 'api') => {
    saveDataSourceMode(mode);
    setDataSourceState(mode);
  };

  useEffect(() => {
    // If in API mode and token exists, fetch profile from /auth/me
    const token = getAuthToken();
    if (dataSource === 'api' && token && !user) {
      apiRequest<any>('/auth/me')
        .then((profile) => {
          const sessionUser: SessionUser = {
            userId: profile.id || profile.userId,
            email: profile.email,
            displayName: profile.displayName || profile.email,
            profile: (profile.role || profile.profile) as AppProfile,
            commerceId: profile.commerceId || null,
          };
          setUser(sessionUser);
          localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(sessionUser));
        })
        .catch(() => {
          // Token expired or invalid
          clearAuthTokens();
          setUser(null);
        });
    }
  }, [dataSource]);

  const login = async (email: string, password = '') => {
    if (dataSource === 'demo' || email.includes('admin@pruebas') || email.includes('demo')) {
      const adminSession: SessionUser = {
        ...demoAdminUser,
        email: email || demoAdminUser.email,
      };
      setUser(adminSession);
      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(adminSession));
      setAuthTokens('demo-access-token', 'demo-refresh-token');
      return;
    }

    // Real API Login
    const res = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user?: any;
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    setAuthTokens(res.accessToken, res.refreshToken);

    // Fetch user info
    let sessionUser: SessionUser;
    if (res.user) {
      sessionUser = {
        userId: res.user.id,
        email: res.user.email,
        displayName: res.user.displayName || res.user.email,
        profile: res.user.role as AppProfile,
        commerceId: res.user.commerceId || null,
      };
    } else {
      const me = await apiRequest<any>('/auth/me');
      sessionUser = {
        userId: me.id,
        email: me.email,
        displayName: me.displayName || me.email,
        profile: me.role as AppProfile,
        commerceId: me.commerceId || null,
      };
    }

    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(sessionUser));
  };

  const loginDemoAdmin = () => {
    setUser(demoAdminUser);
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(demoAdminUser));
    setAuthTokens('demo-admin-token', 'demo-refresh-token');
  };

  const logout = async () => {
    if (dataSource === 'api') {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch {}
    }
    clearAuthTokens();
    setUser(null);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.profile === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        dataSource,
        setDataSource,
        login,
        loginDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
