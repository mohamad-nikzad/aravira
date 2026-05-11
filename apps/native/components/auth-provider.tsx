import * as React from 'react';
import { ApiError } from '@repo/api-client';
import type { User, UserRole } from '@repo/salon-core/types';
import { authApi } from '../lib/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/secure-storage';

export type AuthUser = User;
export type { UserRole };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { phone: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    async function bootstrap() {
      const token = await getStoredToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        timeout = setTimeout(() => ac.abort(), 5000);
        const { user: me } = await authApi.me({ signal: ac.signal });
        if (!cancelled) setUser(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await clearStoredToken();
        }
        // Network error → keep token, allow retry on next launch.
      } finally {
        if (timeout) clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const login = React.useCallback(async (input: { phone: string; password: string }) => {
    const result = await authApi.login(input);
    if (!result.token) {
      throw new Error('Login succeeded, but the API did not return a session token.');
    }
    await setStoredToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort; server-side cookie irrelevant for native
    }
    await clearStoredToken();
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
