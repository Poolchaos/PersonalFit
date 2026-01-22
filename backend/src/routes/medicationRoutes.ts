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
import multer from 'multer';
import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  logDose,
  getDoseLogs,
  getTodaysDoses,
  getAdherenceStats,
  getMedicationsNeedingRefill,
  refillMedication,
  extractFromBottleImage,
  createMedicationWithImage,
  updateBottleImage,
} from '../controllers/medicationController';
import { authenticate } from '../middleware/auth';

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// All medication routes require authentication
router.use(authenticate);

// Get today's doses for all medications (dashboard view)
router.get('/today', getTodaysDoses);

// Get medications needing refill
router.get('/refills', getMedicationsNeedingRefill);

// Get all medications
router.get(
  '/',
  [query('active').optional().isBoolean()],
  getMedications
);

// Create new medication
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Medication name is required'),
    body('type')
      .isIn(['prescription', 'supplement', 'otc'])
      .withMessage('Type must be prescription, supplement, or otc'),
    body('dosage.amount')
      .isFloat({ min: 0.001 })
      .withMessage('Dosage amount must be a positive number'),
    body('dosage.unit')
      .isIn(['mg', 'ml', 'iu', 'mcg', 'g', 'tablets', 'capsules'])
      .withMessage('Invalid dosage unit'),
    body('dosage.form')
      .isIn(['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'other'])
      .withMessage('Invalid dosage form'),
    body('frequency.times_per_day')
      .isInt({ min: 1, max: 24 })
      .withMessage('Times per day must be between 1 and 24'),
    body('frequency.specific_times')
      .optional()
      .isArray()
      .withMessage('Specific times must be an array'),
    body('frequency.specific_times.*')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Time must be in HH:MM format'),
    body('frequency.days_of_week')
      .optional()
      .isArray()
      .withMessage('Days of week must be an array'),
    body('frequency.days_of_week.*')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Day of week must be 0-6'),
    body('frequency.with_food')
      .optional()
      .isBoolean(),
    body('inventory.current_count')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory count must be non-negative'),
    body('inventory.refill_threshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Refill threshold must be non-negative'),
    body('health_tags')
      .optional()
      .isArray(),
    body('warnings')
      .optional()
      .isArray(),
    body('affects_metrics')
      .optional()
      .isArray(),
    body('affects_metrics.*')
      .optional()
      .isIn(['heart_rate', 'blood_pressure', 'sleep_quality', 'energy_level', 'strength', 'endurance', 'recovery', 'weight', 'mood']),
    body('start_date')
      .optional()
      .isISO8601(),
    body('end_date')
      .optional()
      .isISO8601(),
  ],
  createMedication
);

// Get single medication
router.get('/:id', getMedication);

// Update medication
router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('type')
      .optional()
      .isIn(['prescription', 'supplement', 'otc']),
    body('dosage.amount')
      .optional()
      .isFloat({ min: 0.001 }),
    body('dosage.unit')
      .optional()
      .isIn(['mg', 'ml', 'iu', 'mcg', 'g', 'tablets', 'capsules']),
    body('dosage.form')
      .optional()
      .isIn(['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'other']),
    body('frequency.times_per_day')
      .optional()
      .isInt({ min: 1, max: 24 }),
    body('is_active')
      .optional()
      .isBoolean(),
  ],
  updateMedication
);

// Delete medication
router.delete('/:id', deleteMedication);

// Log a dose
router.post(
  '/:id/doses',
  [
    body('scheduled_time')
      .isISO8601()
      .withMessage('Scheduled time is required'),
    body('status')
      .isIn(['taken', 'skipped'])
      .withMessage('Status must be taken or skipped'),
    body('taken_at')
      .optional()
      .isISO8601(),
    body('dosage_amount')
      .optional()
      .isFloat({ min: 0 }),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }),
    body('side_effects')
      .optional()
      .isArray(),
    body('mood_before')
      .optional()
      .isInt({ min: 1, max: 5 }),
    body('mood_after')
      .optional()
      .isInt({ min: 1, max: 5 }),
    body('energy_before')
      .optional()
      .isInt({ min: 1, max: 5 }),
    body('energy_after')
      .optional()
      .isInt({ min: 1, max: 5 }),
  ],
  logDose
);

// Get dose logs for a medication
router.get(
  '/:id/doses',
  [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ],
  getDoseLogs
);

// Get adherence stats
router.get(
  '/:id/stats',
  [query('days').optional().isInt({ min: 1, max: 365 })],
  getAdherenceStats
);

// Refill medication
router.post(
  '/:id/refill',
  [
    body('count')
      .isInt({ min: 1 })
      .withMessage('Refill count must be at least 1'),
  ],
  refillMedication
);

// Vision/OCR Routes (Phase 2)
// Extract medication info from bottle image
router.post(
  '/extract-from-image',
  upload.single('image'),
  extractFromBottleImage
);

// Create medication with bottle image
router.post(
  '/with-image',
  upload.single('bottle_image'),
  [
    body('name').notEmpty().trim().withMessage('Medication name is required'),
    body('type')
      .isIn(['prescription', 'supplement', 'otc'])
      .withMessage('Type must be prescription, supplement, or otc'),
    body('dosage.amount')
      .isFloat({ min: 0.001 })
      .withMessage('Dosage amount must be a positive number'),
    body('dosage.unit')
      .isIn(['mg', 'ml', 'iu', 'mcg', 'g', 'tablets', 'capsules'])
      .withMessage('Invalid dosage unit'),
    body('dosage.form')
      .isIn(['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'other'])
      .withMessage('Invalid dosage form'),
    body('frequency.times_per_day')
      .isInt({ min: 1, max: 24 })
      .withMessage('Times per day must be between 1 and 24'),
  ],
  createMedicationWithImage
);

// Update medication with new bottle image
router.put(
  '/:id/bottle-image',
  upload.single('bottle_image'),
  updateBottleImage
);

export default router;
