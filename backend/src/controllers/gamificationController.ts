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
      };
      await user.save();
    }

    const gamification = user.gamification;
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
 * Award XP for completing a workout
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
      };
    }

    const gamification = user.gamification;

    const isFirstWorkout = gamification.total_workouts_completed === 0;

    // Update streak
    const streakUpdate = updateStreak({
      lastWorkoutDate: gamification.last_workout_date,
      workoutDate: completionDate,
      currentStreak: gamification.current_streak,
    });

    gamification.current_streak = streakUpdate.newStreak;
    gamification.last_workout_date = completionDate;

    // Update longest streak if applicable
    if (
      streakUpdate.newStreak > (gamification.longest_streak || 0)
    ) {
      gamification.longest_streak = streakUpdate.newStreak;
    }

    // Calculate XP earned
    const xpResult = calculateWorkoutXp({
      isFirstWorkout,
      currentStreak: gamification.current_streak,
      hadPersonalRecord,
    });

    // Update user stats
    gamification.xp += xpResult.totalXp;
    gamification.total_workouts_completed += 1;

    const oldLevel = gamification.level;
    const newLevel = calculateLevel(gamification.xp);
    const leveledUp = newLevel > oldLevel;
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

    // Add new achievements
    if (newAchievements.length > 0) {
      gamification.achievements.push(...newAchievements);
    }

    await user.save();

    // Return detailed response
    res.json({
      success: true,
      xpAwarded: xpResult.totalXp,
      xpBreakdown: xpResult.breakdown,
      leveledUp,
      oldLevel,
      newLevel,
      newLevelTitle: getLevelTitle(newLevel),
      streakBroken: streakUpdate.streakBroken,
      currentStreak: gamification.current_streak,
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
        xp: gamification.xp,
        level: newLevel,
        levelProgress: getLevelProgress(gamification.xp),
        totalWorkoutsCompleted: gamification.total_workouts_completed,
        currentStreak: gamification.current_streak,
        longestStreak: gamification.longest_streak,
      },
    });
  } catch (error) {
    console.error('Award workout XP error:', error);
    res.status(500).json({ error: 'Failed to award XP' });
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
