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
  const [dataSource, setDataSourceState] = useState<'demo' | 'api'>(getDataSourceMode());

  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const mode = getDataSourceMode();
      const token = getAuthToken();

      // Si estamos en modo API real pero el token no existe o es de demo, invalidamos sesión previa
      if (mode === 'api' && (!token || token.startsWith('demo-') || token.includes('demo'))) {
        clearAuthTokens();
        return null;
      }

      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const setDataSource = (mode: 'demo' | 'api') => {
    saveDataSourceMode(mode);
    setDataSourceState(mode);
  };

  useEffect(() => {
    const token = getAuthToken();

    // Si pasamos a modo API y había un token mock de demo, limpiarlo de inmediato
    if (dataSource === 'api' && token && (token.startsWith('demo-') || token.includes('demo'))) {
      clearAuthTokens();
      setUser(null);
      return;
    }

    // Si estamos en modo API con token válido y sin usuario en memoria, sincronizar perfil con /auth/me
    if (dataSource === 'api' && token && !user) {
      apiRequest<any>('/auth/me')
        .then((profile) => {
          const sessionUser: SessionUser = {
            userId: profile.userId || profile.id,
            email: profile.email,
            displayName: profile.displayName || profile.email,
            profile: (profile.role || profile.profile) as AppProfile,
            commerceId: profile.commerceId || null,
          };
          setUser(sessionUser);
          localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(sessionUser));
        })
        .catch(() => {
          // Token expirado o revocado
          clearAuthTokens();
          setUser(null);
        });
    }
  }, [dataSource]);

  const login = async (email: string, password = '') => {
    // Si estamos en modo demostración, usamos el fixture local
    if (dataSource === 'demo') {
      const adminSession: SessionUser = {
        ...demoAdminUser,
        email: email || demoAdminUser.email,
      };
      setUser(adminSession);
      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(adminSession));
      setAuthTokens('demo-access-token', 'demo-refresh-token');
      return;
    }

    // En modo API Real: siempre autenticamos contra distri-api real
    // El backend distri-api responde: { tokens: { accessToken, refreshToken, ... }, user: { ... } }
    const res = await apiRequest<{
      tokens?: {
        accessToken: string;
        refreshToken: string;
      };
      accessToken?: string;
      refreshToken?: string;
      user?: any;
    }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });

    const accessToken = res.tokens?.accessToken || res.accessToken;
    const refreshToken = res.tokens?.refreshToken || res.refreshToken;

    if (!accessToken) {
      throw new Error('El servidor no devolvió un token de acceso válido.');
    }

    setAuthTokens(accessToken, refreshToken);

    // Obtener información del usuario autenticado
    let sessionUser: SessionUser;
    const rawUser = res.user;
    if (rawUser) {
      sessionUser = {
        userId: rawUser.userId || rawUser.id,
        email: rawUser.email,
        displayName: rawUser.displayName || rawUser.email,
        profile: (rawUser.role || rawUser.profile) as AppProfile,
        commerceId: rawUser.commerceId || null,
      };
    } else {
      const me = await apiRequest<any>('/auth/me');
      sessionUser = {
        userId: me.userId || me.id,
        email: me.email,
        displayName: me.displayName || me.email,
        profile: (me.role || me.profile) as AppProfile,
        commerceId: me.commerceId || null,
      };
    }

    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(sessionUser));
  };

  const loginDemoAdmin = () => {
    setDataSource('demo');
    setUser(demoAdminUser);
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(demoAdminUser));
    setAuthTokens('demo-access-token', 'demo-refresh-token');
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

  // Solo consideramos autenticado si hay usuario Y (en modo API) existe token real
  const currentToken = getAuthToken();
  const hasValidToken =
    dataSource === 'demo' ||
    (Boolean(currentToken) && !currentToken?.startsWith('demo-') && !currentToken?.includes('demo'));
  const isAuthenticated = Boolean(user) && hasValidToken;
  const isAdmin = user?.profile === 'ADMIN' && hasValidToken;

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
