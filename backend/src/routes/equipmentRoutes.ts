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
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  cleanDuplicateEquipment,
} from '../controllers/equipmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All equipment routes require authentication
router.use(authenticate);

// Clean duplicate equipment (admin/utility endpoint)
router.post('/clean-duplicates', cleanDuplicateEquipment);

// Get all equipment for user
router.get('/', getEquipment);

// Create new equipment
router.post(
  '/',
  [
    body('equipment_name').notEmpty().trim(),
    body('equipment_type')
      .isIn(['free_weights', 'machines', 'cardio', 'bodyweight', 'accessories', 'other']),
    body('quantity').optional().isInt({ min: 0 }),
    body('specifications.weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.adjustable').optional().isBoolean(),
    body('specifications.min_weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.max_weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.resistance_levels').optional().isInt({ min: 1 }),
    body('condition').optional().isIn(['new', 'good', 'fair', 'poor']),
    body('purchase_date').optional().isISO8601(),
    body('is_available').optional().isBoolean(),
  ],
  createEquipment
);

// Update equipment
router.put(
  '/:id',
  [
    body('equipment_name').optional().trim(),
    body('equipment_type')
      .optional()
      .isIn(['free_weights', 'machines', 'cardio', 'bodyweight', 'accessories', 'other']),
    body('quantity').optional().isInt({ min: 0 }),
    body('specifications.weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.adjustable').optional().isBoolean(),
    body('specifications.min_weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.max_weight_kg').optional().isFloat({ min: 0 }),
    body('specifications.resistance_levels').optional().isInt({ min: 1 }),
    body('condition').optional().isIn(['new', 'good', 'fair', 'poor']),
    body('purchase_date').optional().isISO8601(),
    body('is_available').optional().isBoolean(),
  ],
  updateEquipment
);

// Delete equipment
router.delete('/:id', deleteEquipment);

export default router;
