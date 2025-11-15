import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  logExercise,
  updateExercise,
} from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All session routes require authentication
router.use(authenticate);

// Session management
router.post(
  '/',
  [
    body('session_date').isISO8601(),
    body('completion_status')
      .optional()
      .isIn(['planned', 'in_progress', 'completed', 'skipped']),
    body('planned_duration_minutes').optional().isInt({ min: 0 }),
    body('actual_duration_minutes').optional().isInt({ min: 0 }),
    body('exercises_planned').optional().isInt({ min: 0 }),
    body('mood_before')
      .optional()
      .isIn(['great', 'good', 'okay', 'tired', 'unmotivated']),
    body('mood_after')
      .optional()
      .isIn(['energized', 'accomplished', 'satisfied', 'exhausted', 'disappointed']),
    body('perceived_difficulty').optional().isInt({ min: 1, max: 10 }),
  ],
  createSession
);

router.get('/', getSessions);
router.get('/:id', getSession);

router.patch(
  '/:id',
  [
    body('completion_status')
      .optional()
      .isIn(['planned', 'in_progress', 'completed', 'skipped']),
    body('actual_duration_minutes').optional().isInt({ min: 0 }),
    body('mood_after')
      .optional()
      .isIn(['energized', 'accomplished', 'satisfied', 'exhausted', 'disappointed']),
    body('perceived_difficulty').optional().isInt({ min: 1, max: 10 }),
  ],
  updateSession
);

router.delete('/:id', deleteSession);

// Exercise logging
router.post(
  '/:id/exercises',
  [
    body('exercise_name').notEmpty().trim(),
    body('exercise_type')
      .isIn(['strength', 'cardio', 'flexibility', 'balance', 'hiit', 'other']),
    body('sets_completed').optional().isInt({ min: 0 }),
    body('target_sets').optional().isInt({ min: 0 }),
    body('set_details').optional().isArray(),
    body('set_details.*.set_number').optional().isInt({ min: 1 }),
    body('set_details.*.completed').optional().isBoolean(),
    body('set_details.*.form_rating').optional().isInt({ min: 1, max: 5 }),
    body('interval_structure.work_seconds').optional().isInt({ min: 1 }),
    body('interval_structure.rest_seconds').optional().isInt({ min: 0 }),
    body('interval_structure.rounds').optional().isInt({ min: 1 }),
    body('interval_structure.rounds_completed').optional().isInt({ min: 0 }),
    body('target_muscles').isArray().notEmpty(),
    body('difficulty_rating').optional().isInt({ min: 1, max: 10 }),
  ],
  logExercise
);

router.put(
  '/:id/exercises/:exerciseId',
  [
    body('sets_completed').optional().isInt({ min: 0 }),
    body('set_details').optional().isArray(),
    body('interval_structure.work_seconds').optional().isInt({ min: 1 }),
    body('interval_structure.rest_seconds').optional().isInt({ min: 0 }),
    body('interval_structure.rounds').optional().isInt({ min: 1 }),
    body('interval_structure.rounds_completed').optional().isInt({ min: 0 }),
    body('difficulty_rating').optional().isInt({ min: 1, max: 10 }),
  ],
  updateExercise
);

export default router;
