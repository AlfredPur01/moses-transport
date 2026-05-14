import { useCallback, useEffect, useState } from 'react';

import { AvailableAsset, assetApi } from '@/api/asset';

export function useAvailableAssets(typeFilter?: string) {
  const [assets, setAssets] = useState<AvailableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await assetApi.getAvailable({ type: typeFilter || undefined, limit: 50 });
      setAssets(res.data.assets);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load vehicles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => {
    setRefreshing(true);
    fetch(true);
  };

  return { assets, loading, refreshing, error, refetch: fetch, onRefresh };
}
