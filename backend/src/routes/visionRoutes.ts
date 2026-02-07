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
  createVisionScan,
  getVisionScans,
  getVisionScanById,
  updateVisionScan,
  uploadVisionImage,
} from '../controllers/visionController';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post(
  '/upload',
  upload.single('image'),
  [body('source').isIn(['fridge', 'grocery', 'receipt'])],
  uploadVisionImage
);

router.post(
  '/scans',
  [
    body('source').isIn(['fridge', 'grocery', 'receipt']),
    body('image_url').isString().notEmpty(),
    body('items').optional().isArray(),
    body('status').optional().isIn(['pending', 'confirmed', 'failed']),
    body('processed_at').optional().isISO8601(),
  ],
  createVisionScan
);

router.get(
  '/scans',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  getVisionScans
);

router.get('/scans/:id', getVisionScanById);

router.put(
  '/scans/:id',
  [
    body('items').optional().isArray(),
    body('status').optional().isIn(['pending', 'confirmed', 'failed']),
    body('processed_at').optional().isISO8601(),
  ],
  updateVisionScan
);

export default router;
