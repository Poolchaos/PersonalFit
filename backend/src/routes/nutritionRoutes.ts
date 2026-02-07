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
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  createNutritionEvent,
  getNutritionEvents,
  getNutritionEventById,
  deleteNutritionEvent,
} from '../controllers/nutritionController';

const router = Router();

router.use(authenticate);

router.post(
  '/events',
  [
    body('source').isIn(['vision', 'manual', 'meal_plan']),
    body('consumed_at').isISO8601(),
    body('items').optional().isArray(),
    body('calories').optional().isNumeric(),
  ],
  createNutritionEvent
);

router.get(
  '/events',
  [
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  getNutritionEvents
);

router.get('/events/:id', getNutritionEventById);
router.delete('/events/:id', deleteNutritionEvent);

export default router;
