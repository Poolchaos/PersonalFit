import { Router } from 'express';
import { body } from 'express-validator';
import {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  deactivateWorkoutPlan,
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
  ],
  createWorkoutPlan
);

// Get all workout plans for user
router.get('/', getWorkoutPlans);

// Get specific workout plan
router.get('/:id', getWorkoutPlan);

// Deactivate workout plan
router.patch('/:id/deactivate', deactivateWorkoutPlan);

export default router;
