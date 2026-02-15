/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadProgressPhoto,
  deleteProgressPhoto,
  getUserPhotos,
} from '../controllers/photoController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation for photo upload
const uploadValidation = [
  body('photo_type')
    .isIn(['front', 'side', 'back'])
    .withMessage('Photo type must be front, side, or back'),
  body('measurement_date')
    .optional()
    .isISO8601()
    .withMessage('Measurement date must be a valid ISO 8601 date'),
];

// Generic validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Upload progress photo (single file upload)
router.post('/upload', upload.single('photo'), uploadValidation, handleValidationErrors, uploadProgressPhoto);

// Get user's progress photos
router.get('/', getUserPhotos);

// Delete progress photo (filename passed as query parameter or :0+ for wildcard)
router.delete('/:userId/:photoType/:timestamp', deleteProgressPhoto);

export default router;
