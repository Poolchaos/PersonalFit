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
 * Personal Record Service
 * Tracks and manages user's personal bests for exercises
 */

import PersonalRecord, { IPersonalRecord } from '../models/PersonalRecord';
import User from '../models/User';
import mongoose from 'mongoose';

export interface PRCheckResult {
  isNewPR: boolean;
  exerciseName: string;
  recordType: 'weight' | 'reps' | 'time' | 'distance';
  newValue: number;
  previousValue?: number;
  improvementPercentage?: number;
  prRecord?: IPersonalRecord;
}

export interface PRSummary {
  totalPRs: number;
  recentPRs: IPersonalRecord[];
  prsByCategory: Record<string, number>;
  lastPRDate?: Date;
}

/**
 * Check if a new value is a personal record
 */
export async function checkForPR(params: {
  userId: string;
  exerciseName: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'endurance';
  recordType: 'weight' | 'reps' | 'time' | 'distance';
  value: number;
  unit: string;
  workoutSessionId?: string;
  notes?: string;
}): Promise<PRCheckResult> {
  const { userId, exerciseName, category, recordType, value, unit, workoutSessionId, notes } = params;

  // Normalize exercise name
  const normalizedExercise = exerciseName.toLowerCase().trim();

  // Find existing PR for this exercise and record type
  const existingPR = await PersonalRecord.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
    exercise_name: normalizedExercise,
    record_type: recordType,
  }).sort({ value: recordType === 'time' ? 1 : -1 }); // For time, lower is better

  // Determine if this is a new PR
  let isNewPR = false;

  if (!existingPR) {
    // First record for this exercise
    isNewPR = true;
  } else if (recordType === 'time') {
    // For time records, lower is better (faster)
    isNewPR = value < existingPR.value;
  } else {
    // For weight, reps, distance - higher is better
    isNewPR = value > existingPR.value;
  }

  if (!isNewPR) {
    return {
      isNewPR: false,
      exerciseName: normalizedExercise,
      recordType,
      newValue: value,
      previousValue: existingPR?.value,
    };
  }

  // Calculate improvement percentage
  let improvementPercentage: number | undefined;
  if (existingPR) {
    if (recordType === 'time') {
      improvementPercentage = ((existingPR.value - value) / existingPR.value) * 100;
    } else {
      improvementPercentage = ((value - existingPR.value) / existingPR.value) * 100;
    }
  }

  // Create new PR record
  const prRecord = await PersonalRecord.create({
    user_id: new mongoose.Types.ObjectId(userId),
    exercise_name: normalizedExercise,
    category,
    record_type: recordType,
    value,
    unit,
    previous_value: existingPR?.value,
    improvement_percentage: improvementPercentage,
    achieved_at: new Date(),
    workout_session_id: workoutSessionId
      ? new mongoose.Types.ObjectId(workoutSessionId)
      : undefined,
    notes,
  });

  // Update user's total PRs count
  await User.findByIdAndUpdate(userId, {
    $inc: { 'gamification.total_prs': 1 },
  });

  return {
    isNewPR: true,
    exerciseName: normalizedExercise,
    recordType,
    newValue: value,
    previousValue: existingPR?.value,
    improvementPercentage,
    prRecord,
  };
}

/**
 * Get user's PR summary
 */
export async function getPRSummary(userId: string): Promise<PRSummary> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get total PRs
  const totalPRs = await PersonalRecord.countDocuments({ user_id: userObjectId });

  // Get recent PRs (last 10)
  const recentPRs = await PersonalRecord.find({ user_id: userObjectId })
    .sort({ achieved_at: -1 })
    .limit(10);

  // Get PRs by category
  const prsByCategory = await PersonalRecord.aggregate([
    { $match: { user_id: userObjectId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const categoryMap: Record<string, number> = {};
  prsByCategory.forEach((item) => {
    categoryMap[item._id] = item.count;
  });

  // Get last PR date
  const lastPR = await PersonalRecord.findOne({ user_id: userObjectId })
    .sort({ achieved_at: -1 });

  return {
    totalPRs,
    recentPRs,
    prsByCategory: categoryMap,
    lastPRDate: lastPR?.achieved_at,
  };
}

/**
 * Get all PRs for a specific exercise
 */
export async function getExercisePRHistory(
  userId: string,
  exerciseName: string
): Promise<IPersonalRecord[]> {
  return PersonalRecord.find({
    user_id: new mongoose.Types.ObjectId(userId),
    exercise_name: exerciseName.toLowerCase().trim(),
  }).sort({ achieved_at: -1 });
}

/**
 * Get user's best PR for each exercise
 */
export async function getAllTimeBests(userId: string): Promise<IPersonalRecord[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get the best (most recent) PR for each exercise/record_type combo
  const bests = await PersonalRecord.aggregate([
    { $match: { user_id: userObjectId } },
    { $sort: { achieved_at: -1 } },
    {
      $group: {
        _id: { exercise: '$exercise_name', type: '$record_type' },
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { exercise_name: 1 } },
  ]);

  return bests;
}

/**
 * Delete a PR record (for corrections)
 */
export async function deletePR(userId: string, prId: string): Promise<boolean> {
  const result = await PersonalRecord.deleteOne({
    _id: new mongoose.Types.ObjectId(prId),
    user_id: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount > 0) {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'gamification.total_prs': -1 },
    });
    return true;
  }

  return false;
}
