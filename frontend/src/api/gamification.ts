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
  gems: number;
  levelTitle?: string;
  levelProgress?: number;
  xpForNextLevel?: number;
  totalWorkoutsCompleted: number;
  totalPRs: number;
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

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  level: number;
  xp: number;
  currentStreak: number;
  totalWorkouts: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  totalUsers: number;
}

export interface ShopItem {
  id: string;
  category: 'theme' | 'badge' | 'title' | 'avatar' | 'profile';
  name: string;
  description: string;
  icon: string;
  gemsPrice: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  owned?: boolean;
}

export interface ShopResponse {
  items: ShopItem[];
  userGems: number;
}

export interface GemBalanceResponse {
  currentGems: number;
  totalGemsEarned: number;
  purchasedItems: string[];
  itemCount: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  remainingGems: number;
  purchasedItem: ShopItem;
}

export interface MilestoneRewardsResponse {
  message: string;
  gemsAwarded: number;
  newGemBalance: number;
  claimedMilestones: number[];
}

export const gamificationAPI = {
  // Get user's gamification stats
  getStats: async (): Promise<GamificationStats> => {
    const response = await apiClient.get('/api/gamification/stats');
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

  // Leaderboard endpoints
  getGlobalLeaderboard: async (limit = 50, offset = 0): Promise<LeaderboardResponse> => {
    const response = await apiClient.get(`/api/gamification/leaderboard/global?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getWeeklyLeaderboard: async (limit = 50, offset = 0): Promise<LeaderboardResponse> => {
    const response = await apiClient.get(`/api/gamification/leaderboard/weekly?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getUserRank: async (): Promise<{ userRank: number; nearbyLeaderboard: LeaderboardEntry[] }> => {
    const response = await apiClient.get('/api/gamification/leaderboard/rank');
    return response.data;
  },

  // Shop endpoints
  getShopItems: async (category?: string): Promise<ShopResponse> => {
    const url = category
      ? `/api/gamification/shop?category=${category}`
      : '/api/gamification/shop';
    const response = await apiClient.get(url);
    return response.data;
  },

  getGemBalance: async (): Promise<GemBalanceResponse> => {
    const response = await apiClient.get('/api/gamification/gems');
    return response.data;
  },

  purchaseItem: async (itemId: string): Promise<PurchaseResponse> => {
    const response = await apiClient.post('/api/gamification/shop/purchase', { itemId });
    return response.data;
  },

  claimMilestoneRewards: async (): Promise<MilestoneRewardsResponse> => {
    const response = await apiClient.post('/api/gamification/shop/claim-rewards');
    return response.data;
  },
};
