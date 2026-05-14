import { useCallback, useEffect, useState } from 'react';

import { DashboardData, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      if (isRefresh) {
        // Silently sync Paystack transactions so new bank transfers show up
        await userApi.syncPayments().catch(() => {});
      }
      const { data: res } = await userApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => fetchDashboard(),
    onRefresh: () => fetchDashboard(true),
  };
}
