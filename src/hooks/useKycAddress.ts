import { router } from 'expo-router';
import { useState } from 'react';

import { KycAddressPayload, kycApi } from '@/api/kyc';
import { getApiErrorMessage } from '@/utils/error';

export function useKycAddress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: KycAddressPayload) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.submitAddress(data);
      router.push('/(main)/(profile)/kyc/guarantor');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
}
