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

import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAccountability,
  getAccountabilityDetails,
  createPenalty,
  resolvePenaltyById,
  getPenalties,
  getWeeklyStats,
  getCurrentWeek,
} from '../controllers/accountabilityController';
import {
  createPenaltyValidation,
  resolvePenaltyValidation,
  getPenaltiesValidation,
  getWeeklyStatsValidation,
} from '../validators/accountabilityValidators';

const router = express.Router();

// Get accountability status (summary)
router.get('/status', authenticate, getAccountability);

// Get accountability summary (alias for /status)
router.get('/', authenticate, getAccountability);

// Get full accountability details
router.get('/details', authenticate, getAccountabilityDetails);

// Get current week statistics
router.get('/current-week', authenticate, getCurrentWeek);

// Get weekly statistics
router.get(
  '/weekly-stats',
  authenticate,
  getWeeklyStatsValidation,
  getWeeklyStats
);

// Get penalties (filtered)
router.get(
  '/penalties',
  authenticate,
  getPenaltiesValidation,
  getPenalties
);

// Create a penalty
router.post(
  '/penalties',
  authenticate,
  createPenaltyValidation,
  createPenalty
);

// Resolve a penalty
router.patch(
  '/penalties/:penaltyId/resolve',
  authenticate,
  resolvePenaltyValidation,
  resolvePenaltyById
);

export default router;
