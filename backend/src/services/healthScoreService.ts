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
import HabitLog from '../models/HabitLog';
import WorkoutSession from '../models/WorkoutSession';
import { Medication } from '../models/Medication';
import NutritionEvent from '../models/NutritionEvent';
import HealthScore from '../models/HealthScore';

interface PillarScore {
  fitness: number;
  diet: number;
  habits: number;
  meds: number;
  mental: number;
}

interface HealthScoreCalculation {
  total_score: number;
  pillars: PillarScore;
  reasons: string[];
}

/**
 * Calculates unified health score based on data from all pillars
 * Score range: 0-100
 */
export async function calculateHealthScore(
  userId: string,
  date: Date = new Date()
): Promise<HealthScoreCalculation> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Calculate scores for each pillar
  const [fitnessScore, dietScore, habitsScore, medsScore, mentalScore] = await Promise.all([
    calculateFitnessScore(userObjectId, startOfDay, endOfDay),
    calculateDietScore(userObjectId, startOfDay, endOfDay),
    calculateHabitsScore(userObjectId, startOfDay, endOfDay),
    calculateMedsScore(userObjectId, startOfDay, endOfDay),
    calculateMentalScore(userObjectId, startOfDay, endOfDay),
  ]);

  // Weighted average (adjust weights based on importance)
  const weights = {
    fitness: 0.25,
    diet: 0.25,
    habits: 0.20,
    meds: 0.20,
    mental: 0.10,
  };

  const totalScore = Math.round(
    fitnessScore.score * weights.fitness +
      dietScore.score * weights.diet +
      habitsScore.score * weights.habits +
      medsScore.score * weights.meds +
      mentalScore.score * weights.mental
  );

  const reasons = [
    ...fitnessScore.reasons,
    ...dietScore.reasons,
    ...habitsScore.reasons,
    ...medsScore.reasons,
    ...mentalScore.reasons,
  ];

  return {
    total_score: Math.min(100, Math.max(0, totalScore)),
    pillars: {
      fitness: fitnessScore.score,
      diet: dietScore.score,
      habits: habitsScore.score,
      meds: medsScore.score,
      mental: mentalScore.score,
    },
    reasons,
  };
}

/**
 * Calculate fitness pillar score based on workout completion
 */
async function calculateFitnessScore(
  userId: mongoose.Types.ObjectId,
  startOfDay: Date,
  endOfDay: Date
): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];

  // Check today's workout completion
  const todaySession = await WorkoutSession.findOne({
    user_id: userId,
    workout_date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!todaySession) {
    reasons.push('No workout logged today');
    // Check recent 7-day streak
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = await WorkoutSession.countDocuments({
      user_id: userId,
      workout_date: { $gte: sevenDaysAgo, $lt: startOfDay },
      completion_status: 'completed',
    });

    if (recentSessions >= 5) {
      reasons.push('Strong weekly workout consistency');
      return { score: 60, reasons }; // Partial credit for recent consistency
    }
    return { score: 30, reasons };
  }

  if (todaySession.completion_status === 'completed') {
    reasons.push('Workout completed today! 💪');
    
    // Score based on completion percentage
    const completionRate = (todaySession.completion_percentage || 100) / 100;

    if (completionRate >= 0.9) {
      reasons.push('Excellent workout completion');
      return { score: 100, reasons };
    } else if (completionRate >= 0.7) {
      reasons.push('Good workout effort');
      return { score: 85, reasons };
    }
    return { score: 75, reasons };
  }

  if (todaySession.completion_status === 'in_progress') {
    reasons.push('Workout in progress...');
    return { score: 50, reasons };
  }

  reasons.push('Workout scheduled but not started');
  return { score: 40, reasons };
}

/**
 * Calculate diet pillar score based on nutrition logging and meal quality
 */
async function calculateDietScore(
  userId: mongoose.Types.ObjectId,
  startOfDay: Date,
  endOfDay: Date
): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];

  const nutritionEvents = await NutritionEvent.find({
    user_id: userId,
    consumed_at: { $gte: startOfDay, $lte: endOfDay },
  });

  if (nutritionEvents.length === 0) {
    reasons.push('No meals logged today');
    return { score: 40, reasons };
  }

  reasons.push(`${nutritionEvents.length} meal${nutritionEvents.length > 1 ? 's' : ''} logged`);

  // Check meal balance and macros
  interface NutritionEventType {
    calories?: number;
    macros?: {
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
    };
  }

  const totalCalories = nutritionEvents.reduce((sum: number, event: NutritionEventType) => sum + (event.calories || 0), 0);
  const totalProtein = nutritionEvents.reduce(
    (sum: number, event: NutritionEventType) => sum + (event.macros?.protein_g || 0),
    0
  );
  const totalCarbs = nutritionEvents.reduce((sum: number, event: NutritionEventType) => sum + (event.macros?.carbs_g || 0), 0);
  const totalFat = nutritionEvents.reduce((sum: number, event: NutritionEventType) => sum + (event.macros?.fat_g || 0), 0);

  let score = 60; // Base score for logging

  // Bonus for balanced macros (rough estimates)
  if (totalCalories > 1200 && totalCalories < 3000) {
    const proteinPercent = (totalProtein * 4) / totalCalories;
    const carbsPercent = (totalCarbs * 4) / totalCalories;
    const fatPercent = (totalFat * 9) / totalCalories;

    if (proteinPercent >= 0.2 && proteinPercent <= 0.35) {
      score += 10;
      reasons.push('Good protein intake');
    }
    if (carbsPercent >= 0.4 && carbsPercent <= 0.6) {
      score += 10;
      reasons.push('Balanced carbohydrates');
    }
    if (fatPercent >= 0.2 && fatPercent <= 0.35) {
      score += 10;
      reasons.push('Healthy fat balance');
    }
  }

  // Bonus for meal timing (3+ meals = better)
  if (nutritionEvents.length >= 3) {
    score += 10;
    reasons.push('Good meal frequency');
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Calculate habits pillar score based on daily check-ins
 */
async function calculateHabitsScore(
  userId: mongoose.Types.ObjectId,
  startOfDay: Date,
  _endOfDay: Date
): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];

  const logDate = startOfDay.toISOString().split('T')[0];
  const habitLog = await HabitLog.findOne({
    user_id: userId,
    log_date: logDate,
  });

  if (!habitLog || habitLog.entries.length === 0) {
    reasons.push('No habits tracked today');
    return { score: 30, reasons };
  }

  interface HabitEntryType {
    status: string;
  }
  const completedCount = habitLog.entries.filter((e: HabitEntryType) => e.status === 'completed').length;
  const totalCount = habitLog.entries.length;
  const completionRate = completedCount / totalCount;

  if (completionRate >= 0.8) {
    reasons.push(`Excellent! ${completedCount}/${totalCount} good habits completed`);
    return { score: 100, reasons };
  } else if (completionRate >= 0.6) {
    reasons.push(`Good progress: ${completedCount}/${totalCount} habits`);
    return { score: 80, reasons };
  } else if (completionRate >= 0.4) {
    reasons.push(`Keep going: ${completedCount}/${totalCount} habits`);
    return { score: 60, reasons };
  }

  reasons.push(`${completedCount}/${totalCount} habits completed`);
  return { score: 40, reasons };
}

/**
 * Calculate medications pillar score based on adherence
 * Note: For MVP, we check if user has active medications configured
 * Future: integrate with dose tracking/adherence system
 */
async function calculateMedsScore(
  userId: mongoose.Types.ObjectId,
  _startOfDay: Date,
  _endOfDay: Date
): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];

  // Count active medications
  const activeMeds = await Medication.find({
    user_id: userId,
    is_active: true,
  });

  if (activeMeds.length === 0) {
    reasons.push('No medications to track');
    return { score: 100, reasons }; // Perfect score if no meds needed
  }

  // For MVP: assume good adherence if medications are configured
  // Future: integrate with actual dose tracking
  reasons.push(`${activeMeds.length} active medication(s) configured`);
  return { score: 85, reasons }; // Good baseline score
}

/**
 * Calculate mental wellness pillar score (placeholder for future features)
 */
async function calculateMentalScore(
  userId: mongoose.Types.ObjectId,
  startOfDay: Date,
  _endOfDay: Date
): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];

  // For now, give partial credit based on other activities
  // Future: integrate mood tracking, meditation, sleep data

  // Check if user has logged any activity today (shows engagement)
  const hasAnyActivity =
    (await WorkoutSession.exists({
      user_id: userId,
      workout_date: { $gte: startOfDay, $lte: _endOfDay },
    })) ||
    (await HabitLog.exists({
      user_id: userId,
      log_date: startOfDay.toISOString().split('T')[0],
    }));

  if (hasAnyActivity) {
    reasons.push('Active engagement with health goals');
    return { score: 75, reasons };
  }

  reasons.push('Mental wellness: baseline');
  return { score: 60, reasons };
}

/**
 * Generate daily health score and save to database
 */
export async function generateDailyHealthScore(
  userId: string,
  date: Date = new Date()
): Promise<typeof HealthScore.prototype> {
  const calculation = await calculateHealthScore(userId, date);

  const scoreDate = new Date(date);
  scoreDate.setHours(0, 0, 0, 0);

  // Upsert the health score
  const healthScore = await HealthScore.findOneAndUpdate(
    {
      user_id: new mongoose.Types.ObjectId(userId),
      score_date: scoreDate.toISOString().split('T')[0],
    },
    {
      $set: {
        total_score: calculation.total_score,
        pillars: calculation.pillars,
        reasons: calculation.reasons,
      },
    },
    { upsert: true, new: true }
  );

  return healthScore;
}
