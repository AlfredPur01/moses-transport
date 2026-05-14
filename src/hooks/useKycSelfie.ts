import { router } from 'expo-router';
import { useState } from 'react';

import { kycApi } from '@/api/kyc';
import { getApiErrorMessage } from '@/utils/error';

export function useKycSelfie() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (selfieUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.submitSelfie({ selfieUrl });
      router.push('/(main)/(profile)/kyc/address');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to save selfie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
}
