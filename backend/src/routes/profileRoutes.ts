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
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Get user profile
router.get('/', getProfile);

// Update user profile
router.put(
  '/',
  [
    body('profile.first_name').optional().isString().trim(),
    body('profile.last_name').optional().isString().trim(),
    body('profile.date_of_birth').optional().isISO8601(),
    body('profile.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('profile.height_cm').optional().isFloat({ min: 0, max: 300 }),
    body('profile.weight_kg').optional().isFloat({ min: 0, max: 500 }),
    body('profile.activity_level')
      .optional()
      .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('profile.fitness_goals').optional().isArray(),
    body('profile.experience_level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced']),
    body('profile.medical_conditions').optional().isArray(),
    body('profile.injuries').optional().isArray(),
    body('preferences.preferred_workout_days').optional().isArray(),
    body('preferences.preferred_workout_duration')
      .optional()
      .isInt({ min: 10, max: 240 }),
    body('preferences.preferred_workout_types').optional().isArray(),
    body('preferences.equipment_access').optional().isArray(),
  ],
  updateProfile
);

export default router;
