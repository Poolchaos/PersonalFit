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
      };
      await user.save();
    }

    const stats = {
      xp: user.gamification.xp,
      level: user.gamification.level,
      levelTitle: getLevelTitle(user.gamification.level),
      levelProgress: getLevelProgress(user.gamification.xp),
      xpForNextLevel: getXpForNextLevel(user.gamification.level),
      totalWorkoutsCompleted: user.gamification.total_workouts_completed,
      currentStreak: user.gamification.current_streak,
      longestStreak: user.gamification.longest_streak,
      achievements: user.gamification.achievements,
      lastWorkoutDate: user.gamification.last_workout_date,
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
      };
    }

    const isFirstWorkout = user.gamification.total_workouts_completed === 0;

    // Update streak
    const streakUpdate = updateStreak({
      lastWorkoutDate: user.gamification.last_workout_date,
      workoutDate: completionDate,
      currentStreak: user.gamification.current_streak,
    });

    user.gamification.current_streak = streakUpdate.newStreak;
    user.gamification.last_workout_date = completionDate;

    // Update longest streak if applicable
    if (
      streakUpdate.newStreak > (user.gamification.longest_streak || 0)
    ) {
      user.gamification.longest_streak = streakUpdate.newStreak;
    }

    // Calculate XP earned
    const xpResult = calculateWorkoutXp({
      isFirstWorkout,
      currentStreak: user.gamification.current_streak,
      hadPersonalRecord,
    });

    // Update user stats
    user.gamification.xp += xpResult.totalXp;
    user.gamification.total_workouts_completed += 1;

    const oldLevel = user.gamification.level;
    const newLevel = calculateLevel(user.gamification.xp);
    const leveledUp = newLevel > oldLevel;
    user.gamification.level = newLevel;

    // Check for new achievements
    const newAchievements = checkAchievements({
      currentAchievements: user.gamification.achievements,
      stats: {
        totalWorkouts: user.gamification.total_workouts_completed,
        currentStreak: user.gamification.current_streak,
        totalPRs: 0, // TODO: Track PRs in future
        level: newLevel,
      },
    });

    // Add new achievements
    if (newAchievements.length > 0) {
      user.gamification.achievements.push(...newAchievements);
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
      currentStreak: user.gamification.current_streak,
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
        xp: user.gamification.xp,
        level: newLevel,
        levelProgress: getLevelProgress(user.gamification.xp),
        totalWorkoutsCompleted: user.gamification.total_workouts_completed,
        currentStreak: user.gamification.current_streak,
        longestStreak: user.gamification.longest_streak,
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
