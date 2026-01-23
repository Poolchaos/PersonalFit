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

    const session = new WorkoutSession({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      ...req.body,
    });

    await session.save();

    // If the session is completed, award XP and update gamification
    if (session.completion_status === 'completed') {
      const user = await User.findById(req.user?.userId);

      if (user) {
        // Initialize gamification if not present
        if (!user.gamification) {
          user.gamification = {
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
          };
        }

        const gamification = user.gamification!;
        const isFirstWorkout = gamification.total_workouts_completed === 0;

        // Update streak
        const streakUpdate = updateStreak({
          lastWorkoutDate: gamification.last_workout_date,
          workoutDate: session.session_date,
          currentStreak: gamification.current_streak,
        });

        gamification.current_streak = streakUpdate.newStreak;
        gamification.last_workout_date = session.session_date;

        // Update longest streak if applicable
        if (streakUpdate.newStreak > (gamification.longest_streak || 0)) {
          gamification.longest_streak = streakUpdate.newStreak;
        }

        // Calculate XP earned
        const xpResult = calculateWorkoutXp({
          isFirstWorkout,
          currentStreak: gamification.current_streak,
          hadPersonalRecord: false,
        });

        // Update user stats
        gamification.xp += xpResult.totalXp;
        gamification.total_workouts_completed += 1;

        const oldLevel = gamification.level;
        const newLevel = calculateLevel(gamification.xp);
        gamification.level = newLevel;

        // Check for new achievements
        const newAchievements = checkAchievements({
          currentAchievements: gamification.achievements,
          stats: {
            totalWorkouts: gamification.total_workouts_completed,
            currentStreak: gamification.current_streak,
            totalPRs: gamification.total_prs || 0,
            level: newLevel,
          },
        });

        if (newAchievements.length > 0) {
          gamification.achievements.push(...newAchievements);
        }

        await user.save();

        console.log(`XP awarded for session ${session._id}:`, {
          xpAwarded: xpResult.totalXp,
          breakdown: xpResult.breakdown,
          newLevel,
          leveledUp: newLevel > oldLevel,
        });
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

    // Update allowed fields
    Object.assign(session, req.body);
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

    const exerciseLog = new ExerciseLog({
      session_id: req.params.id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      ...req.body,
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

    Object.assign(exercise, req.body);
    await exercise.save();

    res.json({ exercise });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
