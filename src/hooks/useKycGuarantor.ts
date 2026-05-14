import { router } from 'expo-router';
import { useState } from 'react';

import { KycGuarantorPayload, kycApi } from '@/api/kyc';
import { getApiErrorMessage } from '@/utils/error';

export function useKycGuarantor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: KycGuarantorPayload) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.submitGuarantor(data);
      router.replace('/(main)/(profile)/kyc/pending');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to submit guarantor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
}
