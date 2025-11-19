import { useQuery } from '@tanstack/react-query';
import { gamificationAPI } from '../api';

export function useGamification() {
  const { data: gamificationData } = useQuery({
    queryKey: ['gamification'],
    queryFn: gamificationAPI.getStats,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  console.log('🎮 useGamification hook data:', gamificationData);

  const level = gamificationData?.level || 1;
  const xp = gamificationData?.xp || 0;
  const currentStreak = gamificationData?.currentStreak || 0;
  const longestStreak = gamificationData?.longestStreak || 0;
  const totalWorkouts = gamificationData?.totalWorkoutsCompleted || 0;
  const xpToNextLevel = gamificationData?.xpForNextLevel || 500;
  const xpProgress = gamificationData?.levelProgress || 0;

  return {
    user: {
      level,
      xp,
      xpToNextLevel,
      totalPRs: 0, // TODO: Implement PR tracking
    },
    level,
    xp,
    xpToNextLevel,
    xpProgress,
    currentStreak,
    longestStreak,
    totalWorkouts,
    totalPRs: 0, // TODO: Implement PR tracking
  };
}
