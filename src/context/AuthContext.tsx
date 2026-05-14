import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Config } from '@/constants/config';
import { authRef } from './authRef';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUserId(token: string): string | null {
  try {
    const [, payloadB64] = token.split('.');
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const json = atob(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/') + padding,
    );
    return (JSON.parse(json).id as string) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(Config.tokenKey).then((stored) => {
      if (stored) {
        setTokenState(stored);
        setUserId(decodeUserId(stored));
      }
      setIsLoading(false);
    });
  }, []);

  const setToken = useCallback(async (newToken: string) => {
    await AsyncStorage.setItem(Config.tokenKey, newToken);
    setTokenState(newToken);
    setUserId(decodeUserId(newToken));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(Config.tokenKey);
    setTokenState(null);
    setUserId(null);
  }, []);

  useEffect(() => {
    authRef.logout = logout;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, userId, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
