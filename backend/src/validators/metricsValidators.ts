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

import { body, query } from 'express-validator';

export const createMetricsValidation = [
  body('measurement_date')
    .isISO8601()
    .withMessage('Valid ISO 8601 date required'),
  body('weight_kg')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),
  body('body_fat_percentage')
    .optional()
    .isFloat({ min: 1, max: 70 })
    .withMessage('Body fat percentage must be between 1 and 70'),
  body('measurements.chest_cm')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Chest measurement must be between 0 and 300 cm'),
  body('measurements.waist_cm')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Waist measurement must be between 0 and 300 cm'),
  body('measurements.hips_cm')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Hips measurement must be between 0 and 300 cm'),
  body('measurements.thigh_left_cm')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Thigh measurement must be between 0 and 200 cm'),
  body('measurements.thigh_right_cm')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Thigh measurement must be between 0 and 200 cm'),
  body('measurements.bicep_left_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Bicep measurement must be between 0 and 100 cm'),
  body('measurements.bicep_right_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Bicep measurement must be between 0 and 100 cm'),
  body('measurements.calf_left_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Calf measurement must be between 0 and 100 cm'),
  body('measurements.calf_right_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Calf measurement must be between 0 and 100 cm'),
  body('measurements.shoulders_cm')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Shoulders measurement must be between 0 and 300 cm'),
  body('measurements.forearm_left_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Forearm measurement must be between 0 and 100 cm'),
  body('measurements.forearm_right_cm')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Forearm measurement must be between 0 and 100 cm'),
  body('progress_photos.front_url')
    .optional()
    .isURL()
    .withMessage('Valid URL required for front photo'),
  body('progress_photos.side_url')
    .optional()
    .isURL()
    .withMessage('Valid URL required for side photo'),
  body('progress_photos.back_url')
    .optional()
    .isURL()
    .withMessage('Valid URL required for back photo'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less'),
];

export const updateMetricsValidation = [
  body('measurement_date')
    .optional()
    .isISO8601()
    .withMessage('Valid ISO 8601 date required'),
  body('weight_kg')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),
  body('body_fat_percentage')
    .optional()
    .isFloat({ min: 1, max: 70 })
    .withMessage('Body fat percentage must be between 1 and 70'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less'),
];

export const getMetricsValidation = [
  query('from_date')
    .optional()
    .isISO8601()
    .withMessage('Valid ISO 8601 date required for from_date'),
  query('to_date')
    .optional()
    .isISO8601()
    .withMessage('Valid ISO 8601 date required for to_date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
];

export const getTrendsValidation = [
  query('metric_type')
    .notEmpty()
    .withMessage('metric_type is required')
    .isIn([
      'weight_kg',
      'body_fat_percentage',
      'measurements.chest_cm',
      'measurements.waist_cm',
      'measurements.hips_cm',
      'measurements.thigh_left_cm',
      'measurements.thigh_right_cm',
      'measurements.bicep_left_cm',
      'measurements.bicep_right_cm',
    ])
    .withMessage('Invalid metric_type'),
  query('days')
    .optional()
    .isInt({ min: 7, max: 730 })
    .withMessage('Days must be between 7 and 730'),
];
