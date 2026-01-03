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

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { triggerMissedWorkoutDetection } from '../services/missedWorkoutService';

/**
 * Manually trigger missed workout detection
 * POST /api/admin/trigger-missed-workout-detection
 */
export const triggerDetection = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await triggerMissedWorkoutDetection();

    if (result.success) {
      res.json({
        message: 'Missed workout detection completed',
        ...result.result,
      });
    } else {
      res.status(500).json({
        error: 'Failed to process missed workouts',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Trigger detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
