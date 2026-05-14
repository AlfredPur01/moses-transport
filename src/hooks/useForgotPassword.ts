import { useState } from 'react';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/utils/error';

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword({ phone: `+234${phone}` });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setError(null);
  };

  return { handleForgotPassword, loading, error, success, reset };
}
