/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of PersonalFit.
 *
 * PersonalFit is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { useQuery } from '@tanstack/react-query';
import { gamificationAPI, queryKeys } from '../api';

export function useGamification() {
  const { data: gamificationData } = useQuery({
    queryKey: queryKeys.gamification.stats(),
    queryFn: gamificationAPI.getStats,
    staleTime: 0,
    refetchOnMount: 'always',
  });

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
