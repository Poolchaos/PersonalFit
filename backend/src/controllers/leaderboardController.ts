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
import WorkoutSession from '../models/WorkoutSession';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  level: number;
  xp: number;
  currentStreak: number;
  totalWorkouts: number;
  weeklyWorkouts?: number;
  isCurrentUser?: boolean;
}

/**
 * Get global leaderboard with optional time filtering
 */
export const getGlobalLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.user?.userId;

    // Get top users by XP
    const topUsers = await User.find({ 'gamification.xp': { $exists: true } })
      .sort({ 'gamification.xp': -1 })
      .limit(limit)
      .skip(offset)
      .select(
        'profile.first_name profile.last_name gamification.xp gamification.level gamification.current_streak gamification.total_workouts_completed'
      );

    // Get current user's rank
    let userRank = null;
    if (userId) {
      const usersAhead = await User.countDocuments({
        'gamification.xp': { $gt: (await User.findById(userId))?.gamification?.xp || 0 },
      });
      userRank = usersAhead + 1;
    }

    const leaderboard: LeaderboardEntry[] = topUsers.map((user, index) => {
      const userIdStr = String(user._id);
      return {
        rank: offset + index + 1,
        userId: userIdStr,
        name: user.profile?.first_name
          ? `${user.profile.first_name} ${user.profile.last_name?.[0] || ''}.`
          : 'Anonymous',
        level: user.gamification?.level || 1,
        xp: user.gamification?.xp || 0,
        currentStreak: user.gamification?.current_streak || 0,
        totalWorkouts: user.gamification?.total_workouts_completed || 0,
        isCurrentUser: userId ? userIdStr === userId : false,
      };
    });

    res.json({
      leaderboard,
      userRank,
      totalUsers: await User.countDocuments({ 'gamification.xp': { $exists: true } }),
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
};

/**
 * Get weekly leaderboard (users with most workouts this week)
 */
export const getWeeklyLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.user?.userId;

    // Get start of this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Aggregate workout counts by user for this week
    const weeklyWorkoutCounts = await WorkoutSession.aggregate([
      {
        $match: {
          session_date: { $gte: weekStart },
          completion_status: 'completed',
        },
      },
      {
        $group: {
          _id: '$user_id',
          workoutCount: { $sum: 1 },
        },
      },
      {
        $sort: { workoutCount: -1 },
      },
      {
        $limit: limit + offset,
      },
      {
        $skip: offset,
      },
    ]);

    // Get user details for these users
    const userIds = weeklyWorkoutCounts.map((item) => item._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      'profile.first_name profile.last_name gamification.xp gamification.level gamification.current_streak gamification.total_workouts_completed'
    );

    // Create a map for quick lookup
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const workoutCountMap = new Map(
      weeklyWorkoutCounts.map((item) => [String(item._id), item.workoutCount])
    );

    const leaderboard: LeaderboardEntry[] = weeklyWorkoutCounts.map((item, index) => {
      const userIdStr = String(item._id);
      const user = userMap.get(userIdStr);
      return {
        rank: offset + index + 1,
        userId: userIdStr,
        name: user?.profile?.first_name
          ? `${user.profile.first_name} ${user.profile.last_name?.[0] || ''}.`
          : 'Anonymous',
        level: user?.gamification?.level || 1,
        xp: user?.gamification?.xp || 0,
        currentStreak: user?.gamification?.current_streak || 0,
        totalWorkouts: user?.gamification?.total_workouts_completed || 0,
        weeklyWorkouts: item.workoutCount,
        isCurrentUser: userId ? userIdStr === userId : false,
      };
    });

    res.json({
      leaderboard,
      period: 'week',
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly leaderboard' });
  }
};

/**
 * Get user's rank and nearby competitors
 */
export const getUserRankWithNearby = async (
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

    const userXp = user.gamification?.xp || 0;

    // Get user's rank
    const usersAhead = await User.countDocuments({
      'gamification.xp': { $gt: userXp },
    });
    const userRank = usersAhead + 1;

    // Get users nearby in ranking (2 above, current, 2 below)
    const nearbyUsers = await User.find({ 'gamification.xp': { $exists: true } })
      .sort({ 'gamification.xp': -1 })
      .limit(10)
      .skip(Math.max(0, userRank - 3))
      .select(
        'profile.first_name profile.last_name gamification.xp gamification.level gamification.current_streak gamification.total_workouts_completed'
      );

    const nearbyLeaderboard: LeaderboardEntry[] = nearbyUsers.map((u, index) => {
      const uIdStr = String(u._id);
      return {
        rank: userRank - 2 + index,
        userId: uIdStr,
        name: u.profile?.first_name
          ? `${u.profile.first_name} ${u.profile.last_name?.[0] || ''}.`
          : 'Anonymous',
        level: u.gamification?.level || 1,
        xp: u.gamification?.xp || 0,
        currentStreak: u.gamification?.current_streak || 0,
        totalWorkouts: u.gamification?.total_workouts_completed || 0,
        isCurrentUser: uIdStr === userId,
      };
    });

    // Calculate next rank XP requirement
    const nextRankUser = await User.findOne({ 'gamification.xp': { $gt: userXp } })
      .sort({ 'gamification.xp': 1 })
      .select('gamification.xp');
    const xpToNextRank = nextRankUser
      ? nextRankUser.gamification!.xp - userXp
      : 0;

    res.json({
      userRank,
      userXp,
      totalUsers: await User.countDocuments({ 'gamification.xp': { $exists: true } }),
      xpToNextRank,
      nearbyLeaderboard,
    });
  } catch (error) {
    console.error('Get user rank with nearby error:', error);
    res.status(500).json({ error: 'Failed to retrieve ranking data' });
  }
};
