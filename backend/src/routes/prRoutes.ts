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

/**
 * Personal Record Routes
 */

import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  checkForPR,
  getPRSummary,
  getExercisePRHistory,
  getAllTimeBests,
  deletePR,
} from '../services/prService';

const router = Router();

// Validation for PR check
const checkPRValidation = [
  body('exerciseName')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Exercise name is required (max 100 chars)'),
  body('category')
    .isIn(['strength', 'cardio', 'flexibility', 'other'])
    .withMessage('Category must be one of: strength, cardio, flexibility, other'),
  body('recordType')
    .isIn(['weight', 'reps', 'duration', 'distance', 'speed'])
    .withMessage('Record type must be one of: weight, reps, duration, distance, speed'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be a non-negative number'),
  body('unit')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit is required (max 20 chars)'),
  body('workoutSessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workout session ID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be max 500 chars'),
];

/**
 * POST /api/prs/check - Check and record a potential PR
 */
router.post('/check', authenticate, checkPRValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { exerciseName, category, recordType, value, unit, workoutSessionId, notes } = req.body;

    const result = await checkForPR({
      userId,
      exerciseName,
      category,
      recordType,
      value,
      unit,
      workoutSessionId,
      notes,
    });

    res.json(result);
  } catch (error) {
    console.error('Check PR error:', error);
    res.status(500).json({ error: 'Failed to check personal record' });
  }
});

/**
 * GET /api/prs/summary - Get user's PR summary
 */
router.get('/summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const summary = await getPRSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Get PR summary error:', error);
    res.status(500).json({ error: 'Failed to get PR summary' });
  }
});

/**
 * GET /api/prs/bests - Get all-time best PRs
 */
router.get('/bests', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const bests = await getAllTimeBests(userId);
    res.json({ bests });
  } catch (error) {
    console.error('Get all-time bests error:', error);
    res.status(500).json({ error: 'Failed to get all-time bests' });
  }
});

/**
 * GET /api/prs/exercise/:exerciseName - Get PR history for an exercise
 */
router.get(
  '/exercise/:exerciseName',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { exerciseName } = req.params;
      const history = await getExercisePRHistory(userId, exerciseName);
      res.json({ history });
    } catch (error) {
      console.error('Get exercise PR history error:', error);
      res.status(500).json({ error: 'Failed to get exercise PR history' });
    }
  }
);

/**
 * DELETE /api/prs/:prId - Delete a PR record
 */
router.delete('/:prId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { prId } = req.params;
    const deleted = await deletePR(userId, prId);

    if (deleted) {
      res.json({ success: true, message: 'PR deleted' });
    } else {
      res.status(404).json({ error: 'PR not found or unauthorized' });
    }
  } catch (error) {
    console.error('Delete PR error:', error);
    res.status(500).json({ error: 'Failed to delete PR' });
  }
});

export default router;
