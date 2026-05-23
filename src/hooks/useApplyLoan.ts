import { useState } from 'react';

import { assetApi } from '@/api/asset';

export function useApplyLoan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const apply = async (assetId: string, paymentFrequency: 'daily' | 'weekly') => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await assetApi.applyForLoan(assetId, paymentFrequency);
      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to submit application');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { apply, loading, error, success };
}
