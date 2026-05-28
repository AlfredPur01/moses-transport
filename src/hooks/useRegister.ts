import { useState } from 'react';

import { authApi, RegisterPayload } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/error';

export function useRegister() {
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.register(payload);
      await setToken(data.token);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleRegister, loading, error };
}
