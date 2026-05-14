import { router } from 'expo-router';
import { useState } from 'react';

import { kycApi } from '@/api/kyc';
import { getApiErrorMessage } from '@/utils/error';

export function useKycPhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (base64Photo: string) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.uploadPhoto({ photo: base64Photo });
      router.push('/(main)/(profile)/kyc/address');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Photo upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
}
