import { useCallback, useEffect, useState } from 'react';

import { Autopay, loanApi } from '@/api/loan';
import { getApiErrorMessage } from '@/utils/error';

export function useLoanDetails() {
  const [loan, setLoan] = useState<Autopay | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await loanApi.getMyLoan();
      setLoan(data);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load autopay details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { loan, loading, refreshing, error, refetch: () => fetch(), onRefresh: () => fetch(true) };
}
