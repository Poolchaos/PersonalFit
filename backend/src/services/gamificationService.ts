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
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  FIRST_WORKOUT: {
    id: 'first_workout',
    name: 'Getting Started',
    description: 'Complete your first workout',
    icon: 'trophy',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 1,
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: 'flame',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 7,
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day workout streak',
    icon: 'star',
    checkCondition: (stats: { currentStreak: number }) => stats.currentStreak >= 30,
  },
  CONSISTENCY_KING: {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Complete 100 workouts',
    icon: 'crown',
    checkCondition: (stats: { totalWorkouts: number }) => stats.totalWorkouts >= 100,
  },
  PR_CRUSHER: {
    id: 'pr_crusher',
    name: 'PR Crusher',
    description: 'Set 5 personal records',
    icon: 'zap',
    checkCondition: (stats: { totalPRs: number }) => stats.totalPRs >= 5,
  },
  LEVEL_5: {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: 'star',
    checkCondition: (stats: { level: number }) => stats.level >= 5,
  },
  LEVEL_10: {
    id: 'level_10',
    name: 'Elite Athlete',
    description: 'Reach Level 10',
    icon: 'medal',
    checkCondition: (stats: { level: number }) => stats.level >= 10,
  },
  LEVEL_20: {
    id: 'level_20',
    name: 'Fitness Legend',
    description: 'Reach Level 20',
    icon: 'trophy',
    checkCondition: (stats: { level: number }) => stats.level >= 20,
  },
} as const;

/**
 * Check which new achievements have been unlocked
 */
export function checkAchievements(params: {
  currentAchievements: string[];
  stats: {
    totalWorkouts: number;
    currentStreak: number;
    totalPRs: number;
    level: number;
  };
}): string[] {
  const newAchievements: string[] = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    // Skip if already earned
    if (params.currentAchievements.includes(achievement.id)) {
      continue;
    }

    // Check if condition is met
    if (achievement.checkCondition(params.stats)) {
      newAchievements.push(achievement.id);
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
