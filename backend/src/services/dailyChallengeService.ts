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
 * Daily Challenge Service
 * Manages daily challenges with rotating challenge pool
 */

import DailyChallenge, { IDailyChallenge } from '../models/DailyChallenge';
import User from '../models/User';
import mongoose from 'mongoose';

// Challenge definitions pool
export const CHALLENGE_POOL = {
  // Workout challenges
  workout_complete_1: {
    id: 'workout_complete_1',
    type: 'workout' as const,
    title: 'Daily Workout',
    description: 'Complete 1 workout today',
    target: 1,
    xp_reward: 50,
    gems_reward: 5,
  },
  workout_complete_2: {
    id: 'workout_complete_2',
    type: 'workout' as const,
    title: 'Double Down',
    description: 'Complete 2 workouts today',
    target: 2,
    xp_reward: 100,
    gems_reward: 10,
  },
  workout_30_min: {
    id: 'workout_30_min',
    type: 'workout' as const,
    title: 'Marathon Session',
    description: 'Complete a workout lasting 30+ minutes',
    target: 1,
    xp_reward: 75,
    gems_reward: 8,
  },

  // Exercise-specific challenges
  exercise_pushups: {
    id: 'exercise_pushups',
    type: 'exercise' as const,
    title: 'Push It',
    description: 'Complete 50 push-ups total today',
    target: 50,
    xp_reward: 60,
    gems_reward: 6,
  },
  exercise_squats: {
    id: 'exercise_squats',
    type: 'exercise' as const,
    title: 'Leg Day',
    description: 'Complete 100 squats total today',
    target: 100,
    xp_reward: 70,
    gems_reward: 7,
  },
  exercise_plank: {
    id: 'exercise_plank',
    type: 'exercise' as const,
    title: 'Core Crusher',
    description: 'Hold plank for 3 minutes total today',
    target: 180,
    xp_reward: 65,
    gems_reward: 7,
  },
  exercise_burpees: {
    id: 'exercise_burpees',
    type: 'exercise' as const,
    title: 'Burpee Bonanza',
    description: 'Complete 30 burpees today',
    target: 30,
    xp_reward: 80,
    gems_reward: 8,
  },

  // Streak challenges
  streak_maintain: {
    id: 'streak_maintain',
    type: 'streak' as const,
    title: 'Keep It Going',
    description: 'Maintain your workout streak',
    target: 1,
    xp_reward: 40,
    gems_reward: 4,
  },
  streak_extend: {
    id: 'streak_extend',
    type: 'streak' as const,
    title: 'Streak Builder',
    description: 'Extend your streak to a new day',
    target: 1,
    xp_reward: 55,
    gems_reward: 5,
  },

  // Exploration challenges
  exploration_new_exercise: {
    id: 'exploration_new_exercise',
    type: 'exploration' as const,
    title: 'Try Something New',
    description: 'Complete an exercise you haven\'t done before',
    target: 1,
    xp_reward: 100,
    gems_reward: 10,
  },
  exploration_different_category: {
    id: 'exploration_different_category',
    type: 'exploration' as const,
    title: 'Mix It Up',
    description: 'Complete exercises from 3 different categories',
    target: 3,
    xp_reward: 75,
    gems_reward: 8,
  },

  // PR challenges
  pr_set: {
    id: 'pr_set',
    type: 'exercise' as const,
    title: 'Personal Best',
    description: 'Set a new personal record',
    target: 1,
    xp_reward: 100,
    gems_reward: 15,
  },
} as const;

// Challenge types for TypeScript
type ChallengeId = keyof typeof CHALLENGE_POOL;
type ChallengeDefinition = typeof CHALLENGE_POOL[ChallengeId];

/**
 * Get today's date normalized to midnight UTC
 */
function getTodayDate(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/**
 * Generate deterministic challenges for a user on a given day
 * Uses user ID + date to ensure consistent challenges across sessions
 */
function selectDailyChallenges(userId: string, date: Date): ChallengeDefinition[] {
  const dateStr = date.toISOString().split('T')[0];
  const seed = `${userId}-${dateStr}`;

  // Simple hash function for deterministic selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const allChallenges = Object.values(CHALLENGE_POOL);
  const selectedChallenges: ChallengeDefinition[] = [];

  // Select 3 challenges with different types
  const types = ['workout', 'exercise', 'streak', 'exploration'];

  for (let i = 0; i < 3; i++) {
    const targetType = types[(Math.abs(hash) + i) % types.length];
    const typeFiltered = allChallenges.filter(
      (c) => c.type === targetType && !selectedChallenges.includes(c)
    );

    if (typeFiltered.length > 0) {
      const index = Math.abs(hash + i * 31) % typeFiltered.length;
      selectedChallenges.push(typeFiltered[index]);
    } else {
      // Fallback to any unselected challenge
      const remaining = allChallenges.filter((c) => !selectedChallenges.includes(c));
      if (remaining.length > 0) {
        const index = Math.abs(hash + i * 31) % remaining.length;
        selectedChallenges.push(remaining[index]);
      }
    }
  }

  return selectedChallenges;
}

/**
 * Get or create today's challenges for a user
 */
export async function getDailyChallenges(userId: string): Promise<IDailyChallenge> {
  const today = getTodayDate();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check for existing challenges
  let dailyChallenge = await DailyChallenge.findOne({
    user_id: userObjectId,
    challenge_date: today,
  });

  if (dailyChallenge) {
    return dailyChallenge;
  }

  // Generate new challenges
  const selectedChallenges = selectDailyChallenges(userId, today);

  dailyChallenge = await DailyChallenge.create({
    user_id: userObjectId,
    challenge_date: today,
    challenges: selectedChallenges.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      target: c.target,
      progress: 0,
      xp_reward: c.xp_reward,
      gems_reward: c.gems_reward,
      completed: false,
    })),
    streak_freeze_used: false,
    gems_earned_today: 0,
  });

  return dailyChallenge;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progressIncrement: number
): Promise<{
  challenge: IDailyChallenge['challenges'][0] | undefined;
  justCompleted: boolean;
  xpEarned: number;
  gemsEarned: number;
}> {
  const today = getTodayDate();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const dailyChallenge = await DailyChallenge.findOne({
    user_id: userObjectId,
    challenge_date: today,
  });

  if (!dailyChallenge) {
    return { challenge: undefined, justCompleted: false, xpEarned: 0, gemsEarned: 0 };
  }

  const challenge = dailyChallenge.challenges.find((c) => c.id === challengeId);
  if (!challenge || challenge.completed) {
    return { challenge, justCompleted: false, xpEarned: 0, gemsEarned: 0 };
  }

  // Update progress
  challenge.progress = Math.min(challenge.progress + progressIncrement, challenge.target);

  let justCompleted = false;
  let xpEarned = 0;
  let gemsEarned = 0;

  // Check if just completed
  if (challenge.progress >= challenge.target && !challenge.completed) {
    challenge.completed = true;
    challenge.completed_at = new Date();
    justCompleted = true;
    xpEarned = challenge.xp_reward;
    gemsEarned = challenge.gems_reward;

    dailyChallenge.gems_earned_today += gemsEarned;

    // Award gems to user
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'gamification.xp': xpEarned,
        'gamification.gems': gemsEarned,
        'gamification.total_gems_earned': gemsEarned,
      },
    });
  }

  await dailyChallenge.save();

  return { challenge, justCompleted, xpEarned, gemsEarned };
}

/**
 * Mark workout-related challenges as progressed
 */
export async function onWorkoutCompleted(
  userId: string,
  workoutDurationMinutes: number
): Promise<void> {
  const dailyChallenge = await getDailyChallenges(userId);

  for (const challenge of dailyChallenge.challenges) {
    if (challenge.completed) continue;

    if (challenge.id === 'workout_complete_1' || challenge.id === 'workout_complete_2') {
      await updateChallengeProgress(userId, challenge.id, 1);
    }

    if (challenge.id === 'workout_30_min' && workoutDurationMinutes >= 30) {
      await updateChallengeProgress(userId, challenge.id, 1);
    }

    if (challenge.id === 'streak_maintain' || challenge.id === 'streak_extend') {
      await updateChallengeProgress(userId, challenge.id, 1);
    }
  }
}

/**
 * Mark PR challenge as completed
 */
export async function onPRSet(userId: string): Promise<void> {
  await updateChallengeProgress(userId, 'pr_set', 1);
}

/**
 * Use a streak freeze
 */
export async function useStreakFreeze(userId: string): Promise<{
  success: boolean;
  error?: string;
  freezesRemaining?: number;
}> {
  const user = await User.findById(userId);
  if (!user || !user.gamification) {
    return { success: false, error: 'User not found' };
  }

  const today = getTodayDate();

  // Check if already used today
  if (user.gamification.last_streak_freeze_date) {
    const lastFreeze = new Date(user.gamification.last_streak_freeze_date);
    lastFreeze.setUTCHours(0, 0, 0, 0);
    if (lastFreeze.getTime() === today.getTime()) {
      return { success: false, error: 'Already used streak freeze today' };
    }
  }

  // Check if freezes available
  if (user.gamification.streak_freezes_available <= 0) {
    // Check if user has enough gems to buy one (50 gems)
    if (user.gamification.gems >= 50) {
      user.gamification.gems -= 50;
    } else {
      return { success: false, error: 'No streak freezes available. Purchase with 50 gems.' };
    }
  } else {
    user.gamification.streak_freezes_available -= 1;
  }

  user.gamification.streak_freezes_used_this_month += 1;
  user.gamification.last_streak_freeze_date = today;

  // Mark in daily challenge
  const dailyChallenge = await getDailyChallenges(userId);
  dailyChallenge.streak_freeze_used = true;
  await dailyChallenge.save();

  await user.save();

  return {
    success: true,
    freezesRemaining: user.gamification.streak_freezes_available,
  };
}

/**
 * Award monthly streak freezes (call at month start)
 */
export async function awardMonthlyStreakFreezes(): Promise<number> {
  const result = await User.updateMany(
    { 'gamification.xp': { $exists: true } },
    {
      $set: { 'gamification.streak_freezes_used_this_month': 0 },
      $inc: { 'gamification.streak_freezes_available': 2 },
    }
  );

  return result.modifiedCount;
}

/**
 * Get challenge history for a user
 */
export async function getChallengeHistory(
  userId: string,
  days: number = 7
): Promise<IDailyChallenge[]> {
  const endDate = getTodayDate();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return DailyChallenge.find({
    user_id: new mongoose.Types.ObjectId(userId),
    challenge_date: { $gte: startDate, $lte: endDate },
  }).sort({ challenge_date: -1 });
}
