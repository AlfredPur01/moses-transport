import { useCallback, useEffect, useState } from 'react';

import { MyAsset, assetApi } from '@/api/asset';
import { loanApi } from '@/api/loan';
import { getApiErrorMessage } from '@/utils/error';

export function useMyAsset() {
  const [asset, setAsset]       = useState<MyAsset | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data: loan } = await loanApi.getMyLoan();
      if (!loan?.asset_id) {
        setAsset(null);
        return;
      }
      const { data: fullAsset } = await assetApi.getAssetById(loan.asset_id);
      setAsset(fullAsset ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load asset details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    asset,
    loading,
    refreshing,
    error,
    refetch:   () => fetch(),
    onRefresh: () => fetch(true),
  };
}
