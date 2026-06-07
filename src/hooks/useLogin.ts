import { useState } from 'react';

import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/error';

export function useLogin() {
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login({ phone: `+234${phone}`, password });
      await setToken(data.token, data.user.phone_verified ?? false);
      // AuthNavigator in _layout.tsx handles the redirect automatically
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
}
