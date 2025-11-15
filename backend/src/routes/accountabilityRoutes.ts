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
