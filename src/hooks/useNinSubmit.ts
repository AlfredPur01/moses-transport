import { router } from 'expo-router';
import { useState } from 'react';

import { kycApi } from '@/api/kyc';
import { getApiErrorMessage } from '@/utils/error';

export function useNinSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (nin: string, ninDocUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.submitNin({ nin, ninDocUrl });
      router.push('/(main)/(profile)/kyc/photo');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'NIN submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
}
