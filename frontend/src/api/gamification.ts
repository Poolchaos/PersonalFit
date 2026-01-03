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

import { apiClient } from './client';

export interface GamificationStats {
  xp: number;
  level: number;
  levelTitle?: string;
  levelProgress?: number;
  xpForNextLevel?: number;
  totalWorkoutsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  achievements: string[];
}

export interface XPGainResponse {
  xp_gained: number;
  new_total_xp: number;
  new_level: number;
  level_up: boolean;
  streak_bonus: number;
  new_streak: number;
  new_achievements: string[];
}

export const gamificationAPI = {
  // Get user's gamification stats
  getStats: async (): Promise<GamificationStats> => {
    const response = await apiClient.get('/api/gamification/stats');
    console.log('ðŸŽ® Gamification API raw response:', response.data);
    console.log('ðŸŽ® Gamification stats extracted:', response.data.stats);
    return response.data.stats; // Extract stats from nested response
  },

  // Award XP for completing a workout
  awardWorkoutXP: async (workoutData: {
    workout_id?: string;
    exercises_completed: number;
    duration_minutes: number;
    personal_records?: number;
  }): Promise<XPGainResponse> => {
    const response = await apiClient.post('/api/gamification/award-xp', workoutData);
    return response.data;
  },

  // Check and award streak bonus
  checkStreak: async (): Promise<{
    current_streak: number;
    longest_streak: number;
    streak_maintained: boolean;
    streak_bonus_xp: number;
  }> => {
    const response = await apiClient.post('/api/gamification/check-streak');
    return response.data;
  },
};
