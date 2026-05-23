import { useCallback, useEffect, useState } from 'react';

import { Notification, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getNotifications();
      setNotifications(data ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    try {
      await userApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent — marking read is non-critical
    }
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    loading,
    refreshing,
    error,
    markRead,
    onRefresh: () => fetch(true),
    refetch:   () => fetch(),
  };
}
