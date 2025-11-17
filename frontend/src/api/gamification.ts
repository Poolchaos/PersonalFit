import { apiClient } from './client';

export interface GamificationStats {
  xp: number;
  level: number;
  total_workouts_completed: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date?: string;
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
    return response.data;
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
