import { useCallback, useEffect, useState } from 'react';

import { Payment, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function usePaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchPayments = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const { data } = await userApi.getPayments(pageNum, LIMIT);
      if (pageNum === 1) {
        setPayments(data.payments || []);
      } else {
        setPayments((prev) => [...prev, ...(data.payments || [])]);
      }
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load payments.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const loadMore = () => {
    if (!loadingMore && payments.length < total) {
      fetchPayments(page + 1);
    }
  };

  const onRefresh = () => fetchPayments(1, true);

  return { payments, total, loading, loadingMore, refreshing, error, loadMore, onRefresh };
}
