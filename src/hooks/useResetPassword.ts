import { router } from 'expo-router';
import { useState } from 'react';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/utils/error';

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (email: string, otp: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      router.replace('/(auth)/login');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleResetPassword, loading, error };
}
