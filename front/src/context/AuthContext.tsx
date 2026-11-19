import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, setSessionLostHandler } from '../api/client';
import type { User } from '../types';
import type { RegisterFormValues } from '../utils/validation';

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'ready';
  login: (login: string, password: string) => Promise<User>;
  register: (values: RegisterFormValues) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let active = true;

    setSessionLostHandler(() => {
      if (active) setUser(null);
    });

    authApi
      .restore()
      .then((restoredUser) => {
        if (!active) return;
        setUser(restoredUser);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('ready');
      });

    return () => {
      active = false;
      setSessionLostHandler(null);
    };
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const loggedIn = await authApi.login(loginValue, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (values: RegisterFormValues) => {
    const registered = await authApi.register(values);
    setUser(registered);
    return registered;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return context;
}
