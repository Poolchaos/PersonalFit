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
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  updateGoalProgress,
  updateGoalStatus,
  deleteGoal,
  getGoalStats,
} from '../controllers/goalsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/goals/stats
 * Get goal statistics for the user
 */
router.get('/stats', getGoalStats);

/**
 * GET /api/goals
 * Get all goals for the authenticated user
 * Query params: status, category
 */
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['active', 'completed', 'abandoned', 'paused'])
      .withMessage('Invalid status'),
    query('category')
      .optional()
      .isIn([
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'body_composition',
        'workout_frequency',
        'habit',
        'general',
      ])
      .withMessage('Invalid category'),
  ],
  getGoals
);

/**
 * GET /api/goals/:id
 * Get a single goal by ID
 */
router.get('/:id', [param('id').isMongoId().withMessage('Invalid goal ID')], getGoalById);

/**
 * POST /api/goals
 * Create a new goal
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('type')
      .isIn(['decrease', 'increase', 'target', 'accumulate'])
      .withMessage('Invalid goal type'),
    body('category')
      .isIn([
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'body_composition',
        'workout_frequency',
        'habit',
        'general',
      ])
      .withMessage('Invalid category'),
    body('initial_value').isNumeric().withMessage('Initial value must be a number'),
    body('current_value').optional().isNumeric().withMessage('Current value must be a number'),
    body('target_value').isNumeric().withMessage('Target value must be a number'),
    body('unit').trim().notEmpty().withMessage('Unit is required').isLength({ max: 20 }),
    body('target_date')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid target date'),
  ],
  createGoal
);

/**
 * PUT /api/goals/:id
 * Update a goal (full update)
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid goal ID'),
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('type')
      .optional()
      .isIn(['decrease', 'increase', 'target', 'accumulate'])
      .withMessage('Invalid goal type'),
    body('category')
      .optional()
      .isIn([
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'body_composition',
        'workout_frequency',
        'habit',
        'general',
      ])
      .withMessage('Invalid category'),
    body('initial_value').optional().isNumeric(),
    body('current_value').optional().isNumeric(),
    body('target_value').optional().isNumeric(),
    body('unit').optional().trim().notEmpty().isLength({ max: 20 }),
    body('target_date').optional().isISO8601().toDate(),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'abandoned', 'paused'])
      .withMessage('Invalid status'),
  ],
  updateGoal
);

/**
 * PATCH /api/goals/:id/progress
 * Update goal's current value (primary progress update)
 */
router.patch(
  '/:id/progress',
  [
    param('id').isMongoId().withMessage('Invalid goal ID'),
    body('current_value')
      .isNumeric()
      .withMessage('Current value must be a number'),
  ],
  updateGoalProgress
);

/**
 * PATCH /api/goals/:id/status
 * Update goal status
 */
router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid goal ID'),
    body('status')
      .isIn(['active', 'completed', 'abandoned', 'paused'])
      .withMessage('Invalid status'),
  ],
  updateGoalStatus
);

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid goal ID')], deleteGoal);

export default router;
