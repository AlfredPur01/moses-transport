import { useState } from 'react';

import { InitiatePaymentPayload, InitiatePaymentResult, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export type PaymentMethod = 'virtual_account' | 'transfer' | 'cash' | 'pos';

export function useMakePayment() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<InitiatePaymentResult | null>(null);

  const initiatePayment = async (payload: InitiatePaymentPayload) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await userApi.initiatePayment(payload);
      setResult(data);
      return data;
    } catch (err) {
      const msg = getApiErrorMessage(err) ?? 'Payment initiation failed. Please try again.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading, error, result, clearError: () => setError(null) };
}
