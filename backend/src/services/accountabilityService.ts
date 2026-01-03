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

import mongoose from 'mongoose';
import Accountability, { IPenalty, IAccountability } from '../models/Accountability';
import WorkoutSession from '../models/WorkoutSession';

/**
 * Get or create accountability record for user
 */
export const getOrCreateAccountability = async (
  userId: mongoose.Types.ObjectId
): Promise<IAccountability> => {
  let accountability = await Accountability.findOne({ user_id: userId });

  if (!accountability) {
    accountability = await Accountability.create({
      user_id: userId,
      streak: {
        current_streak: 0,
        longest_streak: 0,
      },
      penalties: [],
      weekly_stats: [],
      total_workouts_completed: 0,
      total_workouts_missed: 0,
      total_penalties: 0,
    });
  }

  return accountability;
};

/**
 * Update streak after workout completion
 */
export const updateStreakOnCompletion = async (
  userId: mongoose.Types.ObjectId,
  workoutDate: Date
): Promise<IAccountability> => {
  const accountability = await getOrCreateAccountability(userId);

  const lastWorkout = accountability.streak.last_workout_date;
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Check if workout is consecutive (within 48 hours of last workout)
  if (lastWorkout) {
    const daysSinceLastWorkout = Math.floor(
      (workoutDate.getTime() - lastWorkout.getTime()) / oneDayMs
    );

    if (daysSinceLastWorkout <= 2) {
      // Continue streak
      accountability.streak.current_streak += 1;
    } else {
      // Streak broken, restart
      accountability.streak.current_streak = 1;
      accountability.streak.streak_start_date = workoutDate;
    }
  } else {
    // First workout
    accountability.streak.current_streak = 1;
    accountability.streak.streak_start_date = workoutDate;
  }

  // Update longest streak if current exceeds it
  if (accountability.streak.current_streak > accountability.streak.longest_streak) {
    accountability.streak.longest_streak = accountability.streak.current_streak;
  }

  accountability.streak.last_workout_date = workoutDate;
  accountability.total_workouts_completed += 1;

  await accountability.save();
  return accountability;
};

/**
 * Reset streak (called when workout is missed)
 */
export const resetStreak = async (userId: mongoose.Types.ObjectId): Promise<IAccountability> => {
  const accountability = await getOrCreateAccountability(userId);

  accountability.streak.current_streak = 0;
  accountability.total_workouts_missed += 1;

  await accountability.save();
  return accountability;
};

/**
 * Assign penalty for missed workout
 */
export const assignPenalty = async (
  userId: mongoose.Types.ObjectId,
  workoutDate: Date,
  severity: 'light' | 'moderate' | 'severe',
  description?: string
): Promise<IAccountability> => {
  const accountability = await getOrCreateAccountability(userId);

  const penalty: IPenalty = {
    assigned_date: new Date(),
    workout_date: workoutDate,
    penalty_type: 'missed_workout',
    severity,
    description,
    resolved: false,
  };

  accountability.penalties.push(penalty);
  accountability.total_penalties += 1;

  await accountability.save();
  return accountability;
};

/**
 * Resolve a penalty (mark as complete)
 */
export const resolvePenalty = async (
  userId: mongoose.Types.ObjectId,
  penaltyId: string
): Promise<IAccountability> => {
  const accountability = await Accountability.findOne({ user_id: userId });

  if (!accountability) {
    throw new Error('Accountability record not found');
  }

  const penalty = accountability.penalties.find((p) => p._id?.toString() === penaltyId);
  if (!penalty) {
    throw new Error('Penalty not found');
  }

  penalty.resolved = true;
  penalty.resolved_date = new Date();

  await accountability.save();
  return accountability;
};

/**
 * Get current week's statistics
 */
export const getCurrentWeekStats = async (
  userId: mongoose.Types.ObjectId
): Promise<{
  week_start: Date;
  workouts_planned: number;
  workouts_completed: number;
  workouts_missed: number;
  completion_rate: number;
}> => {
  const accountability = await getOrCreateAccountability(userId);

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Find or create current week stats
  let currentWeek = accountability.weekly_stats.find(
    (week) => week.week_start.getTime() === weekStart.getTime()
  );

  if (!currentWeek) {
    // Count sessions for current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const sessions = await WorkoutSession.find({
      user_id: userId,
      session_date: { $gte: weekStart, $lt: weekEnd },
    });

    const completed = sessions.filter((s) => s.completion_status === 'completed').length;
    const missed = sessions.filter((s) => s.completion_status === 'skipped').length;
    const planned = sessions.length;

    currentWeek = {
      week_start: weekStart,
      workouts_planned: planned,
      workouts_completed: completed,
      workouts_missed: missed,
      completion_rate: planned > 0 ? (completed / planned) * 100 : 0,
    };

    accountability.weekly_stats.push(currentWeek);
    await accountability.save();
  }

  return currentWeek;
};

/**
 * Calculate accountability summary
 */
export const getAccountabilitySummary = async (
  userId: mongoose.Types.ObjectId
): Promise<{
  streak: {
    current: number;
    longest: number;
    last_workout: Date | undefined;
  };
  totals: {
    workouts_completed: number;
    workouts_missed: number;
    penalties_assigned: number;
    penalties_unresolved: number;
  };
  current_week: {
    week_start: Date;
    workouts_planned: number;
    workouts_completed: number;
    workouts_missed: number;
    completion_rate: number;
  };
  recent_penalties: IPenalty[];
}> => {
  const accountability = await getOrCreateAccountability(userId);
  const currentWeek = await getCurrentWeekStats(userId);

  const unresolvedPenalties = accountability.penalties.filter((p) => !p.resolved);
  const totalPenalties = accountability.penalties.length;

  return {
    streak: {
      current: accountability.streak.current_streak,
      longest: accountability.streak.longest_streak,
      last_workout: accountability.streak.last_workout_date,
    },
    totals: {
      workouts_completed: accountability.total_workouts_completed,
      workouts_missed: accountability.total_workouts_missed,
      penalties_assigned: totalPenalties,
      penalties_unresolved: unresolvedPenalties.length,
    },
    current_week: currentWeek,
    recent_penalties: unresolvedPenalties.slice(-5),
  };
};
