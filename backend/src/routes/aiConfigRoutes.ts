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
import {
  getAIConfig,
  updateAIConfig,
  testAIConfig,
  deleteAIConfig,
} from '../controllers/aiConfigController';
import { updateAIConfigValidation } from '../validators/aiConfigValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get AI configuration (without API key)
router.get('/', getAIConfig);

// Update AI configuration
router.patch('/', updateAIConfigValidation, updateAIConfig);

// Test AI configuration
router.post('/test', testAIConfig);

// Delete AI API key
router.delete('/api-key', deleteAIConfig);

export default router;
