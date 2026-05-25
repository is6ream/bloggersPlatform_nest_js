import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import {
  getAccessToken,
  setAccessToken,
  setOnUnauthorized,
} from '../../api/client';
import type { Me } from '../../types/api';

type AuthContextValue = {
  user: Me | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (loginOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_INTERVAL_MS = 8 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMe = useCallback(async (accessToken: string) => {
    const me = await authApi.me(accessToken);
    setUser(me);
    return me;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      setToken(accessToken);
      await loadMe(accessToken);
      return accessToken;
    } catch {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      return null;
    }
  }, [loadMe]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const login = useCallback(
    async (loginOrEmail: string, password: string) => {
      const { accessToken } = await authApi.login(loginOrEmail, password);
      setAccessToken(accessToken);
      setToken(accessToken);
      await loadMe(accessToken);
    },
    [loadMe],
  );

  useEffect(() => {
    setOnUnauthorized(() => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      navigate('/login');
    });
    return () => setOnUnauthorized(null);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const existing = getAccessToken();
        if (existing) {
          await loadMe(existing);
          if (!cancelled) {
            setToken(existing);
          }
        } else {
          const refreshed = await refreshSession();
          if (!refreshed && !cancelled) {
            setUser(null);
          }
        }
      } catch {
        const refreshed = await refreshSession();
        if (!refreshed && !cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [loadMe, refreshSession]);

  useEffect(() => {
    if (!token) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [token, refreshSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user && !!token,
      isLoading,
      accessToken: token,
      login,
      logout,
      refreshSession,
    }),
    [user, token, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
