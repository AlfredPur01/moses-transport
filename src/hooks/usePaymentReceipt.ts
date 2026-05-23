import { useCallback, useEffect, useState } from 'react';

import { Payment, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function usePaymentReceipt(paymentCode: string) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!paymentCode) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getPaymentReceipt(paymentCode);
      setPayment(data);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Could not load receipt.');
    } finally {
      setLoading(false);
    }
  }, [paymentCode]);

  useEffect(() => { fetch(); }, [fetch]);

  return { payment, loading, error, refetch: fetch };
}
