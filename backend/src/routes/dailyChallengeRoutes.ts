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
 * Daily Challenge Routes
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getDailyChallenges,
  updateChallengeProgress,
  useStreakFreeze,
  getChallengeHistory,
} from '../services/dailyChallengeService';

const router = Router();

/**
 * GET /api/challenges/today - Get today's challenges
 */
router.get('/today', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const dailyChallenges = await getDailyChallenges(userId);
    res.json({
      date: dailyChallenges.challenge_date,
      challenges: dailyChallenges.challenges,
      streakFreezeUsed: dailyChallenges.streak_freeze_used,
      gemsEarnedToday: dailyChallenges.gems_earned_today,
    });
  } catch (error) {
    console.error('Get daily challenges error:', error);
    res.status(500).json({ error: 'Failed to get daily challenges' });
  }
});

/**
 * POST /api/challenges/:challengeId/progress - Update challenge progress
 */
router.post(
  '/:challengeId/progress',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { challengeId } = req.params;
      const { progressIncrement = 1 } = req.body;

      const result = await updateChallengeProgress(userId, challengeId, progressIncrement);

      if (!result.challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.json({
        challenge: result.challenge,
        justCompleted: result.justCompleted,
        xpEarned: result.xpEarned,
        gemsEarned: result.gemsEarned,
      });
    } catch (error) {
      console.error('Update challenge progress error:', error);
      res.status(500).json({ error: 'Failed to update challenge progress' });
    }
  }
);

/**
 * POST /api/challenges/streak-freeze - Use a streak freeze
 */
router.post(
  '/streak-freeze',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await useStreakFreeze(userId);

      if (result.success) {
        res.json({
          success: true,
          freezesRemaining: result.freezesRemaining,
          message: 'Streak freeze activated! Your streak is protected for today.',
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Use streak freeze error:', error);
      res.status(500).json({ error: 'Failed to use streak freeze' });
    }
  }
);

/**
 * GET /api/challenges/history - Get challenge history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;
    const history = await getChallengeHistory(userId, days);

    res.json({
      history: history.map((day) => ({
        date: day.challenge_date,
        challenges: day.challenges,
        streakFreezeUsed: day.streak_freeze_used,
        gemsEarned: day.gems_earned_today,
        allCompleted: day.challenges.every((c) => c.completed),
      })),
    });
  } catch (error) {
    console.error('Get challenge history error:', error);
    res.status(500).json({ error: 'Failed to get challenge history' });
  }
});

export default router;
