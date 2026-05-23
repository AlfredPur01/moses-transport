import { useAuth } from '@/context/AuthContext';

export function useCurrentUserId(): string | null {
  return useAuth().userId;
}
