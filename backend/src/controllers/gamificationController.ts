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
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import {
  calculateLevel,
  getXpForNextLevel,
  getLevelProgress,
  getLevelTitle,
  calculateWorkoutXp,
  updateStreak,
  checkAchievements,
  ACHIEVEMENTS,
} from '../services/gamificationService';

/**
 * Get user's gamification stats
 */
export const getGamificationStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

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
      await user.save();
    }

    const gamification = user.gamification!;
    const stats = {
      xp: gamification.xp,
      level: gamification.level,
      levelTitle: getLevelTitle(gamification.level),
      levelProgress: getLevelProgress(gamification.xp),
      xpForNextLevel: getXpForNextLevel(gamification.level),
      totalWorkoutsCompleted: gamification.total_workouts_completed,
      currentStreak: gamification.current_streak,
      longestStreak: gamification.longest_streak,
      achievements: gamification.achievements,
      lastWorkoutDate: gamification.last_workout_date,
      totalPRs: gamification.total_prs || 0,
      gems: gamification.gems || 0,
      streakFreezesAvailable: gamification.streak_freezes_available || 0,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get gamification stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve gamification stats' });
  }
};

/**
 * Award XP for completing a workout (with optimistic locking to prevent race conditions)
 */
export const awardWorkoutXp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { hadPersonalRecord = false, workoutDate } = req.body;
    const completionDate = workoutDate ? new Date(workoutDate) : new Date();

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const currentVersion = user.__v;

      // Initialize gamification if not present
      if (!user.gamification) {
        // Use atomic setOnInsert-style init
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
        workoutDate: completionDate,
        currentStreak: gamification.current_streak,
      });

      const newStreak = streakUpdate.newStreak;
      const newLongestStreak = Math.max(newStreak, gamification.longest_streak || 0);

      // Calculate XP earned
      const xpResult = calculateWorkoutXp({
        isFirstWorkout,
        currentStreak: newStreak,
        hadPersonalRecord,
      });

      const newXp = gamification.xp + xpResult.totalXp;
      const newWorkoutCount = gamification.total_workouts_completed + 1;
      const oldLevel = gamification.level;
      const newLevel = calculateLevel(newXp);
      const leveledUp = newLevel > oldLevel;

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
          __v: currentVersion, // Optimistic lock
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
            'gamification.last_workout_date': completionDate,
            'gamification.level': newLevel,
          },
          $addToSet: {
            'gamification.achievements': { $each: newAchievements },
          },
        },
        { new: true }
      );

      if (!updateResult) {
        // Version mismatch - another request modified the user, retry
        if (attempt < MAX_RETRIES) {
          continue;
        }
        res.status(409).json({ error: 'Concurrent modification detected. Please retry.' });
        return;
      }

      // Success
      res.json({
        success: true,
        xpAwarded: xpResult.totalXp,
        xpBreakdown: xpResult.breakdown,
        leveledUp,
        oldLevel,
        newLevel,
        newLevelTitle: getLevelTitle(newLevel),
        streakBroken: streakUpdate.streakBroken,
        currentStreak: newStreak,
        newAchievements: newAchievements.map((id) => {
          const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === id);
          return achievement
            ? {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
              }
            : null;
        }).filter(Boolean),
        stats: {
          xp: updateResult.gamification?.xp,
          level: newLevel,
          levelProgress: getLevelProgress(updateResult.gamification?.xp || 0),
          totalWorkoutsCompleted: updateResult.gamification?.total_workouts_completed,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
        },
      });
      return;
    }

    // Should not reach here
    res.status(500).json({ error: 'Failed to award XP after retries' });
  } catch (error) {
    console.error('Award workout XP error:', error);
    res.status(500).json({ error: 'Failed to award workout XP' });
  }
};

/**
 * Get all available achievements
 */
export const getAchievements = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const unlockedAchievements = user.gamification?.achievements || [];

    const allAchievements = Object.values(ACHIEVEMENTS).map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: unlockedAchievements.includes(achievement.id),
    }));

    res.json({ achievements: allAchievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to retrieve achievements' });
  }
};

/**
 * Get leaderboard (top users by XP)
 * Note: This is a future enhancement - basic implementation for now
 */
export const getLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topUsers = await User.find({ 'gamification.xp': { $exists: true } })
      .sort({ 'gamification.xp': -1 })
      .limit(limit)
      .select('profile.first_name profile.last_name gamification.xp gamification.level');

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name?.[0] || ''}.`
        : 'Anonymous',
      xp: user.gamification?.xp || 0,
      level: user.gamification?.level || 1,
      levelTitle: getLevelTitle(user.gamification?.level || 1),
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
};
