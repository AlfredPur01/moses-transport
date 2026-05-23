import { useState } from 'react';

import { UpdateProfilePayload, UserProfile, userApi } from '@/api/user';
import { getApiErrorMessage } from '@/utils/error';

export function useEditProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = async (
    payload: UpdateProfilePayload,
    onSuccess?: (updated: UserProfile) => void
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data } = await userApi.updateProfile(payload);
      setSuccess(true);
      onSuccess?.(data);
      return data;
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to update profile. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error, success, clearError: () => setError(null) };
}
