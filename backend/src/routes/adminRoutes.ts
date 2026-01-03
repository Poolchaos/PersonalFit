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
import { triggerDetection } from '../controllers/adminController';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Manually trigger missed workout detection
router.post('/trigger-missed-workout-detection', triggerDetection);

export default router;
