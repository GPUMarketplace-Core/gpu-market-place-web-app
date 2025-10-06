'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ProviderName = 'google';

export interface AuthUser {
  id: string;
  email: string;
  role: 'consumer' | 'provider' | 'admin';
  display_name?: string;
  created_at: string;
}

interface AuthState {
  provider: ProviderName | null;
  accessToken: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  setAuthState: (state: AuthState) => void;
  clear: () => void;
  refreshUser: (token?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ provider: null, accessToken: null, user: null });

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        setState(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authState', JSON.stringify(state));
    }
  }, [state]);

  const setAuthState = useCallback((next: AuthState) => setState(next), []);
  const clear = useCallback(() => setState({ provider: null, accessToken: null, user: null }), []);

  const refreshUser = useCallback(async (token?: string) => {
    const accessToken = token ?? state.accessToken;
    if (!accessToken) return;
    const res = await fetch('/api/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setState((prev: AuthState) => ({ ...prev, provider: 'google', accessToken, user: data.user }));
    }
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(() => ({
    provider: state.provider,
    accessToken: state.accessToken,
    user: state.user,
    setAuthState,
    clear,
    refreshUser,
  }), [state, setAuthState, clear, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


