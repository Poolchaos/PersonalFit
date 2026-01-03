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

// Upload progress photo (single file upload)
router.post('/upload', upload.single('photo'), uploadProgressPhoto);

// Get user's progress photos
router.get('/', getUserPhotos);

// Delete progress photo (filename passed as query parameter or :0+ for wildcard)
router.delete('/:userId/:photoType/:timestamp', deleteProgressPhoto);

export default router;
