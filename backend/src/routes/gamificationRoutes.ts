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

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGamificationStats,
  awardWorkoutXp,
  getAchievements,
  getLeaderboard,
} from '../controllers/gamificationController';
import {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getUserRankWithNearby,
} from '../controllers/leaderboardController';
import {
  getShopItems,
  purchaseItem,
  claimMilestoneRewards,
  getGemBalance,
} from '../controllers/rewardsShopController';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Validation middleware for award-xp
const awardXpValidation = [
  body('sessionId')
    .isMongoId()
    .withMessage('Valid session ID is required'),
  body('hadPersonalRecord')
    .optional()
    .isBoolean()
    .withMessage('hadPersonalRecord must be a boolean'),
  body('workoutDate')
    .optional()
    .isISO8601()
    .withMessage('workoutDate must be a valid ISO 8601 date'),
];

// Validation middleware for shop purchase
const purchaseValidation = [
  body('itemId')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Valid item ID is required'),
];

// Generic validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

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
router.post('/award-xp', awardXpValidation, handleValidationErrors, awardWorkoutXp);

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

/**
 * @route   GET /api/gamification/leaderboard/global
 * @desc    Get global leaderboard with pagination
 * @access  Private
 */
router.get('/leaderboard/global', getGlobalLeaderboard);

/**
 * @route   GET /api/gamification/leaderboard/weekly
 * @desc    Get weekly leaderboard
 * @access  Private
 */
router.get('/leaderboard/weekly', getWeeklyLeaderboard);

/**
 * @route   GET /api/gamification/leaderboard/rank
 * @desc    Get user's rank with nearby competitors
 * @access  Private
 */
router.get('/leaderboard/rank', getUserRankWithNearby);

/**
 * @route   GET /api/gamification/shop
 * @desc    Get available shop items
 * @access  Private
 */
router.get('/shop', getShopItems);

/**
 * @route   POST /api/gamification/shop/purchase
 * @desc    Purchase a shop item with gems
 * @access  Private
 */
router.post('/shop/purchase', purchaseValidation, handleValidationErrors, purchaseItem);

/**
 * @route   POST /api/gamification/shop/claim-rewards
 * @desc    Claim milestone gem rewards
 * @access  Private
 */
router.post('/shop/claim-rewards', claimMilestoneRewards);

/**
 * @route   GET /api/gamification/gems
 * @desc    Get gem balance and purchase history
 * @access  Private
 */
router.get('/gems', getGemBalance);

export default router;
