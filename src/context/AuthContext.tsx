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

const PHONE_VERIFIED_KEY = '@moses_phone_verified';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  phoneVerified: boolean;
  isLoading: boolean;
  setToken: (token: string, phoneVerified?: boolean) => Promise<void>;
  setPhoneVerified: (v: boolean) => Promise<void>;
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
  const [phoneVerified, setPhoneVerifiedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(Config.tokenKey),
      AsyncStorage.getItem(PHONE_VERIFIED_KEY),
    ]).then(([stored, verifiedStr]) => {
      if (stored) {
        setTokenState(stored);
        setUserId(decodeUserId(stored));
        setPhoneVerifiedState(verifiedStr === 'true');
      }
      setIsLoading(false);
    });
  }, []);

  const setToken = useCallback(async (newToken: string, verified = false) => {
    await Promise.all([
      AsyncStorage.setItem(Config.tokenKey, newToken),
      AsyncStorage.setItem(PHONE_VERIFIED_KEY, String(verified)),
    ]);
    setTokenState(newToken);
    setUserId(decodeUserId(newToken));
    setPhoneVerifiedState(verified);
  }, []);

  const setPhoneVerified = useCallback(async (v: boolean) => {
    await AsyncStorage.setItem(PHONE_VERIFIED_KEY, String(v));
    setPhoneVerifiedState(v);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(Config.tokenKey),
      AsyncStorage.removeItem(PHONE_VERIFIED_KEY),
    ]);
    setTokenState(null);
    setUserId(null);
    setPhoneVerifiedState(false);
  }, []);

  useEffect(() => {
    authRef.logout = logout;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, userId, phoneVerified, isLoading, setToken, setPhoneVerified, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
