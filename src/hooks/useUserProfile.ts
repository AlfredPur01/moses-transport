import { useCallback, useEffect, useState } from 'react';

import { UserProfile, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getProfile();
      setProfile(data);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
