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
import { upsertHealthScore, getHealthScores } from '../controllers/healthScoreController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('score_date').isISO8601(),
    body('total_score').isNumeric(),
    body('pillars').optional().isObject(),
    body('reasons').optional().isArray(),
  ],
  upsertHealthScore
);

router.get(
  '/',
  [
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  getHealthScores
);

export default router;
