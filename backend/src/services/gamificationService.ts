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

/**
 * Gamification Service
 *
 * Handles XP calculations, level progression, streak tracking, and achievement awards.
 * All calculations are deterministic and based on factual completion data.
 */

// XP rewards per activity
export const XP_REWARDS = {
  WORKOUT_COMPLETED: 100, // Base reward for completing a workout
  PERSONAL_RECORD: 50, // Bonus for hitting a PR
  STREAK_BONUS: 25, // Per day in current streak (e.g., 7-day streak = 175 bonus)
  FIRST_WORKOUT: 200, // One-time bonus for first ever workout
} as const;

// Level thresholds - exponential curve for progression
export const LEVEL_THRESHOLDS = [
  0,     // Level 1: 0 XP
  500,   // Level 2: 500 XP
  1200,  // Level 3: 1,200 XP
  2200,  // Level 4: 2,200 XP
  3500,  // Level 5: 3,500 XP
  5100,  // Level 6: 5,100 XP
  7000,  // Level 7: 7,000 XP
  9200,  // Level 8: 9,200 XP
  11700, // Level 9: 11,700 XP
  14500, // Level 10: 14,500 XP
  17600, // Level 11: 17,600 XP
  21000, // Level 12: 21,000 XP
  24700, // Level 13: 24,700 XP
  28700, // Level 14: 28,700 XP
  33000, // Level 15: 33,000 XP
  37600, // Level 16: 37,600 XP
  42500, // Level 17: 42,500 XP
  47700, // Level 18: 47,700 XP
  53200, // Level 19: 53,200 XP
  59000, // Level 20: 59,000 XP
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/**
 * Get XP required for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) {
    return LEVEL_THRESHOLDS[MAX_LEVEL - 1]; // Already at max level
  }
  return LEVEL_THRESHOLDS[currentLevel]; // currentLevel is 1-indexed, array is 0-indexed
}

/**
 * Get XP progress for current level (0-100%)
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);

  if (currentLevel >= MAX_LEVEL) {
    return 100; // Max level
  }

  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel];
  const xpInCurrentLevel = totalXp - currentLevelThreshold;
  const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;

  return Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);
}

/**
 * Calculate XP earned for completing a workout
 */
export function calculateWorkoutXp(params: {
  isFirstWorkout: boolean;
  currentStreak: number;
  hadPersonalRecord: boolean;
}): { totalXp: number; breakdown: { source: string; amount: number }[] } {
  const breakdown: { source: string; amount: number }[] = [];

  // Base workout completion
  let totalXp = XP_REWARDS.WORKOUT_COMPLETED;
  breakdown.push({ source: 'Workout Completed', amount: XP_REWARDS.WORKOUT_COMPLETED });

  // First workout bonus
  if (params.isFirstWorkout) {
    totalXp += XP_REWARDS.FIRST_WORKOUT;
    breakdown.push({ source: 'First Workout Bonus', amount: XP_REWARDS.FIRST_WORKOUT });
  }

  // Streak bonus (multiplied by streak length)
  if (params.currentStreak > 0) {
    const streakBonus = XP_REWARDS.STREAK_BONUS * params.currentStreak;
    totalXp += streakBonus;
    breakdown.push({
      source: `${params.currentStreak}-Day Streak Bonus`,
      amount: streakBonus
    });
  }

  // Personal record bonus
  if (params.hadPersonalRecord) {
    totalXp += XP_REWARDS.PERSONAL_RECORD;
    breakdown.push({ source: 'Personal Record', amount: XP_REWARDS.PERSONAL_RECORD });
  }

  return { totalXp, breakdown };
}

/**
 * Update streak based on workout completion date
 * Returns updated streak information
 */
export function updateStreak(params: {
  lastWorkoutDate?: Date;
  workoutDate: Date;
  currentStreak: number;
}): { newStreak: number; streakBroken: boolean } {
  if (!params.lastWorkoutDate) {
    // First workout ever
    return { newStreak: 1, streakBroken: false };
  }

  const lastDate = new Date(params.lastWorkoutDate);
  const currentDate = new Date(params.workoutDate);

  // Reset time to compare dates only
  lastDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  const daysDifference = Math.floor(
    (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference === 0) {
    // Same day - streak continues
    return { newStreak: params.currentStreak, streakBroken: false };
  } else if (daysDifference === 1) {
    // Consecutive day - increase streak
    return { newStreak: params.currentStreak + 1, streakBroken: false };
  } else {
    // Missed days - reset streak
    return { newStreak: 1, streakBroken: true };
  }
}

/**
 * Achievement definitions - 42 total achievements
 */
export const ACHIEVEMENTS = {
  // === Getting Started (5) ===
  FIRST_WORKOUT: {
    id: 'first_workout',
    name: 'Getting Started',
    description: 'Complete your first workout',
    icon: 'trophy',
    category: 'milestone',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 1,
  },
  FIRST_WEEK: {
    id: 'first_week',
    name: 'First Full Week',
    description: 'Complete 7 workouts total',
    icon: 'calendar',
    category: 'milestone',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 7,
  },
  FIRST_MONTH: {
    id: 'first_month',
    name: 'Monthly Milestone',
    description: 'Complete 30 workouts total',
    icon: 'calendar-check',
    category: 'milestone',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 30,
  },
  FIRST_PR: {
    id: 'first_pr',
    name: 'Personal Best',
    description: 'Set your first personal record',
    icon: 'zap',
    category: 'milestone',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 1,
  },
  PROFILE_COMPLETE: {
    id: 'profile_complete',
    name: 'All Set Up',
    description: 'Complete your fitness profile',
    icon: 'user-check',
    category: 'milestone',
    checkCondition: (stats: { profileComplete: boolean }) => stats.profileComplete === true,
  },

  // === Streak Achievements (8) ===
  STREAK_3: {
    id: 'streak_3',
    name: 'Getting Consistent',
    description: 'Maintain a 3-day workout streak',
    icon: 'flame',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 3,
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: 'flame',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 7,
  },
  STREAK_14: {
    id: 'streak_14',
    name: 'Two Week Titan',
    description: 'Maintain a 14-day workout streak',
    icon: 'flame',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 14,
  },
  STREAK_21: {
    id: 'streak_21',
    name: 'Habit Formed',
    description: 'Maintain a 21-day workout streak',
    icon: 'brain',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 21,
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day workout streak',
    icon: 'star',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 30,
  },
  STREAK_60: {
    id: 'streak_60',
    name: 'Unstoppable',
    description: 'Maintain a 60-day workout streak',
    icon: 'rocket',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 60,
  },
  STREAK_90: {
    id: 'streak_90',
    name: 'Quarterly Champion',
    description: 'Maintain a 90-day workout streak',
    icon: 'medal',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 90,
  },
  STREAK_365: {
    id: 'streak_365',
    name: 'Year of Iron',
    description: 'Maintain a 365-day workout streak',
    icon: 'crown',
    category: 'streak',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 365,
  },

  // === Workout Volume (6) ===
  WORKOUTS_25: {
    id: 'workouts_25',
    name: 'Quarter Century',
    description: 'Complete 25 workouts',
    icon: 'dumbbell',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 25,
  },
  WORKOUTS_50: {
    id: 'workouts_50',
    name: 'Half Century',
    description: 'Complete 50 workouts',
    icon: 'dumbbell',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 50,
  },
  CONSISTENCY_KING: {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Complete 100 workouts',
    icon: 'crown',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 100,
  },
  WORKOUTS_250: {
    id: 'workouts_250',
    name: 'Dedicated',
    description: 'Complete 250 workouts',
    icon: 'target',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 250,
  },
  WORKOUTS_500: {
    id: 'workouts_500',
    name: 'Fitness Fanatic',
    description: 'Complete 500 workouts',
    icon: 'star',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 500,
  },
  WORKOUTS_1000: {
    id: 'workouts_1000',
    name: 'Thousand Club',
    description: 'Complete 1000 workouts',
    icon: 'trophy',
    category: 'volume',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 1000,
  },

  // === PR Achievements (7) ===
  PR_CRUSHER: {
    id: 'pr_crusher',
    name: 'PR Crusher',
    description: 'Set 5 personal records',
    icon: 'zap',
    category: 'pr',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 5,
  },
  PR_10: {
    id: 'pr_10',
    name: 'Record Breaker',
    description: 'Set 10 personal records',
    icon: 'trending-up',
    category: 'pr',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 10,
  },
  PR_25: {
    id: 'pr_25',
    name: 'PR Machine',
    description: 'Set 25 personal records',
    icon: 'activity',
    category: 'pr',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 25,
  },
  PR_50: {
    id: 'pr_50',
    name: 'Beast Mode',
    description: 'Set 50 personal records',
    icon: 'flame',
    category: 'pr',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 50,
  },
  PR_100: {
    id: 'pr_100',
    name: 'Century of PRs',
    description: 'Set 100 personal records',
    icon: 'award',
    category: 'pr',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 100,
  },
  PR_WEEK: {
    id: 'pr_week',
    name: 'PR Week',
    description: 'Set 3 personal records in one week',
    icon: 'calendar',
    category: 'pr',
    checkCondition: (stats: { prsThisWeek: number }) => stats.prsThisWeek >= 3,
  },
  PR_DAY: {
    id: 'pr_day',
    name: 'PR Day',
    description: 'Set 2 personal records in one day',
    icon: 'sun',
    category: 'pr',
    checkCondition: (stats: { prsToday: number }) => stats.prsToday >= 2,
  },

  // === Level Achievements (6) ===
  LEVEL_5: {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: 'star',
    category: 'level',
    checkCondition: (stats: { level: number }) => stats.level >= 5,
  },
  LEVEL_10: {
    id: 'level_10',
    name: 'Elite Athlete',
    description: 'Reach Level 10',
    icon: 'medal',
    category: 'level',
    checkCondition: (stats: { level: number }) => stats.level >= 10,
  },
  LEVEL_15: {
    id: 'level_15',
    name: 'Veteran',
    description: 'Reach Level 15',
    icon: 'shield',
    category: 'level',
    checkCondition: (stats: { level: number }) => stats.level >= 15,
  },
  LEVEL_20: {
    id: 'level_20',
    name: 'Fitness Legend',
    description: 'Reach Level 20',
    icon: 'trophy',
    category: 'level',
    checkCondition: (stats: { level: number }) => stats.level >= 20,
  },
  XP_10K: {
    id: 'xp_10k',
    name: '10K Club',
    description: 'Earn 10,000 total XP',
    icon: 'sparkles',
    category: 'level',
    checkCondition: (stats: { totalXP: number }) => stats.totalXP >= 10000,
  },
  XP_50K: {
    id: 'xp_50k',
    name: 'XP Master',
    description: 'Earn 50,000 total XP',
    icon: 'gem',
    category: 'level',
    checkCondition: (stats: { totalXP: number }) => stats.totalXP >= 50000,
  },

  // === Challenge Achievements (5) ===
  DAILY_CHALLENGE_1: {
    id: 'daily_challenge_1',
    name: 'Challenge Accepted',
    description: 'Complete your first daily challenge',
    icon: 'target',
    category: 'challenge',
    checkCondition: (stats: { challengesCompleted: number }) => stats.challengesCompleted >= 1,
  },
  DAILY_CHALLENGE_10: {
    id: 'daily_challenge_10',
    name: 'Challenge Hunter',
    description: 'Complete 10 daily challenges',
    icon: 'crosshair',
    category: 'challenge',
    checkCondition: (stats: { challengesCompleted: number }) => stats.challengesCompleted >= 10,
  },
  DAILY_CHALLENGE_50: {
    id: 'daily_challenge_50',
    name: 'Challenge Master',
    description: 'Complete 50 daily challenges',
    icon: 'award',
    category: 'challenge',
    checkCondition: (stats: { challengesCompleted: number }) => stats.challengesCompleted >= 50,
  },
  PERFECT_DAY: {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Complete all daily challenges in one day',
    icon: 'sun',
    category: 'challenge',
    checkCondition: (stats: { perfectDays: number }) => stats.perfectDays >= 1,
  },
  PERFECT_WEEK: {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all daily challenges for 7 consecutive days',
    icon: 'calendar-check',
    category: 'challenge',
    checkCondition: (stats: { perfectWeeks: number }) => stats.perfectWeeks >= 1,
  },

  // === Special Achievements (5) ===
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a workout before 7 AM',
    icon: 'sunrise',
    category: 'special',
    checkCondition: (stats: { earlyWorkouts: number }) => stats.earlyWorkouts >= 1,
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a workout after 10 PM',
    icon: 'moon',
    category: 'special',
    checkCondition: (stats: { lateWorkouts: number }) => stats.lateWorkouts >= 1,
  },
  WEEKEND_WARRIOR: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete workouts on 10 weekends',
    icon: 'calendar',
    category: 'special',
    checkCondition: (stats: { weekendWorkouts: number }) => stats.weekendWorkouts >= 10,
  },
  COMEBACK_KID: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Return after a 2+ week break and complete a workout',
    icon: 'refresh-cw',
    category: 'special',
    checkCondition: (stats: { comebacks: number }) => stats.comebacks >= 1,
  },
  GEM_COLLECTOR: {
    id: 'gem_collector',
    name: 'Gem Collector',
    description: 'Earn 500 gems total',
    icon: 'gem',
    category: 'special',
    checkCondition: (stats: { totalGems: number }) => stats.totalGems >= 500,
  },
} as const;

/**
 * Stats type for achievement checking
 * All properties optional to allow partial stats
 */
export interface AchievementStats {
  totalWorkouts?: number;
  currentStreak?: number;
  totalPRs?: number;
  level?: number;
  totalXP?: number;
  profileComplete?: boolean;
  prsThisWeek?: number;
  prsToday?: number;
  challengesCompleted?: number;
  perfectDays?: number;
  perfectWeeks?: number;
  earlyWorkouts?: number;
  lateWorkouts?: number;
  weekendWorkouts?: number;
  comebacks?: number;
  totalGems?: number;
}

/**
 * Check which new achievements have been unlocked
 */
export function checkAchievements(params: {
  currentAchievements: string[];
  stats: AchievementStats;
}): string[] {
  const newAchievements: string[] = [];

  // Create full stats with defaults
  const fullStats: Required<AchievementStats> = {
    totalWorkouts: params.stats.totalWorkouts ?? 0,
    currentStreak: params.stats.currentStreak ?? 0,
    totalPRs: params.stats.totalPRs ?? 0,
    level: params.stats.level ?? 1,
    totalXP: params.stats.totalXP ?? 0,
    profileComplete: params.stats.profileComplete ?? false,
    prsThisWeek: params.stats.prsThisWeek ?? 0,
    prsToday: params.stats.prsToday ?? 0,
    challengesCompleted: params.stats.challengesCompleted ?? 0,
    perfectDays: params.stats.perfectDays ?? 0,
    perfectWeeks: params.stats.perfectWeeks ?? 0,
    earlyWorkouts: params.stats.earlyWorkouts ?? 0,
    lateWorkouts: params.stats.lateWorkouts ?? 0,
    weekendWorkouts: params.stats.weekendWorkouts ?? 0,
    comebacks: params.stats.comebacks ?? 0,
    totalGems: params.stats.totalGems ?? 0,
  };

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    // Skip if already earned
    if (params.currentAchievements.includes(achievement.id)) {
      continue;
    }

    // Check if condition is met - pass full stats to avoid type errors
    try {
      if (achievement.checkCondition(fullStats as never)) {
        newAchievements.push(achievement.id);
      }
    } catch {
      // Skip achievements that fail to evaluate
    }
  }

  return newAchievements;
}

/**
 * Get level title based on current level
 */
export function getLevelTitle(level: number): string {
  if (level === 1) return 'Beginner';
  if (level <= 3) return 'Novice';
  if (level <= 5) return 'Intermediate';
  if (level <= 8) return 'Advanced';
  if (level <= 12) return 'Expert';
  if (level <= 15) return 'Master';
  if (level <= 18) return 'Elite';
  if (level <= 20) return 'Legend';
  return 'Max Level';
}
