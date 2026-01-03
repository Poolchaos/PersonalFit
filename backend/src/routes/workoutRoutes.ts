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
import { body } from 'express-validator';
import {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  deactivateWorkoutPlan,
  setActiveWorkoutPlan,
  deleteWorkoutPlan,
} from '../controllers/workoutController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All workout routes require authentication
router.use(authenticate);

// Generate new workout plan
router.post(
  '/generate',
  [
    body('workout_modality')
      .optional()
      .isIn(['strength', 'hiit', 'flexibility', 'cardio'])
      .withMessage('Invalid workout modality'),
    body('fitness_goals').optional().isArray().withMessage('Fitness goals must be an array'),
    body('experience_level').optional().isString(),
    body('workout_frequency').optional().isInt({ min: 1, max: 7 }),
    body('preferred_workout_duration').optional().isInt({ min: 10, max: 180 }),
    body('equipment').optional().isArray(),
  ],
  createWorkoutPlan
);

// Get all workout plans for user
router.get('/', getWorkoutPlans);

// Get specific workout plan
router.get('/:id', getWorkoutPlan);

// Deactivate workout plan
router.patch('/:id/deactivate', deactivateWorkoutPlan);

// Activate workout plan
router.patch('/:id/activate', setActiveWorkoutPlan);

// Delete workout plan
router.delete('/:id', deleteWorkoutPlan);

export default router;
