/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import WorkoutSession from '../models/WorkoutSession';
import ExerciseLog from '../models/ExerciseLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { updateStreakOnCompletion } from '../services/accountabilityService';
import {
  calculateLevel,
  calculateWorkoutXp,
  updateStreak,
  checkAchievements,
} from '../services/gamificationService';

export const createSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Whitelist allowed fields to prevent mass assignment
    const { plan_id, session_date, planned_duration_minutes, actual_duration_minutes,
      completion_status, completion_percentage, exercises_planned, exercises_completed,
      notes, mood_before, mood_after, perceived_difficulty } = req.body;

    const session = new WorkoutSession({
      plan_id, session_date, planned_duration_minutes, actual_duration_minutes,
      completion_status, completion_percentage, exercises_planned, exercises_completed,
      notes, mood_before, mood_after, perceived_difficulty,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    await session.save();

    // If the session is completed, award XP and update gamification (with idempotency)
    if (session.completion_status === 'completed') {
      // Atomically mark session as xp_awarded to prevent double awards
      const markedSession = await WorkoutSession.findOneAndUpdate(
        {
          _id: session._id,
          xp_awarded: { $ne: true }, // Only if not already awarded
        },
        {
          $set: {
            xp_awarded: true,
            xp_awarded_at: new Date(),
          },
        },
        { new: true }
      );

      // If marking failed (already awarded), skip XP logic
      if (!markedSession) {
        console.log(`XP already awarded for session ${session._id}, skipping`);
      } else {
        // Award XP with atomic update
        await awardXpForSession(req.user?.userId!, session.session_date, session._id);
      }
    }

    res.status(201).json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, from_date, to_date, plan_id, limit = 50, skip = 0 } = req.query;

    const filter: Record<string, unknown> = { user_id: new mongoose.Types.ObjectId(req.user?.userId) };

    if (status) {
      filter.completion_status = status;
    }

    if (plan_id) {
      filter.plan_id = plan_id;
    }

    if (from_date || to_date) {
      filter.session_date = {};
      if (from_date) {
        (filter.session_date as Record<string, unknown>).$gte = new Date(from_date as string);
      }
      if (to_date) {
        (filter.session_date as Record<string, unknown>).$lte = new Date(to_date as string);
      }
    }

    const sessions = await WorkoutSession.find(filter)
      .sort({ session_date: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate('plan_id', 'plan_data.plan_overview');

    const total = await WorkoutSession.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    }).populate('plan_id');

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get exercise logs for this session
    const exercises = await ExerciseLog.find({
      session_id: req.params.id,
    });

    res.json({
      session,
      exercises,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: userId,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const wasCompleted = session.completion_status === 'completed';
    const isNowCompleted = req.body.completion_status === 'completed';

    // Whitelist allowed fields to prevent mass assignment
    const allowedSessionUpdateFields: (keyof typeof session)[] = [
      'plan_id', 'session_date', 'planned_duration_minutes', 'actual_duration_minutes',
      'completion_status', 'completion_percentage', 'exercises_planned', 'exercises_completed',
      'notes', 'mood_before', 'mood_after', 'perceived_difficulty',
    ] as (keyof typeof session)[];
    for (const field of allowedSessionUpdateFields) {
      if (req.body[field] !== undefined) {
        (session as unknown as Record<string, unknown>)[field as string] = req.body[field];
      }
    }
    await session.save();

    // Update accountability streak if session just completed
    if (!wasCompleted && isNowCompleted) {
      await updateStreakOnCompletion(userId, session.session_date);
    }

    res.json({ session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const session = await WorkoutSession.findOneAndDelete({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Delete associated exercise logs
    await ExerciseLog.deleteMany({ session_id: req.params.id });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logExercise = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Verify session exists and belongs to user
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Whitelist allowed fields to prevent mass assignment
    const { exercise_name, exercise_type, sets_completed, target_sets, set_details,
      interval_structure, equipment_used, target_muscles, total_volume_kg,
      total_duration_seconds, personal_record, difficulty_rating, notes: exerciseNotes } = req.body;

    const exerciseLog = new ExerciseLog({
      exercise_name, exercise_type, sets_completed, target_sets, set_details,
      interval_structure, equipment_used, target_muscles, total_volume_kg,
      total_duration_seconds, personal_record, difficulty_rating, notes: exerciseNotes,
      session_id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    await exerciseLog.save();

    // Update session statistics
    const completedExercises = await ExerciseLog.countDocuments({
      session_id: req.params.id,
    });
    session.exercises_completed = completedExercises;

    if (session.exercises_planned) {
      session.completion_percentage = Math.round(
        (completedExercises / session.exercises_planned) * 100
      );
    }

    await session.save();

    res.status(201).json({ exercise: exerciseLog });
  } catch (error) {
    console.error('Log exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExercise = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const exercise = await ExerciseLog.findOne({
      _id: req.params.exerciseId,
      session_id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!exercise) {
      res.status(404).json({ error: 'Exercise log not found' });
      return;
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedExerciseUpdateFields = [
      'exercise_name', 'exercise_type', 'sets_completed', 'target_sets', 'set_details',
      'interval_structure', 'equipment_used', 'target_muscles', 'total_volume_kg',
      'total_duration_seconds', 'personal_record', 'difficulty_rating', 'notes',
    ];
    for (const field of allowedExerciseUpdateFields) {
      if (req.body[field] !== undefined) {
        (exercise as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }
    await exercise.save();

    res.json({ exercise });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Helper function to award XP for a session atomically (internal use)
 * Uses optimistic locking to prevent race conditions
 */
async function awardXpForSession(
  userId: string,
  sessionDate: Date,
  sessionId: unknown
): Promise<void> {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    const user = await User.findById(userId);
    if (!user) {
      console.error(`User ${userId} not found for XP award`);
      return;
    }

    const currentVersion = user.__v;

    // Initialize gamification if not present
    if (!user.gamification) {
      const initResult = await User.findOneAndUpdate(
        { _id: userId, gamification: { $exists: false } },
        {
          $set: {
            gamification: {
              xp: 0,
              level: 1,
              total_workouts_completed: 0,
              current_streak: 0,
              longest_streak: 0,
              achievements: [],
              total_prs: 0,
              streak_freezes_available: 2,
              streak_freezes_used_this_month: 0,
              gems: 50,
              total_gems_earned: 50,
              purchased_items: [],
              milestone_rewards_claimed: [],
            },
          },
        },
        { new: true }
      );
      if (initResult) {
        continue; // Retry with initialized state
      }
    }

    const gamification = user.gamification!;
    const isFirstWorkout = gamification.total_workouts_completed === 0;

    // Update streak
    const streakUpdate = updateStreak({
      lastWorkoutDate: gamification.last_workout_date,
      workoutDate: sessionDate,
      currentStreak: gamification.current_streak,
    });

    const newStreak = streakUpdate.newStreak;
    const newLongestStreak = Math.max(newStreak, gamification.longest_streak || 0);

    // Calculate XP earned
    const xpResult = calculateWorkoutXp({
      isFirstWorkout,
      currentStreak: newStreak,
      hadPersonalRecord: false,
    });

    const newXp = gamification.xp + xpResult.totalXp;
    const newWorkoutCount = gamification.total_workouts_completed + 1;
    const oldLevel = gamification.level;
    const newLevel = calculateLevel(newXp);

    // Check for new achievements
    const newAchievements = checkAchievements({
      currentAchievements: gamification.achievements,
      stats: {
        totalWorkouts: newWorkoutCount,
        currentStreak: newStreak,
        totalPRs: gamification.total_prs || 0,
        level: newLevel,
      },
    });

    // Build atomic update with version check (optimistic locking)
    const updateResult = await User.findOneAndUpdate(
      {
        _id: userId,
        __v: currentVersion,
      },
      {
        $inc: {
          'gamification.xp': xpResult.totalXp,
          'gamification.total_workouts_completed': 1,
          __v: 1,
        },
        $set: {
          'gamification.current_streak': newStreak,
          'gamification.longest_streak': newLongestStreak,
          'gamification.level': newLevel,
          'gamification.last_workout_date': sessionDate,
        },
        ...(newAchievements.length > 0
          ? { $addToSet: { 'gamification.achievements': { $each: newAchievements } } }
          : {}),
      },
      { new: true }
    );

    if (updateResult) {
      console.log(`XP awarded for session ${sessionId}:`, {
        xpAwarded: xpResult.totalXp,
        breakdown: xpResult.breakdown,
        newLevel,
        leveledUp: newLevel > oldLevel,
      });
      return;
    }

    // Version conflict - retry
    console.log(`Optimistic lock conflict on XP award (attempt ${attempt}), retrying...`);
  }

  console.error(`Failed to award XP after ${MAX_RETRIES} attempts for session ${sessionId}`);
}
