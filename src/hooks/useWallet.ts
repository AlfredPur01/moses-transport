import { useCallback, useEffect, useState } from 'react';

import { Payment, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function useWallet() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getPayments(1, 50);
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    payments,
    total,
    loading,
    refreshing,
    error,
    refetch:   () => fetch(),
    onRefresh: () => fetch(true),
  };
}
