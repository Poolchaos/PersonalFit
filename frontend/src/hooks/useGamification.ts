import { useQuery } from '@tanstack/react-query';
import { accountabilityAPI, sessionAPI } from '../api';

export function useGamification() {
  const { data: accountabilityData } = useQuery({
    queryKey: ['accountability'],
    queryFn: accountabilityAPI.getStatus,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionAPI.getAll,
  });

  // Calculate level based on total workouts completed (10 workouts = 1 level)
  const totalWorkouts = accountabilityData?.totals.workouts_completed || 0;
  const level = Math.floor(totalWorkouts / 10) + 1;
  const xp = (totalWorkouts % 10) * 100;
  const xpToNextLevel = 1000;

  // Count PRs from sessions (sessions with new personal records)
  const totalPRs = sessionsData?.sessions.filter((session) =>
    session.notes?.toLowerCase().includes('pr') ||
    session.notes?.toLowerCase().includes('personal record')
  ).length || 0;

  return {
    user: {
      level,
      xp,
      xpToNextLevel,
      totalPRs,
    },
    level,
    xp,
    xpToNextLevel,
    xpProgress: (xp / xpToNextLevel) * 100,
    totalPRs,
  };
}
