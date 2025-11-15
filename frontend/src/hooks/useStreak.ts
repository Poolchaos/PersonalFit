import { useQuery } from '@tanstack/react-query';
import { accountabilityAPI } from '../api';

export function useStreak() {
  const { data } = useQuery({
    queryKey: ['accountability'],
    queryFn: accountabilityAPI.getStatus,
  });

  return {
    currentStreak: data?.streak.current || 0,
    longestStreak: data?.streak.longest || 0,
    freezesAvailable: 2, // TODO: Add freezes to backend accountability model
    nextMilestone: Math.ceil((data?.streak.current || 0) / 7) * 7 + 7, // Next multiple of 7
  };
}
