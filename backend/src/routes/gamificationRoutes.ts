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

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGamificationStats,
  awardWorkoutXp,
  getAchievements,
  getLeaderboard,
} from '../controllers/gamificationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/gamification/stats
 * @desc    Get user's gamification stats (XP, level, streak, achievements)
 * @access  Private
 */
router.get('/stats', getGamificationStats);

/**
 * @route   POST /api/gamification/award-xp
 * @desc    Award XP for completing a workout
 * @access  Private
 */
router.post('/award-xp', awardWorkoutXp);

/**
 * @route   GET /api/gamification/achievements
 * @desc    Get all achievements with unlock status
 * @access  Private
 */
router.get('/achievements', getAchievements);

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get leaderboard of top users by XP
 * @access  Private
 */
router.get('/leaderboard', getLeaderboard);

export default router;
